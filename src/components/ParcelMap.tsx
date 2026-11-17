import { useEffect, useMemo, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import GeoJSONFormat from "ol/format/GeoJSON";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import ScaleLine from "ol/control/ScaleLine";
import { defaults as defaultControls } from "ol/control/defaults";
import { Fill, Stroke, Style, Text } from "ol/style";
import { createEmpty, extend as extendExtent, isEmpty } from "ol/extent";
import { fromLonLat } from "ol/proj";
import type Geometry from "ol/geom/Geometry";
import "ol/ol.css";

import type { FeatureCollection, TaskPolygon } from "@/api/types";

const BASEMAP_URL =
  import.meta.env.VITE_BASEMAP_URL ||
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const BASEMAP_ATTRIBUTION = import.meta.env.VITE_BASEMAP_ATTRIBUTION || "Tiles © Esri";

// Punjab, roughly — used until features load.
const DEFAULT_CENTER = fromLonLat([72.7, 31.2]);
const DEFAULT_ZOOM = 7;

const LABEL_FIELDS = ["Label", "label", "khasra_no", "parcel_no", "killa_no", "Khasra_ID", "Join_Shp", "name"];

export function featureLabel(props: Record<string, unknown> | null | undefined, fallback: string): string {
  for (const key of LABEL_FIELDS) {
    const value = props?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") return String(value);
  }
  return fallback;
}

export function featureId(
  feature: { id?: string | number; properties?: Record<string, unknown> | null },
  index: number,
): string {
  const p = feature.properties ?? {};
  const value = feature.id ?? p.id ?? p.fid ?? p.gid ?? p.objectid ?? p.parcel_id ?? p.Khasra_ID ?? p.Join_Shp ?? index + 1;
  return String(value);
}

/** Turn a mouza FeatureCollection into the polygon list the task API stores. */
export function collectionToPolygons(fc: FeatureCollection | null): TaskPolygon[] {
  if (!fc) return [];
  return fc.features
    .filter((f) => f.geometry)
    .map((f, i) => ({
      id: featureId(f, i),
      label: featureLabel(f.properties, `Parcel ${i + 1}`),
      properties: f.properties ?? {},
      geometry: f.geometry,
    }));
}

const format = new GeoJSONFormat();

function toFeatures(polygons: TaskPolygon[]): Feature<Geometry>[] {
  return polygons
    .filter((p) => p.geometry)
    .map((p) => {
      const geometry = format.readGeometry(p.geometry, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      }) as Geometry;
      const feature = new Feature<Geometry>({ geometry });
      feature.setId(p.id);
      feature.set("label", p.label);
      return feature;
    });
}

const outline = new Style({
  stroke: new Stroke({ color: "rgba(255,255,255,0.85)", width: 1.2 }),
  fill: new Fill({ color: "rgba(255,255,255,0.04)" }),
});

function selectedStyle(label: string, showLabel: boolean) {
  return new Style({
    stroke: new Stroke({ color: "#ffffff", width: 2.4 }),
    fill: new Fill({ color: "rgba(86, 196, 80, 0.78)" }),
    text: showLabel
      ? new Text({
          text: label,
          font: "700 14px Inter, sans-serif",
          fill: new Fill({ color: "#ffffff" }),
          stroke: new Stroke({ color: "rgba(0,0,0,0.45)", width: 3 }),
          overflow: true,
        })
      : undefined,
  });
}

export interface ParcelMapProps {
  /** All parcels that can be shown (e.g. the whole mouza). */
  parcels: TaskPolygon[];
  /** Parcel ids drawn as selected. Defaults to none. */
  selectedIds?: string[];
  /** When set, clicking a parcel toggles it. */
  onToggle?: (parcel: TaskPolygon) => void;
  toolbar?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  minHeight?: number;
  caption?: string;
  className?: string;
}

export function ParcelMap({
  parcels,
  selectedIds = [],
  onToggle,
  toolbar = false,
  loading = false,
  emptyMessage,
  minHeight = 460,
  caption,
  className = "",
}: ParcelMapProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const sourceRef = useRef(new VectorSource<Feature<Geometry>>());
  const layerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const selectedRef = useRef(new Set<string>());
  const parcelsByIdRef = useRef(new globalThis.Map<string, TaskPolygon>());
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;
  const [selectMode, setSelectMode] = useState(true);
  const selectModeRef = useRef(selectMode);
  selectModeRef.current = selectMode;

  const selectedKey = useMemo(() => [...selectedIds].sort().join("|"), [selectedIds]);
  // Few selected parcels → label them; on a whole-mouza view labels would clutter.
  const labelSelected = selectedIds.length > 0 && selectedIds.length <= 40;
  const labelSelectedRef = useRef(labelSelected);
  labelSelectedRef.current = labelSelected;

  // Create the map once.
  useEffect(() => {
    if (!targetRef.current) return;
    const layer = new VectorLayer({
      source: sourceRef.current,
      style: (feature) => {
        const id = String(feature.getId());
        return selectedRef.current.has(id) ? selectedStyle(String(feature.get("label") ?? ""), labelSelectedRef.current) : outline;
      },
    });
    layerRef.current = layer;
    const map = new Map({
      target: targetRef.current,
      controls: defaultControls({ zoom: false, rotate: false, attribution: true }).extend(
        scaleRef.current ? [new ScaleLine({ target: scaleRef.current, units: "metric", bar: false })] : [],
      ),
      layers: [
        new TileLayer({
          source: new XYZ({ url: BASEMAP_URL, attributions: BASEMAP_ATTRIBUTION, maxZoom: 19, crossOrigin: "anonymous" }),
        }),
        layer,
      ],
      view: new View({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, maxZoom: 20 }),
    });
    map.on("singleclick", (evt) => {
      if (!onToggleRef.current || !selectModeRef.current) return;
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const parcel = parcelsByIdRef.current.get(String(feature.getId()));
        if (parcel) onToggleRef.current?.(parcel);
        return true;
      });
    });
    map.on("pointermove", (evt) => {
      if (!onToggleRef.current || !selectModeRef.current) return;
      const el = map.getTargetElement();
      if (el) el.style.cursor = map.hasFeatureAtPixel(evt.pixel) ? "pointer" : "";
    });
    mapRef.current = map;
    const observer = new ResizeObserver(() => map.updateSize());
    observer.observe(targetRef.current);
    return () => {
      observer.disconnect();
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  // Load parcels.
  useEffect(() => {
    const source = sourceRef.current;
    source.clear();
    parcelsByIdRef.current = new globalThis.Map(parcels.map((p) => [p.id, p]));
    source.addFeatures(toFeatures(parcels));
    fitTo(selectedIds.length ? selectedIds : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcels]);

  // Update selection styling.
  useEffect(() => {
    selectedRef.current = new Set(selectedIds);
    layerRef.current?.changed();
  }, [selectedKey, selectedIds, labelSelected]);

  function fitTo(ids: string[] | null) {
    const map = mapRef.current;
    if (!map) return;
    const extent = createEmpty();
    for (const feature of sourceRef.current.getFeatures()) {
      if (ids && !ids.includes(String(feature.getId()))) continue;
      const geom = feature.getGeometry();
      if (geom) extendExtent(extent, geom.getExtent());
    }
    if (isEmpty(extent)) return;
    map.getView().fit(extent, { padding: [48, 48, 48, 48], maxZoom: 18, duration: 250 });
  }

  const zoomBy = (delta: number) => {
    const view = mapRef.current?.getView();
    if (!view) return;
    view.animate({ zoom: (view.getZoom() ?? DEFAULT_ZOOM) + delta, duration: 200 });
  };

  const message = loading ? "Loading parcels…" : parcels.length === 0 ? emptyMessage : undefined;

  return (
    <div className={`map-card ${className}`}>
      {toolbar ? (
        <div className="map-toolbar" role="toolbar" aria-label="Map tools">
          <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => zoomBy(1)}>
            ＋
          </button>
          <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => zoomBy(-1)}>
            −
          </button>
          <button
            type="button"
            title="Select parcels"
            aria-label="Select parcels"
            aria-pressed={selectMode}
            className={selectMode ? "is-active" : ""}
            disabled={!onToggle}
            onClick={() => setSelectMode((v) => !v)}
          >
            ◇
          </button>
          <button type="button" title="Zoom to mouza" aria-label="Zoom to mouza" onClick={() => fitTo(null)}>
            ⛶
          </button>
          <button
            type="button"
            title="Zoom to selected parcels"
            aria-label="Zoom to selected parcels"
            disabled={selectedIds.length === 0}
            onClick={() => fitTo(selectedIds)}
          >
            ⌖
          </button>
        </div>
      ) : null}
      <div className="map-canvas" style={{ minHeight }}>
        <div ref={targetRef} className="map-canvas__inner" />
        <div className="map-zoom">
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1)}>
            +
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-1)}>
            −
          </button>
          <button type="button" aria-label="Zoom to parcels" onClick={() => fitTo(selectedIds.length ? selectedIds : null)}>
            ⌖
          </button>
        </div>
        <div ref={scaleRef} className="map-scale" />
        <div className="map-legend" aria-label="Legend">
          <span className="map-legend__item">
            <span className="map-legend__swatch" style={{ background: "#4caf50" }} /> Selected parcel
          </span>
          <span className="map-legend__item">
            <span className="map-legend__swatch" style={{ background: "#fff" }} /> Parcel boundary
          </span>
        </div>
        {caption ? <div className="map-version">{caption}</div> : null}
        {message ? <div className="map-overlay-msg">{message}</div> : null}
      </div>
    </div>
  );
}
