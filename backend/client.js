// Require the Finix SDK
const Finix = require("finix");

// Set up the Finix client
const finix = new Finix({
  username: process.env.FINIX_USERNAME,
  password: process.env.FINIX_PASSWORD,
  environment: process.env.FINIX_ENVIRONMENT || "sandbox",
});

// Include your application ID for API requests
const requestOptions = {
  applicationId: process.env.FINIX_APPLICATION_ID,
};

module.exports = {
  finix,
  requestOptions,
};
