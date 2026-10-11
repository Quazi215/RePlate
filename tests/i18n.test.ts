import assert from "node:assert/strict";
import { test } from "node:test";
import { direction, isLocale, locales, realtimeCodes, speechCodes } from "../src/lib/i18n/locale";
import { dictionaries, english, translate } from "../src/lib/i18n/translations";
import { localizeScreeningReason } from "../src/lib/i18n/screening";
import { screenSnap, type ScreeningAnswers } from "../src/lib/screening/snap-screening";
import { handleGuidanceRequest } from "../src/lib/guidance/request.server";
import { handleLiveGuidanceRequest } from "../src/lib/voice/live-request.server";

function guidance(body: unknown): Request {
  return new Request("http://localhost/api/guidance", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost" }, body: JSON.stringify(body),
  });
}

function answer() {
  return JSON.stringify({ answer: "HRA decides eligibility.", sourceIds: ["nyc-snap"] });
}

test("every supported locale has interface copy, a safe fallback, and correct direction", () => {
  assert.equal(locales.length, 11);
  assert.equal(isLocale("zh-Hant"), true);
  assert.equal(isLocale("zh"), false);
  assert.equal(direction("ar"), "rtl"); assert.equal(direction("ur"), "rtl");
  assert.equal(direction("en"), "ltr");
  for (const locale of locales) {
    for (const key of Object.keys(english) as (keyof typeof english)[]) {
      assert.ok(translate(locale, key).trim(), `${locale}: ${key}`);
      if (locale !== "en") assert.ok(dictionaries[locale][key], `missing ${locale}: ${key}`);
    }
  }
  assert.equal(translate("en", "Language"), "Language");
});

test("screening outcomes remain unchanged while the explanation changes language", () => {
  const answers: ScreeningAnswers = { allAssistance: "no", householdSize: "2", olderOrDisabled: "no",
    dependentCare: "no", earnedIncome: "yes", childSupportPaid: "no", monthlyIncome: "2500" };
  const result = screenSnap(answers);
  const spanish = result.reasons.map(reason => localizeScreeningReason("es", reason, answers));
  assert.equal(screenSnap(answers).outcome, result.outcome);
  assert.notDeepEqual(spanish, result.reasons);
  assert.match(spanish.join(" "), /\$2,500|2500/);
});

test("guidance propagates valid locale and blocks unsupported spoken output", async () => {
  let seen = "";
  const provider = async (_question: string, _signal: AbortSignal, _history?: unknown, locale?: string) => {
    seen = locale ?? ""; return answer();
  };
  const response = await handleGuidanceRequest(guidance({ question: "SNAP?", locale: "es" }), provider);
  assert.equal(response.status, 200); assert.equal(seen, "es");
  assert.equal((await handleGuidanceRequest(guidance({ question: "SNAP?", locale: "bad" }), provider)).status, 400);
  let speechCalls = 0;
  const unsupported = await handleGuidanceRequest(guidance({ question: "SNAP?", locale: "ht", spoken: true }), provider,
    async () => { speechCalls++; return new Response(); });
  const body = await unsupported.json();
  assert.equal(body.status, "ready"); assert.equal(body.audio, null);
  assert.equal(body.warning.code, "SPEECH_UNAVAILABLE"); assert.equal(speechCalls, 0);
  assert.equal(speechCodes.ht, undefined); assert.equal(realtimeCodes.ht, undefined);
  assert.equal(speechCodes["zh-Hant"], undefined);
});

test("live guidance passes locale to the service and blocks unsupported voice", async () => {
  const live = (locale: string) => new Request("http://localhost/api/voice/live", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost" },
    body: JSON.stringify({ question: "SNAP?", history: [], locale }),
  });
  let seen = "";
  const response = await handleLiveGuidanceRequest(live("pl"), async (_question, _signal, _history, locale) => {
    seen = locale ?? ""; return answer();
  }, async () => new Response(new Uint8Array([1]), { headers: { "Content-Type": "audio/mpeg" } }));
  assert.equal(response.status, 200); assert.equal(seen, "pl");
  assert.equal((await handleLiveGuidanceRequest(live("ur"))).status, 400);
  assert.equal((await handleLiveGuidanceRequest(live("invalid"))).status, 400);
});
