import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";
import Header from "../components/Header";

export default function App({ Component, pageProps }) {
  const { session, ...rest } = pageProps;

  return (
    <SessionProvider session={session}>
      <Header />
      <Component {...rest} />
    </SessionProvider>
  );
}
