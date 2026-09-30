import { Legend } from "../components/ui.jsx";

/** Stacked bar chart per step. groups: [{label,color,values}] all non-negative. */
export default function StackedBars({ labels, groups, height = 200, unit = "" }) {
  const W = 640, H = height, m = { l: 40, r: 12, t: 10, b: 24 };
  const n = labels.length;
  if (!n) return <div className="empty">No data yet</div>;
  const totals = labels.map((_, i) => groups.reduce((a, g) => a + (g.values[i] || 0), 0));
  const hi = Math.max(1, ...totals);
  const bw = Math.min(28, ((W - m.l - m.r) / n) * 0.7);
  const x = (i) => m.l + ((i + 0.5) / n) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v / hi) * (H - m.t - m.b);
  const every = Math.max(1, Math.ceil(n / 8));
  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Stacked bars ${unit}`}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line className="grid" x1={m.l} x2={W - m.r} y1={y(hi * f)} y2={y(hi * f)} />
            <text x={m.l - 6} y={y(hi * f) + 4} textAnchor="end">{Math.round(hi * f)}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          let acc = 0;
          return (
            <g key={i}>
              {groups.map((g) => {
                const v = g.values[i] || 0;
                const r = <rect key={g.label} x={x(i) - bw / 2} y={y(acc + v)} width={bw} height={Math.max(0, y(acc) - y(acc + v))} fill={g.color}><title>{`${l} ${g.label}: ${v}`}</title></rect>;
                acc += v;
                return r;
              })}
              {i % every === 0 && <text x={x(i)} y={H - 6} textAnchor="middle">{l}</text>}
            </g>
          );
        })}
        <line className="axis" x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} />
      </svg>
      <Legend items={groups.map((g) => ({ label: g.label, color: g.color }))} />
    </div>
  );
}
