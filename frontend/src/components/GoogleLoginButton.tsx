import { useEffect, useRef, useState } from "react";
import { getGoogleNonce } from "../services/memberApi";

type GoogleIdApi = {
  initialize: (config: {
    client_id: string;
    nonce: string;
    auto_select: boolean;
    callback: (result: { credential: string }) => void;
  }) => void;
  renderButton: (
    element: HTMLElement,
    config: {
      theme: string;
      size: string;
      text: string;
      width: number;
    },
  ) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}
let sdkPromise: Promise<void> | undefined;
function loadGoogleSdk(): Promise<void> {
  if (window.google) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const timer = window.setTimeout(() => {
        script.remove();
        sdkPromise = undefined;
        reject(new Error("Google 元件載入逾時，請檢查網路後重試。"));
      }, 15000);
      script.onload = () => {
        window.clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        window.clearTimeout(timer);
        script.remove();
        sdkPromise = undefined;
        reject(new Error("無法載入 Google 元件，請檢查網路。"));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

export default function GoogleLoginButton({
  onLogin,
}: {
  onLogin: (credential: string) => Promise<void>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const handler = useRef(onLogin);
  const busy = useRef(false);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    handler.current = onLogin;
  }, [onLogin]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setMessage("正在準備 Google 登入…");
    async function prepare() {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) throw new Error("尚未設定 VITE_GOOGLE_CLIENT_ID。");
        await loadGoogleSdk();
        if (!active) return;
        const nonce = await getGoogleNonce(controller.signal);
        if (!active || !host.current || !window.google) return;
        const api = window.google.accounts.id;
        api.initialize({
          client_id: clientId,
          nonce,
          auto_select: false,
          callback: (result) => {
            if (!active || busy.current) return;
            busy.current = true;
            if (host.current) host.current.style.pointerEvents = "none";
            setMessage("Google 身分確認中…");
            void handler
              .current(result.credential)
              .catch((failure: unknown) => {
                if (!active) return;
                setMessage(
                  failure instanceof Error
                    ? failure.message
                    : "登入失敗，請重試。",
                );
                // nonce 可能已消耗，請按重試重新取得，不沿用舊挑戰。
                host.current?.replaceChildren();
              })
              .finally(() => {
                busy.current = false;
              });
          },
        });
        host.current.replaceChildren();
        host.current.style.pointerEvents = "auto";
        api.renderButton(host.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: 280,
        });
        setMessage("");
      } catch (failure) {
        if (active)
          setMessage(
            failure instanceof Error
              ? failure.message
              : "Google 登入初始化失敗。",
          );
      }
    }
    void prepare();
    return () => {
      active = false;
      controller.abort();
      host.current?.replaceChildren();
    };
  }, [attempt]);

  return (
    <section aria-label="Google 登入" style={{ marginTop: 24 }}>
      <div ref={host} />
      {message && <p role="status">{message}</p>}
      <button
        type="button"
        onClick={() => {
          if (!busy.current) setAttempt((value) => value + 1);
        }}
      >
        重新準備 Google 登入
      </button>
    </section>
  );
}
