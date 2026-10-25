(function (root) {
  'use strict';
  const limits = {
    seats: { min: 1, max: 500, step: 1 },
    hoursPerUserWeek: { min: 0, max: 20, step: 0.25 },
    hourlyCost: { min: 1, max: 1000, step: 1 },
    toolSpend: { min: 0, max: 100000, step: 1 },
    productPrice: { min: 0, max: 100000, step: 1 },
  };
  function formatRatio(ratio) {
    return `${Number.isInteger(ratio) ? ratio : ratio.toFixed(2)}×`;
  }
  function computeB({ seats, hoursPerUserWeek, hourlyCost, toolSpend, includeToolSpend }) {
    const liberated = seats * hoursPerUserWeek * 4.33 * hourlyCost;
    return liberated + (includeToolSpend ? toolSpend : 0);
  }
  function computeNetAndRatio(B, P) {
    const net = B - P;
    if (P === 0) return { net, ratio: null, ratioLabel: 'N/A: subscription is $0' };
    const ratio = B / P;
    return { net, ratio, ratioLabel: formatRatio(ratio) };
  }
  function calculate(raw) {
    const input = {};
    for (const [key, { min, max, step }] of Object.entries(limits)) {
      const value = raw[key];
      const number = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') ? Number(value) : NaN;
      if (!Number.isFinite(number) || number < min || number > max || Math.abs((number - min) / step - Math.round((number - min) / step)) > 1e-8) {
        return { valid: false, error: `Enter a valid ${key} value from ${min} to ${max} in steps of ${step}.` };
      }
      input[key] = number;
    }
    input.includeToolSpend = raw.includeToolSpend === true;
    const monthlyHours = input.seats * input.hoursPerUserWeek * 4.33;
    const monthlyLabor = monthlyHours * input.hourlyCost;
    const B = computeB(input);
    return { valid: true, monthlyHours, monthlyLabor, B, ...computeNetAndRatio(B, input.productPrice) };
  }
  const api = { limits, formatRatio, computeB, computeNetAndRatio, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OpulexisFormula = api;
})(globalThis);
