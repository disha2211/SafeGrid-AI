import { ACTION_LABEL } from "../services/types";
import { kw } from "./format";
import { ShieldBadge, SourceBadge } from "./ui.jsx";

const CHECK_LABEL = {
  STRUCTURE: "Structure", BATTERY: "Battery", NODE_LIMITS: "Node limits", POWER_FLOW: "Power flow", VOLTAGE: "Voltage",
  LINE_LOADING: "Line loading", TRANSFORMER: "Transformer", GRID_LIMITS: "Grid limits",
};

export function Checks({ checks }) {
  return (
    <div className="checks">
      {checks.map((c) => (
        <span key={c.name} className={`check ${c.passed === null ? "skip" : c.passed ? "pass" : "fail"}`}
              title={c.passed === null ? "not evaluated" : c.passed ? "passed" : "failed"}>
          {CHECK_LABEL[c.name] || c.name}
        </span>
      ))}
    </div>
  );
}

/** AI proposal -> Safety Shield decision -> action executed on the grid. Always shows all three. */
export default function ActionLane({ record, showChecks = true }) {
  const { proposal, shield, decision_source, fallback_reason } = record;
  const va = shield.validated_action;
  return (
    <div>
      <div className="lane">
        <div className="cell proposed">
          <div className="who">AI proposal <SourceBadge source={decision_source} /></div>
          <div className="big">{kw(proposal.power_kw)}</div>
          <div>{ACTION_LABEL[proposal.action_type]}</div>
          <small>confidence {(proposal.confidence * 100).toFixed(0)}%</small>
        </div>
        <div className="arrow" aria-hidden="true">&#9656;</div>
        <div className={`cell ${shield.status}`}>
          <div className="who">Safety Shield</div>
          <div className="big"><ShieldBadge status={shield.status} /></div>
          <div>{shield.violations.length ? `${shield.violations.length} violation${shield.violations.length > 1 ? "s" : ""} found` : "No violations"}</div>
          {shield.corrections.filter((c) => c.field === "power_kw").map((c) => (
            <small key={c.field}>scaled {kw(c.from)} to {kw(c.to)}</small>
          ))}
        </div>
        <div className="arrow" aria-hidden="true">&#9656;</div>
        <div className="cell executed">
          <div className="who">Executed on grid</div>
          <div className="big">{va ? kw(va.power_kw) : kw(0)}</div>
          <div>{va ? ACTION_LABEL[va.action_type] : "Nothing executed"}</div>
        </div>
      </div>
      {fallback_reason && <p className="muted" style={{ marginTop: 8 }}>LLM unavailable or invalid, fallback used: <span className="mono">{fallback_reason}</span></p>}
      {shield.violations.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {shield.violations.map((v, i) => (
            <div className="viol" key={i}><strong className="mono">{v.code}</strong> at {v.component}: {v.message}
              <span className="muted"> (requested {Number(v.requested).toFixed(2)} {v.unit}, allowed {Number(v.allowed).toFixed(2)} {v.unit})</span></div>
          ))}
        </div>
      )}
      {showChecks && <div style={{ marginTop: 8 }}><Checks checks={shield.checks} /></div>}
    </div>
  );
}
