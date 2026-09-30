import { useSimulation } from "../hooks/useSimulation.jsx";
import { Panel, PageHead, Stat } from "../components/ui.jsx";
import EventTimeline from "../components/EventTimeline.jsx";
import ActionLane from "../components/ActionLane.jsx";
import LineChart from "../charts/LineChart.jsx";
import StackedBars from "../charts/StackedBars.jsx";
import { NODE_COLORS, kw, num, pu } from "../components/format.js";

export default function Dashboard() {
  const { grid, series, summary, events, agents, safety } = useSimulation();
  const t = grid?.totals || {};
  const labels = series.map((s) => s.time);
  const latestUnsafe = agents.map((a) => a.latest).filter(Boolean).find((r) => r.shield.status !== "approved");
  const causedZero = summary && summary.violations_caused_by_actions === 0;
  return (
    <div className="stack">
      <PageHead title="Dashboard">
        Live state of the feeder. Agents propose actions; only what the Symbolic Safety Shield validates is applied to the grid.
      </PageHead>
      <div className="stats">
        <Stat label="Generation" value={kw(t.generation_kw, 1)} />
        <Stat label="Load" value={kw(t.load_kw, 1)} />
        <Stat label="Grid import / export" value={kw(t.ext_grid_kw, 1)} sub="positive = import" />
        <Stat label="Voltage range" value={`${pu(t.min_voltage_pu)} - ${pu(t.max_voltage_pu)}`} sub="limits 0.95 - 1.05 pu" />
        <Stat label="Worst line loading" value={`${num(t.max_line_loading_pct, 0)}%`} />
        <Stat label="Shield interventions" value={summary ? summary.projected + summary.rejected : 0} sub={summary ? `of ${summary.proposals} proposals` : ""} />
        <Stat label="Violations caused by actions" value={summary ? summary.violations_caused_by_actions : 0} tone={causedZero ? "good" : summary ? "bad" : ""} sub="executed vs. all-idle grid" />
      </div>
      <div className="cols c2">
        <Panel title="Generation, load and grid exchange" flush>
          <LineChart labels={labels} unit="kW" digits={1} series={[
            { label: "Generation", color: "#1c8a68", values: series.map((s) => s.generation_kw) },
            { label: "Load", color: "#c0392f", values: series.map((s) => s.load_kw) },
            { label: "Grid exchange", color: "#1d5f9b", values: series.map((s) => s.ext_grid_kw) },
          ]} />
        </Panel>
        <Panel title="Battery state of charge" flush>
          <LineChart labels={labels} unit="" digits={2} yMin={0} yMax={1} series={
            ["node_1", "node_2", "node_3"].map((n) => ({ label: n, color: NODE_COLORS[n], values: series.map((s) => s.nodes?.[n]?.soc) }))} />
        </Panel>
      </div>
      <div className="cols c2">
        <Panel title="Shield outcome per step" flush>
          <StackedBars labels={labels} groups={[
            { label: "approved", color: "#1c8a68", values: series.map((s) => s.counts.approved) },
            { label: "projected", color: "#b0731a", values: series.map((s) => s.counts.projected) },
            { label: "rejected", color: "#c0392f", values: series.map((s) => s.counts.rejected) },
          ]} />
        </Panel>
        <Panel title="Latest shield intervention">
          {latestUnsafe ? <ActionLane record={latestUnsafe} showChecks={false} /> : <div className="empty">No intervention in the latest step.</div>}
        </Panel>
      </div>
      <Panel title="Event timeline" right={<small>{safety.total || 0} safety events, hash chain {safety.chain_valid === null ? "n/a" : safety.chain_valid ? "valid" : "BROKEN"}</small>} flush>
        <EventTimeline events={events} types={["agent_action", "safety_intervention", "conflict_detected", "simulation_started", "simulation_complete", "simulation_stopped", "simulation_error"]} />
      </Panel>
    </div>
  );
}
