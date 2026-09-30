import { useMemo } from "react";
import { Legend } from "../components/ui.jsx";

/**
 * Dependency-free SVG line chart.
 * series: [{label, color, values:number[]}]; x labels are `labels`.
 * bands: [{y1,y2,color}] shaded reference ranges; refs: [{y,label,color}] limit lines.
 */
export default function LineChart({ labels, series, height = 220, yMin, yMax, refs = [], unit = "", digits = 2, area = false }) {
  const W = 640, H = height, m = { l: 48, r: 12, t: 10, b: 24 };
  const calc = useMemo(() => {
    const vals = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
    const rv = refs.map((r) => r.y);
    let lo = yMin ?? Math.min(...vals, ...rv), hi = yMax ?? Math.max(...vals, ...rv);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) { lo = 0; hi = 1; }
    if (hi - lo < 1e-9) { hi = lo + 1; }
    const pad = (hi - lo) * (yMin === undefined && yMax === undefined ? 0.08 : 0);
    return { lo: lo - pad, hi: hi + pad };
  }, [series, yMin, yMax, refs]);
  const n = labels.length;
  if (!n) return <div className="empty">No data yet</div>;
  const x = (i) => m.l + (n === 1 ? 0.5 : i / (n - 1)) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - (v - calc.lo) / (calc.hi - calc.lo)) * (H - m.t - m.b);
  const ticks = Array.from({ length: 5 }, (_, i) => calc.lo + ((calc.hi - calc.lo) * i) / 4);
  const every = Math.max(1, Math.ceil(n / 8));
  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Line chart ${unit}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} />
            <text x={m.l - 6} y={y(t) + 4} textAnchor="end">{t.toFixed(digits)}</text>
          </g>
        ))}
        {labels.map((l, i) => (i % every === 0 ? <text key={i} x={x(i)} y={H - 6} textAnchor="middle">{l}</text> : null))}
        <line className="axis" x1={m.l} x2={m.l} y1={m.t} y2={H - m.b} />
        <line className="axis" x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} />
        {refs.map((r) => (
          <g key={r.label}>
            <line x1={m.l} x2={W - m.r} y1={y(r.y)} y2={y(r.y)} stroke={r.color || "#c0392f"} strokeDasharray="5 4" strokeWidth="1.2" />
            <text x={W - m.r - 2} y={y(r.y) - 4} textAnchor="end" style={{ fill: r.color || "#c0392f" }}>{r.label}</text>
          </g>
        ))}
        {series.map((s) => {
          const pts = s.values.map((v, i) => (Number.isFinite(v) ? `${x(i)},${y(v)}` : null)).filter(Boolean);
          if (!pts.length) return null;
          return (
            <g key={s.label}>
              {area && <polygon points={`${x(0)},${y(calc.lo)} ${pts.join(" ")} ${x(n - 1)},${y(calc.lo)}`} fill={s.color} opacity="0.12" />}
              <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" />
              {n < 40 && s.values.map((v, i) => (Number.isFinite(v) ? <circle key={i} cx={x(i)} cy={y(v)} r="2.2" fill={s.color}><title>{`${s.label} ${labels[i]}: ${Number(v).toFixed(digits)} ${unit}`}</title></circle> : null))}
            </g>
          );
        })}
      </svg>
      <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
    </div>
  );
}
