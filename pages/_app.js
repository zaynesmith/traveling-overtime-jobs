import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css";
import Header from "../components/Header";

const PLACEHOLDER_PUBLISHABLE_KEY = "pk_test_bmV4dC5jbGVyay5hY2NvdW50cy5kZXYk";

export default function App({ Component, pageProps }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      "Missing Clerk publishable key. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment (see .env.local.example)."
    );
  }

  if (publishableKey === PLACEHOLDER_PUBLISHABLE_KEY && process.env.VERCEL === "1") {
    throw new Error(
      "Replace the placeholder Clerk publishable key before deploying. See .env.local.example for details."
    );
  }

  if (publishableKey === PLACEHOLDER_PUBLISHABLE_KEY && process.env.NODE_ENV !== "production") {
    console.warn(
      "Using placeholder Clerk keys. Update .env.local with your own Clerk credentials to enable authentication."
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} {...pageProps}>
      <Header />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
