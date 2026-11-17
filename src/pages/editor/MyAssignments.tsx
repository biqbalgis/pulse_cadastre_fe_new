import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import type { TaskRequest } from "@/api/types";
import { Chip, Empty, ErrorBanner, FilterSelect, Loading, PageHeader, SearchBox, StatCard } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { matchesSearch, taskCode } from "@/lib/format";
import { decodeRemarks } from "@/lib/remarks";
import { editorStage } from "@/lib/status";
import { useAsync } from "@/state/useAsync";

export function openEditorTask(task: TaskRequest): string {
  return task.status === "rejected" || task.status === "completed" || task.status === "completed_with_constraints"
    ? `/editor/results/${task.id}`
    : `/editor/workspace/${task.id}`;
}

export function MyAssignments() {
  usePageTitle("My Assignments");
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => taskApi.assignedToMe(), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const tasks = useMemo(() => data ?? [], [data]);
  const count = (s: string) => tasks.filter((t) => t.status === s).length;
  const visible = tasks.filter((t) => matchesSearch(t, query) && (!status || editorStage(t).label === status));
  const statusOptions = [...new Set(tasks.map((t) => editorStage(t).label))].map((l) => ({ value: l, label: l }));

  return (
    <>
      <PageHeader title="My Assignments" />
      <div className="stats">
        <StatCard value={count("assigned")} label="Assigned" tone="info" />
        <StatCard value={count("in_progress")} label="In progress" tone="warn" />
        <StatCard value={count("rejected")} label="Returned" tone="ok" />
      </div>

      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by Task ID, Mouza, or Change type" />
        <FilterSelect value={status} onChange={setStatus} options={statusOptions} />
      </div>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Mouza</th>
              <th>Change type</th>
              <th>Status</th>
              <th className="col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((task, i) => {
              const s = editorStage(task);
              return (
                <tr key={task.id} className={i === 0 ? "is-highlight" : undefined}>
                  <td className="strong">{taskCode(task)}</td>
                  <td>{task.mouza}</td>
                  <td>{decodeRemarks(task.remarks).changeType ?? "—"}</td>
                  <td>
                    <Chip tone={s.tone} square>
                      {s.label}
                    </Chip>
                  </td>
                  <td className="col-action">
                    <button type="button" className="btn btn--primary btn--sm" style={{ minHeight: 48 }} onClick={() => navigate(openEditorTask(task))}>
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading ? <Loading /> : null}
        {!loading && visible.length === 0 ? (
          <Empty title={tasks.length ? "No assignments match" : "No assignments yet"}>
            {tasks.length ? "Try a different search or status." : "Tasks assigned to you by the Cadastre Manager appear here."}
          </Empty>
        ) : null}
      </div>
    </>
  );
}
