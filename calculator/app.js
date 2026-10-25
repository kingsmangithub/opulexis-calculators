(() => {
  const STORAGE_KEY = 'opulexis-roi-lead-v1';

  const $ = (id) => document.getElementById(id);

  const { calculate, limits } = globalThis.OpulexisFormula;
  const fields = [
    { range: 'seats', key: 'seats' },
    { range: 'hours', key: 'hoursPerUserWeek' },
    { range: 'cost', key: 'hourlyCost' },
    { range: 'spend', key: 'toolSpend' },
    { range: 'price', key: 'productPrice' },
  ].map(field => ({ ...field, num: `${field.range}-num`, out: `${field.range}-out` }));

  function money(n) {
    const abs = Math.abs(n);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(abs);
    return n < 0 ? `−${formatted}` : formatted;
  }

  function hoursFmt(n) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(n);
  }

  function syncField(field, raw, fromRange = false) {
    const num = $(field.num);
    if (fromRange) num.value = raw;
    const value = Number(raw);
    const { min, max } = limits[field.key];
    const valid = raw.trim() !== '' && Number.isFinite(value) && value >= min && value <= max && num.validity.valid;
    num.setAttribute('aria-invalid', String(!valid));
    if (valid) $(field.range).value = raw;
    $(field.out).textContent = valid ? raw : '—';
  }

  function readInputs() {
    const input = { includeToolSpend: $('include-tool-spend').checked };
    fields.forEach(field => { input[field.key] = $(field.num).value; });
    return input;
  }

  function render() {
    const result = calculate(readInputs());
    $('calc-error').hidden = result.valid;
    $('calc-error').textContent = result.valid ? '' : result.error;
    $('calc-metrics').hidden = !result.valid;
    if (result.valid) {
      $('out-hours').textContent = hoursFmt(result.monthlyHours);
      $('out-labor').textContent = money(result.monthlyLabor);
      $('out-net').textContent = money(result.net);
      $('out-ratio').textContent = result.ratioLabel;
    } else {
      ['out-hours', 'out-labor', 'out-net', 'out-ratio'].forEach(id => { $(id).textContent = '—'; });
    }
    const gated = Boolean(localStorage.getItem(STORAGE_KEY));
    $('lead-gate').hidden = gated;
    $('lead-success').hidden = !gated;
    document.dispatchEvent(new Event('calculator:updated'));
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
      syncField(field, event.target.value, true);
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

  $('include-tool-spend').addEventListener('change', render);

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
    if (!calculate(scenario).valid) {
      error.textContent = 'Correct the scenario inputs before saving.';
      error.hidden = false;
      return;
    }
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
