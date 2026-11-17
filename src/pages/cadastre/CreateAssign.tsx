import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import { ParcelMap } from "@/components/ParcelMap";
import { TaskFormFields, TaskFormMap, useTaskDraft } from "@/components/TaskForm";
import { useRouteTask } from "@/components/tasks";
import { Chip, ErrorBanner, Field, Loading, MetaLine, PageHeader } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { parcelLabels, taskCode } from "@/lib/format";
import { decodeRemarks } from "@/lib/remarks";
import { cadastreStage } from "@/lib/status";
import { errorMessage, useToast } from "@/state/toast";
import { useAsync } from "@/state/useAsync";

function useAssignees() {
  return useAsync(() => taskApi.assignees(), []);
}

function EditorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const assignees = useAssignees();
  return (
    <Field
      label="Assign editor"
      required
      hint={
        assignees.error
          ? assignees.error
          : !assignees.loading && (assignees.data ?? []).length === 0
            ? "No active users have the data_editor role."
            : undefined
      }
    >
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)} disabled={assignees.loading}>
        <option value="">{assignees.loading ? "Loading editors…" : "Select editor"}</option>
        {(assignees.data ?? []).map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.username})
          </option>
        ))}
      </select>
    </Field>
  );
}

function ReviewerField() {
  return (
    <Field label="Assign reviewer" hint="Submissions go to the shared HQ review queue (data_reviewer role).">
      <select className="select" disabled value="queue">
        <option value="queue">HQ review queue</option>
      </select>
    </Field>
  );
}

export function CreateAssign() {
  const { taskId } = useRouteTask();
  usePageTitle(taskId ? "Assign Task" : "Create & Assign Task");
  return taskId ? <AssignExisting /> : <CreateAndAssign />;
}

/** No task in the URL: create a new task on the manager's behalf, then assign it. */
function CreateAndAssign() {
  const navigate = useNavigate();
  const toast = useToast();
  const draft = useTaskDraft();
  const [editor, setEditor] = useState("");
  const [busy, setBusy] = useState(false);
  const payload = draft.buildPayload("Central Office");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!payload || !editor) return;
    setBusy(true);
    try {
      const task = await taskApi.create(payload);
      await taskApi.assign(task.id, Number(editor));
      toast(`${taskCode(task)} created and assigned.`, "success");
      navigate("/cadastre");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Create & Assign Task" />
      {draft.mouzas.error ? <ErrorBanner message={draft.mouzas.error} onRetry={draft.mouzas.reload} /> : null}
      <form onSubmit={onSubmit} className="stack">
        <div className="grid-form-map">
          <div className="card form-card">
            <TaskFormFields draft={draft}>
              <EditorSelect value={editor} onChange={setEditor} />
              <ReviewerField />
            </TaskFormFields>
          </div>
          <TaskFormMap draft={draft} />
        </div>
        <div className="actions-end">
          <button type="submit" className="btn btn--primary btn--caps btn--lg" style={{ minWidth: 222 }} disabled={!payload || !editor || busy}>
            {busy ? "Assigning…" : "Assign Task"}
          </button>
        </div>
      </form>
    </>
  );
}

/** A referral from the queue: show it and pick the editor. */
function AssignExisting() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: task, loading, error, reload } = useRouteTask();
  const [editor, setEditor] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error || !task) return <ErrorBanner message={error ?? "Task not found."} onRetry={reload} />;

  const stage = cadastreStage(task);
  const meta = decodeRemarks(task.remarks);
  const canAssign = ["sent_to_manager", "assigned", "rejected"].includes(task.status);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    setBusy(true);
    try {
      await taskApi.assign(task.id, Number(editor));
      toast(`${taskCode(task)} assigned.`, "success");
      navigate("/cadastre");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={canAssign ? "Assign Task" : "Task Details"}
        sub={<MetaLine items={[["Task", taskCode(task)], ["Mouza", task.mouza]]} />}
        aside={<Chip tone={stage.tone}>{stage.label}</Chip>}
      />
      <form onSubmit={onSubmit} className="stack">
        <div className="grid-form-map">
          <div className="card form-card">
            <ReadOnly label="District" value={task.district} />
            <ReadOnly label="Mouza" value={task.mouza} />
            <ReadOnly label="Parcel / Khasra" value={parcelLabels(task)} />
            <ReadOnly label="Change type" value={meta.changeType ?? "—"} />
            <ReadOnly label="Requested by" value={`${task.requested_by ?? "—"}${meta.route ? ` · ${meta.route}` : ""}`} />
            {task.assigned_to ? <ReadOnly label="Current editor" value={task.assigned_to} /> : null}
            {canAssign ? <EditorSelect value={editor} onChange={setEditor} /> : null}
            <ReviewerField />
            <Field label="Reference notes">
              <div className="note-box">{meta.notes || "—"}</div>
            </Field>
          </div>
          <ParcelMap toolbar parcels={task.polygons ?? []} selectedIds={(task.polygons ?? []).map((p) => p.id)} minHeight={560} />
        </div>
        <div className="actions-split">
          <Link to="/cadastre" className="btn btn--outline">
            Back to queue
          </Link>
          {canAssign ? (
            <button type="submit" className="btn btn--primary btn--caps btn--lg" style={{ minWidth: 222 }} disabled={!editor || busy}>
              {busy ? "Assigning…" : task.assigned_to ? "Reassign Task" : "Assign Task"}
            </button>
          ) : null}
        </div>
      </form>
    </>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      <input className="input" value={value} readOnly />
    </Field>
  );
}


