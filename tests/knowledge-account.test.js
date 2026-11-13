import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readKnowledgeAccount } from "../server/lib/knowledge-account.js";

const account = readKnowledgeAccount();
assert.equal(account.personas.length, 3);
for (const persona of account.personas) {
  assert.equal(persona.learned + persona.remaining, persona.total, persona.id);
  assert.equal(persona.gained, persona.learned, persona.id);
}
const beast = account.personas.find((p) => p.id === "beast");
const mira = account.personas.find((p) => p.id === "mira");
const helper = account.personas.find((p) => p.id === "helper");
assert.equal(beast.site, "cosmos");
assert.equal(mira.site, "semicolon");
assert.equal(helper.site, "semicolon");
assert.equal(account.sites.length, 2);
assert.ok(beast.learned > 30);
assert.ok(beast.remaining > 0);
assert.ok(mira.learned > 15);
assert.ok(mira.remaining > 0);
assert.equal(mira.alsoKnownAs, "Ada");
assert.equal(helper.defaultName, "Henwin");
assert.equal(helper.learned, 0);
assert.equal(helper.remaining, helper.lessons.length);
assert.ok(helper.lessons.includes("semicolon-story"));
assert.equal(account.totalGained, beast.gained + mira.gained + helper.gained);

const page = readFileSync("knowledge.html", "utf8");
assert.equal((page.match(/class="lesson-code"/g) || []).length, 9);
assert.match(page, /id="semicolon-story"/);
assert.match(page, /data-knowledge-account/);
assert.match(readFileSync("ada.html", "utf8"), /data-knowledge-account="semicolon"/);
assert.match(readFileSync("account.html", "utf8"), /data-knowledge-account="cosmos"/);
assert.match(readFileSync(".semicolon-patch/semicolon-site/pages/ada.html", "utf8"), /data-knowledge-account="semicolon"/);
assert.match(readFileSync(".semicolon-patch/semicolon-site/pages/account.html", "utf8"), /data-knowledge-account="semicolon"/);
assert.doesNotMatch(readFileSync(".semicolon-patch/semicolon-site/pages/account.html", "utf8"), /data-knowledge-account="cosmos"/);

console.log("Knowledge account tests passed", {
  beast: beast.learned + "/" + beast.total,
  mira: mira.learned + "/" + mira.total,
  helper: helper.remaining,
});
