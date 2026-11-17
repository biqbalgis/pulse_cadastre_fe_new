import { api, downloadProtected } from "./client";
import type {
  Assignee,
  DistrictMouza,
  FeatureCollection,
  TaskDocument,
  TaskPolygon,
  TaskRequest,
  TaskRequestPayload,
  TaskStatus,
} from "./types";

const BASE = "dch/task-request";

export const taskApi = {
  districtMouzas: () => api.get<DistrictMouza[]>(`${BASE}/district-mouza/`),
  mouzaGeoJson: (mouzaId: number) =>
    api.get<FeatureCollection>(`${BASE}/mouza/{mouza_id}/geojson/`, { mouza_id: mouzaId }),

  create: (payload: TaskRequestPayload) => api.post<TaskRequest>(`${BASE}/`, payload),
  detail: (taskId: number | string) => api.get<TaskRequest>(`${BASE}/detail/{task_id}/`, { task_id: taskId }),

  createdByMe: () => api.get<TaskRequest[]>(`${BASE}/created-by-me/`),
  assignedToMe: () => api.get<TaskRequest[]>(`${BASE}/assigned-to-me/`),
  managerList: () => api.get<TaskRequest[]>(`${BASE}/manager/`),
  reviewerList: () => api.get<TaskRequest[]>(`${BASE}/reviewer/`),

  assignees: () => api.get<Assignee[]>(`${BASE}/assignees/`),
  assign: (taskId: number, assigneeId: number) =>
    api.post<TaskRequest>(`${BASE}/{task_id}/assign/`, { assigned_to: assigneeId }, { task_id: taskId }),
  setStatus: (taskId: number, status: TaskStatus, reason?: string) =>
    api.post<TaskRequest>(
      `${BASE}/{task_id}/status/`,
      reason ? { status, reason } : { status },
      { task_id: taskId },
    ),
  saveParcels: (taskId: number, polygons: TaskPolygon[], status: "completed" | "completed_with_constraints") =>
    api.post<TaskRequest>(`${BASE}/{task_id}/save-parcels/`, { polygons, status }, { task_id: taskId }),
  syncLis: (taskId: number) => api.post<TaskRequest>(`${BASE}/{task_id}/sync-lis/`, {}, { task_id: taskId }),

  documents: (taskId: number) => api.get<TaskDocument[]>(`${BASE}/{task_id}/documents/`, { task_id: taskId }),
  uploadDocuments: (taskId: number, files: File[]) => {
    const form = new FormData();
    files.forEach((file, i) => form.append(`file_${i}`, file, file.name));
    return api.raw<TaskDocument[]>("POST", `${BASE}/{task_id}/documents/`, {
      body: form,
      params: { task_id: taskId },
    });
  },
  deleteDocument: (taskId: number, documentId: number) =>
    api.delete(`${BASE}/{task_id}/documents/{document_id}/`, { task_id: taskId, document_id: documentId }),
  downloadDocument: (taskId: number, doc: TaskDocument) =>
    downloadProtected(
      `${BASE}/{task_id}/documents/{document_id}/file/`,
      { task_id: taskId, document_id: doc.id },
      doc.filename,
    ),
};
