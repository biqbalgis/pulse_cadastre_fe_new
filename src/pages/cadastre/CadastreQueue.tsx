import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { taskApi } from "@/api/tasks";
import type { TaskRequest } from "@/api/types";
import { Chip, Empty, ErrorBanner, FilterSelect, Loading, PageHeader, SearchBox } from "@/components/ui";
import { usePageTitle } from "@/layout/AppShell";
import { matchesSearch, taskCode } from "@/lib/format";
import { cadastreStage } from "@/lib/status";
import { useAsync } from "@/state/useAsync";

type Group = ReturnType<typeof cadastreStage>["group"];

const GROUPS: Array<{ key: Group; label: string; tone: "info" | "warn" | "ok" }> = [
  { key: "new", label: "New referrals", tone: "info" },
  { key: "review", label: "In technical review", tone: "warn" },
  { key: "final", label: "Pending final approval", tone: "ok" },
];

function action(task: TaskRequest): { label: string; to: string; primary: boolean } {
  const group = cadastreStage(task).group;
  if (group === "new") return { label: "Assign", to: `/cadastre/assign/${task.id}`, primary: true };
  if (group === "final") return { label: "Review", to: `/cadastre/approval/${task.id}`, primary: false };
  if (group === "done") return { label: "View", to: `/cadastre/lis-sync?task=${task.id}`, primary: false };
  return { label: "View", to: `/cadastre/assign/${task.id}`, primary: false };
}

export function CadastreQueue() {
  usePageTitle("Cadastre Task Queue");
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => taskApi.managerList(), []);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");

  const tasks = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<Group, number> = { new: 0, review: 0, final: 0, done: 0 };
    tasks.forEach((t) => c[cadastreStage(t).group]++);
    return c;
  }, [tasks]);

  const visible = tasks.filter((t) => matchesSearch(t, query) && (!group || cadastreStage(t).group === group));

  return (
    <>
      <PageHeader
        title="Cadastre Task Queue"
        aside={
          <Link to="/cadastre/assign" className="btn btn--primary btn--caps btn--lg" style={{ minWidth: 232 }}>
            Create Task
          </Link>
        }
      />

      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by Task ID, Mouza, or Parcel" />
        <FilterSelect
          value={group}
          onChange={setGroup}
          options={[...GROUPS.map((g) => ({ value: g.key, label: g.label })), { value: "done", label: "LIS acknowledged" }]}
        />
      </div>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 290fr) minmax(0, 800fr)", alignItems: "start" }}>
        <div className="stack" style={{ gap: 14 }}>
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              className={`stat tone-${g.tone}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: 120,
                cursor: "pointer",
                textAlign: "left",
                outline: group === g.key ? "3px solid var(--tone-accent)" : undefined,
              }}
              aria-pressed={group === g.key}
              onClick={() => setGroup(group === g.key ? "" : g.key)}
            >
              <span className="stat__label" style={{ marginTop: 0 }}>
                {g.label}
              </span>
              <span className="stat__value">{counts[g.key]}</span>
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Mouza</th>
                <th>Stage</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((task) => {
                const s = cadastreStage(task);
                const a = action(task);
                return (
                  <tr key={task.id} className={s.group === "new" ? "is-highlight" : undefined}>
                    <td className="strong" style={{ fontSize: 17 }}>
                      {taskCode(task)}
                    </td>
                    <td>
                      {task.mouza}
                      <div className="small muted">{task.district}</div>
                    </td>
                    <td>
                      <Chip tone={s.tone} square>
                        {s.label}
                      </Chip>
                    </td>
                    <td className="col-action">
                      <button
                        type="button"
                        className={`btn btn--sm ${a.primary ? "btn--primary" : "btn--outline-primary"}`}
                        style={{ minWidth: 112, minHeight: 56 }}
                        onClick={() => navigate(a.to)}
                      >
                        {a.label}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading ? <Loading /> : null}
          {!loading && visible.length === 0 ? (
            <Empty title={tasks.length ? "No tasks match" : "Queue is empty"}>
              {tasks.length ? "Try a different search or stage." : "District referrals will appear here."}
            </Empty>
          ) : null}
        </div>
      </div>
    </>
  );
}
