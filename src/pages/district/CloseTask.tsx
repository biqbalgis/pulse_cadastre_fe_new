import { taskApi } from "@/api/tasks";
import type { TaskRequest } from "@/api/types";
import { CheckCircleIcon, DotIcon } from "@/components/icons";
import { TaskPicker, useRouteTask, useTaskDocuments } from "@/components/tasks";
import { Card, Chip, ErrorBanner, Loading, MetaLine, PageHeader } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { formatDate, parcelLabels, taskCode } from "@/lib/format";
import { districtStage } from "@/lib/status";
import { useAsync } from "@/state/useAsync";

export function CloseTask() {
  usePageTitle("Close Task");
  const { taskId, data: task, loading, error, reload } = useRouteTask();

  if (!taskId) return <CloseTaskPicker />;
  return (
    <>
      <PageHeader
        title="Close Task"
        sub={task ? <MetaLine items={[["Mouza", task.mouza], ["Task", taskCode(task)]]} /> : null}
        aside={task ? <Chip tone={districtStage(task).tone}>{districtStage(task).label}</Chip> : null}
      />
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {loading ? <Loading /> : task ? <CloseTaskBody task={task} /> : null}
    </>
  );
}

function CloseTaskPicker() {
  const list = useAsync(() => taskApi.createdByMe(), []);
  return (
    <>
      <PageHeader title="Close Task" />
      <TaskPicker
        title="Ready to close"
        description="Tasks whose approved version has been acknowledged by LIS."
        tasks={(list.data ?? []).filter((t) => districtStage(t).group === "close")}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        basePath="/district/close"
        status={districtStage}
        emptyText="No tasks have been acknowledged by LIS yet."
      />
    </>
  );
}

function CloseTaskBody({ task }: { task: TaskRequest }) {
  const docs = useTaskDocuments(task.id);
  const acknowledged = task.status === "synced_with_lis";
  const firstUpload = (docs.data ?? []).map((d) => d.created_at).filter(Boolean).sort()[0];

  const checklist: Array<{ label: string; done: boolean; date?: string | null }> = [
    { label: "Field survey submitted", done: (docs.data ?? []).length > 0, date: firstUpload },
    { label: "QC passed", done: ["approved", "synced_with_lis"].includes(task.status) },
    { label: "Cadastre Manager approved", done: acknowledged },
    { label: "LIS acknowledged", done: acknowledged, date: acknowledged ? task.updated_at : null },
  ];

  return (
    <div className="stack">
      <div className={`banner banner--lg ${acknowledged ? "tone-ok" : "tone-warn"}`}>
        {acknowledged ? "LIS acknowledged the approved version" : "Waiting for LIS acknowledgement"}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 650fr) minmax(0, 440fr)" }}>
        <Card title="Closure checklist" accent="info" divider>
          <ul className="check-list">
            {checklist.map((item) => (
              <li key={item.label}>
                {item.done ? (
                  <CheckCircleIcon className="check-list__icon check-list__icon--ok" />
                ) : (
                  <DotIcon className="check-list__icon check-list__icon--pending" />
                )}
                <span style={{ flex: 1 }}>{item.label}</span>
                <span className="kv-list__value">{item.done ? (item.date ? formatDate(item.date) : "Done") : "Pending"}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="stack">
          <Card title="Task summary" accent="info">
            <ul className="kv-list">
              <li>
                <span>Parcels</span>
                <span className="strong">{parcelLabels(task)}</span>
              </li>
              <li>
                <span>LIS sync</span>
                <Chip tone={acknowledged ? "ok" : "warn"}>{acknowledged ? "Acknowledged" : "Pending"}</Chip>
              </li>
            </ul>
          </Card>
          <div className="field">
            <span className="field__label">Closure notes</span>
            <div className="note-box" style={{ minHeight: 110 }}>
              {acknowledged
                ? `All required steps completed. Approved update acknowledged by LIS for parcels ${parcelLabels(task)} (Mouza ${task.mouza}).`
                : "Closure becomes available once LIS acknowledges the approved version."}
            </div>
          </div>
        </div>
      </div>

      <div className="actions-end">
        <div style={{ width: "min(440px, 100%)" }}>
          <button
            type="button"
            className="btn btn--primary btn--caps btn--lg btn--block"
            disabled
            title="The task-request API has no 'closed' status yet"
          >
            Close task
          </button>
          <p className="small muted mt-8">
            Closing isn't recorded yet: the backend workflow ends at “LIS acknowledged”. Add a closed status to the
            task-request API to enable this button.
          </p>
        </div>
      </div>
    </div>
  );
}
