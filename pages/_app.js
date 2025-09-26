// pages/_app.js
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css"; // simple relative path; no "@/"

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
