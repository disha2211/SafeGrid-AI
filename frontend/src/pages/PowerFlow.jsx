import { useSimulation } from "../hooks/useSimulation.jsx";
import { PageHead, Panel } from "../components/ui.jsx";
import LineChart from "../charts/LineChart.jsx";
import { NODE_COLORS, PALETTE, num } from "../components/format.js";

export default function PowerFlow() {
  const { series, grid } = useSimulation();
  const labels = series.map((s) => s.time);
  const lineNames = Object.keys(series[series.length - 1]?.lines || {});
  const busNames = Object.keys(series[series.length - 1]?.buses || {});
  const nodes = ["node_1", "node_2", "node_3"];
  return (
    <div className="stack">
      <PageHead title="Power flow">Results of the AC power flow (pandapower) after the validated actions of each step.</PageHead>
      <div className="cols c2">
        <Panel title="Bus voltage (pu)" flush>
          <LineChart labels={labels} digits={3} unit="pu" refs={[{ y: 1.05, label: "1.05 max" }, { y: 0.95, label: "0.95 min" }]}
            series={busNames.map((b, i) => ({ label: b, color: PALETTE[i], values: series.map((s) => s.buses?.[b]) }))} />
        </Panel>
        <Panel title="Line loading (%)" flush>
          <LineChart labels={labels} digits={0} unit="%" yMin={0} refs={[{ y: 100, label: "100% limit" }]}
            series={lineNames.map((l, i) => ({ label: l, color: PALETTE[i], values: series.map((s) => s.lines?.[l]) }))} />
        </Panel>
        <Panel title="Net exchange per node (kW, + = import)" flush>
          <LineChart labels={labels} digits={1} unit="kW"
            series={nodes.map((n) => ({ label: n, color: NODE_COLORS[n], values: series.map((s) => s.nodes?.[n]?.exchange_kw) }))} />
        </Panel>
        <Panel title="Battery power (kW, + = charging)" flush>
          <LineChart labels={labels} digits={1} unit="kW"
            series={nodes.map((n) => ({ label: n, color: NODE_COLORS[n], values: series.map((s) => s.nodes?.[n]?.battery_kw) }))} />
        </Panel>
        <Panel title="Generation and consumption (kW)" flush>
          <LineChart labels={labels} digits={1} unit="kW" area
            series={[{ label: "Generation", color: "#1c8a68", values: series.map((s) => s.generation_kw) }, { label: "Consumption", color: "#c0392f", values: series.map((s) => s.load_kw) }]} />
        </Panel>
        <Panel title="Imports and exports (kW)" flush>
          <LineChart labels={labels} digits={1} unit="kW"
            series={[{ label: "Import", color: "#1d5f9b", values: series.map((s) => s.import_kw) }, { label: "Export", color: "#b0731a", values: series.map((s) => s.export_kw) }]} />
        </Panel>
        <Panel title="Electricity price (INR/kWh, illustrative tariff)" flush>
          <LineChart labels={labels} digits={1} unit="INR/kWh" series={[{ label: "Price", color: "#7a4fb5", values: series.map((s) => s.price) }]} />
        </Panel>
        <Panel title="Network losses (kW)" flush>
          <LineChart labels={labels} digits={3} unit="kW" series={[{ label: "Losses", color: "#5d6b79", values: series.map((s) => s.losses_kw) }]} />
        </Panel>
      </div>
      {grid?.converged === false && <div className="banner">The last power flow did not converge.</div>}
    </div>
  );
}
