import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import type { TaskRequest } from "@/api/types";
import { ParcelMap } from "@/components/ParcelMap";
import { DocumentList, TaskPicker, useRouteTask, useTaskDocuments } from "@/components/tasks";
import { Chip, ErrorBanner, FilePicker, Loading, PageHeader } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { parcelLabels, taskCode } from "@/lib/format";
import { downloadParcelPackage } from "@/lib/package";
import { EDITING_STATUSES, editorStage } from "@/lib/status";
import { errorMessage, useToast } from "@/state/toast";
import { useAsync } from "@/state/useAsync";

export function TaskWorkspace() {
  usePageTitle("Task Workspace");
  const { taskId, data: task, loading, error, reload } = useRouteTask();

  if (!taskId) return <WorkspacePicker />;
  return (
    <>
      <PageHeader
        title="Task Workspace"
        sub={task ? <span>{taskCode(task)} &nbsp;·&nbsp; {task.mouza}</span> : null}
        aside={task ? <Chip tone={editorStage(task).tone}>{editorStage(task).label}</Chip> : null}
      />
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {loading ? <Loading /> : task ? <WorkspaceBody task={task} onChanged={reload} /> : null}
    </>
  );
}

function WorkspacePicker() {
  const list = useAsync(() => taskApi.assignedToMe(), []);
  return (
    <>
      <PageHeader title="Task Workspace" />
      <TaskPicker
        title="Open a task"
        description="Assignments you can edit."
        tasks={(list.data ?? []).filter((t) => EDITING_STATUSES.has(t.status))}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        basePath="/editor/workspace"
        status={editorStage}
        emptyText="No assignments are open for editing."
      />
    </>
  );
}

function WorkspaceBody({ task, onChanged }: { task: TaskRequest; onChanged: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const docs = useTaskDocuments(task.id);
  const [files, setFiles] = useState<File[]>([]);
  const [constraints, setConstraints] = useState(false);
  const [busy, setBusy] = useState(false);
  const editable = EDITING_STATUSES.has(task.status);

  const download = async () => {
    downloadParcelPackage(task);
    if (task.status === "assigned") {
      // Downloading the package is the point where work starts.
      try {
        await taskApi.setStatus(task.id, "in_progress");
        onChanged();
      } catch {
        // Not fatal: the editor can still work and submit.
      }
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (files.length) await taskApi.uploadDocuments(task.id, files);
      const polygons = task.polygons ?? [];
      await taskApi.saveParcels(task.id, polygons, constraints ? "completed_with_constraints" : "completed");
      toast(`${taskCode(task)} submitted for validation.`, "success");
      navigate(`/editor/results/${task.id}`);
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const hasDataset = files.length > 0 || (docs.data ?? []).length > 0;

  return (
    <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 405fr) minmax(0, 680fr)", alignItems: "start" }}>
      <div className="stack">
        <section className="card card--tint-info" style={{ borderLeft: "3px solid var(--info-accent)" }}>
          <ul className="kv-list" style={{ padding: "4px 18px" }}>
            <li style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <span className="strong">Authorized parcels</span>
              <span className="small" style={{ paddingLeft: 16 }}>
                {parcelLabels(task)}
              </span>
            </li>
            <li style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <span className="strong">Source</span>
              <span className="small" style={{ paddingLeft: 16 }}>
                {task.mouza}, {task.district} · {task.polygon_count ?? task.polygons?.length ?? 0} parcel(s)
              </span>
            </li>
          </ul>
          <div style={{ padding: "0 18px 18px" }}>
            <p className="strong small">Parcel package · GeoJSON</p>
            <button type="button" className="btn btn--primary btn--block mt-16" onClick={download}>
              Download package
            </button>
            <p className="small muted mt-16">Edit authorized parcels in ArcGIS Desktop.</p>
          </div>
        </section>

        <section className="card card--tint-ok" style={{ borderLeft: "3px solid var(--ok-accent)" }}>
          <h2 className="card__title card__title--divider">Upload edited dataset</h2>
          <div className="card__body stack" style={{ gap: 12 }}>
            {editable ? (
              <FilePicker files={files} onChange={setFiles} placeholder="e.g. Chak42_GP-1042_edit.gdb.zip" accept=".zip,.gpkg,.geojson,.json,.kml,.shp,.dxf" />
            ) : null}
            {docs.loading ? <Loading /> : <DocumentList taskId={task.id} documents={docs.data ?? []} emptyText="No dataset uploaded yet." />}
            {editable ? (
              <>
                <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={constraints} onChange={(e) => setConstraints(e.target.checked)} style={{ accentColor: "var(--primary)" }} />
                  Completed with constraints (flag issues for the reviewer)
                </label>
                <button type="button" className="btn btn--primary btn--block btn--lg" disabled={busy || !hasDataset} onClick={submit}>
                  {busy ? "Submitting…" : "Submit for validation"}
                </button>
                {!hasDataset ? <p className="small muted">Upload the edited dataset to submit.</p> : null}
              </>
            ) : (
              <p className="small muted">This task is {editorStage(task).label.toLowerCase()} and can't be edited.</p>
            )}
          </div>
        </section>
      </div>

      <section className="card" style={{ padding: 12 }}>
        <ParcelMap parcels={task.polygons ?? []} selectedIds={(task.polygons ?? []).map((p) => p.id)} minHeight={560} />
      </section>
    </div>
  );
}
