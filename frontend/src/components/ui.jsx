import { SOURCE_LABEL } from "../services/types";

export function Panel({ title, right, children, flush = false, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      {(title || right) && (
        <div className="panel-head">
          <h2 className="grow">{title}</h2>
          {right}
        </div>
      )}
      <div className={`panel-body ${flush ? "flush" : ""}`}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className={`stat ${tone || ""}`}>
      <div className="v">{value}</div>
      <div className="k">{label}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
}

export const ShieldBadge = ({ status }) => <span className={`badge ${status}`}>{status}</span>;
export const SourceBadge = ({ source }) => (
  <span className={`badge ${source === "fallback" || source === "injected" ? "projected" : "neutral"}`}>{SOURCE_LABEL[source] || source}</span>
);
export const Empty = ({ children }) => <div className="empty">{children}</div>;
export const PageHead = ({ title, children }) => (
  <div className="page-head">
    <h1>{title}</h1>
    {children && <p>{children}</p>}
  </div>
);
export const Legend = ({ items }) => (
  <div className="legend">
    {items.map((i) => (
      <span key={i.label}><i style={{ background: i.color }} />{i.label}</span>
    ))}
  </div>
);
