import { useState, type FormEvent } from "react";

import { taskApi } from "@/api/tasks";
import type { TaskRequest } from "@/api/types";
import { DocumentList, TaskPicker, useRouteTask, useTaskDocuments } from "@/components/tasks";
import { Chip, ErrorBanner, Field, FilePicker, Loading, MetaLine, PageHeader } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { parcelLabels, taskCode } from "@/lib/format";
import { downloadParcelPackage, surveyNotesFile } from "@/lib/package";
import { decodeRemarks } from "@/lib/remarks";
import { districtStage } from "@/lib/status";
import { errorMessage, useToast } from "@/state/toast";
import { useAsync } from "@/state/useAsync";

const STEPS = ["Package", "Field survey", "Upload", "Approval"];

function currentStep(task: TaskRequest, hasEvidence: boolean): number {
  if (["completed", "completed_with_constraints", "approved", "synced_with_lis"].includes(task.status)) return 3;
  return hasEvidence ? 2 : 1;
}

export function FieldSurvey() {
  usePageTitle("Field Survey & Upload");
  const { taskId, data: task, loading, error, reload } = useRouteTask();

  if (!taskId) return <FieldSurveyPicker />;
  return (
    <>
      <PageHeader
        title="Field Survey & Upload"
        sub={task ? <MetaLine items={[["Task", taskCode(task)], ["Mouza", task.mouza]]} /> : null}
        aside={task ? <Chip tone={districtStage(task).tone}>{districtStage(task).label}</Chip> : null}
      />
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {loading ? <Loading /> : task ? <FieldSurveyBody task={task} /> : null}
    </>
  );
}

function FieldSurveyPicker() {
  const list = useAsync(() => taskApi.createdByMe(), []);
  return (
    <>
      <PageHeader title="Field Survey & Upload" />
      <TaskPicker
        title="Choose a task"
        description="Tasks you created that still need field survey evidence."
        tasks={(list.data ?? []).filter((t) => districtStage(t).group === "survey")}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        basePath="/district/field-survey"
        status={districtStage}
        emptyText="No tasks are waiting for a field survey."
      />
    </>
  );
}

function FieldSurveyBody({ task }: { task: TaskRequest }) {
  const toast = useToast();
  const docs = useTaskDocuments(task.id);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState<File[]>([]);
  const [dataset, setDataset] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const meta = decodeRemarks(task.remarks);
  const step = currentStep(task, (docs.data ?? []).length > 0);
  const canSubmit = !!date && notes.trim().length > 0 && evidence.length > 0 && !busy;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await taskApi.uploadDocuments(task.id, [surveyNotesFile(task, date, notes), ...evidence, ...dataset]);
      toast("Field survey evidence uploaded.", "success");
      setNotes("");
      setEvidence([]);
      setDataset([]);
      docs.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="card" style={{ ["--steps" as string]: STEPS.length }}>
        <ol className="stepper" style={{ listStyle: "none", margin: 0 }}>
          {STEPS.map((label, i) => (
            <li key={label} className={`stepper__step${i < step ? " is-done" : i === step ? " is-current" : ""}`}>
              <span className="stepper__dot">{i < step ? "✓" : ""}</span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      <form className="grid-2" style={{ gridTemplateColumns: "minmax(0, 405fr) minmax(0, 685fr)" }} onSubmit={onSubmit}>
        <div className="stack">
          <section className="card card--tint-info">
            <h2 className="card__title card__title--accent" style={{ ["--accent" as string]: "var(--info-accent)" }}>
              Authorized package
            </h2>
            <div className="card__body stack" style={{ paddingTop: 0 }}>
              <p className="muted">GIS data and reference layers for field survey.</p>
              <button type="button" className="btn btn--primary btn--caps btn--block mt-16" onClick={() => downloadParcelPackage(task)}>
                Download package
              </button>
              <p className="small muted" style={{ textAlign: "center" }}>
                Parcels {parcelLabels(task)} · GeoJSON (EPSG:4326)
              </p>
              <div className="note-box">{meta.changeType ?? "Minor edits in ArcGIS Desktop (e.g., boundary/attribute update)"}</div>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <h2 className="card__title">Submit evidence</h2>
            <div className="card__body stack" style={{ paddingTop: 0, gap: 14 }}>
              <Field label="Survey date" required>
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </Field>
              <Field label="Survey notes" required>
                <textarea
                  className="textarea"
                  value={notes}
                  placeholder="e.g. Field verification completed. Minor boundary adjustment for parcels 108 and 109."
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
              <div className="field">
                <span className="field__label">Survey evidence *</span>
                <FilePicker files={evidence} onChange={setEvidence} multiple placeholder="Photos or a .zip of survey evidence" />
              </div>
              <div className="field">
                <span className="field__label">Updated dataset (if edited)</span>
                <FilePicker files={dataset} onChange={setDataset} placeholder="e.g. Chak42_GP-1042_v2.gdb.zip" />
              </div>
              <div className="field">
                <span className="field__label">Uploaded so far</span>
                {docs.loading ? <Loading /> : <DocumentList taskId={task.id} documents={docs.data ?? []} />}
              </div>
            </div>
          </section>
          <button type="submit" className="btn btn--primary btn--caps btn--lg btn--block" disabled={!canSubmit}>
            {busy ? "Uploading…" : "Submit for validation"}
          </button>
        </div>
      </form>
    </div>
  );
}
