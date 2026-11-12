import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const check = spawnSync("node", ["tools/collect-training-data.js", "--check"], { encoding: "utf8" });
assert.equal(check.status, 0, check.stderr + check.stdout);

const beast = readFileSync("training/beast.jsonl", "utf8").trim().split("\n").map(JSON.parse);
const ada = readFileSync("training/ada.jsonl", "utf8").trim().split("\n").map(JSON.parse);
const summary = JSON.parse(readFileSync("training/summary.json", "utf8"));

assert.equal(summary.planets, 8);
assert.equal(summary.constellations, 16);
assert.ok(beast.length >= 40);
assert.ok(ada.length >= 40);
assert.equal(beast.length, summary.beast_examples);
assert.equal(ada.length, summary.ada_examples);

const planetNames = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
for (const name of planetNames) {
  assert.ok(beast.some((r) => r.user.includes(name) && r.assistant.includes(name)), "missing " + name);
}
assert.ok(beast.some((r) => r.assistant.includes("465")));
assert.ok(beast.some((r) => /belt/i.test(r.assistant)));
assert.ok(beast.some((r) => r.page === "quiz" && /option letter/i.test(r.assistant)));
assert.ok(beast.some((r) => /not Ada/i.test(r.assistant) || /Ada's job/i.test(r.assistant)));

assert.ok(ada.some((r) => /I'm Ada/i.test(r.assistant)));
assert.ok(ada.some((r) => /labelled box/i.test(r.assistant)));
assert.ok(ada.every((r) => !r.assistant.includes('"\n        "')));
assert.ok(ada.some((r) => /Cosmos/i.test(r.assistant)));

const beastFile = readFileSync("Modelfile.beast", "utf8");
const adaFile = readFileSync(".semicolon-patch/Modelfile.ada", "utf8");
assert.match(beastFile, /MESSAGE user/);
assert.match(beastFile, /cosmos\.punah\.pro/);
assert.match(adaFile, /semicolon\.punah\.pro/);
assert.match(adaFile, /MESSAGE assistant/);

console.log("Training corpus tests passed", { beast: beast.length, ada: ada.length });
