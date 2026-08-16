/**
 * Automatically repairs text where Indian Rupee symbol (₹) or math symbols (×, −)
 * were corrupted into '?' or replacement characters due to non-UTF8 CSV / Excel exports.
 */
export function cleanCorruptedText(str) {
  if (str === null || str === undefined) return str;
  if (typeof str !== "string") {
    if (typeof str === "object") {
      try {
        return JSON.parse(cleanCorruptedText(JSON.stringify(str)));
      } catch {
        return str;
      }
    }
    return str;
  }

  return str
    // 1. Replace corrupted replacement characters (\uFFFD)
    .replace(/\uFFFD/g, "×")

    // 2. Fix currency expressions in headers & table metadata
    .replace(/\(\s*\?\s*in\s*lakhs?\s*\)/gi, "(₹ in lakhs)")
    .replace(/\(\s*\?\s*in\s*lacs?\s*\)/gi, "(₹ in lacs)")
    .replace(/\(\s*in\s*\?\s*crores?\s*\)/gi, "(In ₹ Crores)")
    .replace(/\(\s*\?\s*in\s*crores?\s*\)/gi, "(₹ in Crores)")
    .replace(/\(\s*\?\s*in\s*thousands?\s*\)/gi, "(₹ in thousands)")
    .replace(/\(\s*\?\s*per\s*unit\s*\)/gi, "(₹ per unit)")
    .replace(/\(\s*\?\s*\)/g, "(₹)")
    .replace(/\bAmount\s*\?/gi, "Amount (₹)")
    .replace(/\bCost Data\s*\?/gi, "Cost Data (₹)")
    .replace(/\bAmount\s*\/\s*Activity\s*\?/gi, "Amount / Activity (₹)")
    .replace(/Sales\s*\?/gi, "Sales (₹)")
    .replace(/Variable\s*Costs?\s*\?/gi, "Variable Costs (₹)")
    .replace(/Fixed\s*Costs?\s*\?/gi, "Fixed Costs (₹)")
    .replace(/Contribution\s*\?/gi, "Contribution (₹)")
    .replace(/Divisional\s*Income\s*\?/gi, "Divisional Income (₹)")
    .replace(/Selling\s*Price\s*per\s*unit\s*\(\?\s*\)/gi, "Selling Price per unit (₹)")
    .replace(/Direct\s*Cost\s*per\s*unit\s*\(\?\s*\)/gi, "Direct Cost per unit (₹)")
    .replace(/Cost\s*per\s*set\s*up\s*\(\?\s*\)/gi, "Cost per set up (₹)")
    .replace(/Cost\s*per\s*engineering\s*hour\s*\(\?\s*\)/gi, "Cost per engineering hour (₹)")

    // 3. Fix math subtraction in descriptions: e.g. "(Ticket revenue ? Variable expense)" -> "(Ticket revenue − Variable expense)"
    .replace(/(revenue|income|cost|price|margin)\s*\?\s*(variable|fixed|cost|expense)/gi, "$1 − $2")

    // 4. Fix currency values: e.g. "?5,200", "? 5,200", "at ?7,800", "of ?60,000", "?20 lakh", "?8 crores", "?500"
    .replace(/\?\s*(\d+[\d,]*(?:\.\d+)?(?:\s*(?:lakhs?|lacs?|crores?|cr|k|thousand|million|billion|p\.u\.|per\s+(?:year|month|bike|unit|kg|hr|hour|seat|pair|component|packet|day|annum|run|set\s*up)))?)/gi, "₹$1")

    // 5. Standalone ? followed immediately by digits (e.g. ?10/ per kg, ?100.05)
    .replace(/\?(\d+)/g, "₹$1");
}
