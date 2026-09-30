import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import GridView from "./pages/GridView.jsx";
import AgentMonitor from "./pages/AgentMonitor.jsx";
import SafetyShield from "./pages/SafetyShield.jsx";
import PowerFlow from "./pages/PowerFlow.jsx";
import ScenarioRunner from "./pages/ScenarioRunner.jsx";
import Explainability from "./pages/Explainability.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/grid" element={<GridView />} />
        <Route path="/agents" element={<AgentMonitor />} />
        <Route path="/shield" element={<SafetyShield />} />
        <Route path="/power-flow" element={<PowerFlow />} />
        <Route path="/scenarios" element={<ScenarioRunner />} />
        <Route path="/explain" element={<Explainability />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}
