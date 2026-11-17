import type { TaskRequest, TaskStatus } from "@/api/types";

export type Tone = "info" | "warn" | "ok" | "danger" | "neutral";

/**
 * Backend workflow (pulse_cadastre_be_new, dch/task-request):
 *
 *   sent_to_manager → assigned → in_progress → completed | completed_with_constraints
 *     → (reviewer) approved | rejected → (cadastre manager) synced_with_lis
 *
 * The Figma screens use their own wording for the same states; this table is
 * the single place that maps one onto the other.
 */
const STATUS_META: Record<TaskStatus, { label: string; tone: Tone }> = {
  sent_to_manager: { label: "Awaiting assignment", tone: "neutral" },
  assigned: { label: "Assigned", tone: "info" },
  in_progress: { label: "In progress", tone: "ok" },
  completed: { label: "Submitted for review", tone: "warn" },
  completed_with_constraints: { label: "Submitted · issues flagged", tone: "danger" },
  approved: { label: "Ready for approval", tone: "ok" },
  rejected: { label: "Returned", tone: "danger" },
  synced_with_lis: { label: "LIS acknowledged", tone: "ok" },
};

export const ALL_STATUSES = Object.keys(STATUS_META) as TaskStatus[];

export function statusMeta(status: string): { label: string; tone: Tone } {
  return STATUS_META[status as TaskStatus] ?? { label: humanize(status), tone: "neutral" };
}

export function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export const REVIEW_STATUSES = new Set<string>(["completed", "completed_with_constraints"]);
export const EDITING_STATUSES = new Set<string>(["assigned", "in_progress", "rejected"]);

/** District Manager view of a task (Figma: District Task Queue). */
export function districtStage(task: TaskRequest): { label: string; tone: Tone; group: "survey" | "approval" | "close" } {
  switch (task.status) {
    case "synced_with_lis":
      return { label: "Ready to close", tone: "ok", group: "close" };
    case "completed":
    case "completed_with_constraints":
    case "approved":
      return { label: "Awaiting approval", tone: "warn", group: "approval" };
    case "rejected":
      return { label: "Returned for correction", tone: "danger", group: "survey" };
    case "sent_to_manager":
      return { label: "Sent to Central Office", tone: "neutral", group: "survey" };
    default:
      return { label: "Field survey ready", tone: "info", group: "survey" };
  }
}

/** Cadastre Manager view (Figma: Cadastre Task Queue). */
export function cadastreStage(task: TaskRequest): { label: string; tone: Tone; group: "new" | "review" | "final" | "done" } {
  switch (task.status) {
    case "sent_to_manager":
      return { label: "Unassigned", tone: "neutral", group: "new" };
    case "approved":
      return { label: "Ready for approval", tone: "ok", group: "final" };
    case "synced_with_lis":
      return { label: "LIS acknowledged", tone: "ok", group: "done" };
    case "rejected":
      return { label: "Returned to editor", tone: "danger", group: "review" };
    case "completed":
    case "completed_with_constraints":
      return { label: "Technical review", tone: "info", group: "review" };
    default:
      return { label: "With editor", tone: "info", group: "review" };
  }
}

/** Editor view (Figma: My Assignments). */
export function editorStage(task: TaskRequest): { label: string; tone: Tone } {
  switch (task.status) {
    case "assigned":
      return { label: "Assigned", tone: "info" };
    case "in_progress":
      return { label: "In progress", tone: "ok" };
    case "rejected":
      return { label: "Returned", tone: "danger" };
    case "completed":
    case "completed_with_constraints":
      return { label: "In review", tone: "warn" };
    case "approved":
    case "synced_with_lis":
      return { label: "Accepted", tone: "ok" };
    default:
      return statusMeta(task.status);
  }
}

/** Reviewer QC status (Figma: Review Queue). */
export function qcStage(task: TaskRequest): { label: string; tone: Tone } {
  return task.status === "completed_with_constraints"
    ? { label: "Issue flagged", tone: "danger" }
    : { label: "Passed", tone: "ok" };
}
