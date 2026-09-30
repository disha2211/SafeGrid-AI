import { useSimulation } from "../hooks/useSimulation.jsx";
import { Panel, PageHead, Empty } from "../components/ui.jsx";
import { kw, num, pu } from "../components/format.js";

const vColor = (v) => (v < 0.95 || v > 1.05 ? "var(--rejected)" : v < 0.96 || v > 1.04 ? "var(--projected)" : "var(--approved)");
const lColor = (p) => (p > 100 ? "var(--rejected)" : p > 80 ? "var(--projected)" : "var(--executed)");

export default function GridView() {
  const { topology, grid } = useSimulation();
  if (!topology) return <Empty>Loading topology...</Empty>;
  const pos = Object.fromEntries(topology.nodes.map((n) => [n.id, n]));
  const buses = Object.fromEntries((grid?.buses || []).map((b) => [b.name, b]));
  const lines = Object.fromEntries((grid?.lines || []).map((l) => [l.name, l]));
  const trafo = (grid?.trafos || [])[0];
  const nodeByBus = Object.fromEntries((grid?.nodes || []).map((n) => [`B${n.bus}`, n]));
  return (
    <div className="stack">
      <PageHead title="Grid view">Low-voltage feeder behind a 20/0.4 kV transformer. Line colour shows loading, bus colour shows voltage against the 0.95 - 1.05 pu band.</PageHead>
      <Panel flush>
        <svg className="sld" viewBox="0 0 760 420" width="100%" role="img" aria-label="Single line diagram of the feeder">
          {topology.edges.map((e) => {
            const a = pos[e.source], b = pos[e.target];
            const l = lines[e.id];
            const load = e.kind === "trafo" ? trafo?.loading_percent : l?.loading_percent;
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            return (
              <g key={e.id}>
                <line className="edge" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={load === undefined ? "var(--line-strong)" : lColor(load)} strokeWidth={e.kind === "trafo" ? 6 : 4} />
                <text x={mx} y={my - 10} textAnchor="middle" fontSize="12" fontWeight="600">{e.id}</text>
                <text className="sub" x={mx} y={my + 14} textAnchor="middle">{load === undefined ? "" : `${num(load, 0)}% loaded`}{l ? `, ${num(l.p_from_kw, 1)} kW` : ""}</text>
              </g>
            );
          })}
          <g>
            <rect x={pos.ext.x - 38} y={pos.ext.y - 24} width="76" height="48" rx="4" fill="var(--panel)" stroke="var(--line-strong)" />
            <text x={pos.ext.x} y={pos.ext.y - 3} textAnchor="middle" fontSize="12" fontWeight="600">External grid</text>
            <text className="sub" x={pos.ext.x} y={pos.ext.y + 14} textAnchor="middle">{grid?.totals ? kw(grid.totals.ext_grid_kw, 1) : ""}</text>
          </g>
          {topology.nodes.filter((n) => n.type === "bus").map((n) => {
            const b = buses[n.id];
            const nd = nodeByBus[n.id];
            const dev = topology.devices.find((d) => d.bus === n.id);
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r="14" fill="var(--panel)" stroke={b ? vColor(b.vm_pu) : "var(--line-strong)"} strokeWidth="4" />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="600">{n.id}</text>
                <text className="sub" x={n.x} y={n.y + 32} textAnchor="middle">{b ? `${pu(b.vm_pu)} pu` : ""}</text>
                {dev && (
                  <g transform={`translate(${n.x + 24},${n.y - 30})`}>
                    <rect width="150" height="66" rx="4" fill="var(--panel)" stroke="var(--line-strong)" />
                    <text x="8" y="16" fontSize="12" fontWeight="600">{dev.label}</text>
                    <text className="sub" x="8" y="31">{dev.devices.join(", ")}</text>
                    {nd && <text className="sub" x="8" y="46">load {num(nd.load_kw, 1)} / PV {num(nd.pv_kw, 1)} kW</text>}
                    {nd && <text className="sub" x="8" y="59">battery {num(nd.battery_kw, 1)} kW, SOC {num(nd.soc * 100, 0)}%</text>}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </Panel>
      <Panel title="Line and transformer loading" flush>
        <table className="data">
          <thead><tr><th>Element</th><th className="r">Active power (kW)</th><th className="r">Current (kA)</th><th className="r">Rated (kA)</th><th className="r">Loading</th></tr></thead>
          <tbody>
            {(grid?.lines || []).map((l) => (
              <tr key={l.name}><td>{l.name}</td><td className="r">{num(l.p_from_kw, 2)}</td><td className="r">{num(l.i_ka, 4)}</td><td className="r">{num(l.max_i_ka, 4)}</td>
                <td className="r" style={{ color: lColor(l.loading_percent) }}>{num(l.loading_percent, 1)}%</td></tr>
            ))}
            {trafo && <tr><td>T0 transformer</td><td className="r">{num(trafo.p_hv_kw, 2)}</td><td className="r">-</td><td className="r">-</td><td className="r" style={{ color: lColor(trafo.loading_percent) }}>{num(trafo.loading_percent, 1)}%</td></tr>}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
