import { useEffect, useState } from "react";
import { useSimulation } from "../hooks/useSimulation.jsx";
import { api } from "../services/api";
import { Empty, PageHead, Panel } from "../components/ui.jsx";
import { num, pct } from "../components/format.js";

function SummaryTable({ s }) {
  const rows = [
    ["Proposals", s.proposals], ["Approved", s.approved], ["Projected", s.projected], ["Rejected", s.rejected],
    ["Violations the raw proposals would cause", s.violations_without_shield],
    ["Violations caused by executed actions", s.violations_caused_by_actions],
    ["Steps with pre-existing grid stress (all idle)", s.violation_steps_no_action],
    ["Voltage violation steps", s.voltage_violation_steps], ["Line overload events", s.line_overload_events],
    ["Total energy cost (INR, illustrative)", num(s.total_cost, 2)], ["Renewable utilisation", pct(s.renewable_utilization, 1)],
    ["Battery throughput (kWh)", num(s.battery_throughput_kwh, 1)], ["Fallback rate", pct(s.fallback_rate, 1)],
    ["Avg decision latency", `${num(s.avg_decision_latency_ms, 1)} ms`], ["Audit chain valid", String(s.safety_chain_valid)],
  ];
  return <table className="data"><tbody>{rows.map(([k, v]) => <tr key={k}><td>{k}</td><td className="r">{v}</td></tr>)}</tbody></table>;
}

const METRIC_ROWS = [
  ["violation_steps_caused_by_actions", "Steps with violations caused by actions", 0],
  ["violations_without_shield", "Violations raw proposals would cause", 0],
  ["voltage_violation_steps", "Voltage violation steps", 0],
  ["line_overload_events", "Line overload events", 0],
  ["total_cost", "Energy cost (INR)", 1],
  ["renewable_utilization", "Renewable utilisation", 3],
  ["intervention_rate", "Shield intervention rate", 3],
  ["fallback_rate", "Fallback rate", 3],
  ["avg_decision_latency_ms", "Decision latency (ms)", 2],
];

function Experiment() {
  const [exp, setExp] = useState(null);
  const [job, setJob] = useState(null);
  const [seeds, setSeeds] = useState("0,1,2");
  const [steps, setSteps] = useState(16);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!job || job.status !== "running") return undefined;
    const t = setInterval(async () => {
      try {
        const r = await api.experiment(job.exp_id);
        if (r.status === "failed") { setJob(r); setErr(r.error); }
        else if (r.results || r.overall || r.by_scenario) { setExp(r.results || r); setJob({ ...job, status: "completed" }); }
      } catch (_) { /* still running */ }
    }, 1500);
    return () => clearInterval(t);
  }, [job]);
  const run = async () => {
    setErr(null); setExp(null);
    try {
      const list = seeds.split(",").map((x) => parseInt(x.trim(), 10)).filter((x) => !Number.isNaN(x));
      setJob(await api.experimentRun({ seeds: list, steps: Number(steps) }));
    } catch (e) { setErr(e.message); }
  };
  const arms = exp ? Object.keys(exp.overall) : [];
  return (
    <Panel title="Baseline vs. proposed system">
      <p className="muted">Runs every scenario with identical seeds for each arm. Nothing is precomputed: results come from actual simulation runs on this feeder.</p>
      <div className="form-row">
        <label className="field">Seeds (comma separated)<input value={seeds} onChange={(e) => setSeeds(e.target.value)} /></label>
        <label className="field">Steps per run<input type="number" min="4" max="96" value={steps} onChange={(e) => setSteps(e.target.value)} style={{ width: 90 }} /></label>
        <button className="btn primary" onClick={run} disabled={job?.status === "running"}>{job?.status === "running" ? "Running..." : "Run experiment"}</button>
      </div>
      {err && <div className="banner" style={{ marginTop: 12 }}>{err}</div>}
      {exp && (
        <div className="scroll-x" style={{ marginTop: 14 }}>
          <table className="data">
            <thead><tr><th>Metric (mean over scenarios and seeds)</th>{arms.map((a) => <th key={a} className="r">{exp.spec.arm_definitions[a]}</th>)}</tr></thead>
            <tbody>
              {METRIC_ROWS.map(([k, label, d]) => (
                <tr key={k}><td>{label}</td>{arms.map((a) => <td key={a} className="r">{exp.overall[a][k] ? num(exp.overall[a][k].mean, d) : "-"}</td>)}</tr>
              ))}
            </tbody>
          </table>
          {exp.notes.map((n) => <p key={n} className="muted" style={{ marginTop: 6 }}>{n}</p>)}
        </div>
      )}
    </Panel>
  );
}

export default function ScenarioRunner() {
  const { scenarios, runScenario, status } = useSimulation();
  const [busy, setBusy] = useState(null);
  const [results, setResults] = useState({});
  const go = async (id) => {
    setBusy(id);
    const r = await runScenario(id, { seed: 42, provider: "mock", step_delay_s: 0 });
    if (r) setResults((prev) => ({ ...prev, [id]: r }));
    setBusy(null);
  };
  return (
    <div className="stack">
      <PageHead title="Scenario runner">Seven scenarios, each seeded and reproducible. Some deliberately inject unsafe or malformed AI proposals to show the shield at work.</PageHead>
      {!scenarios.length ? <Empty>Scenario list unavailable.</Empty> : (
        <div className="cols c2">
          {scenarios.map((s) => (
            <Panel key={s.id} title={s.name} right={<button className="btn small primary" onClick={() => go(s.id)} disabled={busy !== null || status?.status === "running"}>{busy === s.id ? "Running..." : "Run"}</button>}>
              <p>{s.description}</p>
              <small className="muted">{s.n_steps} steps from {s.start_time}{s.faults.length ? `, ${s.faults.length} injected AI fault${s.faults.length > 1 ? "s" : ""}` : ""}</small>
              {results[s.id] && <div style={{ marginTop: 10 }}><SummaryTable s={results[s.id].summary} /></div>}
            </Panel>
          ))}
        </div>
      )}
      <Experiment />
    </div>
  );
}
