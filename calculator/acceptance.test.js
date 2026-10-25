'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { computeB, computeNetAndRatio, calculate, limits } = require('./formula.js');
const defaults = { seats: 25, hoursPerUserWeek: 2, hourlyCost: 75, toolSpend: 0, includeToolSpend: false, productPrice: 499 };
let failures = 0;
function test(name, run) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}: ${error.message}`); }
}
test('1: default B, net and 32.54× ratio', () => {
  const B = computeB(defaults);
  assert.equal(B, 16237.5);
  const result = calculate(defaults);
  assert.equal(result.valid, true);
  assert.equal(result.net, 15738.5);
  assert.ok(Math.abs(result.ratio - 32.54) < 0.005);
  assert.equal(result.ratioLabel, '32.54×');
});
test('2: zero benefit gives −499 net and 0×', () => {
  assert.deepEqual(computeNetAndRatio(0, 499), { net: -499, ratio: 0, ratioLabel: '0×' });
});
test('3: equal benefit and subscription gives zero net and 1×', () => {
  assert.deepEqual(computeNetAndRatio(499, 499), { net: 0, ratio: 1, ratioLabel: '1×' });
});
test('4: zero subscription gives exact unavailable label', () => {
  for (const B of [0, 499, 16237.5]) {
    assert.deepEqual(computeNetAndRatio(B, 0), { net: B, ratio: null, ratioLabel: 'N/A: subscription is $0' });
  }
});
test('5: illegal inputs produce no valid numeric results', () => {
  for (const [key, { min, max, step }] of Object.entries(limits)) {
    for (const value of [-1, min - step, max + step, NaN, Infinity, '', ' ', 'invalid', null, undefined, min + step / 2]) {
      const result = calculate({ ...defaults, [key]: value });
      assert.equal(result.valid, false, `${key}: ${String(value)}`);
      assert.ok(result.error);
      assert.equal(result.net, undefined);
      assert.equal(result.ratio, undefined);
    }
  }
});
test('6: hours zero stays zero', () => {
  assert.equal(computeB({ ...defaults, hoursPerUserWeek: 0 }), 0);
  const result = calculate({ ...defaults, hoursPerUserWeek: '0' });
  assert.equal(result.valid, true);
  assert.equal(result.monthlyHours, 0);
  assert.equal(result.net, -499);
});
test('7: tool spend enters B only when included', () => {
  assert.equal(computeB({ ...defaults, toolSpend: 1000 }), 16237.5);
  assert.equal(computeB({ ...defaults, toolSpend: 1000, includeToolSpend: true }), 17237.5);
  assert.equal(calculate({ ...defaults, toolSpend: 1000 }).B, 16237.5);
  assert.equal(calculate({ ...defaults, toolSpend: 1000, includeToolSpend: true }).B, 17237.5);
});
test('8: HTML pairs and pure validation share min/max/step; checkbox defaults off', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const fields = { seats: 'seats', hours: 'hoursPerUserWeek', cost: 'hourlyCost', spend: 'toolSpend', price: 'productPrice' };
  for (const [id, key] of Object.entries(fields)) {
    for (const suffix of ['', '-num']) {
      const tag = html.match(new RegExp(`<input\\b[^>]*id="${id}${suffix}"[^>]*>`))?.[0];
      assert.ok(tag, `${id}${suffix} exists`);
      for (const attr of ['min', 'max', 'step']) {
        assert.equal(Number(tag.match(new RegExp(`${attr}="([^"]+)"`))?.[1]), limits[key][attr]);
      }
      assert.ok(tag.includes(`type="${suffix ? 'number' : 'range'}"`));
    }
  }
  assert.ok(!html.match(/<input\b[^>]*id="include-tool-spend"[^>]*>/)[0].includes('checked'));
  assert.ok(!/payback|annual net/i.test(html));
});
process.exitCode = failures ? 1 : 0;
