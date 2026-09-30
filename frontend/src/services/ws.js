/** Small auto-reconnecting WebSocket client for /ws/simulation. */
export function connectSimulationSocket({ onEvent, onState }) {
  let ws = null;
  let closed = false;
  let retry = 0;
  let timer = null;

  const url = () => {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}/ws/simulation`;
  };

  const open = () => {
    onState?.("connecting");
    ws = new WebSocket(url());
    ws.onopen = () => {
      retry = 0;
      onState?.("open");
      timer = setInterval(() => ws.readyState === 1 && ws.send("ping"), 20000);
    };
    ws.onmessage = (m) => {
      try {
        onEvent(JSON.parse(m.data));
      } catch (_) {
        /* ignore malformed frame */
      }
    };
    ws.onclose = () => {
      clearInterval(timer);
      onState?.("closed");
      if (!closed) setTimeout(open, Math.min(1000 * 2 ** retry++, 8000));
    };
    ws.onerror = () => ws.close();
  };
  open();
  return () => {
    closed = true;
    clearInterval(timer);
    ws?.close();
  };
}
