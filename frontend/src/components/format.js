export const kw = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? "-" : `${Number(v).toFixed(d)} kW`);
export const num = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? "-" : Number(v).toFixed(d));
export const pct = (v, d = 0) => (v === null || v === undefined ? "-" : `${(Number(v) * 100).toFixed(d)}%`);
export const pu = (v) => (v === null || v === undefined ? "-" : Number(v).toFixed(3));
export const timeOf = (iso) => (iso ? new Date(iso).toLocaleTimeString() : "");
export const NODE_COLORS = { node_1: "#4a56c9", node_2: "#b0731a", node_3: "#1c8a68" };
export const PALETTE = ["#1d5f9b", "#c0392f", "#1c8a68", "#b0731a", "#7a4fb5", "#4a56c9"];
