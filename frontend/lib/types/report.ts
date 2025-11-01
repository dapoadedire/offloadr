// Report Types
export type ReportType =
  | "scam"
  | "inappropriate"
  | "spam"
  | "sold"
  | "wrong_category"
  | "duplicate"
  | "other";

export interface Report {
  id: number;
  item_id: number;
  item_title: string;
  reporter_id: number;
  report_type: ReportType;
  comment: string | null;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
}

// Payload Types
export interface CreateReportPayload {
  item_id: number;
  report_type: ReportType;
  comment?: string;
}

// Report type display names
export const reportTypeLabels: Record<ReportType, string> = {
  scam: "Scam/Fraud",
  inappropriate: "Inappropriate Content",
  spam: "Spam Listing",
  sold: "Already Sold",
  wrong_category: "Wrong Category",
  duplicate: "Duplicate Listing",
  other: "Other",
};

// Report type descriptions
export const reportTypeDescriptions: Record<ReportType, string> = {
  scam: "This listing appears to be a scam or fraudulent",
  inappropriate: "This content is inappropriate or offensive",
  spam: "This is a spam or irrelevant listing",
  sold: "This item has already been sold",
  wrong_category: "This item is in the wrong category",
  duplicate: "This is a duplicate of another listing",
  other: "Other reason (please specify in comments)",
};
