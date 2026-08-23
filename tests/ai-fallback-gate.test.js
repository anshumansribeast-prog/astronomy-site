import assert from "node:assert/strict";
import { shouldFallback } from "../server/lib/ai.js";
assert.equal(shouldFallback("[OUT_OF_KNOWLEDGE] I don't know."), true);
assert.equal(shouldFallback("I don't know enough to answer reliably."), true);
assert.equal(shouldFallback("Outside my knowledge."), true);
assert.equal(shouldFallback("Venus is the hottest planet in the Solar System."), false);
assert.equal(shouldFallback("Here is the orbital mechanics explanation."), false);
console.log("Beast fallback gate: all tests passed");
