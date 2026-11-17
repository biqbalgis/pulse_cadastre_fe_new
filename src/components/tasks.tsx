import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import type { TaskDocument, TaskRequest } from "@/api/types";
import { formatBytes, formatDate, taskCode } from "@/lib/format";
import type { Tone } from "@/lib/status";
import { useAsync } from "@/state/useAsync";
import { useToast, errorMessage } from "@/state/toast";
import { Chip, Empty, ErrorBanner, Loading } from "./ui";

/** Load the task named by the :taskId route param (null when absent). */
export function useRouteTask() {
  const { taskId } = useParams();
  const id = taskId ? Number(taskId) : null;
  const state = useAsync(() => (id ? taskApi.detail(id) : Promise.resolve(null)), [id]);
  return { taskId: id, ...state };
}

export function useTaskDocuments(taskId: number | null) {
  return useAsync(() => (taskId ? taskApi.documents(taskId) : Promise.resolve([] as TaskDocument[])), [taskId]);
}

/**
 * Pages reached from the sidebar have no task in the URL. They show this list
 * of tasks the page can act on, each linking to `${basePath}/${id}`.
 */
export function TaskPicker({
  title,
  description,
  tasks,
  loading,
  error,
  onRetry,
  basePath,
  status,
  emptyText,
  actionLabel = "Open",
}: {
  title: string;
  description?: string;
  tasks: TaskRequest[] | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  basePath: string;
  status: (task: TaskRequest) => { label: string; tone: Tone };
  emptyText: string;
  actionLabel?: string;
}) {
  return (
    <div className="stack">
      {error ? <ErrorBanner message={error} onRetry={onRetry} /> : null}
      <section className="card">
        <h2 className="card__title card__title--accent card__title--divider" style={{ ["--accent" as string]: "var(--primary)" }}>
          {title}
        </h2>
        {description ? <p className="muted small" style={{ padding: "12px 22px 0" }}>{description}</p> : null}
        {loading ? (
          <Loading />
        ) : !tasks || tasks.length === 0 ? (
          <Empty title="Nothing here yet">{emptyText}</Empty>
        ) : (
          <table className="table table--compact">
            <thead className="visually-hidden">
              <tr>
                <th>Task</th>
                <th>Mouza</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const s = status(task);
                return (
                  <tr key={task.id}>
                    <td className="strong">{taskCode(task)}</td>
                    <td>
                      {task.mouza} <span className="muted small">· {task.district}</span>
                    </td>
                    <td>
                      <Chip tone={s.tone}>{s.label}</Chip>
                    </td>
                    <td className="col-action">
                      <Link className="btn btn--primary btn--sm" to={`${basePath}/${task.id}`}>
                        {actionLabel}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export function DocumentList({
  taskId,
  documents,
  emptyText = "No files uploaded yet.",
  onDeleted,
  canDelete,
}: {
  taskId: number;
  documents: TaskDocument[];
  emptyText?: string;
  onDeleted?: () => void;
  canDelete?: boolean;
}) {
  const toast = useToast();
  if (documents.length === 0) return <p className="muted small">{emptyText}</p>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      {documents.map((doc) => (
        <div className="file-pill" key={doc.id}>
          <span>
            {doc.filename}{" "}
            <span className="muted">
              ({formatBytes(doc.file_size)}
              {doc.uploaded_by ? ` · ${doc.uploaded_by}` : ""} · {formatDate(doc.created_at)})
            </span>
          </span>
          <span style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => taskApi.downloadDocument(taskId, doc).catch((e) => toast(errorMessage(e), "error"))}
            >
              Download
            </button>
            {canDelete ? (
              <button
                type="button"
                className="file-pill__remove"
                aria-label={`Delete ${doc.filename}`}
                onClick={async () => {
                  try {
                    await taskApi.deleteDocument(taskId, doc.id);
                    onDeleted?.();
                  } catch (e) {
                    toast(errorMessage(e), "error");
                  }
                }}
              >
                ×
              </button>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TaskNotFound({ children }: { children?: ReactNode }) {
  return <ErrorBanner message={typeof children === "string" ? children : "This task could not be loaded."} />;
}
