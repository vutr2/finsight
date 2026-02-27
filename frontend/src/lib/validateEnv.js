/**
 * Validate required environment variables at startup.
 * Call this at the top of API routes that depend on external services.
 */

const REQUIRED_SERVER = [
  "NEXT_PUBLIC_DESCOPE_PROJECT_ID",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VNPAY_TMN_CODE",
  "VNPAY_HASH_SECRET",
  "VNPAY_RETURN_URL",
];

let validated = false;

export function validateEnv() {
  if (validated) return;

  const missing = REQUIRED_SERVER.filter((key) => {
    const val = process.env[key];
    return !val || val.startsWith("your_");
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing or unconfigured environment variables: ${missing.join(", ")}\n` +
      `Please set them in .env.local`
    );
  }

  validated = true;
}
