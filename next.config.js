/** @type {import('next').NextConfig} */
const nextConfig = {};

const envPlaceholders = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_bmV4dC5jbGVyay5hY2NvdW50cy5kZXYk",
  CLERK_SECRET_KEY: "sk_test_bmV4dC5jbGVyay5hY2NvdW50cy5kZXYk",
};

for (const [key, placeholder] of Object.entries(envPlaceholders)) {
  if (!process.env[key]) {
    const message = `${key} must be set in the environment. See .env.local.example for guidance.`;

    if (process.env.VERCEL === "1") {
      throw new Error(message);
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn(`Using placeholder ${key} for local development. ${message}`);
    }

    process.env[key] = placeholder;
  }
}

module.exports = nextConfig;
