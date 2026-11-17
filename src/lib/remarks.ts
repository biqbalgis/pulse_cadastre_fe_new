/**
 * The backend task model has no columns for "change type" or "processing
 * route" (both appear on the Figma Create Task form), so they are stored as a
 * readable header line in `remarks`:
 *
 *   Change type: Minor update · Route: District direct
 *   <free-text reference notes>
 *
 * Note: a rejection overwrites `remarks` with the rejection reason.
 */

export const CHANGE_TYPES = [
  "Minor update (e.g., boundary/attribute)",
  "Boundary correction",
  "Attribute update",
  "Parcel adjustment",
  "Subdivision",
  "Merger",
  "Classification change",
] as const;

export const ROUTES = {
  district: {
    label: "District direct",
    description: "Minor or no changes (e.g., boundary, attributes)",
  },
  central: {
    label: "Refer to Central Office",
    description: "Substantial changes (e.g., subdivision, merger, classification change)",
  },
} as const;

export type RouteKey = keyof typeof ROUTES;

export interface TaskMeta {
  changeType?: string;
  route?: string;
  notes: string;
}

const HEADER_RE = /^Change type: (.+?)(?: · Route: (.+))?$/;

export function encodeRemarks(meta: { changeType: string; route?: string; notes: string }): string {
  const header = meta.route
    ? `Change type: ${meta.changeType} · Route: ${meta.route}`
    : `Change type: ${meta.changeType}`;
  const notes = meta.notes.trim();
  return notes ? `${header}\n${notes}` : header;
}

export function decodeRemarks(remarks?: string | null): TaskMeta {
  if (!remarks) return { notes: "" };
  const [first, ...rest] = remarks.split("\n");
  const match = first.match(HEADER_RE);
  if (!match) return { notes: remarks };
  return { changeType: match[1], route: match[2], notes: rest.join("\n").trim() };
}
