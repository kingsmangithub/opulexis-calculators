(() => {
  const WEEKS_PER_MONTH = 4.33;
  const STORAGE_KEY = 'opulexis-roi-lead-v1';

  const $ = (id) => document.getElementById(id);

  const fields = [
    { range: 'seats', num: 'seats-num', out: 'seats-out', parse: (v) => clamp(Math.round(Number(v)), 1, 500), format: (v) => String(v) },
    { range: 'hours', num: 'hours-num', out: 'hours-out', parse: (v) => clamp(Number(v), 0.25, 20), format: (v) => String(v) },
    { range: 'cost', num: 'cost-num', out: 'cost-out', parse: (v) => clamp(Number(v), 1, 1000), format: (v) => String(v) },
    { range: 'spend', num: 'spend-num', out: 'spend-out', parse: (v) => clamp(Number(v), 0, 100000), format: (v) => String(v) },
    { range: 'price', num: 'price-num', out: 'price-out', parse: (v) => clamp(Number(v), 0, 100000), format: (v) => String(v) },
  ];

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function money(n) {
    const abs = Math.abs(n);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: abs >= 100 ? 0 : 2,
    }).format(abs);
    return n < 0 ? `−${formatted}` : formatted;
  }

  function hoursFmt(n) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(n);
  }

  function syncField(field, raw) {
    const value = field.parse(raw);
    const range = $(field.range);
    const num = $(field.num);
    const out = $(field.out);
    const rangeMin = Number(range.min);
    const rangeMax = Number(range.max);
    range.value = String(clamp(value, rangeMin, rangeMax));
    num.value = field.format(value);
    out.textContent = field.format(value);
    return value;
  }

  function readInputs() {
    return {
      seats: fields[0].parse($('seats-num').value),
      hoursPerUserWeek: fields[1].parse($('hours-num').value),
      hourlyCost: fields[2].parse($('cost-num').value),
      currentToolSpend: fields[3].parse($('spend-num').value),
      productPrice: fields[4].parse($('price-num').value),
    };
  }

  function calculate(input) {
    const weeklyHours = input.seats * input.hoursPerUserWeek;
    const monthlyHours = weeklyHours * WEEKS_PER_MONTH;
    const monthlyLabor = monthlyHours * input.hourlyCost;
    const monthlyNet = monthlyLabor + input.currentToolSpend - input.productPrice;
    const annualNet = monthlyNet * 12;
    const positive = monthlyNet > 0;
    const paybackMonths = input.productPrice / Math.max(monthlyNet, 0.01);
    return { weeklyHours, monthlyHours, monthlyLabor, monthlyNet, annualNet, positive, paybackMonths };
  }

  function render() {
    const t0 = performance.now();
    const input = readInputs();
    const result = calculate(input);

    $('out-hours').textContent = hoursFmt(result.monthlyHours);
    $('out-labor').textContent = money(result.monthlyLabor);

    const netEl = $('out-net');
    const annualEl = $('out-annual');
    const payEl = $('out-payback');
    netEl.textContent = money(result.monthlyNet);
    annualEl.textContent = money(result.annualNet);
    netEl.classList.toggle('is-warn', !result.positive);
    annualEl.classList.toggle('is-warn', !result.positive);

    if (!result.positive) {
      payEl.textContent = 'Not positive yet — adjust inputs';
      payEl.classList.add('is-warn');
    } else {
      const months = result.paybackMonths;
      payEl.textContent = months < 1
        ? (() => { const d = Math.max(1, Math.round(months * 30)); return `${d} day${d===1?'':'s'}`; })()
        : `${months.toFixed(months < 10 ? 1 : 0)} months`;
      payEl.classList.remove('is-warn');
    }

    const gated = Boolean(localStorage.getItem(STORAGE_KEY));
    $('lead-gate').hidden = gated;
    $('lead-success').hidden = !gated;

    document.dispatchEvent(new Event('calculator:updated'));

    const elapsed = performance.now() - t0;
    if (elapsed > 100) console.warn(`ROI recalculate took ${elapsed.toFixed(1)}ms`);
  }

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  function isWorkEmail(email) {
    const trimmed = String(email || '').trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  fields.forEach((field) => {
    $(field.range).addEventListener('input', (event) => {
      syncField(field, event.target.value);
      render();
    });
    $(field.num).addEventListener('input', (event) => {
      syncField(field, event.target.value);
      render();
    });
    $(field.num).addEventListener('change', (event) => {
      syncField(field, event.target.value);
      render();
    });
  });

  $('lead-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = $('lead-email').value.trim();
    const company = $('lead-company').value.trim();
    const error = $('lead-error');
    error.hidden = true;
    error.textContent = '';

    if (!isWorkEmail(email)) {
      error.textContent = 'Enter a valid work email.';
      error.hidden = false;
      return;
    }
    if (!company) {
      error.textContent = 'Company is required.';
      error.hidden = false;
      return;
    }

    const scenario = readInputs();
    const payload = {
      email,
      company,
      savedAt: new Date().toISOString(),
      scenario,
      result: calculate(scenario),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    render();
    showToast('Lead saved locally · no email sent');
  });

  // Sync outputs from defaults, then paint results
  fields.forEach((field) => syncField(field, $(field.num).value));
  render();
})();
