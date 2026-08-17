import axios from "axios";

const API_BASE_URL =
  window.__API_BASE_URL__ || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({ baseURL: API_BASE_URL });

export async function getDashboard(startDate, endDate) {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await client.get("/api/dashboard", { params });
  return data;
}

export async function getDateBounds() {
  const { data } = await client.get("/api/dashboard/date-bounds");
  return data;
}

export async function sendChatMessage(message, sessionId) {
  const { data } = await client.post("/api/chat", { message, session_id: sessionId });
  return data;
}

export async function resetChatSession(sessionId) {
  const { data } = await client.post("/api/chat/reset", null, { params: { session_id: sessionId } });
  return data;
}

export async function getCumulativeReport(asOf) {
  const params = {};
  if (asOf) params.as_of = asOf;
  const { data } = await client.get("/api/reports/cumulative", { params });
  return data;
}

export function getCumulativeReportPdfUrl(asOf) {
  const params = new URLSearchParams();
  if (asOf) params.set("as_of", asOf);
  const query = params.toString();
  return `${API_BASE_URL}/api/reports/cumulative/pdf${query ? `?${query}` : ""}`;
}

export default client;
