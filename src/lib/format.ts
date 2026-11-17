import type { TaskRequest } from "@/api/types";

/** Display code used across the Figma screens, e.g. "GP-1042". */
export function taskCode(task: Pick<TaskRequest, "id"> | number | string): string {
  const id = typeof task === "object" ? task.id : task;
  return `GP-${String(id).padStart(4, "0")}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  // Backend timestamps are naive UTC (datetime.utcnow).
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatBytes(bytes?: number): string {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function parcelLabels(task: TaskRequest): string {
  const labels = (task.polygons ?? []).map((p) => p.label).filter(Boolean);
  if (labels.length === 0) return task.polygon_count ? `${task.polygon_count} parcel(s)` : "—";
  return labels.length > 6 ? `${labels.slice(0, 6).join(", ")} +${labels.length - 6}` : labels.join(", ");
}

export function matchesSearch(task: TaskRequest, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    taskCode(task),
    String(task.id),
    task.mouza,
    task.district,
    task.assigned_to ?? "",
    task.requested_by ?? "",
    ...(task.polygons ?? []).map((p) => p.label),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
