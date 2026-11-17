import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import type { TaskRequest } from "@/api/types";
import { Card, Chip, Empty, ErrorBanner, Loading, PageHeader, StatCard } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { formatDate, parcelLabels, taskCode } from "@/lib/format";
import { errorMessage, useToast } from "@/state/toast";
import { useAsync } from "@/state/useAsync";

const STEPS = ["Reconciled", "Consistency checked", "Transferred", "LIS acknowledged"];

export function LisSync() {
  usePageTitle("LIS Sync Monitor");
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useAsync(() => taskApi.managerList(), []);
  const [syncing, setSyncing] = useState<number | null>(null);

  const rows = useMemo(
    () => (data ?? []).filter((t) => t.status === "approved" || t.status === "synced_with_lis"),
    [data],
  );
  const pending = rows.filter((t) => t.status === "approved").length;
  const acknowledged = rows.length - pending;

  const selectedId = Number(params.get("task")) || rows.find((t) => t.status === "synced_with_lis")?.id || rows[0]?.id;
  const selected = rows.find((t) => t.id === selectedId) ?? null;

  const sync = async (task: TaskRequest) => {
    setSyncing(task.id);
    try {
      await taskApi.syncLis(task.id);
      toast(`${taskCode(task)} acknowledged by LIS.`, "success");
      await reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setSyncing(null);
    }
  };

  return (
    <>
      <PageHeader title="LIS Sync Monitor" />
      <div className="stats">
        <StatCard value={pending} label="Pending" tone="info" />
        <StatCard value={syncing ? 1 : 0} label="In progress" tone="warn" />
        <StatCard value={acknowledged} label="Acknowledged" tone="ok" />
      </div>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      <div className="table-wrap" style={{ marginBottom: 18 }}>
        <table className="table table--compact">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Parcels</th>
              <th>Reconciliation</th>
              <th>LIS status</th>
              <th className="col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => {
              const done = task.status === "synced_with_lis";
              return (
                <tr
                  key={task.id}
                  className={`is-clickable${task.id === selectedId ? " is-selected" : ""}`}
                  onClick={() => setParams({ task: String(task.id) })}
                >
                  <td className="strong">{taskCode(task)}</td>
                  <td>{parcelLabels(task)}</td>
                  <td style={{ color: "var(--ok-ink)" }}>Passed</td>
                  <td>
                    <Chip tone={done ? "ok" : syncing === task.id ? "warn" : "neutral"}>
                      {done ? "Acknowledged" : syncing === task.id ? "In progress" : "Pending"}
                    </Chip>
                  </td>
                  <td className="col-action">
                    {done ? null : (
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        disabled={syncing !== null}
                        onClick={(e) => {
                          e.stopPropagation();
                          void sync(task);
                        }}
                      >
                        Sync now
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading ? <Loading /> : null}
        {!loading && rows.length === 0 ? <Empty title="Nothing to sync">Approved tasks appear here.</Empty> : null}
      </div>

      {selected ? (
        <div className="stack">
          <Card title={`Transaction details: ${taskCode(selected)}`} accent="primary">
            <div className="stepper stepper--numbered" style={{ ["--steps" as string]: STEPS.length }}>
              {STEPS.map((label, i) => {
                const done = selected.status === "synced_with_lis" || i === 0;
                return (
                  <div key={label} className={`stepper__step${done ? " is-done" : ""}`}>
                    <span className="stepper__dot" style={done ? undefined : { background: "var(--surface)", color: "var(--text-muted)" }}>
                      {i + 1}
                    </span>
                    {label}
                    <span className="stepper__date">{done ? formatDate(selected.updated_at) : "—"}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="card card--pad" style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span className="strong">Status note</span>
            <div className={`banner ${selected.status === "synced_with_lis" ? "tone-ok" : "tone-info"}`} style={{ flex: 1, padding: "10px 14px", fontSize: 13 }}>
              {selected.status === "synced_with_lis" ? "Ready for District Manager closure" : "Approved — waiting to be sent to LIS"}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
