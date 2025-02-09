'use strict';

const BaseGateway = require('42-cent-base').BaseGateway;
const CreditCard = require('42-cent-model').CreditCard;
const Prospect = require('42-cent-model').Prospect;
const Promise = require('bluebird');
const _ = require('lodash');
const crypto = require('crypto');

class PayeezyGateway extends BaseGateway {
  constructor(options) {
    super();
    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
    this.merchantToken = options.merchantToken;
    this.environment = options.environment || 'sandbox';
    this.baseUrl = this.environment === 'sandbox' 
      ? 'https://api-cert.payeezy.com/v1'
      : 'https://api.payeezy.com/v1';
  }

  generateHmac(payload, timestamp) {
    const message = this.apiKey + timestamp + this.merchantToken + JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  async submitTransaction(transaction) {
    const timestamp = new Date().getTime();
    const hmac = this.generateHmac(transaction, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      'token': this.merchantToken,
      'timestamp': timestamp,
      'hmac': hmac
    };

    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(transaction)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.createTransactionResponse(data);
    } catch (error) {
      throw new Error(`Failed to process transaction: ${error.message}`);
    }
  }

  createTransactionResponse(response) {
    return {
      transactionId: response.transaction_id,
      _original: response,
      authCode: response.authorization_num,
      status: response.transaction_status
    };
  }

  submitTransaction(order, creditCard, prospect, other) {
    const payload = {
      merchant_ref: order.orderId || Date.now().toString(),
      transaction_type: 'purchase',
      method: 'credit_card',
      amount: order.amount,
      currency_code: order.currency || 'USD',
      credit_card: {
        type: this.getCardType(creditCard.cardNumber),
        cardholder_name: creditCard.cardHolder,
        card_number: creditCard.cardNumber,
        exp_date: creditCard.expirationMonth.toString().padStart(2, '0') + creditCard.expirationYear.toString().slice(-2),
        cvv: creditCard.cvv
      }
    };

    if (prospect) {
      payload.billing_address = {
        name: prospect.firstName + ' ' + prospect.lastName,
        street: prospect.address1,
        city: prospect.city,
        state_province: prospect.state,
        zip_postal_code: prospect.zip,
        country: prospect.country || 'US'
      };
    }

    return this.submitTransaction(payload);
  }

  getCardType(number) {
    // Basic card type detection
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6(?:011|5)/.test(number)) return 'discover';
    return 'unknown';
  }

  refundTransaction(transactionId, options) {
    const payload = {
      merchant_ref: options.orderId || Date.now().toString(),
      transaction_type: 'refund',
      method: 'credit_card',
      amount: options.amount,
      currency_code: options.currency || 'USD',
      transaction_tag: options.transactionTag,
      transaction_id: transactionId
    };

    return this.submitTransaction(payload);
  }

  voidTransaction(transactionId, options) {
    const payload = {
      merchant_ref: options.orderId || Date.now().toString(),
      transaction_type: 'void',
      method: 'credit_card',
      transaction_tag: options.transactionTag,
      transaction_id: transactionId
    };

    return this.submitTransaction(payload);
  }
}

exports.factory = function (options) {
  return new PayeezyGateway(options);
};
