import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import { connectSimulationSocket } from "../services/ws";

const Ctx = createContext(null);
export const useSimulation = () => useContext(Ctx);

const MAX_LIVE_EVENTS = 300;

export function SimulationProvider({ children }) {
  const [status, setStatus] = useState(null);
  const [grid, setGrid] = useState(null);
  const [topology, setTopology] = useState(null);
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [agents, setAgents] = useState([]);
  const [safety, setSafety] = useState({ events: [], chain_valid: null, total: 0 });
  const [scenarios, setScenarios] = useState([]);
  const [events, setEvents] = useState([]);
  const [socket, setSocket] = useState("connecting");
  const [error, setError] = useState(null);
  const refreshTimer = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [st, g, m, a, s] = await Promise.all([
        api.status(), api.gridState(), api.metrics(), api.agents(), api.safetyEvents(),
      ]);
      setStatus(st); setGrid(g); setSeries(m.series); setSummary(m.summary); setAgents(a); setSafety(s);
      setError(null);
    } catch (e) {
      setError(`Backend unreachable: ${e.message}`);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(refresh, 200);
  }, [refresh]);

  useEffect(() => {
    refresh();
    api.topology().then(setTopology).catch(() => {});
    api.scenarios().then(setScenarios).catch(() => {});
    api.events().then((r) => setEvents(r.events)).catch(() => {});
    const close = connectSimulationSocket({
      onState: setSocket,
      onEvent: (ev) => {
        if (ev.type === "connected") return;
        setEvents((prev) => [ev, ...prev].slice(0, MAX_LIVE_EVENTS));
        if (["grid_update", "simulation_complete", "simulation_stopped", "simulation_started", "simulation_error"].includes(ev.type)) {
          scheduleRefresh();
        }
      },
    });
    return close;
  }, [refresh, scheduleRefresh]);

  const act = useCallback(async (fn) => {
    try {
      const r = await fn();
      setError(null);
      await refresh();
      return r;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, [refresh]);

  const actions = useMemo(() => ({
    start: (cfg, resume = false) => act(() => api.start(cfg, resume)),
    stop: () => act(api.stop),
    reset: (cfg) => act(() => api.reset(cfg)).then(() => setEvents([])),
    step: () => act(api.step),
    runScenario: (id, cfg) => act(() => api.runScenario(id, cfg)),
    refresh,
  }), [act, refresh]);

  const value = { status, grid, topology, series, summary, agents, safety, scenarios, events, socket, error, ...actions };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
