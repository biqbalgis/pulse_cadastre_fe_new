import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import { TaskFormFields, TaskFormMap, useTaskDraft } from "@/components/TaskForm";
import { ErrorBanner, FilePicker, PageHeader } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { taskCode } from "@/lib/format";
import { ROUTES, type RouteKey } from "@/lib/remarks";
import { errorMessage, useToast } from "@/state/toast";

export function CreateTask() {
  usePageTitle("Create Task");
  const navigate = useNavigate();
  const toast = useToast();
  const draft = useTaskDraft();
  const [route, setRoute] = useState<RouteKey>("district");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const payload = draft.buildPayload(ROUTES[route].label);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!payload) return;
    setBusy(true);
    try {
      const task = await taskApi.create(payload);
      if (files.length) {
        try {
          await taskApi.uploadDocuments(task.id, files);
        } catch (err) {
          toast(`Task created, but the supporting files failed to upload: ${errorMessage(err)}`, "error");
        }
      }
      toast(`${taskCode(task)} sent to the Central Office.`, "success");
      navigate("/district");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Create Task" />
      {draft.mouzas.error ? <ErrorBanner message={draft.mouzas.error} onRetry={draft.mouzas.reload} /> : null}
      <form className="grid-form-map" onSubmit={onSubmit}>
        <div className="stack">
          <div className="card form-card">
            <TaskFormFields
              draft={draft}
              after={
                <>
              <div className="field">
                <span className="field__label">Supporting data (optional)</span>
                <FilePicker files={files} onChange={setFiles} multiple placeholder="Survey sheets, photos, or GIS files" />
              </div>
              <fieldset className="field" style={{ border: "none", padding: 0, margin: 0 }}>
                <legend className="field__label" style={{ marginBottom: 8 }}>
                  Processing route *
                </legend>
                <div className="stack" style={{ gap: 10 }}>
                  {(Object.keys(ROUTES) as RouteKey[]).map((key) => (
                    <label key={key} className="radio-option">
                      <input type="radio" name="route" checked={route === key} onChange={() => setRoute(key)} />
                      <span>
                        <span className="radio-option__title" style={{ display: "block" }}>
                          {ROUTES[key].label}
                        </span>
                        <span className="radio-option__desc">{ROUTES[key].description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
                </>
              }
            />
          </div>
          <button type="submit" className="btn btn--primary btn--caps btn--lg btn--block" disabled={!payload || busy}>
            {busy ? "Creating…" : "Create Task"}
          </button>
        </div>
        <TaskFormMap draft={draft} />
      </form>
    </>
  );
}
