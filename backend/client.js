// Require the parts of the module you want to use.
const { Client, CheckoutAPI, Types} = require("@adyen/api-library");
 
// Set up the client and service.
const client = new Client({ apiKey: process.env.ADYEN_API_KEY, environment: "TEST" });
const checkoutAPI = new CheckoutAPI(client);
 
// Include your idempotency key when you make an API request.
const requestOptions = { idempotencyKey: process.env.ADYEN_IDEMPOTENCY_KEY };

module.exports = {
    checkoutAPI,
    requestOptions,
}