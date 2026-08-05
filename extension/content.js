const API = globalThis.browser ?? globalThis.chrome;

function appendMetric(container, id, label, value) {
  const metric = document.createElement('span');
  metric.id = id;
  metric.textContent = `${label}: ${value}`;

  if (typeof value === 'number' && value < 0) {
    metric.classList.add('metric-negative');
  }

  container.append(metric);
}

function updateUi({ year, leftVacation, leftWorkReduction }) {
  const anchor = document.querySelector('.navcenter');
  if (!anchor) {
    return;
  }

  document.getElementById('vacations')?.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'vacations';

  appendMetric(wrapper, 'year', 'Year', year);
  appendMetric(wrapper, 'vacation-balance', 'Vacations Left', leftVacation);
  appendMetric(wrapper, 'reduction-balance', 'Work Reduction Left', leftWorkReduction);

  anchor.append(wrapper);
}

API.runtime.onMessage.addListener((message) => {
  if (message?.refresh) {
    updateUi(message);
  }
});

void API.runtime.sendMessage({ type: 'recalculate-tab' }).catch(() => {});
