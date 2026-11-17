import { useEffect, useMemo, useState, type ReactNode } from "react";

import { taskApi } from "@/api/tasks";
import type { DistrictMouza, TaskPolygon, TaskRequestPayload } from "@/api/types";
import { CHANGE_TYPES, encodeRemarks } from "@/lib/remarks";
import { useAsync } from "@/state/useAsync";
import { collectionToPolygons, ParcelMap } from "./ParcelMap";
import { Field } from "./ui";

/** Mouza geojson is looked up by mouza_id, falling back to fid where mouza_id is 0. */
const mouzaKey = (m: DistrictMouza) => m.mouza_id || m.fid;

/** State for the "Create Task" style form shared by District and Cadastre portals. */
export function useTaskDraft() {
  const mouzas = useAsync(() => taskApi.districtMouzas(), []);
  const [district, setDistrict] = useState("");
  const [mouzaFid, setMouzaFid] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [parcelText, setParcelText] = useState("");
  const [changeType, setChangeType] = useState<string>(CHANGE_TYPES[0]);
  const [notes, setNotes] = useState("");

  const districts = useMemo(
    () => [...new Set((mouzas.data ?? []).map((m) => m.district))].sort((a, b) => a.localeCompare(b)),
    [mouzas.data],
  );
  const districtMouzas = useMemo(
    () => (mouzas.data ?? []).filter((m) => m.district === district),
    [mouzas.data, district],
  );
  const mouza = useMemo(() => districtMouzas.find((m) => m.fid === mouzaFid) ?? null, [districtMouzas, mouzaFid]);

  // Default to the only district when the user is scoped to one.
  useEffect(() => {
    if (!district && districts.length === 1) setDistrict(districts[0]);
  }, [district, districts]);

  const geo = useAsync(
    () => (mouza ? taskApi.mouzaGeoJson(mouzaKey(mouza)).then(collectionToPolygons) : Promise.resolve([] as TaskPolygon[])),
    [mouza ? mouzaKey(mouza) : null],
  );
  const parcels = useMemo(() => geo.data ?? [], [geo.data]);
  const byId = useMemo(() => new Map(parcels.map((p) => [p.id, p])), [parcels]);
  const selected = useMemo(() => selectedIds.map((id) => byId.get(id)).filter(Boolean) as TaskPolygon[], [selectedIds, byId]);

  // Reset parcel selection when the mouza changes.
  useEffect(() => {
    setSelectedIds([]);
    setParcelText("");
  }, [mouzaFid]);

  const syncText = (ids: string[]) => setParcelText(ids.map((id) => byId.get(id)?.label ?? id).join(", "));

  const toggle = (parcel: TaskPolygon) => {
    setSelectedIds((ids) => {
      const next = ids.includes(parcel.id) ? ids.filter((i) => i !== parcel.id) : [...ids, parcel.id];
      syncText(next);
      return next;
    });
  };

  /** Resolve typed khasra numbers against parcel labels. Returns unknown tokens. */
  const applyParcelText = (): string[] => {
    const tokens = parcelText.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
    const ids: string[] = [];
    const unknown: string[] = [];
    for (const token of tokens) {
      const match = parcels.find((p) => p.label === token || p.id === token);
      if (match) {
        if (!ids.includes(match.id)) ids.push(match.id);
      } else unknown.push(token);
    }
    setSelectedIds(ids);
    return unknown;
  };

  const buildPayload = (route?: string): TaskRequestPayload | null => {
    if (!mouza || selected.length === 0) return null;
    return {
      district: mouza.district,
      district_id: mouza.distid,
      mouza: mouza.mouza ?? "",
      mouza_id: mouza.mouza_id,
      manager: "",
      remarks: encodeRemarks({ changeType, route, notes }),
      polygons: selected,
    };
  };

  return {
    mouzas,
    districts,
    districtMouzas,
    district,
    setDistrict: (d: string) => {
      setDistrict(d);
      setMouzaFid(null);
    },
    mouza,
    setMouzaFid,
    geo,
    parcels,
    selectedIds,
    selected,
    toggle,
    parcelText,
    setParcelText,
    applyParcelText,
    changeType,
    setChangeType,
    notes,
    setNotes,
    buildPayload,
  };
}

export type TaskDraft = ReturnType<typeof useTaskDraft>;

/** `children` render before the notes field, `after` below it (Figma field order differs per portal). */
export function TaskFormFields({ draft, children, after }: { draft: TaskDraft; children?: ReactNode; after?: ReactNode }) {
  const [unknown, setUnknown] = useState<string[]>([]);
  return (
    <>
      <Field label="District" required>
        <select
          className="select"
          value={draft.district}
          onChange={(e) => draft.setDistrict(e.target.value)}
          disabled={draft.mouzas.loading}
        >
          <option value="">{draft.mouzas.loading ? "Loading districts…" : "Select district"}</option>
          {draft.districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Mouza" required>
        <select
          className="select"
          value={draft.mouza?.fid ?? ""}
          onChange={(e) => draft.setMouzaFid(e.target.value ? Number(e.target.value) : null)}
          disabled={!draft.district}
        >
          <option value="">{draft.district ? "Select mouza" : "Select a district first"}</option>
          {draft.districtMouzas.map((m) => (
            <option key={m.fid} value={m.fid}>
              {m.mouza}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Parcel / Khasra"
        required
        hint={
          unknown.length
            ? `Not found in this mouza: ${unknown.join(", ")}`
            : draft.selected.length
              ? `${draft.selected.length} parcel(s) selected — click parcels on the map to add or remove.`
              : "Type khasra numbers (comma separated) or click parcels on the map."
        }
      >
        <input
          className="input"
          value={draft.parcelText}
          placeholder={draft.mouza ? "e.g. 108, 109" : "Select a mouza first"}
          disabled={!draft.mouza || draft.geo.loading}
          onChange={(e) => draft.setParcelText(e.target.value)}
          onBlur={() => setUnknown(draft.applyParcelText())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setUnknown(draft.applyParcelText());
            }
          }}
        />
      </Field>

      <Field label="Change type" required>
        <select className="select" value={draft.changeType} onChange={(e) => draft.setChangeType(e.target.value)}>
          {CHANGE_TYPES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      {children}

      <Field label="Reference notes">
        <textarea
          className="textarea"
          value={draft.notes}
          placeholder="e.g. Boundary adjustment and attribute update for parcels 108 and 109."
          onChange={(e) => draft.setNotes(e.target.value)}
        />
      </Field>

      {after}
    </>
  );
}

export function TaskFormMap({ draft }: { draft: TaskDraft }) {
  return (
    <ParcelMap
      toolbar
      parcels={draft.parcels}
      selectedIds={draft.selectedIds}
      onToggle={draft.toggle}
      loading={draft.geo.loading}
      emptyMessage={draft.mouza ? "No parcel geometry is stored for this mouza." : "Select a mouza to load its parcels."}
      minHeight={560}
    />
  );
}
