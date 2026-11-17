import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import type { TaskRequest } from "@/api/types";
import { ParcelMap } from "@/components/ParcelMap";
import { DocumentList, TaskPicker, useRouteTask, useTaskDocuments } from "@/components/tasks";
import { ConfirmDialog, ErrorBanner, Loading, PageHeader } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { formatDate, parcelLabels, taskCode } from "@/lib/format";
import { qcStage, REVIEW_STATUSES } from "@/lib/status";
import { errorMessage, useToast } from "@/state/toast";
import { useAsync } from "@/state/useAsync";

export function TechnicalReview() {
  usePageTitle("Technical Review");
  const { taskId, data: task, loading, error, reload } = useRouteTask();

  if (!taskId) return <ReviewPicker />;
  return (
    <>
      <PageHeader
        title="Technical Review"
        sub={task ? <span>{taskCode(task)} &nbsp;·&nbsp; {task.mouza} &nbsp;·&nbsp; {task.assigned_to ?? "—"}</span> : null}
      />
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {loading ? <Loading /> : task ? <ReviewBody task={task} /> : null}
    </>
  );
}

function ReviewPicker() {
  const list = useAsync(() => taskApi.reviewerList(), []);
  return (
    <>
      <PageHeader title="Technical Review" />
      <TaskPicker
        title="Choose a submission"
        tasks={list.data}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        basePath="/reviewer/review"
        status={qcStage}
        emptyText="No submissions are waiting for review."
        actionLabel="Review"
      />
    </>
  );
}

function ReviewBody({ task }: { task: TaskRequest }) {
  const navigate = useNavigate();
  const toast = useToast();
  const docs = useTaskDocuments(task.id);
  const [observations, setObservations] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState(false);
  const reviewable = REVIEW_STATUSES.has(task.status);
  const qc = qcStage(task);

  const decide = async (status: "approved" | "rejected") => {
    setBusy(true);
    try {
      await taskApi.setStatus(task.id, status, status === "rejected" ? observations.trim() : undefined);
      toast(status === "approved" ? `${taskCode(task)} accepted.` : `${taskCode(task)} returned for correction.`, "success");
      navigate("/reviewer");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirmAccept(false);
    }
  };

  return (
    <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 774fr) minmax(0, 367fr)", alignItems: "stretch" }}>
      <ParcelMap
        parcels={task.polygons ?? []}
        selectedIds={(task.polygons ?? []).map((p) => p.id)}
        minHeight={540}
        caption={`Submitted · ${formatDate(task.updated_at)}`}
      />

      <div className="stack" style={{ gap: 14 }}>
        <section className="card" style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ background: "var(--sidebar-bg)", color: "#fff", padding: "14px 16px", fontWeight: 700, fontSize: 18 }}>QC findings</div>
          <div className="card__body stack" style={{ gap: 14, padding: 14 }}>
            <div className={`banner tone-${qc.tone === "danger" ? "danger" : "ok"}`} style={{ fontSize: 13 }}>
              {qc.tone === "danger" ? "Constraints flagged by the editor" : "No constraints flagged"}
              <div className="small" style={{ fontWeight: 500, marginTop: 4 }}>
                Parcels {parcelLabels(task)}
              </div>
            </div>
            <div>
              <div className="strong" style={{ marginBottom: 8 }}>
                Submitted files
              </div>
              {docs.loading ? <Loading /> : <DocumentList taskId={task.id} documents={docs.data ?? []} emptyText="No files uploaded." />}
            </div>
            <label className="field" style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <span className="strong">Reviewer observations</span>
              <textarea
                className="textarea"
                style={{ minHeight: 110 }}
                value={observations}
                disabled={!reviewable}
                placeholder="e.g. Correct the overlap along the shared boundary of parcels 108 and 109."
                onChange={(e) => setObservations(e.target.value)}
              />
              <span className="field__hint">Required when returning the submission.</span>
            </label>
          </div>
        </section>

        <button
          type="button"
          className="btn btn--primary btn--lg btn--block"
          disabled={!reviewable || busy || !observations.trim()}
          onClick={() => decide("rejected")}
        >
          Return for correction
        </button>
        <button type="button" className="btn btn--muted btn--lg btn--block" disabled={!reviewable || busy} onClick={() => setConfirmAccept(true)}>
          Accept submission
        </button>
        {!reviewable ? <p className="small muted">This submission has already been decided.</p> : null}
      </div>

      <ConfirmDialog
        open={confirmAccept}
        title={`Accept ${taskCode(task)}?`}
        confirmLabel="Accept"
        busy={busy}
        onConfirm={() => decide("approved")}
        onCancel={() => setConfirmAccept(false)}
      >
        The submission moves to the Cadastre Manager for final approval.
      </ConfirmDialog>
    </div>
  );
}
