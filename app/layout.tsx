"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode, useMemo } from "react";
import Header from "../components/Header";
import "../styles/globals.css";

const PLACEHOLDER_PUBLISHABLE_KEY = "pk_test_bmV4dC5jbGVyay5hY2NvdW50cy5kZXYk";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
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

  const appearance = useMemo(
    () => ({
      variables: {
        colorPrimary: "#1d4ed8",
      },
    }),
    []
  );

  return (
    <ClerkProvider publishableKey={publishableKey} appearance={appearance}>
      <html lang="en">
        <body>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
