// Common barcode formats for testing
export const TEST_BARCODES = {
  // Standard UPC-A barcodes (12 digits)
  COFFEE: "123456789012",
  TEA: "234567890123",
  MEDITATION_APP: "345678901234",
  EARBUDS: "456789012345",
  CHOCOLATE: "567890123456",
  WATER_BOTTLE: "678901234567",
  YOGA_MAT: "789012345678",
} as const;

// QR Code format for product data
export const createProductQR = (productId: string, barcode: string) => {
  return JSON.stringify({
    type: "product",
    productId,
    barcode,
    source: "store_app",
    timestamp: Date.now(),
  });
};

// Price tag QR format (common in retail)
export const createPriceTagQR = (
  barcode: string,
  price: number,
  name: string,
) => {
  return JSON.stringify({
    type: "price_tag",
    barcode,
    price,
    name,
    currency: "USD",
    timestamp: Date.now(),
  });
};

// Generate test QR codes for demo
export const DEMO_QR_CODES = {
  COFFEE_QR: createProductQR("1", TEST_BARCODES.COFFEE),
  TEA_QR: createProductQR("2", TEST_BARCODES.TEA),
  EARBUDS_PRICE_TAG: createPriceTagQR(
    TEST_BARCODES.EARBUDS,
    149.99,
    "Wireless Earbuds",
  ),
} as const;

// Helper to validate barcode format
export const isValidBarcode = (barcode: string): boolean => {
  // UPC-A: 12 digits
  // EAN-13: 13 digits
  // Code-128: variable length
  return /^\d{8,13}$/.test(barcode);
};

// Helper to format barcode display
export const formatBarcode = (barcode: string): string => {
  if (barcode.length === 12) {
    // UPC-A format: X-XXXXX-XXXXX-X
    return `${barcode.slice(0, 1)}-${barcode.slice(1, 6)}-${barcode.slice(6, 11)}-${barcode.slice(11)}`;
  }
  if (barcode.length === 13) {
    // EAN-13 format: X-XXXXXX-XXXXXX-X
    return `${barcode.slice(0, 1)}-${barcode.slice(1, 7)}-${barcode.slice(7, 12)}-${barcode.slice(12)}`;
  }
  return barcode;
};

// Console helpers for testing (you can run these in browser console)
export const logTestCodes = () => {
  console.log("=== TEST BARCODES ===");
  Object.entries(TEST_BARCODES).forEach(([name, code]) => {
    console.log(`${name}: ${code} (formatted: ${formatBarcode(code)})`);
  });

  console.log("\n=== TEST QR CODES ===");
  Object.entries(DEMO_QR_CODES).forEach(([name, code]) => {
    console.log(`${name}:`, code);
  });

  console.log("\n=== HOW TO TEST ===");
  console.log("1. Use an online barcode generator with the codes above");
  console.log("2. Use an online QR generator with the JSON strings above");
  console.log("3. Display on another device and scan with the app");
};
