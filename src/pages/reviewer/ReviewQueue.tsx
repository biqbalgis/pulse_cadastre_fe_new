import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import { Chip, Empty, ErrorBanner, FilterSelect, Loading, PageHeader, SearchBox, StatCard } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { formatDate, matchesSearch, taskCode } from "@/lib/format";
import { qcStage } from "@/lib/status";
import { useAsync } from "@/state/useAsync";

export function ReviewQueue() {
  usePageTitle("Review Queue");
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => taskApi.reviewerList(), []);
  const [query, setQuery] = useState("");
  const [qc, setQc] = useState("");

  const tasks = useMemo(() => data ?? [], [data]);
  const flagged = tasks.filter((t) => t.status === "completed_with_constraints").length;
  const visible = tasks.filter((t) => matchesSearch(t, query) && (!qc || qcStage(t).label === qc));

  return (
    <>
      <PageHeader title="Review Queue" />
      <div className="stats">
        <StatCard value={tasks.length} label="Awaiting review" tone="info" />
        <StatCard value={flagged} label="Issue flagged" tone="warn" />
        <StatCard value={tasks.length - flagged} label="Passed QC" tone="ok" />
      </div>

      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by Task ID, Mouza, or Submission" />
        <FilterSelect
          value={qc}
          onChange={setQc}
          options={[
            { value: "Issue flagged", label: "Issue flagged" },
            { value: "Passed", label: "Passed" },
          ]}
        />
      </div>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Mouza</th>
              <th>Submission</th>
              <th>QC status</th>
              <th className="col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((task, i) => {
              const s = qcStage(task);
              return (
                <tr key={task.id} className={i === 0 ? "is-highlight" : undefined}>
                  <td className="strong">{taskCode(task)}</td>
                  <td>{task.mouza}</td>
                  <td>
                    {task.assigned_to ?? "—"}
                    <div className="small muted">{formatDate(task.updated_at)}</div>
                  </td>
                  <td>
                    <Chip tone={s.tone} square>
                      {s.label}
                    </Chip>
                  </td>
                  <td className="col-action">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      style={{ minWidth: 145, minHeight: 50 }}
                      onClick={() => navigate(`/reviewer/review/${task.id}`)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading ? <Loading /> : null}
        {!loading && visible.length === 0 ? (
          <Empty title={tasks.length ? "No submissions match" : "Queue is empty"}>
            {tasks.length ? "Try a different search or QC status." : "Editor submissions waiting for review appear here."}
          </Empty>
        ) : null}
      </div>
    </>
  );
}
