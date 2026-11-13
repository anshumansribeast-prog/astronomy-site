/* Knowledge account — learned vs still-to-learn for each persona.
   Numbers come from the training corpus the collect script writes.
   The helper row starts at zero learned; the browser adds explanations
   the visitor has actually asked for. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "training", "knowledge-account.json");

export function readKnowledgeAccount() {
  const account = JSON.parse(readFileSync(file, "utf8"));
  for (const persona of account.personas) {
    if (persona.learned + persona.remaining !== persona.total) {
      throw new Error(persona.id + " learned + remaining must equal total");
    }
  }
  return account;
}
