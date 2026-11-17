import type { ComponentType, SVGProps } from "react";

import {
  AssignIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClipboardIcon,
  FilePlusIcon,
  FileTextIcon,
  LayersIcon,
  ListIcon,
  MagnifierIcon,
  MapPinIcon,
  ParcelIcon,
  PenNibIcon,
  ReviewIcon,
  ShieldCheckIcon,
  SyncIcon,
  UploadDocIcon,
  WorkspaceIcon,
} from "@/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type PortalKey = "district" | "cadastre" | "editor" | "reviewer";

export interface NavItem {
  label: string;
  to: string;
  icon: Icon;
  /** Extra path prefixes that keep this item highlighted. */
  match?: string[];
}

export interface Portal {
  key: PortalKey;
  title: string;
  description: string;
  icon: Icon;
  home: string;
  /** Backend roles that may open this portal (superusers can open all). */
  roles: string[];
  nav: NavItem[];
}

export const PORTALS: Record<PortalKey, Portal> = {
  district: {
    key: "district",
    title: "District Manager",
    description: "Create tasks and manage field surveys.",
    icon: MapPinIcon,
    home: "/district",
    roles: ["district_manager", "admin", "app_manager"],
    nav: [
      { label: "District Tasks", to: "/district", icon: ClipboardIcon },
      { label: "Create Task", to: "/district/create", icon: FilePlusIcon },
      { label: "Field Survey & Upload", to: "/district/field-survey", icon: UploadDocIcon },
      { label: "Close Task", to: "/district/close", icon: CheckCircleIcon },
    ],
  },
  cadastre: {
    key: "cadastre",
    title: "Cadastre Manager",
    description: "Assign tasks and approve parcel updates.",
    icon: ParcelIcon,
    home: "/cadastre",
    roles: ["vendor_manager", "admin", "app_manager"],
    nav: [
      { label: "Task Queue", to: "/cadastre", icon: ListIcon },
      { label: "Create & Assign", to: "/cadastre/assign", icon: AssignIcon },
      { label: "Final Approval", to: "/cadastre/approval", icon: ShieldCheckIcon },
      { label: "LIS Sync", to: "/cadastre/lis-sync", icon: SyncIcon },
    ],
  },
  editor: {
    key: "editor",
    title: "Editor (HQ)",
    description: "Edit parcel data and submit updates.",
    icon: PenNibIcon,
    home: "/editor",
    roles: ["data_editor"],
    nav: [
      { label: "My Assignments", to: "/editor", icon: BriefcaseIcon },
      { label: "Task Workspace", to: "/editor/workspace", icon: WorkspaceIcon },
      { label: "Submission Results", to: "/editor/results", icon: FileTextIcon },
    ],
  },
  reviewer: {
    key: "reviewer",
    title: "Reviewer (HQ)",
    description: "Review submissions and flag issues.",
    icon: MagnifierIcon,
    home: "/reviewer",
    roles: ["data_reviewer", "admin", "app_manager", "vendor_manager"],
    nav: [
      { label: "Review Queue", to: "/reviewer", icon: LayersIcon },
      { label: "Technical Review", to: "/reviewer/review", icon: ReviewIcon },
    ],
  },
};

export const PORTAL_ORDER: PortalKey[] = ["district", "cadastre", "editor", "reviewer"];
