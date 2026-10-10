"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Map as LeafletMap, Marker, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { hasLocation, type Store } from "./sample-discovery";
import styles from "./prototype.module.css";

type Props = {
  stores: Store[];
  selectedId: string | null;
  hoveredId: string | null;
  select: (id: string) => void;
  hover: Dispatch<SetStateAction<string | null>>;
  failed: () => void;
};

export default function DiscoveryMap({ stores, selectedId, hoveredId, select, hover, failed }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const pinsRef = useRef<Map<string, Marker>>(new Map());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const pins = pinsRef.current;
    let observer: ResizeObserver | undefined;
    import("leaflet").then(L => {
      if (cancelled || !container.current) return;
      leafletRef.current = L;
      const map = L.map(container.current, { zoomControl: false, scrollWheelZoom: false, keyboard: false })
        .setView([40.705, -73.947], 14);
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        // Only visible tiles; no offline download or bulk prefetch.
        keepBuffer: 0,
      }).on("tileerror", failed)
        .on("loading", () => { if (!cancelled) setTilesLoaded(false); })
        .on("load", () => { if (!cancelled) setTilesLoaded(true); })
        .addTo(map);
      observer = new ResizeObserver(() => {
        map.invalidateSize({ pan: false });
        if (container.current) setWidth(container.current.clientWidth);
      });
      observer.observe(container.current);
      setReady(true);
    }).catch(() => { if (!cancelled) failed(); });
    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      pins.clear();
    };
  }, [failed]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    const group: LayerGroup = L.layerGroup().addTo(map);
    const pins = pinsRef.current;
    pins.clear();
    stores.forEach((store, index) => {
      if (!hasLocation(store) || !store.location) return;
      const marker = L.marker([store.location.latitude, store.location.longitude], {
        icon: L.divIcon({ className: styles.pin, html: `<span>${index + 1}</span>`, iconSize: [44, 48], iconAnchor: [22, 48] }),
        title: `Sample store ${index + 1}: ${store.name}. Illustrative location.`,
        keyboard: true,
      }).addTo(group);
      const element = marker.getElement();
      element?.setAttribute("role", "button");
      element?.setAttribute("aria-label", `Show sample store ${index + 1} on map`);
      element?.setAttribute("aria-pressed", "false");
      marker.on("click", () => select(store.id));
      marker.on("mouseover", () => hover(store.id));
      marker.on("mouseout", () => hover(null));
      element?.addEventListener("keydown", event => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          select(store.id);
        }
      });
      // Text nodes keep future names safe: no retailer data is interpolated as HTML.
      const label = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = store.name;
      const detail = document.createElement("span");
      detail.textContent = `Sample store · ${store.miles.toFixed(2)} mi straight-line`;
      label.append(name, detail);
      marker.bindTooltip(label, { permanent: true, direction: "right", offset: [14, -26], className: styles.mapCallout });
      pins.set(store.id, marker);
    });
    const points = stores.filter(hasLocation).map(store => L.latLng(store.location!.latitude, store.location!.longitude));
    if (points.length) {
      const wide = container.current!.clientWidth >= 900;
      map.fitBounds(L.latLngBounds(points), { paddingTopLeft: wide ? [430, 100] : [45, 85], paddingBottomRight: wide ? [230, 190] : [45, 160], maxZoom: 15, animate: false });
    }
    return () => { group.remove(); pins.clear(); };
  }, [stores, ready, width, select, hover]);

  useEffect(() => {
    for (const [id, marker] of pinsRef.current) {
      const element = marker.getElement();
      element?.classList.toggle(styles.pinSelected, id === selectedId);
      element?.classList.toggle(styles.pinHovered, id === hoveredId);
      element?.setAttribute("aria-pressed", String(id === selectedId));
      marker.setZIndexOffset(id === selectedId ? 1000 : id === hoveredId ? 500 : 0);
    }
    const selected = selectedId ? pinsRef.current.get(selectedId) : null;
    if (selected && mapRef.current && container.current) {
      const wide = container.current.clientWidth >= 900;
      mapRef.current.panInside(selected.getLatLng(), { paddingTopLeft: wide ? [430, 100] : [50, 130], paddingBottomRight: wide ? [240, 200] : [50, 330], animate: false });
    }
  }, [selectedId, hoveredId, ready, stores, width]);

  return <>
    <div ref={container} className={styles.mapCanvas} role="region" aria-label="Illustrative sample-store map" />
    {!ready || !tilesLoaded ? <p className={styles.mapLoading} role="status">Loading map. The list is ready to use.</p> : null}
  </>;
}
