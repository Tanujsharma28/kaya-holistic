import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let scriptPromise = null;

const loadGsi = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { scriptPromise = null; reject(new Error("gsi")); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
};

export default function GoogleSignIn({ onCredential, onError }) {
  const ref = useRef(null);

  useEffect(() => {
    let off = false;
    if (!CLIENT_ID) { onError?.("Google sign-in is not set up yet."); return undefined; }
    loadGsi()
      .then(() => {
        if (off || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (r) => r?.credential && onCredential(r.credential),
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 320,
        });
      })
      .catch(() => onError?.("Could not load Google sign-in. Please check your connection."));
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} style={{ minHeight: 44, display: "flex", justifyContent: "center" }} />;
}
