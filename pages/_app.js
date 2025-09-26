// pages/_app.js
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css"; // use a simple relative path

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
