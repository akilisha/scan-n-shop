const express = require("express");
const router = express.Router();
const { checkoutAPI, requestOptions } = require("../client");

router.post("/payments/sessions", async function (req, res, next) {
  const { amount, currency, reference, shopperReference } = req.body;

  // Create the request object(s)
  const createCheckoutSessionRequest = {
    merchantAccount: shopperReference || "CraftedOnECOM",
    amount: {
      value: amount,
      currency: currency,
    },
    returnUrl: `${process.env.CLIENT_URL}/checkout/return`,
    reference: reference,
    countryCode: "US",
    shopperLocale: "en-US",
    channel: "Web",
  };

  const response = await checkoutAPI.PaymentsApi.sessions(
    createCheckoutSessionRequest,
    requestOptions,
  );

  res.send(response);
});

router.post('/payments/process', async function (req, res, next) {
  const { paymentMethod, amount, reference, shopperReference, returnUrl, } = req.body;


});

router.post('/payments/details', async function (req, res, next) {
  const {details, paymentData } = req.body;


});

router.post('/payments/methods/store', async function (req, res, next) {
  const {paymentMethod, shopperReference } = req.body;

  
});

router.post('/webhooks/adyen', async function (req, res, next) {
  const {details, paymentData } = req.body;


});

module.exports = router;
