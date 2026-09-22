import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const appRoot = new URL("../", import.meta.url);
const context = vm.createContext({ window: {} });
for (const filename of ["data.js", "tier-data.js"]) {
  const source = await readFile(new URL(`public/${filename}`, appRoot), "utf8");
  vm.runInContext(source, context, { filename });
}

const data = context.window.DEFAULT_GROCERY_DATA;
const products = data.products || [];
const idCounts = new Map();
const urlCounts = new Map();
const issues = [];

function issue(severity, id, message) {
  issues.push({ severity, id, message });
}

function exactUrl(product) {
  if (product.purchaseUrl) return product.purchaseUrl;
  const links = (product.sourceLinks || []).map((item) => item.url).filter(Boolean);
  return links.find((url) => /(?:aldi\.us\/.+(?:product|products|detail)\/|walmart\.com\/ip\/)/i.test(url)) || "";
}

function isExactUrl(url, store) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (store === "Walmart") return parsed.hostname === "www.walmart.com" && parsed.pathname.includes("/ip/");
    return ["www.aldi.us", "shop.aldi.us"].includes(parsed.hostname) && /\/(?:product|products|detail)\//.test(parsed.pathname);
  } catch {
    return false;
  }
}

for (const product of products) {
  idCounts.set(product.id, (idCounts.get(product.id) || 0) + 1);
  const url = exactUrl(product);
  if (!url) issue("error", product.id, "No exact retailer product URL.");
  else {
    urlCounts.set(url, [...(urlCounts.get(url) || []), product.id]);
    if (!isExactUrl(url, product.store)) issue("error", product.id, "Retailer URL is not an exact Aldi or Walmart product page.");
  }
  if (!Number.isFinite(Number(product.currentPrice)) || Number(product.currentPrice) <= 0) {
    issue("error", product.id, "Current price is missing or invalid.");
  }
  if (!/^[SAB]$/.test(product.foodTier || "")) issue("error", product.id, "Food tier must be S, A, or B.");
  if (!/^[ABC]$/.test(product.verificationGrade || "")) issue("error", product.id, "Verification grade must be A, B, or C.");
  for (const certification of product.certifications || []) {
    if (!certification.name || !certification.certifier || !certification.scope) {
      issue("warning", product.id, `Certification '${certification.name || "unnamed"}' lacks a certifier or scope.`);
    }
  }
  if (product.imageUrl && !/^https:\/\//i.test(product.imageUrl)) {
    issue("error", product.id, "Product image URL is not HTTPS.");
  }
}

for (const [id, count] of idCounts) {
  if (count > 1) issue("error", id, `Duplicate product id appears ${count} times.`);
}
for (const [url, ids] of urlCounts) {
  if (ids.length > 1) issue("warning", ids.join(","), `Exact listing is reused by ${ids.length} products: ${url}`);
}

const budgetPlans = (data.budgetPlans || []).map((plan) => {
  const total = plan.items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) {
      issue("error", plan.id, `Budget references missing product '${item.productId}'.`);
      return sum;
    }
    return sum + Number(product.currentPrice) * Number(item.quantity);
  }, 0);
  if (total > Number(plan.target) + 0.005) issue("error", plan.id, `Budget total $${total.toFixed(2)} exceeds $${plan.target}.`);
  return { id: plan.id, name: plan.name, target: plan.target, total: Number(total.toFixed(2)), remaining: Number((plan.target - total).toFixed(2)) };
});

const choiceCoverage = products.reduce(
  (summary, product) => {
    const type = product.choiceType || "optional";
    summary[type] = (summary[type] || 0) + 1;
    return summary;
  },
  {},
);

const report = {
  generatedAt: new Date().toISOString(),
  catalogVersion: data.version,
  products: products.length,
  stores: products.reduce((summary, product) => ({ ...summary, [product.store]: (summary[product.store] || 0) + 1 }), {}),
  exactRetailerLinks: products.filter((product) => isExactUrl(exactUrl(product), product.store)).length,
  verifiedProductImages: products.filter((product) => /^https:\/\//i.test(product.imageUrl || "")).length,
  productsWithCertifications: products.filter((product) => (product.certifications || []).length > 0).length,
  choiceCoverage,
  budgets: budgetPlans,
  issues,
  issueCounts: issues.reduce((summary, item) => ({ ...summary, [item.severity]: (summary[item.severity] || 0) + 1 }), {}),
};

assert.equal(new Set(products.map((product) => product.id)).size, products.length, "Product ids must be unique");
if (issues.some((item) => item.severity === "error")) process.exitCode = 1;
console.log(JSON.stringify(report, null, 2));
