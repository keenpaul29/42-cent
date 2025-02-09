# 42-cent-payeezy

Payeezy adapter for [42-cent](https://github.com/continuous-software/42-cent) payment processing library.

## Installation

```bash
npm install 42-cent-payeezy --save
```

## Usage

```javascript
const Gateways = require('42-cent');
const PayeezyGateway = require('42-cent-payeezy');

// Register the Payeezy gateway
Gateways.registerGateway('Payeezy', PayeezyGateway.factory);

// Create a new gateway instance
const gateway = Gateways.use('Payeezy', {
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  merchantToken: 'your-merchant-token',
  environment: 'sandbox' // or 'production'
});

// Create a credit card
const creditCard = Gateways.createCreditCard({
  cardNumber: '4111111111111111',
  expirationMonth: '01',
  expirationYear: '2025',
  cvv: '123',
  cardHolder: 'John Doe'
});

// Create a prospect (customer)
const prospect = Gateways.createProspect({
  firstName: 'John',
  lastName: 'Doe',
  address1: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip: '10001',
  country: 'US'
});

// Process a payment
gateway.submitTransaction({
  amount: 10.00,
  currency: 'USD',
  orderId: 'order-123'
}, creditCard, prospect)
  .then(transaction => {
    console.log('Transaction successful:', transaction);
  })
  .catch(error => {
    console.error('Transaction failed:', error);
  });
```

## API Reference

### Gateway Configuration

The gateway requires the following configuration options:

- `apiKey`: Your Payeezy API key
- `apiSecret`: Your Payeezy API secret
- `merchantToken`: Your Payeezy merchant token
- `environment`: Either 'sandbox' or 'production' (default: 'sandbox')

### Methods

- `submitTransaction(order, creditCard, prospect)`: Process a payment
- `refundTransaction(transactionId, options)`: Refund a transaction
- `voidTransaction(transactionId, options)`: Void a transaction

## License

MIT
