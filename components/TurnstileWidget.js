import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Script from "next/script";

function loadOptions(tokenCallback, widgetIdRef, containerRef, siteKey) {
  if (!window?.turnstile || widgetIdRef.current || !containerRef.current || !siteKey) {
    return;
  }

  widgetIdRef.current = window.turnstile.render(containerRef.current, {
    sitekey: siteKey,
    size: "invisible",
    callback: (token) => tokenCallback(token || null),
    "error-callback": () => tokenCallback(null),
    "timeout-callback": () => tokenCallback(null),
  });
}

const TurnstileWidget = forwardRef(function TurnstileWidget({ onToken, siteKey }, ref) {
  const [scriptReady, setScriptReady] = useState(false);
  const widgetIdRef = useRef(null);
  const containerRef = useRef(null);
  const pendingPromise = useRef(null);

  useEffect(() => {
    if (!scriptReady) return;
    loadOptions(
      (token) => {
        if (pendingPromise.current) {
          pendingPromise.current(token);
          pendingPromise.current = null;
        }
        onToken?.(token);
      },
      widgetIdRef,
      containerRef,
      siteKey
    );
  }, [scriptReady, siteKey, onToken]);

  useImperativeHandle(ref, () => ({
    async execute() {
      if (!window?.turnstile || !widgetIdRef.current) {
        return null;
      }
      return new Promise((resolve) => {
        pendingPromise.current = resolve;
        window.turnstile.execute(widgetIdRef.current);
      });
    },
    reset() {
      if (window?.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setScriptReady(true)}
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="hidden" />
    </>
  );
});

export default TurnstileWidget;
