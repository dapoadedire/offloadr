import apiClient from "./client";
import type { Report, CreateReportPayload } from "@/lib/types/report";

export const reportsApi = {
  // Report an item
  create: async (payload: CreateReportPayload): Promise<Report> => {
    const response = await apiClient.post<Report>("/reports", payload);
    return response.data;
  },

  // Get user's submitted reports
  getUserReports: async (): Promise<Report[]> => {
    const response = await apiClient.get<Report[]>("/users/me/reports");
    return response.data;
  },
};
