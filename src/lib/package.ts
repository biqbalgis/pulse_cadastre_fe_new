import type { TaskRequest } from "@/api/types";
import { taskCode } from "./format";

/** Build the "authorized package": the task's parcels as a GeoJSON file. */
export function downloadParcelPackage(task: TaskRequest) {
  const collection = {
    type: "FeatureCollection",
    name: `${taskCode(task)}_${task.mouza}`,
    crs: { type: "name", properties: { name: "EPSG:4326" } },
    properties: {
      task_id: task.id,
      task_code: taskCode(task),
      district: task.district,
      mouza: task.mouza,
      mouza_id: task.mouza_id,
      status: task.status,
      exported_at: new Date().toISOString(),
    },
    features: (task.polygons ?? []).map((p) => ({
      type: "Feature",
      id: p.id,
      geometry: p.geometry,
      properties: { ...p.properties, task_parcel_label: p.label },
    })),
  };
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${task.mouza.replace(/\s+/g, "")}_${taskCode(task)}_parcels.geojson`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Survey date + notes have no backend field; they are stored as a small text document. */
export function surveyNotesFile(task: TaskRequest, date: string, notes: string): File {
  const body = [`Field survey — ${taskCode(task)} (${task.mouza}, ${task.district})`, `Survey date: ${date}`, "", notes.trim(), ""].join("\n");
  return new File([body], `${taskCode(task)}_survey-notes_${date}.txt`, { type: "text/plain" });
}
