import { Fragment, useMemo, useState } from "react";
import { useSimulation } from "../hooks/useSimulation.jsx";
import { api } from "../services/api";
import { Empty, PageHead, Panel, ShieldBadge, Stat } from "../components/ui.jsx";
import ActionLane, { Checks } from "../components/ActionLane.jsx";
import { ACTION_LABEL } from "../services/types";
import { num, timeOf } from "../components/format.js";

const TYPES = Object.keys(ACTION_LABEL);

function DryRun({ agents }) {
  const [form, setForm] = useState({ agent_id: "renewable_01", action_type: "export_power", power_kw: 1000, duration_minutes: 15 });
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const action = { agent_id: form.agent_id, action_type: form.action_type, power_kw: Number(form.power_kw),
        duration_minutes: Number(form.duration_minutes), target_node: null, reason_codes: ["OPERATOR_TEST"], confidence: 1 };
      setResult(await api.dryRun(form.agent_id, action));
    } catch (e) { setErr(e.message); setResult(null); }
    setBusy(false);
  };
  return (
    <Panel title="Try an action against the shield">
      <p className="muted">Craft any proposal, including absurd ones. It is validated against the current grid state and never applied.</p>
      <div className="form-row">
        <label className="field">Agent<select value={form.agent_id} onChange={set("agent_id")}>{agents.map((a) => <option key={a.agent_id}>{a.agent_id}</option>)}</select></label>
        <label className="field">Action<select value={form.action_type} onChange={set("action_type")}>{TYPES.map((t) => <option key={t} value={t}>{ACTION_LABEL[t]}</option>)}</select></label>
        <label className="field">Power (kW)<input type="number" step="0.1" min="0" value={form.power_kw} onChange={set("power_kw")} style={{ width: 100 }} /></label>
        <label className="field">Duration (min)<input type="number" min="1" value={form.duration_minutes} onChange={set("duration_minutes")} style={{ width: 90 }} /></label>
        <button className="btn primary" onClick={submit} disabled={busy}>Validate</button>
      </div>
      {err && <div className="banner" style={{ marginTop: 12 }}>{err}</div>}
      {result && <div style={{ marginTop: 14 }}><ActionLane record={{ ...result, proposal: result.proposal }} /></div>}
    </Panel>
  );
}

export default function SafetyShield() {
  const { safety, summary, agents } = useSimulation();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const events = useMemo(() => (safety.events || []).filter((e) => filter === "all" || e.status === filter), [safety, filter]);
  return (
    <div className="stack">
      <PageHead title="Safety shield">Deterministic checks between every AI proposal and the grid. Each decision is stored in a hash-chained log, so later edits are detectable.</PageHead>
      <div className="stats">
        <Stat label="Proposals checked" value={summary?.proposals ?? 0} />
        <Stat label="Approved" value={summary?.approved ?? 0} tone="good" />
        <Stat label="Projected (scaled down)" value={summary?.projected ?? 0} />
        <Stat label="Rejected" value={summary?.rejected ?? 0} tone={summary?.rejected ? "bad" : ""} />
        <Stat label="Violations the raw proposals would cause" value={summary?.violations_without_shield ?? 0} />
        <Stat label="Violations caused by executed actions" value={summary?.violations_caused_by_actions ?? 0} tone={summary?.violations_caused_by_actions ? "bad" : "good"} />
        <Stat label="Audit chain" value={safety.chain_valid === null ? "n/a" : safety.chain_valid ? "valid" : "broken"} tone={safety.chain_valid === false ? "bad" : ""} />
      </div>
      <div className="cols side">
        <Panel title="Safety events" right={
          <div className="segmented" role="group" aria-label="Filter by outcome">
            {["all", "projected", "rejected"].map((f) => <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>)}
          </div>} flush>
          {!events.length ? <Empty>No safety events for this filter.</Empty> : (
            <div className="scroll-y scroll-x">
              <table className="data">
                <thead><tr><th>Step</th><th>Agent</th><th>Outcome</th><th>Violations</th><th className="r">Requested</th><th className="r">Executed</th></tr></thead>
                <tbody>
                  {events.map((e) => (
                    <Fragment key={e.event_id}>
                      <tr onClick={() => setOpen(open === e.event_id ? null : e.event_id)} style={{ cursor: "pointer" }}>
                        <td>{e.sim_time}</td><td>{e.agent_id}</td><td><ShieldBadge status={e.status} /></td>
                        <td>{(e.violations || []).map((v) => v.code).join(", ") || <span className="muted">{e.event_type === "AGENT_ANOMALY" ? e.decision_source : "-"}</span>}</td>
                        <td className="r">{num(e.requested_action?.power_kw)}</td><td className="r">{num(e.validated_action?.power_kw ?? 0)}</td>
                      </tr>
                      {open === e.event_id && (
                        <tr><td colSpan="6">
                          <Checks checks={e.checks} />
                          {(e.violations || []).map((v, i) => <div className="viol" key={i}>{v.message}</div>)}
                          <p className="muted mono" style={{ marginTop: 8 }}>{timeOf(e.timestamp)} | hash {e.hash?.slice(0, 16)} | prev {e.prev_hash?.slice(0, 16)}</p>
                        </td></tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <DryRun agents={agents} />
      </div>
    </div>
  );
}
