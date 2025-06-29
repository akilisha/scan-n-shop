const express = require("express");
const router = express.Router();
const { finix, requestOptions } = require("../client");

router.post("/payments/sessions", async function (req, res, next) {
  const { amount, currency, reference, merchantId } = req.body;

  try {
    // Create a Finix payment session
    const sessionData = {
      id: `FS${Date.now()}`,
      amount: {
        value: amount,
        currency: currency,
      },
      reference: reference,
      merchantId: merchantId,
      applicationId: requestOptions.applicationId,
      countryCode: "US",
      returnUrl: `${process.env.CLIENT_URL}/checkout/return`,
    };

    res.send(sessionData);
  } catch (error) {
    console.error("Error creating payment session:", error);
    res.status(500).send({ error: "Failed to create payment session" });
  }
});

router.post("/payments/process", async function (req, res, next) {
  const { paymentMethod, amount, reference, merchantId, source } = req.body;

  try {
    // Create a transfer using Finix
    const transfer = await finix.transfers.create({
      amount: amount, // Amount in cents
      currency: "USD",
      merchant: merchantId,
      source: source, // Payment instrument ID
      tags: {
        reference: reference,
      },
    });

    res.send({
      id: transfer.id,
      status: transfer.state,
      amount: transfer.amount,
      reference: reference,
      pspReference: transfer.id,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).send({ error: "Payment processing failed" });
  }
});

router.post("/payments/methods/store", async function (req, res, next) {
  const { paymentMethod, merchantReference } = req.body;

  try {
    // Create a payment instrument in Finix
    const paymentInstrument = await finix.paymentInstruments.create({
      name: paymentMethod.name,
      number: paymentMethod.number,
      expiration_month: paymentMethod.expiration_month,
      expiration_year: paymentMethod.expiration_year,
      security_code: paymentMethod.security_code,
      type: "PAYMENT_CARD",
      tags: {
        merchantReference: merchantReference,
      },
    });

    res.send({
      id: paymentInstrument.id,
      last4: paymentInstrument.last_four,
      brand: paymentInstrument.brand,
      type: paymentInstrument.type,
    });
  } catch (error) {
    console.error("Error storing payment method:", error);
    res.status(500).send({ error: "Failed to store payment method" });
  }
});

router.post("/merchants/create", async function (req, res, next) {
  const { name, email, phone, bankAccount, businessAddress } = req.body;

  try {
    // Create a merchant account in Finix
    const merchant = await finix.merchants.create({
      name: name,
      email: email,
      phone: phone,
      business_type: "INDIVIDUAL_SOLE_PROPRIETORSHIP",
      has_accepted_credit_cards_previously: false,
      default_statement_descriptor: "KERBDROP",
      bank_account: bankAccount,
      business_address: businessAddress,
    });

    res.send({
      id: merchant.id,
      status: merchant.verification?.merchant_identity?.status,
      canAcceptPayments: merchant.can_accept_payments,
    });
  } catch (error) {
    console.error("Error creating merchant:", error);
    res.status(500).send({ error: "Failed to create merchant account" });
  }
});

router.post("/webhooks/finix", async function (req, res, next) {
  const event = req.body;

  try {
    // Handle Finix webhook events
    console.log("Received Finix webhook:", event.type);

    switch (event.type) {
      case "created":
        if (event.entity === "merchant") {
          console.log("Merchant created:", event.merchant?.id);
        }
        break;
      case "updated":
        if (event.entity === "merchant") {
          console.log("Merchant updated:", event.merchant?.id);
        }
        break;
      case "succeeded":
        if (event.entity === "transfer") {
          console.log("Transfer succeeded:", event.transfer?.id);
        }
        break;
      case "failed":
        if (event.entity === "transfer") {
          console.log("Transfer failed:", event.transfer?.id);
        }
        break;
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send({ error: "Webhook processing failed" });
  }
});

module.exports = router;
