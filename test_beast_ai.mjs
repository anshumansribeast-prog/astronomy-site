import assert from "node:assert/strict";
import { shouldFallback } from "./server/lib/ai.js";

assert.equal(shouldFallback("Jupiter is the largest planet."), false);
assert.equal(shouldFallback("[OUT_OF_KNOWLEDGE] I cannot verify that."), true);
assert.equal(shouldFallback("I'm not sure enough to answer."), true);
assert.equal(shouldFallback(""), true);

console.log("Beast fallback gate: all assertions passed");
