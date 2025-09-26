// pages/_app.js
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css";
import Header from "../components/Header";

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <Header />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
