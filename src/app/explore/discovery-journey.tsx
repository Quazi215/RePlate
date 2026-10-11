"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m, useReducedMotion } from "motion/react";
import { findStores, hasLocation, retailerLocatorUrl, validateSearch, type DiscoveryError, type DiscoveryResult, type Search, type SearchErrors, type Store } from "./discovery";
import styles from "../site.module.css";

const DiscoveryMap = dynamic(() => import("./discovery-map"), {
  ssr: false,
  loading: () => <p className={styles.mapLoading} role="status">Loading map. The list is ready to use.</p>,
});

class MapBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function SearchForm({ search, errors, update, submit, validateField }: {
  search: Search; errors: SearchErrors; update: (next: Search) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void; validateField: (field: keyof SearchErrors) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  return <form className={styles.searchForm} onSubmit={submit} noValidate>
    <div className={styles.field}>
      <label htmlFor="zip">NYC ZIP code</label>
      <input id="zip" name="zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={search.zip}
        aria-invalid={Boolean(errors.zip)} aria-describedby={errors.zip ? "zip-help zip-error" : "zip-help"}
        onChange={event => update({ ...search, zip: event.target.value })} onBlur={() => validateField("zip")} />
      <p id="zip-help" className={styles.help}>No home address needed. Enter a NYC ZIP code.</p>
      {errors.zip ? <p id="zip-error" className={styles.error} role="alert">{errors.zip}</p> : null}
    </div>
    <button className={styles.advancedToggle} type="button" aria-controls="search-radius" aria-expanded={advancedOpen || Boolean(errors.radius)} onClick={() => setAdvancedOpen(previous => !previous)}>
      <span>Radius <strong>{search.radius ? `${search.radius} mi` : "No limit"}</strong></span><span aria-hidden="true">{advancedOpen ? "−" : "+"}</span>
    </button>
    <div id="search-radius" className={`${styles.advancedFields} ${advancedOpen || errors.radius ? styles.advancedOpen : ""}`}>
    <div className={styles.field}>
      <label htmlFor="radius">Straight-line radius <span className={styles.optional}>(optional)</span></label>
      <div className={styles.inputUnit}><input id="radius" name="radius" type="number" min="0.01" max="25" step="any" value={search.radius} placeholder="No limit"
        aria-invalid={Boolean(errors.radius)} aria-describedby={errors.radius ? "radius-help radius-error" : "radius-help"}
        onChange={event => update({ ...search, radius: event.target.value })} onBlur={() => validateField("radius")} /><span>miles</span></div>
      <p id="radius-help" className={styles.help}>Approximate proximity, not route distance.</p>
      {errors.radius ? <p id="radius-error" className={styles.error} role="alert">{errors.radius}</p> : null}
    </div>
    </div>
    <button className={styles.primary} type="submit">Find stores <span aria-hidden="true">→</span></button>
  </form>;
}

function StoreCard({ store, index, selected, select, hover }: {
  store: Store; index: number; selected: boolean; select: (id: string) => void; hover: (id: string | null) => void;
}) {
  const located = hasLocation(store);
  const reducedMotion = useReducedMotion();
  return <m.article layout={reducedMotion ? false : "position"} transition={{ duration: 0.16 }} id={`card-${store.id}`} data-store-id={store.id} data-selected={selected} className={`${styles.storeCard} ${selected ? styles.cardSelected : ""}`}
    onMouseEnter={() => hover(store.id)} onMouseLeave={() => hover(null)}>
    <div className={styles.cardTop}><span className={styles.storeNumber} aria-hidden="true">{index + 1}</span><div><span className={styles.storeTag}>Retailer candidate</span><h3>{store.name}</h3></div>{selected ? <span className={styles.selectedLabel}>Selected</span> : null}</div>
    <p className={styles.address}>{store.address}</p>
    <p className={styles.distance}>{store.miles.toFixed(2)} mi <span>approx. straight-line</span></p>
    <p className={styles.cardStatus}>SNAP authorization: <strong>Not verified</strong></p>
    <p className={styles.help}>Prices &amp; stock unknown. Route, time &amp; trip fare unknown.</p>
    {!located ? <p className={styles.help}>Location unavailable. This store remains in the list.</p> : null}
    <div className={styles.cardActions}>
      <button className={styles.mapAction} disabled={!located} aria-label={`Show ${store.name} on map`} aria-pressed={selected} onClick={() => select(store.id)}>Show on map <span aria-hidden="true">↗</span></button>
    </div>
  </m.article>;
}

function Sources({ result }: { result: DiscoveryResult | null }) {
  return <details className={styles.assumptions}>
    <summary>Sources &amp; limitations</summary>
    <p>Retailers come from the local supermarket snapshot. Its source, snapshot date, and current SNAP authorization have not been verified. Prices and inventory are unknown.</p>
    <p>Distances are calculated from an approximate ZIP/ZCTA internal point, not your address or a travel route. {result ? `${result.originLabel} Reference extracted ${result.referenceDate}. ` : null}<a href="https://data.cityofnewyork.us/City-Government/ZIP-Code-Tabulation-Areas/35j5-n34v" target="_blank" rel="noopener noreferrer">NYC ZIP/ZCTA reference ↗</a>.</p>
    <p>Results use the submitted ZIP and straight-line radius. Panning or zooming does not search the visible area. Nearby does not establish a usable walking or bus route.</p>
    <p>SNAP authorization is not verified. Missing evidence does not mean a store does not accept SNAP. <a href={retailerLocatorUrl} target="_blank" rel="noopener noreferrer">Check stores in the official USDA retailer locator ↗</a>.</p>
    <p>The geographic basemap is supplied by OpenStreetMap. Tile requests share normal browser/network information and the viewed tile area with that provider. Hiraku does not request your precise location or send a home address. <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">OpenStreetMap privacy policy ↗</a>.</p>
  </details>;
}

export default function DiscoveryJourney() {
  const reducedMotion = useReducedMotion();
  const [search, setSearch] = useState<Search>({ zip: "", radius: "" });
  const [applied, setApplied] = useState<Search | null>(null);
  const [errors, setErrors] = useState<SearchErrors>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [mapFailed, setMapFailed] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [requestError, setRequestError] = useState<DiscoveryError | null>(null);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);
  useEffect(() => () => { requestSequence.current++; requestRef.current?.abort(); }, []);
  const results = result?.stores ?? [];
  const selected = results.find(store => store.id === selectedId);
  const selectedNumber = results.findIndex(store => store.id === selectedId) + 1;
  const dirty = Boolean(applied && (search.zip !== applied.zip || search.radius !== applied.radius));
  const failMap = useCallback(() => setMapFailed(true), []);
  const selectPin = useCallback((id: string) => {
    setSelectedId(id);
    if (window.matchMedia("(min-width: 900px)").matches) {
      const card = document.getElementById(`card-${id}`);
      const bounds = card?.getBoundingClientRect();
      const listBounds = card?.closest('[data-store-list]')?.getBoundingClientRect();
      if (bounds && listBounds && (bounds.top < Math.max(0, listBounds.top) || bounds.bottom > Math.min(window.innerHeight, listBounds.bottom))) {
        card?.scrollIntoView({ block: "nearest", behavior: "instant" });
      }
    }
  }, []);

  function update(next: Search) { setSearch(next); setErrors({}); }
  async function apply(next: Search) {
    const nextErrors = validateSearch(next);
    setErrors(nextErrors);
    if (nextErrors.zip || nextErrors.radius) {
      document.getElementById(nextErrors.zip ? "zip" : "radius")?.focus();
      return;
    }
    const sequence = ++requestSequence.current;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setApplied(next);
    setResult(null);
    setRequestError(null);
    setSelectedId(null);
    setHoveredId(null);
    setLoading(true);
    try {
      const response = await findStores(next, controller.signal);
      if (sequence !== requestSequence.current) return;
      if (response.status === "error") {
        setRequestError(response);
      } else {
        setResult(response);
      }
    } catch {
      if (sequence === requestSequence.current) setRequestError({ status: "error", code: "SEARCH_UNAVAILABLE", message: "We couldn’t load nearby stores. Please try again or use the USDA retailer locator." });
    } finally {
      clearTimeout(timeout);
      if (sequence === requestSequence.current) { setLoading(false); requestRef.current = null; }
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void apply(search); }
  function validateField(field: keyof SearchErrors) { setErrors(previous => ({ ...previous, [field]: validateSearch(search)[field] })); }
  function reset() {
    requestSequence.current++; requestRef.current?.abort(); requestRef.current = null;
    setResult(null); setRequestError(null); setLoading(false);
    setSearch({ zip: "", radius: "" }); setApplied(null); setErrors({}); setSelectedId(null); setHoveredId(null);
    document.getElementById("zip")?.focus();
  }
  function showOnMap(id: string) { setSelectedId(id); setView("map"); }
  function viewInList() {
    setView("list");
    requestAnimationFrame(() => {
      const card = document.getElementById(`card-${selectedId}`);
      if (card) {
        card.scrollIntoView({ block: "nearest", behavior: "instant" });
        card.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
      }
    });
  }
  function retryMap() { setMapFailed(false); setMapAttempt(previous => previous + 1); }
  const fallback = <div className={styles.mapFailure} role="status"><h2>Map unavailable</h2><p>The map could not load. Your store list is still available.</p><div className={styles.failureActions}><button className={styles.primary} onClick={retryMap}>Retry map</button><button className={styles.secondary} onClick={() => setView("list")}>View store list</button></div></div>;

  return <LazyMotion features={domMax} strict><MotionConfig reducedMotion="user"><div className={styles.site}>
    <header className={styles.header}><Link className={styles.brand} href="/" aria-label="Hiraku home"><span className={styles.brandMark} aria-hidden="true" />Hiraku<span className={styles.brandPeriod} aria-hidden="true">.</span></Link><nav className={styles.navigation} aria-label="Main navigation"><Link href="/">Info</Link><Link href="/explore" aria-current="page">Explore</Link></nav><button className={styles.textButton} onClick={reset}>Reset</button></header>
    <div className={styles.evidenceNotice}><strong>SNAP authorization not verified</strong><span>Confirm current SNAP acceptance with the USDA locator or the store.</span></div>
    <main className={styles.shell}>
      <div className={styles.titleStrip}><div><h1>Your neighborhood, on the map.</h1><p>Find nearby supermarket candidates by NYC ZIP code.</p></div><span className={styles.areaTag}>{result ? `${result.borough} · ${result.zip}` : "NYC · Five boroughs"}</span></div>
      <div className={styles.mobileSwitch} aria-label="Discovery view">{(["map", "list"] as const).map(option => <button key={option} className={view === option ? styles.viewSelected : ""} aria-pressed={view === option} onClick={() => setView(option)}>
        {view === option ? <m.span className={styles.viewIndicator} layoutId={reducedMotion ? undefined : "discovery-view"} transition={{ duration: reducedMotion ? 0 : 0.16 }} aria-hidden="true" /> : null}<span>{option === "map" ? "Map" : "List"}</span>
      </button>)}</div>
      <section className={`${styles.discovery} ${view === "list" ? styles.listView : styles.mapView}`} aria-label="Grocery discovery">
        <div className={styles.mapStage}>
          {result && results.some(hasLocation) ? <MapBoundary key={mapAttempt} fallback={fallback}>{mapFailed ? fallback : <DiscoveryMap stores={results} selectedId={selectedId} hoveredId={hoveredId} select={selectPin} hover={setHoveredId} failed={failMap} />}</MapBoundary> : <div className={styles.mapPlaceholder}><span className={styles.placeholderMark} aria-hidden="true">↗</span><h2>{loading ? "Finding nearby stores…" : requestError ? "Search unavailable" : result ? "No nearby stores to show" : "Your next stop starts here"}</h2><p>{loading ? "The map and list will update together." : requestError ? "Check the search message in the list and try again." : result ? "Adjust or clear your radius to search again." : "Enter a NYC ZIP code to explore nearby stores."}</p></div>}
          <div className={styles.mapCaption}><span className={styles.mapCaptionDot} aria-hidden="true" /><strong>Retailer locations · SNAP not verified</strong><span>Map movement does not change results.</span></div>
          <AnimatePresence initial={false}>{selected && !mapFailed ? <m.aside className={styles.selectedSummary} aria-label="Selected store" key={selected.id}
            initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 4 }} transition={{ duration: reducedMotion ? 0 : 0.16 }}>
            <div className={styles.summaryTop}><span className={styles.storeNumber} aria-hidden="true">{selectedNumber}</span><span className={styles.storeTag}>Retailer candidate · selected</span><button className={styles.closeSummary} aria-label="Close selected store summary" onClick={() => setSelectedId(null)}>×</button></div>
            <h2>{selected.name}</h2><p>{selected.address}</p><p className={styles.distance}>{selected.miles.toFixed(2)} mi <span>approx. straight-line</span></p><p className={styles.help}>SNAP not verified. Prices, stock, route, time &amp; trip fare unknown.</p><button className={styles.primary} onClick={viewInList} aria-label="View selected store in list">View in list <span aria-hidden="true">→</span></button>
          </m.aside> : null}</AnimatePresence>
        </div>
        <aside className={styles.sidePanel} aria-label="Search and store list">
          <div className={styles.panelHeading}><div><span className={styles.panelEyebrow}>A little closer to home</span><h2>Find your grocery stop</h2></div><span className={styles.panelAccent} aria-hidden="true">↗</span></div>
          <SearchForm search={search} errors={errors} update={update} submit={submit} validateField={validateField} />
          {dirty ? <p className={styles.pendingNotice} role="status">Changes not applied. Select Find stores to update results.</p> : null}
          <div className={styles.resultHeading}><h2>{loading ? "Finding stores…" : requestError ? "Search could not complete" : result ? `${results.length} stores` : "Ready when you are"}</h2><p role="status">{applied ? `Near ${applied.zip} · ${applied.radius ? `${applied.radius}-mile radius` : "No radius limit"}` : "Enter a NYC ZIP code to get started."}</p>{result ? <p className={styles.help}>Ordered by approximate straight-line distance.</p> : null}{result?.capNotice ? <p className={styles.help}>{result.capNotice}</p> : null}</div>
          <div className={`${styles.resultsBody} ${loading || requestError || result?.status === "no-results" ? styles.searchFeedback : ""}`} data-store-list role="region" aria-label="Nearby store results" tabIndex={0} aria-busy={loading}>
            {loading ? <div className={styles.empty} role="status"><p>Loading nearby stores…</p></div> : requestError ? <div className={styles.empty} role="alert"><h3>{requestError.code === "UNSUPPORTED_ZIP" ? "ZIP not supported" : "Stores unavailable"}</h3><p>{requestError.message}</p><div className={styles.failureActions}><button className={styles.secondary} onClick={() => { if (applied) void apply(applied); }}>Retry search</button><a href={retailerLocatorUrl} target="_blank" rel="noopener noreferrer">Find stores with USDA ↗</a></div></div> : !result ? <div className={styles.empty}><h3>A few possibilities, nearby.</h3><p>Find stores to explore nearby supermarket candidates. No precise location needed.</p></div> : results.length === 0 ? <div className={styles.empty} role="status"><h3>No stores in this radius</h3><p>Try a wider straight-line radius or clear it to see nearby candidates.</p><button className={styles.secondary} onClick={() => { if (applied) { const next = { ...applied, radius: "" }; setSearch(next); void apply(next); } }}>Clear radius</button></div> : results.map((store, index) => <StoreCard key={store.id} store={store} index={index} selected={store.id === selectedId} select={showOnMap} hover={setHoveredId} />)}
          </div>
          <Sources result={result} />
        </aside>
      </section>
      <footer className={styles.footer}><span>Hiraku · Explore grocery options.</span><a href="https://www.fns.usda.gov/snap/retailer-locator" target="_blank" rel="noopener noreferrer">Find verified information with USDA ↗</a></footer>
    </main>
  </div></MotionConfig></LazyMotion>;
}
