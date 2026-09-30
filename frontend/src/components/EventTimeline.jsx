import { ACTION_LABEL } from "../services/types";
import { kw } from "./format";
import { Empty, ShieldBadge } from "./ui.jsx";

function describe(ev) {
  const d = ev.data || {};
  switch (ev.type) {
    case "agent_action":
      return <><strong>{d.agent_id}</strong> proposed {ACTION_LABEL[d.proposal.action_type]} {kw(d.proposal.power_kw)} <ShieldBadge status={d.shield_status} /> executed {kw(d.executed_power_kw)}</>;
    case "safety_intervention":
      return <><strong>Shield {d.status}</strong> {d.agent_id}: {(d.violations || []).map((v) => v.code).join(", ") || "-"}</>;
    case "conflict_detected":
      return <><strong>Conflict {d.type}</strong>: {d.detail}</>;
    case "grid_update":
      return <>Grid updated: min {d.grid?.totals?.min_voltage_pu} pu, worst line {d.grid?.totals?.max_line_loading_pct}%</>;
    case "simulation_started": return <>Simulation started ({d.steps} steps)</>;
    case "simulation_complete": return <>Simulation complete</>;
    case "simulation_stopped": return <>Simulation stopped</>;
    case "simulation_error": return <><strong>Simulation error</strong>: {d.error}</>;
    default: return <>{ev.type}</>;
  }
}

export default function EventTimeline({ events, types, limit = 60 }) {
  const list = (types ? events.filter((e) => types.includes(e.type)) : events).slice(0, limit);
  if (!list.length) return <Empty>No events yet. Start or step the simulation.</Empty>;
  return (
    <ul className="timeline">
      {list.map((ev, i) => (
        <li key={`${ev.timestamp}-${i}`}>
          <span className="t">{ev.data?.time || ""}</span>
          <span>{describe(ev)}</span>
        </li>
      ))}
    </ul>
  );
}
