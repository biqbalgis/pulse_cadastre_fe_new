import { Link } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import type { TaskRequest } from "@/api/types";
import { CheckCircleIcon, DotIcon } from "@/components/icons";
import { DocumentList, TaskPicker, useRouteTask, useTaskDocuments } from "@/components/tasks";
import { Card, ErrorBanner, Loading, PageHeader } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { formatDate, parcelLabels, taskCode } from "@/lib/format";
import { decodeRemarks } from "@/lib/remarks";
import { editorStage, type Tone } from "@/lib/status";
import { useAsync } from "@/state/useAsync";

export function SubmissionResults() {
  usePageTitle("Submission Results");
  const { taskId, data: task, loading, error, reload } = useRouteTask();

  if (!taskId) return <ResultsPicker />;
  return (
    <>
      <PageHeader title="Submission Results" sub={task ? <span>{taskCode(task)} &nbsp;·&nbsp; {task.mouza}</span> : null} />
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {loading ? <Loading /> : task ? <ResultsBody task={task} /> : null}
    </>
  );
}

function ResultsPicker() {
  const list = useAsync(() => taskApi.assignedToMe(), []);
  return (
    <>
      <PageHeader title="Submission Results" />
      <TaskPicker
        title="Your submissions"
        tasks={(list.data ?? []).filter((t) => t.status !== "assigned")}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        basePath="/editor/results"
        status={editorStage}
        emptyText="You haven't submitted any tasks yet."
        actionLabel="View"
      />
    </>
  );
}

function banner(task: TaskRequest): { text: string; tone: Tone } {
  switch (task.status) {
    case "rejected":
      return { text: "Returned for correction", tone: "warn" };
    case "completed":
      return { text: "Submitted — waiting for HQ review", tone: "info" };
    case "completed_with_constraints":
      return { text: "Submitted with constraints — waiting for HQ review", tone: "info" };
    case "approved":
      return { text: "Accepted by the HQ reviewer", tone: "ok" };
    case "synced_with_lis":
      return { text: "Approved and acknowledged by LIS", tone: "ok" };
    default:
      return { text: "Not submitted yet", tone: "neutral" };
  }
}

function ResultsBody({ task }: { task: TaskRequest }) {
  const docs = useTaskDocuments(task.id);
  const b = banner(task);
  const submitted = !["assigned", "in_progress"].includes(task.status);
  const returned = task.status === "rejected";
  const observation = returned ? task.remarks?.trim() : null;
  const meta = decodeRemarks(task.remarks);

  const checks = [
    { label: "Dataset uploaded", ok: (docs.data ?? []).length > 0 },
    { label: "Upload authorized", ok: !!task.assigned_to },
    { label: `Parcel scope verified (${parcelLabels(task)})`, ok: (task.polygons ?? []).length > 0 },
  ];

  return (
    <div className="stack">
      <div className={`banner tone-${b.tone}`}>{b.text}</div>

      <div className="grid-2">
        <Card title="Upload validation" accent="warn" className="" bodyClassName="card__body">
          <ul className="check-list">
            {checks.map((c) => (
              <li key={c.label}>
                {c.ok ? <CheckCircleIcon className="check-list__icon check-list__icon--ok" /> : <DotIcon className="check-list__icon check-list__icon--pending" />}
                {c.label}
              </li>
            ))}
          </ul>
          <h3 style={{ fontSize: 19, margin: "22px 0 12px", paddingTop: 18, borderTop: "1px solid var(--border)" }}>QC findings</h3>
          {task.status === "completed_with_constraints" ? (
            <div className="banner tone-danger" style={{ fontWeight: 500, fontSize: 13 }}>
              Submitted with constraints flagged by the editor.
            </div>
          ) : returned ? (
            <div className="banner tone-danger" style={{ fontWeight: 500, fontSize: 13 }}>
              Returned by the reviewer — see observations.
            </div>
          ) : (
            <p className="small muted">{submitted ? "No findings recorded." : "Submit the task to run QC."}</p>
          )}
        </Card>

        <Card title="Reviewer observations" accent="info">
          <div className="note-box" style={{ minHeight: 84 }}>
            {observation || (submitted ? "No observations yet." : "—")}
          </div>
          {!returned && meta.notes ? <p className="small muted mt-8">Task notes: {meta.notes}</p> : null}
          <h3 style={{ fontSize: 19, margin: "22px 0 12px", paddingTop: 18, borderTop: "1px solid var(--border)" }}>Submission history</h3>
          {docs.loading ? (
            <Loading />
          ) : (
            <DocumentList taskId={task.id} documents={docs.data ?? []} emptyText="No uploads yet." />
          )}
          <p className="small muted mt-8">Last updated {formatDate(task.updated_at)}</p>
        </Card>
      </div>

      <div>
        <Link to={`/editor/workspace/${task.id}`} className="btn btn--primary btn--lg" style={{ minWidth: 288 }}>
          Back to workspace
        </Link>
      </div>
    </div>
  );
}
