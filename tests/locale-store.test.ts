import assert from "node:assert/strict";
import { test } from "node:test";
import { readLocale, setLocale, subscribeLocale } from "../src/lib/i18n/locale-store";

test("locale preferences load without overwriting storage, update subscribers, and survive blocked storage", context => {
  const browser = new EventTarget();
  let saved: string | null = "es";
  let blocked = false;
  let writes = 0;
  const storage = {
    getItem: () => { if (blocked) throw new Error("Storage blocked"); return saved; },
    setItem: (_key: string, value: string) => {
      if (blocked) throw new Error("Storage blocked");
      writes++; saved = value;
    },
  };
  for (const [name, value] of Object.entries({ window: browser, localStorage: storage })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    context.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  let notifications = 0;
  const unsubscribe = subscribeLocale(() => { notifications++; });
  const storageChanged = (key: string | null) => browser.dispatchEvent(Object.assign(new Event("storage"), { key }));
  try {
    assert.equal(readLocale(), "es");
    assert.equal(writes, 0);
    setLocale("ar");
    assert.equal(readLocale(), "ar"); assert.equal(saved, "ar"); assert.equal(notifications, 1);
    saved = "fr"; storageChanged("hiraku-locale");
    assert.equal(readLocale(), "fr"); assert.equal(notifications, 2);
    storageChanged("unrelated"); assert.equal(notifications, 2);
    saved = "invalid"; storageChanged("hiraku-locale"); assert.equal(readLocale(), "en");
    saved = null; storageChanged(null); assert.equal(readLocale(), "en");
    blocked = true;
    assert.equal(readLocale(), "en");
    setLocale("ur"); assert.equal(readLocale(), "ur");
    const count = notifications;
    unsubscribe(); setLocale("pl"); assert.equal(notifications, count);
  } finally {
    unsubscribe();
  }
});
