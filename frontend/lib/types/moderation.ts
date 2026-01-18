// Moderation status types
export type ModerationStatus = 'pending' | 'passed' | 'flagged' | 'rejected';
export type ReviewDecision = 'approved' | 'rejected';
export type AppealStatus = 'pending' | 'approved' | 'denied';
export type FlagSeverity = 'low' | 'medium' | 'high';

// Moderation flag types
export interface ModerationFlag {
  type: string;
  severity: FlagSeverity;
  evidence: string;
}

// Moderation result from API
export interface ModerationResult {
  id: number;
  item_id: number;
  status: ModerationStatus;
  confidence_score: number | null;

  // Flags
  flagged_inappropriate: boolean;
  flagged_scam: boolean;
  flagged_prohibited: boolean;
  flagged_price_anomaly: boolean;
  flagged_contact_leak: boolean;
  flagged_condition_mismatch: boolean;

  // AI analysis
  ai_explanation: string | null;
  ai_suggested_condition: string | null;
  ai_category_match: boolean | null;
  ai_raw_response: Record<string, unknown> | null;

  // Review info
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_decision: ReviewDecision | null;
  review_notes: string | null;

  created_at: string;
  updated_at: string;
}

// Image moderation result
export interface ImageModeration {
  id: number;
  photo_id: number;
  moderation_result_id: number;
  is_appropriate: boolean | null;
  is_stock_photo: boolean | null;
  is_duplicate: boolean | null;
  matches_description: boolean | null;
  detected_objects: string[] | null;
  confidence_score: number | null;
  ai_notes: string | null;
  created_at: string;
}

// Moderation result with details (includes item info)
export interface ModerationResultWithDetails extends ModerationResult {
  item?: {
    id: number;
    title: string;
    description: string;
    price: number;
    condition: string;
    status: string;
  };
  seller?: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    avatar_url: string | null;
  };
  reviewer?: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    avatar_url: string | null;
  };
  images?: ImageModeration[];
}

// Moderation appeal
export interface ModerationAppeal {
  id: number;
  moderation_result_id: number;
  user_id: number;
  reason: string;
  status: AppealStatus;
  resolved_by: number | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

// Appeal with details
export interface ModerationAppealWithDetails extends ModerationAppeal {
  user?: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    avatar_url: string | null;
  };
  moderation_result?: ModerationResult;
  resolver?: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    avatar_url: string | null;
  };
}

// Analytics data
export interface ModerationAnalytics {
  id: number;
  date: string;
  school_id: number | null;
  total_scanned: number;
  auto_approved: number;
  flagged_for_review: number;
  rejected: number;
  appeals_submitted: number;
  appeals_approved: number;
  flagged_inappropriate: number;
  flagged_scam: number;
  flagged_prohibited: number;
  flagged_price: number;
}

// Analytics response from API
export interface ModerationAnalyticsResponse {
  summary: ModerationAnalytics;
  daily: ModerationAnalytics[];
  rates: {
    auto_approval_rate: number;
    flag_rate: number;
    reject_rate: number;
    appeal_success_rate: number;
  };
  period: {
    from_date: string;
    to_date: string;
  };
}

// Trends response from API
export interface ModerationTrendsResponse {
  current_period: {
    from: string;
    to: string;
    summary: ModerationAnalytics;
  };
  previous_period: {
    from: string;
    to: string;
    summary: ModerationAnalytics;
  };
  changes: {
    total_scanned: number;
    auto_approved: number;
    flagged_for_review: number;
    rejected: number;
    flagged_inappropriate: number;
    flagged_scam: number;
  };
}

// Scan result (returned when triggering a scan)
export interface ScanResultResponse {
  moderation_result: ModerationResult;
  scan_details: {
    passed: boolean;
    status: ModerationStatus;
    confidence_score: number;
    flags_count: number;
    explanation: string;
    suggested_condition: string | null;
    category_match: boolean;
  };
}

// API Payloads
export interface TriggerScanPayload {
  item_id: number;
}

export interface SubmitReviewPayload {
  decision: ReviewDecision;
  notes?: string;
}

export interface SubmitAppealPayload {
  moderation_result_id: number;
  reason: string;
}

export interface ResolveAppealPayload {
  status: 'approved' | 'denied';
  notes?: string;
}

// Filter for moderation queue
export interface ModerationQueueFilter {
  status?: ModerationStatus;
  school_id?: number;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

// Paginated response
export interface PaginatedModerationResults {
  data: ModerationResultWithDetails[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export interface PaginatedAppeals {
  data: ModerationAppealWithDetails[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

// Item creation response with moderation info
export interface ItemCreationResponse {
  item: {
    id: number;
    title: string;
    description: string;
    price: number;
    condition: string;
    status: string;
    // ... other item fields
  };
  moderation?: {
    status: 'scanning';
    message: string;
  };
}
