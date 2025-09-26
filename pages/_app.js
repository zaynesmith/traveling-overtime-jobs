// pages/_app.js
import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "../components/Header";

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <Header />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
