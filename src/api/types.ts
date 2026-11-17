export type RoleName =
  | "admin"
  | "app_manager"
  | "district_manager"
  | "vendor_manager"
  | "data_editor"
  | "data_reviewer";

export interface UserInfo {
  id: number;
  username: string;
  name?: string | null;
  email?: string | null;
  designation?: string | null;
  organization?: string | null;
  dist_id?: number | null;
  dist_name?: string | null;
  is_superuser: boolean;
  is_staff?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
  roles: string[];
  vendor_id?: number | null;
}

export interface LoginResponse {
  token: { accessToken: string; refreshToken: string; expiresIn: number };
  userInfo: UserInfo;
}

export type TaskStatus =
  | "sent_to_manager"
  | "assigned"
  | "in_progress"
  | "completed"
  | "completed_with_constraints"
  | "approved"
  | "rejected"
  | "synced_with_lis";

export interface TaskPolygon {
  id: string;
  label: string;
  properties: Record<string, unknown>;
  geometry: Geometry | null;
}

export interface TaskRequest {
  id: number;
  district: string;
  district_id?: number;
  mouza: string;
  mouza_id?: number;
  manager?: string | null;
  requested_by?: string;
  assigned_to?: string | null;
  assigned_to_user_id?: number | null;
  status: TaskStatus | string;
  remarks?: string | null;
  polygons?: TaskPolygon[];
  polygon_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TaskRequestPayload {
  district: string;
  district_id: number;
  mouza: string;
  mouza_id: number;
  manager: string;
  remarks: string;
  polygons: TaskPolygon[];
}

export interface DistrictMouza {
  fid: number;
  district: string;
  distid: number;
  mouza: string | null;
  mouza_id: number;
  is_available?: boolean;
}

export interface Assignee {
  id: number;
  username: string;
  name: string;
}

export interface TaskDocument {
  id: number;
  task_id: number;
  filename: string;
  content_type?: string | null;
  file_size?: number;
  uploaded_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    id?: string | number;
    type: "Feature";
    geometry: Geometry | null;
    properties: Record<string, unknown> | null;
  }>;
  crs?: unknown;
}

/** GeoJSON geometry (kept minimal to avoid a @types/geojson dependency). */
export interface Geometry {
  type: string;
  coordinates?: unknown;
  geometries?: Geometry[];
}
