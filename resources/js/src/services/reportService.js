import api from "./api";

export async function fetchReportSummary() {
    const response = await api.get("/reports/tickets");
    return response.data;
}
