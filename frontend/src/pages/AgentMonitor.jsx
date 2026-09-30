import { useEffect, useState } from "react";
import { useSimulation } from "../hooks/useSimulation.jsx";
import { api } from "../services/api";
import { Empty, PageHead, Panel, ShieldBadge, SourceBadge } from "../components/ui.jsx";
import ActionLane from "../components/ActionLane.jsx";
import { ACTION_LABEL } from "../services/types";
import { kw, num, pct } from "../components/format.js";

export default function AgentMonitor() {
  const { agents, status } = useSimulation();
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const id = selected || agents[0]?.agent_id;
  useEffect(() => {
    if (!id) return;
    api.agent(id).then(setDetail).catch(() => setDetail(null));
  }, [id, status?.step]);
  const ctx = detail?.latest?.explanation;
  return (
    <div className="stack">
      <PageHead title="Agent monitor">Each agent perceives its node, proposes one action per step and never touches the grid directly. Failures of the LLM are handled by a labelled fallback policy.</PageHead>
      <div className="cols c3">
        {agents.map((a) => (
          <button key={a.agent_id} className="panel" onClick={() => setSelected(a.agent_id)} aria-pressed={id === a.agent_id}
                  style={{ textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit", borderColor: id === a.agent_id ? "var(--executed)" : undefined }}>
            <div className="panel-head"><h2 className="grow">{a.agent_id}</h2><span className="badge neutral">{a.role.replace("_", " ")}</span></div>
            <div className="panel-body">
              <dl className="kv">
                <dt>Node</dt><dd>{a.node_id}</dd>
                <dt>Battery SOC</dt><dd>{a.soc === undefined || a.soc === null ? "-" : pct(a.soc)}</dd>
                <dt>Local voltage</dt><dd>{num(a.voltage_pu, 3)} pu</dd>
                <dt>Grid exchange</dt><dd>{kw(a.exchange_kw)}</dd>
                <dt>Latest proposal</dt><dd>{a.latest ? `${ACTION_LABEL[a.latest.proposal.action_type]} ${kw(a.latest.proposal.power_kw)}` : "-"}</dd>
                <dt>Shield result</dt><dd>{a.latest ? <ShieldBadge status={a.latest.shield.status} /> : "-"}</dd>
                <dt>Decision source</dt><dd>{a.latest ? <SourceBadge source={a.latest.decision_source} /> : "-"}</dd>
              </dl>
            </div>
          </button>
        ))}
      </div>
      {!detail?.latest ? <Panel><Empty>No decisions yet for {id}. Step or start the simulation.</Empty></Panel> : (
        <>
          <Panel title={`${id}: latest decision (${detail.latest.time})`}>
            <ActionLane record={detail.latest} />
          </Panel>
          <div className="cols side">
            <Panel title="Recent decisions" flush>
              <div className="scroll-y scroll-x">
                <table className="data">
                  <thead><tr><th>Time</th><th>Proposal</th><th className="r">kW</th><th>Shield</th><th className="r">Executed kW</th><th>Source</th><th className="r">Latency</th></tr></thead>
                  <tbody>
                    {[...detail.history].reverse().map((h) => (
                      <tr key={h.step}><td>{h.time}</td><td>{ACTION_LABEL[h.proposal.action_type]}</td><td className="r">{num(h.proposal.power_kw)}</td>
                        <td><ShieldBadge status={h.shield.status} /></td><td className="r">{num(h.executed_power_kw)}</td>
                        <td><SourceBadge source={h.decision_source} /></td><td className="r">{num(h.latency_ms, 1)} ms</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title="Context the agent saw">
              <dl className="kv">
                {Object.entries(ctx?.context_used || {}).map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k.replace(/_/g, " ")}</dt><dd>{typeof v === "number" ? num(v, 3) : String(v)}</dd></div>)}
              </dl>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
