"use client";

import Link from "next/link";
import { LanguageSelector, useLocale } from "../lib/i18n/client";
import brand from "./site.module.css";
import styles from "./info.module.css";
import GuidanceJourney from "./guidance/guidance-journey";

const hra = "https://a069-access.nyc.gov/accesshra/";
const workRules = "https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page";
const workGuide = "https://www.nyc.gov/main/services/snap-benefits/abawd";
const snapGuide = "https://www.nyc.gov/main/services/snap-benefits";
const resetSource = "https://home4.nyc.gov/site/hra/partners/community-updates.page";

export default function InfoContent() {
  const { t } = useLocale();
  return <div className={`${brand.site} ${styles.page}`}>
    <a className={styles.skipLink} href="#snap-content">{t("Skip to content")}</a>
    <header className={styles.header}>
      <Link className={brand.brand} href="/" aria-label={t("Hiraku home")}>
        <span className={brand.brandMark} aria-hidden="true" />{t("Hiraku")}<span className={brand.brandPeriod}>.</span>
      </Link>
      <nav className={brand.navigation} aria-label={t("Main navigation")}><Link href="/" aria-current="page">{t("Info")}</Link><Link href="/explore">{t("Explore")}</Link></nav>
      <LanguageSelector /><a className={styles.headerHelp} href="#help">{t("Get help ")}<span aria-hidden="true">↗</span></a>
    </header>
    <main id="snap-content" className={styles.main}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("NYC SNAP · October 2026")}</p>
          <h1 id="hero-title">{t("The clock reset.")}<br />{t("Know your next step.")}</h1>
          <p className={styles.lead}>{t("Lost SNAP because of work rules? The October 1 reset may give you a way back.")}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primary} href="/screening">{t("Find your next step ")}<span aria-hidden="true">→</span></Link>
            <a className={styles.primary} href="#shosai">{t("Talk to Shosai ")}<span aria-hidden="true">↓</span></a>
            <a href={workRules}>{t("Read HRA’s reset guidance ")}<span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <figure className={styles.resetGraphic} aria-labelledby="reset-caption">
          <div className={styles.graphicHeading}><span>{t("New period. Fresh allowance.")}</span><span aria-hidden="true">↺</span></div>
          <div className={styles.clock} aria-hidden="true"><span className={styles.clockNumber}>3</span><span>{t("countable months")}</span><i /></div>
          <figcaption id="reset-caption">{t("Up to ")}<strong>{t("3 countable months")}</strong> {t("without meeting work rules, if you’re otherwise eligible and subject to them.")}</figcaption>
          <div className={styles.period}><span>{t("Oct 1, 2026")}</span><span aria-hidden="true">→</span><span>{t("Sep 30, 2029")}</span></div>
        </figure>
      </section>

      <GuidanceJourney />
      <section className={styles.explainer} aria-labelledby="reset-title">
        <div className={styles.sectionHeading}><h2 id="reset-title">{t("What reset. What didn’t.")}</h2><p>{t("The allowance restarted. The work rules still apply.")}</p></div>
        <ol className={styles.timeline}>
          <li><span className={styles.stepNumber} aria-hidden="true">1</span><div><h3>{t("The old count cleared")}</h3><p>{t("Previous countable months for not meeting ABAWD work rules no longer count in the new fixed three-year period.")}</p></div></li>
          <li><span className={styles.stepNumber} aria-hidden="true">2</span><div><h3>{t("You can take action now")}</h3><p>{t("If work rules stopped your benefits, reapply or request to be added back to your household’s case. HRA must still determine eligibility.")}</p></div></li>
          <li><span className={styles.stepNumber} aria-hidden="true">3</span><div><h3>{t("Use the time to keep benefits")}</h3><p>{t("Ask about an exemption or how to document approved activities. After three countable months, benefits can stop or be reduced again.")}</p></div></li>
        </ol>
        <p className={styles.sourceLine}>{t("Based on ")}<a href={resetSource}>{t("HRA’s October 1 reset update ↗")}</a>{t(". Countable months are not necessarily consecutive. This is not a personal countdown or a guarantee of benefits.")}</p>
      </section>

      <aside className={styles.impact} aria-label={t("NYC impact")}>
        <strong>26,500</strong><div><p>{t("New Yorkers lost SNAP under expanded work requirements, according to the City.")}</p><a href="https://www.nyc.gov/zh-ch/mayors-office/news/2026/10/mayor-mamdani-launches-citywide-push-to-get-snap-benefits-back-t">{t("Read the October 1 outreach announcement ↗")}</a></div>
      </aside>

      <section id="next-step" className={styles.nextSteps} aria-labelledby="next-title">
        <div className={styles.sectionHeading}><h2 id="next-title">{t("Start with your situation.")}</h2><p>{t("Already applied or receiving SNAP? These links take you to official services for your case.")}</p></div>
        <div className={styles.pathList}>
          <article className={styles.path}><div><h3>{t("My benefits stopped because of work rules")}</h3><p>{t("Whole case closed? Reapply. Household still receives SNAP? Request a case change to add the removed member back.")}</p></div><a className={styles.primary} href={hra}>{t("Open ACCESS HRA ")}<span aria-hidden="true">↗</span></a></article>
          <article className={styles.path}><div><h3>{t("I don’t know why my benefits changed")}</h3><p>{t("Check your notice and case information first. A missing payment does not necessarily mean you need to reapply.")}</p></div><a className={styles.textAction} href={snapGuide}>{t("Find status and help guidance ")}<span aria-hidden="true">↗</span></a></article>
          <article className={styles.path}><div><h3>{t("I received a recertification notice")}</h3><p>{t("Follow the recertification instructions and deadline on your notice. Recertification is a different process from reapplying.")}</p></div><a className={styles.textAction} href={snapGuide}>{t("Read recertification guidance ")}<span aria-hidden="true">↗</span></a></article>
        </div>
      </section>

      <section className={styles.keepBenefits} aria-labelledby="keep-title">
        <div><span className={styles.ruleLabel}>{t("Beyond the reset")}</span><h2 id="keep-title">{t("Reapplying buys time.")}<br />{t("Plan for what comes next.")}</h2><p>{t("People subject to ABAWD rules generally need 80 hours a month of work or qualifying activities, unless exempt. Approved community-service hours follow a different calculation.")}</p></div>
        <div className={styles.tools}><h3>{t("Let the official tools help.")}</h3><p>{t("The city’s guide includes an exemption checker, volunteer-hours calculator, reporting instructions, and forms. HRA must document an exemption.")}</p><a className={styles.primary} href={workGuide}>{t("Explore work-rule tools ")}<span aria-hidden="true">↗</span></a><p className={styles.small}>{t("ABAWD is the official name for these work rules. Hiraku does not determine your eligibility or case status.")}</p></div>
      </section>

      <section id="help" className={styles.help} aria-labelledby="help-title">
        <div><h2 id="help-title">{t("You can ask for help.")}</h2><p>{t("Unsure which step applies? Talk to HRA before guessing.")}</p><a className={styles.phone} href="tel:+17187627669">{t("718-SNAP-NOW ")}<span>(718-762-7669)</span></a><p className={styles.small}>{t("For questions about work rules and possible exemptions.")}</p></div>
        <div className={styles.helpLinks}><a href={workRules}>{t("HRA work-rule assistance & forms ↗")}</a><a href="https://www.nyc.gov/site/mayorspeu/resources/oh-snap-new-work-requirements.page">{t("Official guides in other languages ↗")}</a><a href={snapGuide}>{t("Find immediate food help & SNAP support ↗")}</a></div>
      </section>
      <section className={styles.explore} aria-labelledby="explore-title"><h2 id="explore-title">{t("Explore grocery options.")}</h2><p>{t("Browse the grocery map and ZIP search. It currently uses clearly labeled sample stores.")}</p><Link className={styles.textAction} href="/explore">{t("Explore nearby groceries ")}<span aria-hidden="true">→</span></Link></section>
      <footer className={styles.footer}><p><strong>{t("Hiraku.")}</strong>{t("Clear information. Official next steps.")}</p><p>{t("Sources reviewed ")}<time dateTime="2026-10-10">{t("October 10, 2026")}</time>.<br />{t("Independent information. Not an HRA service or an eligibility decision.")}</p></footer>
    </main>
  </div>;
}
