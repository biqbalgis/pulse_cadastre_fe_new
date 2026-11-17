import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import type { TaskRequest } from "@/api/types";
import { Chip, Empty, ErrorBanner, FilterSelect, Loading, PageHeader, SearchBox, StatCard } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { matchesSearch, taskCode } from "@/lib/format";
import { decodeRemarks } from "@/lib/remarks";
import { districtStage } from "@/lib/status";
import { useAsync } from "@/state/useAsync";

function routeLabel(task: TaskRequest): string {
  return decodeRemarks(task.remarks).route ?? "District direct";
}

/** Where "Open" goes for each District Manager stage. */
function openPath(task: TaskRequest): string | null {
  const stage = districtStage(task).group;
  if (stage === "close") return `/district/close/${task.id}`;
  if (stage === "survey") return `/district/field-survey/${task.id}`;
  return null; // awaiting approval elsewhere — nothing for the District Manager to do
}

export function DistrictQueue() {
  usePageTitle("District Task Queue");
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => taskApi.createdByMe(), []);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");

  const tasks = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const c = { survey: 0, approval: 0, close: 0 };
    tasks.forEach((t) => c[districtStage(t).group]++);
    return c;
  }, [tasks]);

  const visible = tasks.filter((t) => matchesSearch(t, query) && (!stage || districtStage(t).group === stage));

  return (
    <>
      <PageHeader
        title="District Task Queue"
        aside={
          <Link to="/district/create" className="btn btn--primary btn--caps btn--lg" style={{ minWidth: 212 }}>
            Create Task
          </Link>
        }
      />

      <div className="stats">
        <StatCard value={counts.survey} label="Field survey" tone="info" />
        <StatCard value={counts.approval} label="Awaiting approval" tone="warn" />
        <StatCard value={counts.close} label="Ready to close" tone="ok" />
      </div>

      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by Task ID, Mouza, or Parcel" />
        <FilterSelect
          value={stage}
          onChange={setStage}
          options={[
            { value: "survey", label: "Field survey" },
            { value: "approval", label: "Awaiting approval" },
            { value: "close", label: "Ready to close" },
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
              <th>Route</th>
              <th>Status</th>
              <th className="col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((task) => {
              const s = districtStage(task);
              const path = openPath(task);
              return (
                <tr key={task.id}>
                  <td className="strong">{taskCode(task)}</td>
                  <td>{task.mouza}</td>
                  <td>{routeLabel(task)}</td>
                  <td>
                    <Chip tone={s.tone}>{s.label}</Chip>
                  </td>
                  <td className="col-action">
                    <button
                      type="button"
                      className={`btn btn--sm ${path ? "btn--primary" : "btn--muted"}`}
                      disabled={!path}
                      title={path ? undefined : "Waiting on the Central Office"}
                      onClick={() => path && navigate(path)}
                    >
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
          <Empty title={tasks.length ? "No tasks match" : "No tasks yet"}>
            {tasks.length ? "Try a different search or status." : "Create a task to send parcels for update."}
          </Empty>
        ) : null}
      </div>
    </>
  );
}
