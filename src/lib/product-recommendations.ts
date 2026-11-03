/**
 * Rule-based product suggestions for Sales Promotion Activity.
 * Matches the issue type + free-text symptoms against nutrient-deficiency keywords
 * and maps each need to product-name patterns from the Indicafert master.
 */

export interface RecommendableProduct {
  id: string;
  name: string;
  productCode: string;
}

export interface ProductSuggestion {
  productId: string;
  name: string;
  productCode: string;
  reason: string;
}

type Rule = {
  need: string;
  keywords: RegExp;
  products: RegExp[];
};

const RULES: Rule[] = [
  {
    need: "Calcium — fruit cracking / blossom-end rot / tip burn",
    keywords: /crack|blossom[\s-]*end|tip[\s-]*burn|bitter[\s-]*pit|calcium|\bca\b|soft fruit|fruit rot/i,
    products: [/calcium nitrate/i, /caltica/i, /thio cal/i],
  },
  {
    need: "Boron — flower/fruit drop, poor fruit set",
    keywords: /flower(?:s)?\s*drop|fruit\s*drop|poor\s*(?:fruit\s*)?set|setting|hollow|deform|boron/i,
    products: [/boron/i, /calcium nitrate with boron/i],
  },
  {
    need: "Zinc — small leaves / rosetting",
    keywords: /small\s*leav|little\s*leaf|rosett|short\s*internode|zinc|\bzn\b/i,
    products: [/\bzn\b.*edta/i, /zincox/i],
  },
  {
    need: "Iron — yellowing of young leaves (interveinal chlorosis)",
    keywords: /young\s*leav\w*\s*(?:are\s*)?yellow|yellow\w*\s*(?:of\s*)?(?:new|young)\s*leav|new\s*leav\w*\s*yellow|chlorosis|iron|\bfe\b/i,
    products: [/\bfe\b.*edta/i],
  },
  {
    need: "Magnesium — yellowing between veins of older leaves",
    keywords: /interveinal|between\s*(?:the\s*)?veins|magnesium|\bmg\b/i,
    products: [/magnesium sulphate/i, /schoenite/i],
  },
  {
    need: "Sulphur — pale new growth, low oil / pungency",
    keywords: /sulph|sulfur|oil\s*content|pungen/i,
    products: [/sulfura/i, /bentosul/i, /thio potash/i],
  },
  {
    need: "Nitrogen — yellowing of older leaves, weak vegetative growth",
    keywords: /yellow|pale|stunt|slow\s*growth|poor\s*growth|weak\s*(?:plant|growth)|nitrogen|vegetative|\bgrowth\b/i,
    products: [/npk 19:19:19/i, /npk 20:20:20/i, /npk 30:10:10/i, /neurea/i],
  },
  {
    need: "Phosphorus — weak roots, purple leaves, flowering initiation",
    keywords: /root|purple|flower(?:ing)?\s*(?:initiation|start)|transplant|establish|phosph|tiller/i,
    products: [/npk 12:61:00/i, /npk 13:40:13/i, /npk 10:54:10/i, /lumina/i, /nitrophos/i],
  },
  {
    need: "Potassium — fruit size, colour, sweetness, leaf-edge scorch",
    keywords: /fruit\s*size|small\s*fruit|colou?r|shine|lust|sweet|sugar|brix|quality|maturity|ripen|edge\s*(?:burn|scorch)|scorch|potash|potassium|grain\s*fill|bulb/i,
    products: [/npk 00:00:50/i, /npk 13:00:45/i, /npk 00:52:34/i, /thio potash/i],
  },
];

/** Used when the issue is nutritional/general but nothing in the text matches a specific deficiency. */
const DEFAULT_BY_ISSUE: Record<string, Rule | undefined> = {
  NUTRITIONAL: {
    need: "Balanced nutrition — general deficiency",
    keywords: /.^/,
    products: [/npk 19:19:19/i, /magnesium sulphate/i],
  },
  GENERAL: {
    need: "Balanced nutrition for healthy growth",
    keywords: /.^/,
    products: [/npk 19:19:19/i, /npk 00:52:34/i],
  },
  TECHNICAL: {
    need: "Balanced nutrition for healthy growth",
    keywords: /.^/,
    products: [/npk 19:19:19/i],
  },
};

const MAX_SUGGESTIONS = 6;

export function suggestProducts(
  input: { issueType?: string; issueDescription?: string; symptomsObserved?: string; cropType?: string },
  products: RecommendableProduct[]
): ProductSuggestion[] {
  const text = [input.issueDescription, input.symptomsObserved].filter(Boolean).join(" ").trim();
  const matched = text ? RULES.filter((rule) => rule.keywords.test(text)) : [];
  // Specific deficiencies outrank the broad nitrogen "yellow / growth" catch-all.
  const specific = matched.filter((rule) => !rule.need.startsWith("Nitrogen"));
  const rules = specific.length ? [...specific, ...matched.filter((r) => r.need.startsWith("Nitrogen"))] : matched;
  if (!rules.length) {
    const fallback = DEFAULT_BY_ISSUE[input.issueType || ""];
    if (fallback) rules.push(fallback);
  }

  const seenNames = new Set<string>();
  const suggestions: ProductSuggestion[] = [];
  for (const rule of rules) {
    for (const pattern of rule.products) {
      // Each packing is its own SKU; suggest one SKU per product name.
      const product = products.find((p) => pattern.test(p.name) && !seenNames.has(p.name.toLowerCase()));
      if (!product) continue;
      seenNames.add(product.name.toLowerCase());
      const crop = input.cropType?.trim();
      suggestions.push({
        productId: product.id,
        name: product.name,
        productCode: product.productCode,
        reason: crop ? `${rule.need} (${crop})` : rule.need,
      });
      if (suggestions.length >= MAX_SUGGESTIONS) return suggestions;
    }
  }
  return suggestions;
}
