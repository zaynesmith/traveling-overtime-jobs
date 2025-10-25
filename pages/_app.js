import Head from "next/head";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";
import Header from "../components/Header";

export default function App({ Component, pageProps }) {
  const { session, ...rest } = pageProps;

  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Header />
      <Component {...rest} />
    </SessionProvider>
  );
}
