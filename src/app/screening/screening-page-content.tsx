"use client";

import { LanguageSelector, useLocale } from "../../lib/i18n/client";
import Link from "next/link";
import brand from "../site.module.css";
import info from "../info.module.css";
import ScreeningJourney from "./screening-journey";
import styles from "./screening.module.css";

export default function ScreeningPageContent() {
  const { t } = useLocale();
  return <div className={`${brand.site} ${styles.page}`}>
    <a className={info.skipLink} href="#screening-content">{t("Skip to content")}</a>
    <header className={info.header}>
      <Link className={brand.brand} href="/" aria-label={t("Hiraku home")}>
        <span className={brand.brandMark} aria-hidden="true" />{t("Hiraku")}<span className={brand.brandPeriod}>.</span>
      </Link>
      <nav className={brand.navigation} aria-label={t("Main navigation")}>
        <Link href="/">{t("Info")}</Link><Link href="/explore">{t("Explore")}</Link><Link href="/screening" aria-current="page">{t("Screening")}</Link>
      </nav><LanguageSelector />
    </header>
    <main id="screening-content" className={styles.main}>
      <ScreeningJourney />
    </main>
  </div>;
}
