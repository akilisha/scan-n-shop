// Simple test script for payment intent creation
require("dotenv").config();

const { stripe, createPaymentIntentOptions } = require("./client");

async function testBasicPaymentIntent() {
  console.log("🧪 Testing basic payment intent creation...");

  try {
    // Test data
    const amount = 2999; // $29.99
    const currency = "usd";

    console.log(
      `💰 Creating payment intent for $${amount / 100} ${currency.toUpperCase()}`,
    );

    // Create payment intent using our helper function
    const options = createPaymentIntentOptions(amount, currency);
    options.metadata = {
      test: "true",
      created_via: "test_script",
    };

    const paymentIntent = await stripe.paymentIntents.create(options);

    console.log("✅ Payment intent created successfully!");
    console.log(`📄 ID: ${paymentIntent.id}`);
    console.log(`💸 Amount: $${paymentIntent.amount / 100}`);
    console.log(
      `🔐 Client Secret: ${paymentIntent.client_secret.substring(0, 20)}...`,
    );
    console.log(`📊 Status: ${paymentIntent.status}`);

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
      },
    };
  } catch (error) {
    console.error("❌ Payment intent creation failed:");
    console.error(`   Error: ${error.message}`);

    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }

    if (error.message.includes("No such API key")) {
      console.log(
        "\n💡 Tip: Make sure you've set STRIPE_SECRET_KEY in backend/.env",
      );
      console.log(
        "   Get your test keys from: https://dashboard.stripe.com/test/apikeys",
      );
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the test
if (require.main === module) {
  testBasicPaymentIntent()
    .then((result) => {
      if (result.success) {
        console.log("\n🎉 Test completed successfully!");
        process.exit(0);
      } else {
        console.log("\n💥 Test failed!");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Unexpected error:", error);
      process.exit(1);
    });
}

module.exports = { testBasicPaymentIntent };
