import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSimulation } from "../hooks/useSimulation.jsx";
import { useTheme } from "../hooks/useTheme.js";

const NAV = [
  ["/", "Dashboard"], ["/grid", "Grid view"], ["/agents", "Agent monitor"], ["/shield", "Safety shield"],
  ["/power-flow", "Power flow"], ["/scenarios", "Scenario runner"], ["/explain", "Explainability"],
];
const PROVIDERS = [["mock", "Mock LLM"], ["api", "Real LLM (API)"], ["failing", "Failing LLM (test)"], ["baseline", "Baseline (no LLM)"]];

function RunControls() {
  const { status, scenarios, start, stop, reset, step } = useSimulation();
  const [cfg, setCfg] = useState({ scenario_id: "normal", provider: "mock", seed: 42, step_delay_s: 0.6 });
  const running = status?.status === "running";
  const finished = status && status.step >= status.total_steps;
  const pctDone = status ? Math.round((status.step / Math.max(status.total_steps, 1)) * 100) : 0;
  const set = (k) => (e) => setCfg({ ...cfg, [k]: k === "seed" || k === "step_delay_s" ? Number(e.target.value) : e.target.value });
  const fresh = !status || status.step === 0 || finished;
  return (
    <>
      <label className="field">Scenario
        <select value={cfg.scenario_id} onChange={set("scenario_id")} disabled={running}>
          {(scenarios.length ? scenarios : [{ id: "normal", name: "Normal operation" }]).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="field">Agent brain
        <select value={cfg.provider} onChange={set("provider")} disabled={running}>
          {PROVIDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="field">Seed
        <input type="number" value={cfg.seed} onChange={set("seed")} style={{ width: 70 }} disabled={running} />
      </label>
      <div className="form-row">
        <button className="btn primary" disabled={running} onClick={() => start(cfg, !fresh)}>{fresh ? "Start" : "Resume"}</button>
        <button className="btn" disabled={running} onClick={step}>Step</button>
        <button className="btn" disabled={!running} onClick={stop}>Stop</button>
        <button className="btn" onClick={() => reset(cfg)}>Reset</button>
      </div>
      <div className="grow" />
      <div title={`${status?.step ?? 0} of ${status?.total_steps ?? 0} steps`}>
        <span className={`dot ${status?.status || ""}`} />{status?.status || "unknown"}{status ? ` - ${status.time}` : ""}
        <div className="progress"><i style={{ width: `${pctDone}%` }} /></div>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const { error, socket, status } = useSimulation();
  const [theme, toggle] = useTheme();
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">SafeGrid-AI<small>Shielded multi-agent grid control</small></div>
        <nav className="nav" aria-label="Main">
          {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>)}
        </nav>
        <div className="side-foot">
          <div><span className={`dot ${socket}`} />Live stream {socket}</div>
          <div style={{ marginTop: 6 }}><button className="btn small" onClick={toggle}>{theme === "dark" ? "Light theme" : "Dark theme"}</button></div>
          <div style={{ marginTop: 6 }}>{status?.provider?.name ? `Provider: ${status.provider.name}` : ""}</div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar"><RunControls /></header>
        <main className="page">
          {error && <div className="banner" role="alert">{error}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
