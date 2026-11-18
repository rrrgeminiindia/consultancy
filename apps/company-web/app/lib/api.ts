import "server-only";

export interface CompanySummary {
  instance_code: string;
  display_name: string;
  status: string;
}

export interface DashboardSummary {
  company: CompanySummary;
  metrics: {
    total_candidates: number;
    bench_candidates: number;
    marketing_candidates: number;
    upcoming_interviews: number;
    active_placements: number;
  };
}

export interface Membership {
  group_id: string;
  group_code: string;
  group_name: string;
  role: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  display_name: string;
  global_role: string;
  can_view_all_groups: boolean;
  can_manage_company: boolean;
  can_view_rates: boolean;
  memberships: Membership[];
}

export interface GroupMember {
  user_id: string;
  display_name: string;
  email: string;
  global_role: string;
  membership_role: string;
  started_at: string;
}

export interface GroupSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  candidate_count: number;
  leads: GroupMember[];
  current_user_role: string | null;
}

export interface GroupDetail extends GroupSummary {
  members: GroupMember[];
}

export interface EligibleGroupUser {
  id: string;
  display_name: string;
  email: string;
  global_role: string;
  memberships: Array<{
    group_id: string;
    group_name: string;
    role: string;
  }>;
}

export interface EligibleGroupUserList {
  items: EligibleGroupUser[];
  total: number;
  page: number;
  page_size: number;
}

export interface CandidateSummary {
  id: string;
  candidate_number: string;
  first_name: string;
  last_name: string;
  display_name: string;
  professional_title: string | null;
  email: string | null;
  phone: string | null;
  lifecycle_state: string;
  lifecycle_entered_at: string;
  last_activity_at: string;
  availability_date: string | null;
  stream_name: string | null;
  group_id: string | null;
  group_name: string | null;
  owner_user_id: string | null;
  owner_name: string | null;
}

export interface CandidateDetail extends CandidateSummary {
  middle_name: string | null;
  preferred_name: string | null;
  summary: string | null;
  marketing_summary: string | null;
  total_experience_months: number | null;
  relevant_experience_months: number | null;
  city: string | null;
  state_region: string | null;
  country: string | null;
  current_location: string | null;
  relocation_preference: string | null;
  remote_preference: string | null;
  work_authorization: string | null;
  employment_preference: string | null;
  current_pay_rate: number | null;
  target_pay_rate: number | null;
  target_bill_rate: number | null;
  currency: string;
  notice_period_days: number | null;
  profile_completeness: number;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
  can_view_rates: boolean;
  current_user_group_role: string | null;
}

export interface CandidateList {
  items: CandidateSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface TimelineEvent {
  id: string;
  category: string;
  event_type: string;
  summary: string;
  occurred_at: string;
  actor_name: string | null;
  group_name: string | null;
  metadata: Record<string, unknown>;
}

export interface CandidateHistory {
  candidate_id: string;
  items: TimelineEvent[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  const apiUrl = process.env.COMPANY_API_URL ?? "http://127.0.0.1:8100";
  const userEmail = process.env.COMPANY_DEV_USER_EMAIL ?? "admin@company.local";
  const response = await fetch(`${apiUrl}${path}`, {
    cache: "no-store",
    headers: { "X-User-Email": userEmail },
  });
  if (!response.ok) {
    let message = `Company API request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) message = body.detail;
    } catch {
      // Preserve the status-based message when a non-JSON response is returned.
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

async function apiMutation<T>(path: string, method: "POST", body: unknown): Promise<T> {
  const apiUrl = process.env.COMPANY_API_URL ?? "http://127.0.0.1:8100";
  const userEmail = process.env.COMPANY_DEV_USER_EMAIL ?? "admin@company.local";
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": userEmail,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let message = `Company API request failed (${response.status})`;
    try {
      const responseBody = (await response.json()) as { detail?: string };
      if (responseBody.detail) message = responseBody.detail;
    } catch {
      // Preserve the status-based message when a non-JSON response is returned.
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export function getDashboardSummary() {
  return apiFetch<DashboardSummary>("/api/v1/dashboard/summary");
}

export function getMe() {
  return apiFetch<CurrentUser>("/api/v1/me");
}

export function getGroups() {
  return apiFetch<GroupSummary[]>("/api/v1/groups");
}

export function getGroup(groupId: string) {
  return apiFetch<GroupDetail>(`/api/v1/groups/${groupId}`);
}

export function createGroup(input: { code: string; name: string; description?: string }) {
  return apiMutation<GroupDetail>("/api/v1/groups", "POST", input);
}

export function getEligibleGroupUsers(groupId: string, search?: string) {
  const params = new URLSearchParams({ page_size: "50" });
  if (search) params.set("search", search);
  return apiFetch<EligibleGroupUserList>(
    `/api/v1/groups/${groupId}/eligible-users?${params.toString()}`,
  );
}

export function addGroupMember(
  groupId: string,
  input: { user_id: string; membership_role: string },
) {
  return apiMutation<GroupDetail>(`/api/v1/groups/${groupId}/members`, "POST", input);
}

export function getCandidates(options: {
  search?: string;
  groupId?: string;
  lifecycleState?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.groupId) params.set("group_id", options.groupId);
  if (options.lifecycleState) params.set("lifecycle_state", options.lifecycleState);
  if (options.page) params.set("page", String(options.page));
  if (options.pageSize) params.set("page_size", String(options.pageSize));
  const suffix = params.size ? `?${params.toString()}` : "";
  return apiFetch<CandidateList>(`/api/v1/candidates${suffix}`);
}

export function getCandidate(candidateId: string) {
  return apiFetch<CandidateDetail>(`/api/v1/candidates/${candidateId}`);
}

export function getCandidateHistory(candidateId: string) {
  return apiFetch<CandidateHistory>(`/api/v1/candidates/${candidateId}/history`);
}

export function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value: string | null, includeTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(value));
}
