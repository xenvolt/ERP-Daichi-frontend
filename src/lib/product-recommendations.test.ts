import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { suggestProducts } from "./product-recommendations";

const products = [
  { id: "1", name: "Indicafert [NPK 19:19:19]", productCode: "DI-1" },
  { id: "1b", name: "Indicafert [NPK 19:19:19]", productCode: "DI-1-5KG" },
  { id: "2", name: "Calcium Nitrate [CaNO3]", productCode: "DI-2" },
  { id: "3", name: "Indicafert Boron 20% [DOT]", productCode: "DI-3" },
  { id: "4", name: "Indicafert ZN 12% [EDTA]", productCode: "DI-4" },
  { id: "5", name: "Indicafert [NPK 00:00:50]", productCode: "DI-5" },
  { id: "6", name: "Magnesium Sulphate [MgSO4 9.6%]", productCode: "DI-6" },
];

describe("product suggestions", () => {
  it("maps fruit cracking to calcium products", () => {
    const s = suggestProducts({ issueType: "NUTRITIONAL", symptomsObserved: "Tomato fruit cracking" }, products);
    assert.equal(s[0].productId, "2");
  });

  it("suggests boron for flower drop and keeps one SKU per product", () => {
    const s = suggestProducts({ issueDescription: "heavy flower drop, yellow leaves" }, products);
    const ids = s.map((x) => x.productId);
    assert.ok(ids.includes("3"));
    assert.ok(ids.includes("1"));
    assert.ok(!ids.includes("1b"));
    assert.ok(ids.indexOf("3") < ids.indexOf("1"), "specific need before nitrogen catch-all");
  });

  it("falls back to balanced nutrition for a nutritional issue with no text", () => {
    const s = suggestProducts({ issueType: "NUTRITIONAL" }, products);
    assert.deepEqual(s.map((x) => x.productId), ["1", "6"]);
  });

  it("returns nothing for pest issues without nutrient symptoms", () => {
    assert.equal(suggestProducts({ issueType: "PEST_DISEASE", issueDescription: "aphids" }, products).length, 0);
  });

  it("includes crop in the reason", () => {
    const s = suggestProducts({ symptomsObserved: "small fruit size", cropType: "Grapes" }, products);
    assert.match(s[0].reason, /Grapes/);
  });
});
