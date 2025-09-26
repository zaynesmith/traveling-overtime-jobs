import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Nav from "../components/Nav";

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <Nav />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
