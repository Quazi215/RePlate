import type { Metadata } from "next";
import Link from "next/link";
import brand from "../site.module.css";
import info from "../info.module.css";
import ScreeningJourney from "./screening-journey";
import styles from "./screening.module.css";

export const metadata: Metadata = {
  title: "Hiraku · SNAP screening",
  description: "Check a limited NYC SNAP income guideline, understand your result, and prepare your next step.",
};

export default function ScreeningPage() {
  return <div className={`${brand.site} ${styles.page}`}>
    <a className={info.skipLink} href="#screening-content">Skip to content</a>
    <header className={info.header}>
      <Link className={brand.brand} href="/" aria-label="Hiraku home">
        <span className={brand.brandMark} aria-hidden="true" />Hiraku<span className={brand.brandPeriod}>.</span>
      </Link>
      <nav className={brand.navigation} aria-label="Main navigation">
        <Link href="/">Info</Link><Link href="/explore">Explore</Link><Link href="/screening" aria-current="page">Screening</Link>
      </nav>
    </header>
    <main id="screening-content" className={styles.main}>
      <ScreeningJourney />
    </main>
  </div>;
}
