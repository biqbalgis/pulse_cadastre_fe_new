import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import type { TaskDocument, TaskRequest } from "@/api/types";
import { ParcelMap } from "@/components/ParcelMap";
import { DocumentList, TaskPicker, useRouteTask, useTaskDocuments } from "@/components/tasks";
import { Chip, ConfirmDialog, ErrorBanner, Loading, MetaLine, PageHeader } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { parcelLabels, taskCode } from "@/lib/format";
import { cadastreStage, type Tone } from "@/lib/status";
import { errorMessage, useToast } from "@/state/toast";
import { useAsync } from "@/state/useAsync";

const DATASET_RE = /\.(zip|gdb|gpkg|shp|geojson|json|kml|dxf)$/i;

export function FinalApproval() {
  usePageTitle("Final Review & Approval");
  const { taskId, data: task, loading, error, reload } = useRouteTask();

  if (!taskId) return <ApprovalPicker />;
  return (
    <>
      <PageHeader
        title="Final Review & Approval"
        sub={task ? <MetaLine items={[["Task", taskCode(task)], ["Mouza", task.mouza]]} /> : null}
        aside={task ? <Chip tone={cadastreStage(task).tone}>{cadastreStage(task).label}</Chip> : null}
      />
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {loading ? <Loading /> : task ? <ApprovalBody task={task} /> : null}
    </>
  );
}

function ApprovalPicker() {
  const list = useAsync(() => taskApi.managerList(), []);
  return (
    <>
      <PageHeader title="Final Review & Approval" />
      <TaskPicker
        title="Pending final approval"
        description="Submissions accepted by the HQ reviewer."
        tasks={(list.data ?? []).filter((t) => t.status === "approved")}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        basePath="/cadastre/approval"
        status={cadastreStage}
        emptyText="Nothing is waiting for final approval."
        actionLabel="Review"
      />
    </>
  );
}

function Section({
  title,
  tone,
  chip,
  children,
}: {
  title: string;
  tone: Tone;
  chip: { label: string; tone: Tone };
  children: ReactNode;
}) {
  return (
    <section className="card" style={{ overflow: "hidden" }}>
      <div className={`section-band tone-${tone}`} style={{ background: "var(--tone-bg)" }}>
        {title}
      </div>
      <div className="card__body" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "start", padding: "12px 14px 14px" }}>
        <div className="stack" style={{ gap: 8 }}>
          {children}
        </div>
        <Chip tone={chip.tone} square>
          {chip.label}
        </Chip>
      </div>
    </section>
  );
}

function ApprovalBody({ task }: { task: TaskRequest }) {
  const navigate = useNavigate();
  const toast = useToast();
  const docs = useTaskDocuments(task.id);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"approve" | "return" | null>(null);

  const all = docs.data ?? [];
  const datasets = all.filter((d: TaskDocument) => DATASET_RE.test(d.filename));
  const evidence = all.filter((d: TaskDocument) => !DATASET_RE.test(d.filename));
  const pending = task.status === "approved";

  const approve = async () => {
    setBusy(true);
    try {
      await taskApi.syncLis(task.id);
      toast(`${taskCode(task)} approved and sent to LIS.`, "success");
      navigate("/cadastre/lis-sync");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const sendBack = async (reason: string) => {
    setBusy(true);
    try {
      await taskApi.setStatus(task.id, "rejected", reason);
      toast(`${taskCode(task)} returned to the editor.`, "success");
      navigate("/cadastre");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <div className="stack">
      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 600fr) minmax(0, 480fr)", alignItems: "start" }}>
        <div className="stack" style={{ gap: 12 }}>
          <Section title="Cadastral dataset" tone="info" chip={datasets.length ? { label: "Available", tone: "ok" } : { label: "Missing", tone: "danger" }}>
            <p className="small">Edited cadastral data for parcels {parcelLabels(task)}.</p>
            {docs.loading ? <Loading /> : <DocumentList taskId={task.id} documents={datasets} emptyText="No dataset uploaded." />}
          </Section>
          <Section
            title="QC results"
            tone="warn"
            chip={pending ? { label: "QC passed", tone: "ok" } : { label: "Not reviewed", tone: "neutral" }}
          >
            <p className="small">
              {pending ? "Topology and attribute checks accepted by the HQ reviewer." : "The HQ reviewer has not accepted this submission yet."}
            </p>
          </Section>
          <Section title="Field survey evidence" tone="ok" chip={evidence.length ? { label: "Survey verified", tone: "ok" } : { label: "None", tone: "neutral" }}>
            {docs.loading ? <Loading /> : <DocumentList taskId={task.id} documents={evidence} emptyText="No survey evidence uploaded." />}
          </Section>
          <label className="field">
            <span className="field__label">Decision notes (Cadastre Manager)</span>
            <textarea
              className="textarea"
              value={notes}
              placeholder="e.g. All checks completed. Boundary correction is accurate and consistent with field survey."
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <section className="card" style={{ padding: 14 }}>
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>Parcel Map</h2>
          <ParcelMap parcels={task.polygons ?? []} selectedIds={(task.polygons ?? []).map((p) => p.id)} minHeight={440} caption={`Submitted · ${taskCode(task)}`} />
        </section>
      </div>

      <div className="actions-split">
        <button type="button" className="btn btn--outline btn--caps btn--lg" disabled={!pending || busy} onClick={() => setConfirm("return")}>
          Return for correction
        </button>
        <button type="button" className="btn btn--primary btn--caps btn--lg" style={{ minWidth: 263 }} disabled={!pending || busy} onClick={() => setConfirm("approve")}>
          Approve &amp; send to LIS
        </button>
      </div>

      <ConfirmDialog
        open={confirm === "approve"}
        title={`Approve ${taskCode(task)}?`}
        confirmLabel="Approve"
        busy={busy}
        onConfirm={approve}
        onCancel={() => setConfirm(null)}
      >
        The approved version is sent to LIS and the District Manager can then close the task.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "return"}
        title={`Return ${taskCode(task)} for correction?`}
        confirmLabel="Return to editor"
        busy={busy}
        requireText
        textLabel="What needs correcting"
        onConfirm={(text) => sendBack(text || notes)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
