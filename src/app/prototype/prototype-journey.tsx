"use client";

// Development-only discovery. Fictional fixtures, no live retailer search.
import dynamic from "next/dynamic";
import { Component, useCallback, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m, useReducedMotion } from "motion/react";
import { hasLocation, sampleResults, sampleSearch, validateSearch, type Search, type SearchErrors, type Store } from "./sample-discovery";
import styles from "./prototype.module.css";

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
      <p id="zip-help" className={styles.help}>No home address needed. Sample ZIP: 11206.</p>
      {errors.zip ? <p id="zip-error" className={styles.error} role="alert">{errors.zip}</p> : null}
    </div>
    <button className={styles.advancedToggle} type="button" aria-controls="travel-radius" aria-expanded={advancedOpen || Boolean(errors.radius)} onClick={() => setAdvancedOpen(previous => !previous)}>
      <span>Travel &amp; radius <strong>{search.mode === "bus" ? "Bus" : "Walking"} · {search.radius ? `${search.radius} mi` : "No limit"}</strong></span><span aria-hidden="true">{advancedOpen ? "−" : "+"}</span>
    </button>
    <div id="travel-radius" className={`${styles.advancedFields} ${advancedOpen || errors.radius ? styles.advancedOpen : ""}`}>
    <fieldset className={styles.modeField}>
      <legend>Travel preference</legend>
      <div className={styles.modeOptions}>{(["walking", "bus"] as const).map(mode => <label className={`${styles.modeOption} ${search.mode === mode ? styles.modeSelected : ""}`} key={mode}>
        <input type="radio" name="mode" value={mode} checked={search.mode === mode} onChange={() => update({ ...search, mode })} />
        <span>{mode === "walking" ? "Walking" : "Bus"}</span>
      </label>)}</div>
      <p className={styles.help}>Preference only. Routes are not verified.</p>
    </fieldset>
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
    <div className={styles.cardTop}><span className={styles.storeNumber} aria-hidden="true">{index + 1}</span><div><span className={styles.sampleTag}>Sample store</span><h3>{store.name}</h3></div>{selected ? <span className={styles.selectedLabel}>Selected</span> : null}</div>
    <p className={styles.address}>{store.address}</p>
    <p className={styles.distance}>{store.miles.toFixed(2)} mi <span>approx. straight-line</span></p>
    <p className={styles.cardStatus}>SNAP authorization: <strong>Not verified</strong></p>
    <p className={styles.help}>Prices &amp; stock unknown. Route, time &amp; trip fare unknown.</p>
    {!located ? <p className={styles.help}>Location unavailable. This store remains in the list.</p> : null}
    <div className={styles.cardActions}>
      <button className={styles.mapAction} disabled={!located} aria-label={`Show ${store.name} on map`} aria-pressed={selected} onClick={() => select(store.id)}>Show on map <span aria-hidden="true">↗</span></button>
      <button className={styles.disabledAction} disabled aria-label={`Directions unavailable for sample store ${store.name}`}>Directions unavailable</button>
    </div>
  </m.article>;
}

function Sources() {
  return <details className={styles.assumptions}>
    <summary>Sources &amp; limitations</summary>
    <p>Four fictional stores, illustrative addresses and pins, and fixed sample distances. These distances are not computed from the pins. No live retailer lookup, geocoding, routing, prices, or inventory is used.</p>
    <p>Results use the submitted sample ZIP and straight-line radius. Panning or zooming does not search the visible area. Travel preference never changes proximity ordering.</p>
    <p>Sample directions are disabled to avoid sending you to an unrelated real business. An illustrative pin is not a verified retailer location.</p>
    <p>SNAP authorization is not verified. Missing evidence does not mean a store does not accept SNAP. <a href="https://www.fns.usda.gov/snap/retailer-locator" target="_blank" rel="noopener noreferrer">Check real stores in the official USDA retailer locator ↗</a>.</p>
    <p>Trip fare is unknown. For general fare education, <a href="https://www.mta.info/fares-tolls/subway-bus" target="_blank" rel="noopener noreferrer">see MTA subway and bus fares ↗</a>; no fare amount is used in this comparison.</p>
    <p>The geographic basemap is supplied by OpenStreetMap. Tile requests share normal browser/network information and the viewed tile area with that provider. This draft does not request your precise location or send a home address. <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">OpenStreetMap privacy policy ↗</a>.</p>
  </details>;
}

export default function PrototypeJourney() {
  const reducedMotion = useReducedMotion();
  const [search, setSearch] = useState<Search>(sampleSearch);
  const [applied, setApplied] = useState<Search | null>(sampleSearch);
  const [errors, setErrors] = useState<SearchErrors>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [mapFailed, setMapFailed] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const results = useMemo(() => applied ? sampleResults(applied) : [], [applied]);
  const selected = results.find(store => store.id === selectedId);
  const selectedNumber = results.findIndex(store => store.id === selectedId) + 1;
  const dirty = Boolean(applied && (search.zip !== applied.zip || search.mode !== applied.mode || search.radius !== applied.radius));
  const failMap = useCallback(() => setMapFailed(true), []);
  const selectPin = useCallback((id: string) => {
    setSelectedId(id);
    if (window.matchMedia("(min-width: 900px)").matches) {
      const card = document.getElementById(`card-${id}`);
      const bounds = card?.getBoundingClientRect();
      if (bounds && (bounds.top < 0 || bounds.bottom > window.innerHeight)) card?.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
  }, []);

  function update(next: Search) { setSearch(next); setErrors({}); }
  function apply(next: Search) {
    const nextErrors = validateSearch(next);
    setErrors(nextErrors);
    if (nextErrors.zip || nextErrors.radius) {
      document.getElementById(nextErrors.zip ? "zip" : "radius")?.focus();
      return;
    }
    setApplied(next);
    setSelectedId(previous => sampleResults(next).some(store => store.id === previous) ? previous : null);
    setHoveredId(null);
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); apply(search); }
  function validateField(field: keyof SearchErrors) { setErrors(previous => ({ ...previous, [field]: validateSearch(search)[field] })); }
  function reset() {
    setSearch({ zip: "", mode: "walking", radius: "" }); setApplied(null); setErrors({}); setSelectedId(null); setHoveredId(null);
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

  return <LazyMotion features={domMax} strict><MotionConfig reducedMotion="user"><div className={styles.prototype}>
    <header className={styles.header}><a className={styles.brand} href="/prototype" aria-label="RePlate discovery prototype"><span className={styles.brandMark} aria-hidden="true" />RePlate<span className={styles.brandPeriod} aria-hidden="true">.</span></a><span className={styles.headerCaption}>Grocery discovery · NYC</span><button className={styles.textButton} onClick={reset}>Reset</button></header>
    <div className={styles.draftNotice}><strong>Sample discovery</strong><span>Fictional stores. Pins &amp; distances illustrative. SNAP not verified.</span></div>
    <main className={styles.shell}>
      <div className={styles.titleStrip}><div><h1>Your neighborhood, on the map.</h1><p>Explore nearby grocery options. Know what’s known.</p></div><span className={styles.areaTag}>Brooklyn sample · 11206</span></div>
      <div className={styles.mobileSwitch} aria-label="Discovery view">{(["map", "list"] as const).map(option => <button key={option} className={view === option ? styles.viewSelected : ""} aria-pressed={view === option} onClick={() => setView(option)}>
        {view === option ? <m.span className={styles.viewIndicator} layoutId={reducedMotion ? undefined : "discovery-view"} transition={{ duration: reducedMotion ? 0 : 0.16 }} aria-hidden="true" /> : null}<span>{option === "map" ? "Map" : "List"}</span>
      </button>)}</div>
      <section className={`${styles.discovery} ${view === "list" ? styles.listView : styles.mapView}`} aria-label="Grocery discovery">
        <div className={styles.mapStage}>
          {applied && results.some(hasLocation) ? <MapBoundary key={mapAttempt} fallback={fallback}>{mapFailed ? fallback : <DiscoveryMap stores={results} selectedId={selectedId} hoveredId={hoveredId} select={selectPin} hover={setHoveredId} failed={failMap} />}</MapBoundary> : <div className={styles.mapPlaceholder}><span className={styles.placeholderMark} aria-hidden="true">↗</span><h2>{applied ? "No sample locations to show" : "Your next stop starts here"}</h2><p>{applied ? "Adjust your radius to explore the sample map." : "Enter sample ZIP 11206 to explore the map and list."}</p></div>}
          <div className={styles.mapCaption}><span className={styles.mapCaptionDot} aria-hidden="true" /><strong>Illustrative sample locations</strong><span>Map movement does not change results.</span></div>
          <AnimatePresence initial={false}>{selected && !mapFailed ? <m.aside className={styles.selectedSummary} aria-label="Selected sample store" key={selected.id}
            initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 4 }} transition={{ duration: reducedMotion ? 0 : 0.16 }}>
            <div className={styles.summaryTop}><span className={styles.storeNumber} aria-hidden="true">{selectedNumber}</span><span className={styles.sampleTag}>Sample store · selected</span><button className={styles.closeSummary} aria-label="Close selected store summary" onClick={() => setSelectedId(null)}>×</button></div>
            <h2>{selected.name}</h2><p>{selected.address}</p><p className={styles.distance}>{selected.miles.toFixed(2)} mi <span>approx. straight-line</span></p><p className={styles.help}>SNAP not verified. Prices, stock, route, time &amp; trip fare unknown.</p><button className={styles.primary} onClick={viewInList} aria-label="View selected store in list">View in list <span aria-hidden="true">→</span></button><p className={styles.help}>Sample directions are disabled.</p>
          </m.aside> : null}</AnimatePresence>
        </div>
        <aside className={styles.sidePanel} aria-label="Search and store list">
          <div className={styles.panelHeading}><div><span className={styles.panelEyebrow}>A little closer to home</span><h2>Find your grocery stop</h2></div><span className={styles.panelAccent} aria-hidden="true">↗</span></div>
          <SearchForm search={search} errors={errors} update={update} submit={submit} validateField={validateField} />
          {dirty ? <p className={styles.pendingNotice} role="status">Changes not applied. Select Find stores to update results.</p> : null}
          <div className={styles.resultHeading}><h2>{applied ? `${results.length} sample stores` : "Ready when you are"}</h2><p role="status">{applied ? `Near ${applied.zip} · ${applied.radius ? `${applied.radius}-mile radius` : "No radius limit"} · ${applied.mode === "bus" ? "Bus" : "Walking"} preference` : "Use sample ZIP 11206 to get started."}</p>{applied ? <p className={styles.help}>Ordered by approximate straight-line distance.</p> : null}</div>
          <div className={styles.resultsBody}>
            {!applied ? <div className={styles.empty}><h3>A few possibilities, nearby.</h3><p>Find stores to compare sample grocery options. No precise location needed.</p></div> : results.length === 0 ? <div className={styles.empty} role="status"><h3>No sample stores in this radius</h3><p>Try a wider straight-line radius or clear it to see all four sample stores.</p><button className={styles.secondary} onClick={() => { const next = { ...applied, radius: "" }; setSearch(next); apply(next); }}>Clear radius</button></div> : results.map((store, index) => <StoreCard key={store.id} store={store} index={index} selected={store.id === selectedId} select={showOnMap} hover={setHoveredId} />)}
            {applied ? <p className={styles.sampleFootnote}>Sample stores cannot be used for real shopping directions.</p> : null}
          </div>
          <Sources />
        </aside>
      </section>
      <footer className={styles.footer}><span>RePlate · A neighborhood discovery draft.</span><a href="https://www.fns.usda.gov/snap/retailer-locator" target="_blank" rel="noopener noreferrer">Find verified information with USDA ↗</a></footer>
    </main>
  </div></MotionConfig></LazyMotion>;
}
