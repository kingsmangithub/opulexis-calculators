(() => {
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
    document.dispatchEvent(new Event('calculator:updated'));
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

  // Sync outputs from defaults, then paint results
  fields.forEach((field) => syncField(field, $(field.num).value));
  render();
})();
