"use client";

// PROTOTYPE: fictional retailers/distances, in-memory state, no API or audit claims.
// Question: does a staged card journey or an inline comparison sheet feel clearer?
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./prototype.module.css";

type Search = { zip: string; mode: "walking" | "bus"; radius: string };
type Store = { id: string; name: string; address: string; miles: number };
type Errors = { zip?: string; radius?: string };
type Status = "search" | "results" | "unavailable";

const sampleSearch: Search = { zip: "11206", mode: "bus", radius: "1" };
const stores: Store[] = [
  { id: "sample-01", name: "Broadway Community Market", address: "760 Broadway, Brooklyn, NY 11206", miles: 0.24 },
  { id: "sample-02", name: "Union Avenue Grocers", address: "310 Union Avenue, Brooklyn, NY 11211", miles: 0.58 },
  { id: "sample-03", name: "Flushing Fresh Market", address: "695 Flushing Avenue, Brooklyn, NY 11206", miles: 0.92 },
  { id: "sample-04", name: "Graham Avenue Food Center", address: "150 Graham Avenue, Brooklyn, NY 11206", miles: 1.46 },
];

function validate(search: Search): Errors {
  const errors: Errors = {};
  if (!/^\d{5}$/.test(search.zip)) errors.zip = "Enter a 5-digit ZIP code.";
  else if (search.zip !== "11206") errors.zip = "This ZIP is not in the draft’s sample lookup. Try 11206. This does not mean it is outside NYC.";
  if (search.radius !== "" && (!Number.isFinite(Number(search.radius)) || Number(search.radius) <= 0 || Number(search.radius) > 25)) {
    errors.radius = "Enter a straight-line radius greater than 0 and up to 25 miles, or leave it blank.";
  }
  return errors;
}

function Directions({ store, mode }: { store: Store; mode: Search["mode"] }) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", store.address);
  url.searchParams.set("travelmode", mode === "walking" ? "walking" : "transit");
  return <a className={styles.primary} href={url.toString()} target="_blank" rel="noopener noreferrer">Get directions <span aria-hidden="true">↗</span><span className={styles.srOnly}> to the sample address for {store.name}; opens Google Maps in a new tab</span></a>;
}

function SearchForm({ search, errors, compact, update, submit, validateField }: {
  search: Search; errors: Errors; compact?: boolean;
  update: (next: Search) => void; submit: (event: FormEvent<HTMLFormElement>) => void;
  validateField: (field: keyof Errors) => void;
}) {
  return (
    <form className={compact ? styles.inlineForm : styles.form} onSubmit={submit} noValidate>
      <div className={styles.field}>
        <label htmlFor="zip">Enter your NYC ZIP code</label>
        <input id="zip" name="zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={search.zip}
          aria-invalid={Boolean(errors.zip)} aria-describedby={errors.zip ? "zip-help zip-error" : "zip-help"}
          onChange={(event) => update({ ...search, zip: event.target.value })}
          onBlur={() => validateField("zip")} />
        <p id="zip-help" className={styles.help}>No home address needed. Use 11206 for this draft.</p>
        {errors.zip ? <p id="zip-error" className={styles.error} role="alert">{errors.zip}</p> : null}
      </div>
      <fieldset className={styles.modeField}>
        <legend>How would you like to travel?</legend>
        <div className={styles.modeOptions}>
          {(["walking", "bus"] as const).map((mode) => (
            <label className={`${styles.modeOption} ${search.mode === mode ? styles.selected : ""}`} key={mode}>
              <input type="radio" name="mode" value={mode} checked={search.mode === mode} onChange={() => update({ ...search, mode })} />
              <span><strong>{mode === "walking" ? "Walking" : "Bus"}</strong>{!compact ? <small>{mode === "walking" ? "$0 fare" : "General fare example"}</small> : null}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={styles.field}>
        <label htmlFor="radius">Straight-line radius <span className={styles.optional}>(optional)</span></label>
        <div className={styles.inputUnit}><input id="radius" name="radius" type="number" min="0.01" max="25" step="any" value={search.radius} placeholder="No limit"
          aria-invalid={Boolean(errors.radius)} aria-describedby={errors.radius ? "radius-help radius-error" : "radius-help"}
          onChange={(event) => update({ ...search, radius: event.target.value })}
          onBlur={() => validateField("radius")} /><span>miles</span></div>
        <p id="radius-help" className={styles.help}>An approximate area, not the distance of a walking or bus route.</p>
        {errors.radius ? <p id="radius-error" className={styles.error} role="alert">{errors.radius}</p> : null}
      </div>
      <button className={styles.primary} type="submit">Find stores <span aria-hidden="true">→</span></button>
    </form>
  );
}

function FareContext({ mode }: { mode: Search["mode"] }) {
  return (
    <aside className={styles.fare} aria-label="Travel fare context">
      <div className={styles.fareTop}><strong>{mode === "walking" ? "$0 walking fare" : "$3 local-bus fare example"}</strong><span className={styles.tag}>{mode === "walking" ? "Walking selected" : "General example"}</span></div>
      <p>{mode === "walking" ? "The walking route and travel time are not verified." : "This is a general fare example, not the cost to reach a store. A bus route, service type, transfers, and return journey are not verified."}</p>
      {mode === "bus" ? <a href="https://www.mta.info/fares-tolls/subway-bus" target="_blank" rel="noopener noreferrer">MTA fare source <span aria-hidden="true">↗</span></a> : null}
    </aside>
  );
}

function Evidence() {
  return <div className={styles.evidence}><strong>SNAP authorization not verified.</strong> These are fictional stores. <a href="https://www.fns.usda.gov/snap/retailer-locator" target="_blank" rel="noopener noreferrer">Use the official USDA retailer locator <span aria-hidden="true">↗</span></a> to check real stores.</div>;
}

function Assumptions() {
  return (
    <details className={styles.assumptions}>
      <summary>How we estimate this</summary>
      <p>This draft uses four fictional retailer names, sample addresses, and fixed illustrative distances. It does not use the repository’s retailer snapshot or a reviewed ZIP lookup.</p>
      <p>The intended live list uses approximate straight-line distance from a ZIP Code Tabulation Area (ZCTA) internal point, then retailer ID to break ties. A ZCTA approximates a ZIP area; it is not your exact starting location.</p>
      <p>Up to 20 candidates will be shown; the list is not exhaustive. A radius limits straight-line proximity only. Changing travel mode changes fare context, never store order.</p>
      <p>The <a href="https://www.mta.info/fares-tolls/subway-bus" target="_blank" rel="noopener noreferrer">MTA local-bus example</a> was checked October 9, 2026. Reduced fares, transfers, caps, and service type can affect your charge. Your trip fare is unknown.</p>
      <p>Directions open Google Maps with the sample destination and selected mode. No ZIP or exact home address is sent by this draft. Maps checks the route; opening a link does not verify a route here. If the link fails, use the written address.</p>
    </details>
  );
}

function EmptyResults({ edit }: { edit: () => void }) {
  return <div className={styles.empty} role="status"><h2>No sample stores in this radius</h2><p>Try a larger straight-line radius or leave it blank to see all four sample stores.</p><button className={styles.secondary} onClick={edit}>Edit search</button></div>;
}

export function VariantA({ search, errors, status, results, update, submit, edit, validateField }: VariantProps) {
  if (status === "search") return (
    <>
      <div className={styles.intro}><p className={styles.eyebrow}>1. Your search</p><h1>Find stores near your ZIP</h1><p>A starting point for your next grocery trip. Compare nearby places, then check directions.</p></div>
      <div className={styles.searchCard}><SearchForm search={search} errors={errors} update={update} submit={submit} validateField={validateField} /></div>
      <p className={styles.quiet}>No account or proof of SNAP enrollment needed.</p>
    </>
  );
  return (
    <>
      <div className={styles.intro}><p className={styles.eyebrow}>2. Compare stores</p><h1>Stores near your starting ZIP</h1><p>Closer by straight line. You decide what works for your trip.</p></div>
      <div className={styles.searchSummary}><div><strong>ZIP {search.zip} · {search.mode === "bus" ? "Bus" : "Walking"}</strong><p>{search.radius ? `${search.radius}-mile straight-line radius` : "No straight-line radius limit"}</p></div><button className={styles.secondary} onClick={edit}>Edit search</button></div>
      <FareContext mode={search.mode} />
      <Evidence />
      <p className={styles.resultCount} role="status">{results.length} sample stores · ordered by straight-line distance</p>
      {results.length === 0 ? <EmptyResults edit={edit} /> : <div className={styles.cards}>{results.map((store, index) => (
        <article className={styles.storeCard} key={store.id}>
          <div className={styles.storeTitle}><span className={styles.rank}>{index + 1}</span><h2>{store.name}</h2></div>
          <p className={styles.address}>{store.address}</p>
          <dl className={styles.cardFacts}>
            <div><dt>Approx. straight-line distance</dt><dd className={styles.distance}>{store.miles.toFixed(2)} <span>miles</span></dd></div>
            <div><dt>Travel fare</dt><dd>{search.mode === "walking" ? "$0 walking fare" : "Trip fare unknown"}</dd></div>
            <div><dt>Travel time</dt><dd>Unavailable · route not verified</dd></div>
            <div><dt>Grocery prices and stock</dt><dd>Unknown</dd></div>
          </dl>
          <Directions store={store} mode={search.mode} />
          <p className={styles.help}>Opens Google Maps to check a route to the sample address.</p>
        </article>
      ))}</div>}
      <Assumptions />
    </>
  );
}

type VariantProps = {
  search: Search; errors: Errors; status: Status; results: Store[];
  update: (next: Search) => void; submit: (event: FormEvent<HTMLFormElement>) => void; edit: () => void;
  validateField: (field: keyof Errors) => void;
};

export function VariantB({ search, errors, status, results, update, submit, edit, validateField }: VariantProps) {
  return (
    <>
      <div className={styles.intro}><p className={styles.eyebrow}>Your grocery trip</p><h1>Compare nearby stores</h1><p>Keep your search and your options together.</p></div>
      <section className={styles.inlineSearch} aria-label="Your search"><SearchForm compact search={search} errors={errors} update={update} submit={submit} validateField={validateField} /></section>
      {status === "search" ? <div className={styles.empty}><h2>Your options will appear here</h2><p>Find stores to compare approximate proximity. Grocery prices, stock, and route times will remain unknown.</p></div> : <>
        <div className={styles.sheetHeading}><h2>{results.length} sample stores near {search.zip}</h2><p role="status">Ordered by straight-line distance · {search.radius ? `${search.radius}-mile radius` : "no radius limit"}</p></div>
        <FareContext mode={search.mode} />
        <div className={styles.sharedFacts}><p><strong>For every store:</strong> Travel time unavailable. Route not verified. Grocery prices and stock unknown.{search.mode === "bus" ? " Trip fare unknown." : " Walking fare $0."}</p></div>
        <Evidence />
        {results.length === 0 ? <EmptyResults edit={edit} /> : <div className={styles.comparisonSheet}>{results.map((store, index) => (
          <article key={store.id} className={styles.storeRow}>
            <div className={styles.rowDistance}><span className={styles.rowOrder}>Store {index + 1}</span><strong>{store.miles.toFixed(2)} <span>mi</span></strong><span>Approx. straight line</span></div>
            <div className={styles.rowStore}><h3>{store.name}</h3><p>{store.address}</p><Directions store={store} mode={search.mode} /></div>
          </article>
        ))}</div>}
        <p className={styles.help}>Directions open Google Maps to check routes to sample addresses.</p>
        <Assumptions />
      </>}
    </>
  );
}

function PrototypeSwitcher({ variant, status, switchVariant, start, showResults }: {
  variant: "A" | "B"; status: Status; switchVariant: () => void; start: () => void; showResults: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, button, a, summary, [contenteditable]")) return;
      event.preventDefault();
      switchVariant();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [switchVariant]);

  if (process.env.NODE_ENV === "production") return null;
  return <nav className={styles.switcher} aria-label="UI draft comparison">
    <div className={styles.variantControls}>
      <button onClick={switchVariant} aria-label="Previous layout">←</button>
      <div aria-live="polite"><small>Throwaway UI draft · {variant === "A" ? "1" : "2"} of 2</small><strong>{variant === "A" ? "A · Step-by-step cards" : "B · Inline comparison"}</strong></div>
      <button onClick={switchVariant} aria-label="Next layout">→</button>
    </div>
    <div className={styles.screenControls}><button onClick={start} aria-pressed={status === "search"}>Search screen</button><button onClick={showResults} aria-pressed={status === "results"}>Sample results</button></div>
  </nav>;
}

export default function PrototypeJourney() {
  const router = useRouter();
  const params = useSearchParams();
  const variant = params.get("variant") === "B" ? "B" : "A";
  const [search, setSearch] = useState<Search>(sampleSearch);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("results");
  const headingRef = useRef<HTMLDivElement>(null);
  const results = stores.filter((store) => search.radius === "" || store.miles <= Number(search.radius)).sort((a, b) => a.miles - b.miles || a.id.localeCompare(b.id));

  function update(next: Search) {
    setSearch(next);
    setErrors({});
    setStatus("search");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(search);
    setErrors(nextErrors);
    if (nextErrors.zip || nextErrors.radius) {
      document.getElementById(nextErrors.zip ? "zip" : "radius")?.focus();
      return;
    }
    setStatus("results");
    if (variant === "A") headingRef.current?.focus();
  }

  function validateField(field: keyof Errors) {
    setErrors((previous) => ({ ...previous, [field]: validate(search)[field] }));
  }

  function retry() {
    const nextErrors = validate(search);
    setErrors(nextErrors);
    setStatus(nextErrors.zip || nextErrors.radius ? "search" : "results");
  }

  function edit() {
    setStatus("search");
    requestAnimationFrame(() => document.getElementById("zip")?.focus());
  }

  function reset() {
    setSearch({ zip: "", mode: "walking", radius: "" });
    setErrors({});
    edit();
  }

  function showResults() {
    setSearch(sampleSearch);
    setErrors({});
    setStatus("results");
  }

  function switchVariant() {
    const next = new URLSearchParams(params.toString());
    next.set("variant", variant === "A" ? "B" : "A");
    router.replace(`/prototype?${next.toString()}`, { scroll: false });
  }

  const props: VariantProps = { search, errors, status, results, update, submit, edit, validateField };
  return <div className={styles.prototype}>
    <div className={styles.draftNotice}>UI draft · Fictional stores and illustrative distances · No live search</div>
    <header className={styles.header}><span className={styles.brand}><span className={styles.brandMark} aria-hidden="true" />RePlate</span><span className={styles.headerCaption}>SNAP shopping · NYC</span><button className={styles.textButton} onClick={reset}>Reset</button></header>
    <main className={styles.shell}>
      <div className={styles.focusTarget} ref={headingRef} tabIndex={-1}>
        {status === "unavailable" ? <div className={styles.empty} role="alert"><h1>Store data is unavailable</h1><p>This is a simulated data failure. Your search is kept so you can try again.</p><button className={styles.primary} onClick={retry}>Try again</button></div> : variant === "A" ? <VariantA {...props} /> : <VariantB {...props} />}
      </div>
      <details className={styles.draftState}>
        <summary>Draft notes and current state</summary>
        <p><strong>{variant === "A" ? "A: separate search and results; full store cards." : "B: inline search; shared limitations and compact comparison rows."}</strong> A follows DESIGN.md more closely. B explores a different presentation for this disposable draft; it is not an approved change to the design system.</p>
        <p>Both preserve the same inputs and sample state when switching layouts. Search screen starts the journey; Sample results restores the default bus example. Try radius 0.1 for no results, blank radius for all four, or ZIP 99999 for unsupported input.</p>
        <button className={styles.secondary} onClick={() => setStatus("unavailable")}>Preview data unavailable</button>
        <pre>{JSON.stringify({ variant, status, inputs: search, errors, resultIds: status === "results" ? results.map((store) => store.id) : [], sampleStores: status === "results" ? results : [], fareContext: search.mode === "walking" ? "$0 walking fare" : "$3 generic local-bus example; trip fare unknown", authorization: "unverified", routeTime: "unavailable", groceryPrices: "unknown", inventory: "unknown", source: "fictional local fixtures" }, null, 2)}</pre>
      </details>
      <footer className={styles.footer}>Choose a layout before implementing the live P0 journey.</footer>
    </main>
    <PrototypeSwitcher variant={variant} status={status} switchVariant={switchVariant} start={edit} showResults={showResults} />
  </div>;
}
