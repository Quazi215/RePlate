"use client";

// PROTOTYPE: fictional retailers/distances, in-memory state, no API or audit claims.
import { useState, type FormEvent } from "react";
import styles from "./prototype.module.css";

type Search = { zip: string; mode: "walking" | "bus"; radius: string };
type Store = { id: string; name: string; address: string; miles: number };
type Errors = { zip?: string; radius?: string };
type Status = "search" | "results";

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

function SearchForm({ search, errors, update, submit, validateField }: {
  search: Search; errors: Errors;
  update: (next: Search) => void; submit: (event: FormEvent<HTMLFormElement>) => void;
  validateField: (field: keyof Errors) => void;
}) {
  return (
    <form className={styles.inlineForm} onSubmit={submit} noValidate>
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
              <span><strong>{mode === "walking" ? "Walking" : "Bus"}</strong></span>
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

type ComparisonProps = {
  search: Search; errors: Errors; status: Status; results: Store[];
  update: (next: Search) => void; submit: (event: FormEvent<HTMLFormElement>) => void; edit: () => void;
  validateField: (field: keyof Errors) => void;
};

function StoreComparison({ search, errors, status, results, update, submit, edit, validateField }: ComparisonProps) {
  return (
    <>
      <div className={styles.intro}><p className={styles.eyebrow}>Your grocery trip</p><h1>Compare nearby stores</h1><p>Keep your search and your options together.</p></div>
      <section className={styles.inlineSearch} aria-label="Your search"><SearchForm search={search} errors={errors} update={update} submit={submit} validateField={validateField} /></section>
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

export default function PrototypeJourney() {
  const [search, setSearch] = useState<Search>(sampleSearch);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("results");
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
  }

  function validateField(field: keyof Errors) {
    setErrors((previous) => ({ ...previous, [field]: validate(search)[field] }));
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

  const props: ComparisonProps = { search, errors, status, results, update, submit, edit, validateField };
  return <div className={styles.prototype}>
    <header className={styles.header}><span className={styles.brand}><span className={styles.brandMark} aria-hidden="true" />RePlate</span><span className={styles.headerCaption}>SNAP shopping · NYC</span><button className={styles.textButton} onClick={reset}>Reset</button></header>
    <main className={styles.shell}>
      <StoreComparison {...props} />
    </main>
  </div>;
}
