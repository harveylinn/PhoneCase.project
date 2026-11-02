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
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      let settled = false;
      const timer = window.setTimeout(() => {
        settled = true;
        script.remove();
        sdkPromise = undefined;
        reject(new Error("Google 元件載入逾時，請檢查網路後重試。"));
      }, 15000);
      script.onload = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (window.google?.accounts?.id) resolve();
        else {
          script.remove();
          sdkPromise = undefined;
          reject(new Error("Google 元件尚未就緒，請重試。"));
        }
      };
      script.onerror = () => {
        if (settled) return;
        settled = true;
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

type LoginState =
  | { phase: "preparing" | "ready" | "verifying" }
  | { phase: "error"; message: string };

export default function GoogleLoginButton({
  onLogin,
}: {
  onLogin: (credential: string) => Promise<void>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const handler = useRef(onLogin);
  const phase = useRef<LoginState["phase"]>("preparing");
  const [state, setState] = useState<LoginState>({ phase: "preparing" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    handler.current = onLogin;
  }, [onLogin]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const element = host.current;
    let observer: ResizeObserver | undefined;
    function updateState(next: LoginState) {
      if (!active) return;
      phase.current = next.phase;
      setState(next);
    }
    async function prepare() {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) throw new Error("Google 登入暫時無法使用，請稍後重試或使用帳密登入。");
        await loadGoogleSdk();
        if (!active) return;
        const nonce = await getGoogleNonce(controller.signal);
        if (!active || !element || !window.google?.accounts?.id) return;
        const api = window.google.accounts.id;
        api.initialize({
          client_id: clientId,
          nonce,
          auto_select: false,
          callback: (result) => {
            if (!active || phase.current !== "ready") return;
            updateState({ phase: "verifying" });
            element.replaceChildren();
            void Promise.resolve()
              .then(() => handler.current(result.credential))
              .catch((failure: unknown) => {
                if (!active) return;
                updateState({
                  phase: "error",
                  message: failure instanceof Error && !(failure instanceof TypeError)
                    ? failure.message
                    : "無法完成 Google 登入，請檢查網路後重試。",
                });
                // nonce 可能已消耗，請按重試重新取得，不沿用舊挑戰。
              });
          },
        });
        let renderedWidth = 0;
        function renderButton() {
          if (!active || phase.current !== "ready" || !element) return;
          const width = Math.floor(element.getBoundingClientRect().width);
          if (width <= 0 || width === renderedWidth) return;
          element.replaceChildren();
          api.renderButton(element, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            width,
          });
          renderedWidth = width;
        }
        updateState({ phase: "ready" });
        renderButton();
        observer = new ResizeObserver(renderButton);
        observer.observe(element);
      } catch (failure) {
        if (active) {
          element?.replaceChildren();
          updateState({
            phase: "error",
            message: failure instanceof Error && !(failure instanceof TypeError)
              ? failure.message
              : "無法準備 Google 登入，請檢查網路後重試。",
          });
        }
      }
    }
    void prepare();
    return () => {
      active = false;
      controller.abort();
      observer?.disconnect();
      element?.replaceChildren();
    };
  }, [attempt]);

  return (
    <section aria-label="Google 登入" className="google-login">
      <div className="google-login-divider">或使用 Google 登入</div>
      <div
        className="google-login-content"
        aria-busy={state.phase === "preparing" || state.phase === "verifying"}
      >
        <div ref={host} className="google-login-host" />
        <p
          className={`google-login-status${state.phase === "error" ? " google-login-error" : ""}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {state.phase === "preparing" && "正在準備 Google 登入…"}
          {state.phase === "verifying" && "Google 身分確認中…"}
          {state.phase === "error" && state.message}
        </p>
        {state.phase === "error" && (
          <button
            className="google-login-retry"
            type="button"
            onClick={() => {
              if (phase.current !== "error") return;
              phase.current = "preparing";
              host.current?.replaceChildren();
              setState({ phase: "preparing" });
              setAttempt((value) => value + 1);
            }}
          >
            重試 Google 登入
          </button>
        )}
      </div>
    </section>
  );
}
