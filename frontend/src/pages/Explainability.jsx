import { useMemo, useState } from "react";
import { useSimulation } from "../hooks/useSimulation.jsx";
import { Empty, PageHead, Panel, ShieldBadge, SourceBadge } from "../components/ui.jsx";
import ActionLane from "../components/ActionLane.jsx";
import { num } from "../components/format.js";

/** Only structured facts are shown: inputs, decision factors, action, safety checks, outcome. No model reasoning text. */
export default function Explainability() {
  const { agents } = useSimulation();
  const records = useMemo(() => agents.map((a) => a.latest).filter(Boolean), [agents]);
  const [pick, setPick] = useState(null);
  const rec = records.find((r) => r.agent_id === pick) || records[0];
  if (!rec) return <div className="stack"><PageHead title="Explainability">Why each agent did what it did, and what the shield changed.</PageHead><Panel><Empty>No decisions yet. Step or start the simulation.</Empty></Panel></div>;
  const ex = rec.explanation;
  return (
    <div className="stack">
      <PageHead title="Explainability">Structured explanation of each decision: the inputs, the decision factors and the safety outcome. The system stores no model chain-of-thought.</PageHead>
      <div className="segmented" role="group" aria-label="Agent" style={{ justifySelf: "start" }}>
        {records.map((r) => <button key={r.agent_id} className={r.agent_id === rec.agent_id ? "on" : ""} onClick={() => setPick(r.agent_id)}>{r.agent_id}</button>)}
      </div>
      <Panel title={`${rec.agent_id} at ${rec.time}`}><ActionLane record={rec} /></Panel>
      <div className="cols c2">
        <Panel title="Why the agent proposed this">
          <p><strong>{ex.decision_label}</strong> {num(ex.power_kw)} kW with confidence {(ex.confidence * 100).toFixed(0)}%.</p>
          <ul>{ex.decision_factors.map((f) => <li key={f}>{f}</li>)}</ul>
          <div className="tags">{ex.reason_codes.map((c) => <span className="tag" key={c}>{c}</span>)}</div>
          <p style={{ marginTop: 10 }}>Decision source: <SourceBadge source={ex.decision_source} /> <span className="muted">{ex.decision_source_text}</span></p>
          {ex.fallback_reason && <p className="muted mono">{ex.fallback_reason}</p>}
        </Panel>
        <Panel title="What the agent knew">
          <dl className="kv">
            {Object.entries(ex.context_used).map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k.replace(/_/g, " ")}</dt><dd>{num(v, 3)}</dd></div>)}
          </dl>
        </Panel>
        <Panel title="Safety result">
          <p>Outcome: <ShieldBadge status={ex.safety_result} />. Executed power: <strong>{num(ex.executed_power_kw)} kW</strong> of {num(ex.power_kw)} kW requested.</p>
          {ex.shield_violations.length === 0 ? <p className="muted">All checks passed for the requested action.</p> : ex.shield_violations.map((v, i) => (
            <div className="viol" key={i}><span className="mono">{v.code}</span> at {v.component}: requested {num(v.requested)}, allowed {num(v.allowed)}</div>
          ))}
        </Panel>
        <Panel title="Raw record (JSON)"><pre className="json">{JSON.stringify(ex, null, 2)}</pre></Panel>
      </div>
    </div>
  );
}
