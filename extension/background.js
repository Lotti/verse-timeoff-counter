const API = globalThis.browser ?? globalThis.chrome;

const HOSTS = [
  'mail.notes.collabservintegration.com',
  'mail.notes.na.collabserv.com',
  'mail.notes.ap.collabserv.com',
  'mail.notes.ce.collabserv.com',
  'mail.notes.scniris.com',
  'mail.notes.collabservsvt2.swg.usma.ibm.com',
  'llc1mail.notes.collabservsvt1.swg.usma.ibm.com',
];

const PAGE_MATCHES = HOSTS.map((host) => `*://${host}/verse*`);
const MONITORED_PATHS = ['/*($Calendar)*', '/*iNotes/Proxy*', '/*$new*'];
const MONITORED_REQUESTS = HOSTS.flatMap((host) =>
  MONITORED_PATHS.map((path) => `*://${host}${path}`),
);

const DEFAULT_SETTINGS = {
  vacationDays: 20,
  workReductionHours: 16 * 8,
  vacationRegex: 'ferie',
  reductionRegex: 'permesso|rol',
};

const SUPPORTED_TYPES = new Set(['appointment', 'all-day', 'meeting']);

function buildInsensitiveRegex(pattern, fallback) {
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return new RegExp(fallback, 'i');
  }
}

function mapEntryType(value) {
  switch (Number.parseInt(value, 10)) {
    case 0:
      return 'appointment';
    case 1:
      return 'anniversary';
    case 2:
      return 'all-day';
    case 3:
      return 'meeting';
    case 4:
      return 'reminder';
    default:
      return null;
  }
}

function parseEntry(rawEntry) {
  const subject = rawEntry?.entrydata?.[1]?.text?.[0] ?? '';
  const durationValue =
    rawEntry?.entrydata?.[4]?.number?.[0] ?? rawEntry?.entrydata?.[4]?.numberlist?.number?.[0];
  const duration = Number.parseInt(durationValue ?? 0, 10) || 0;
  const type = mapEntryType(rawEntry?.entrydata?.[6]?.text?.[0]);

  return {
    durationHours: duration / (60 * 60),
    subject,
    type,
  };
}

function summariseEntries(entries, vacationRegex, reductionRegex) {
  let countVacation = 0;
  let countWorkReduction = 0;

  for (const rawEntry of entries) {
    const entry = parseEntry(rawEntry);
    if (!SUPPORTED_TYPES.has(entry.type)) {
      continue;
    }

    if (vacationRegex.test(entry.subject)) {
      countVacation += entry.durationHours > 4 ? 1 : 0.5;
      continue;
    }

    if (reductionRegex.test(entry.subject)) {
      if (entry.durationHours > 8) {
        countWorkReduction += 8;
      } else if (entry.durationHours > 4) {
        countWorkReduction += entry.durationHours - 1;
      } else {
        countWorkReduction += entry.durationHours;
      }
    }
  }

  return { countVacation, countWorkReduction };
}

function isVerseUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return HOSTS.includes(parsedUrl.hostname) && parsedUrl.pathname.startsWith('/verse');
  } catch {
    return false;
  }
}

function buildCalendarUrl(origin) {
  const year = new Date().getFullYear();
  const firstDay = `${year}0101T000000,00Z`;
  const lastDay = `${year}1231T235959,00Z`;
  const url = new URL(
    `/livemail/iNotes/Proxy/?OpenDocument&Form=s_ReadViewEntries_JSON&Count=-1&KeyType=time&StartKey=${encodeURIComponent(
      firstDay,
    )}&UntilKey=${encodeURIComponent(
      lastDay,
    )}&PresetFields=${encodeURIComponent('FolderName;($CSAPIs)')}&xhr=1&sq=1`,
    origin,
  );

  return { url, year };
}

async function getSettings() {
  const stored = await API.storage.sync.get(Object.keys(DEFAULT_SETTINGS));

  return {
    vacationDays: Number(stored.vacationDays ?? DEFAULT_SETTINGS.vacationDays),
    workReductionHours: Number(
      stored.workReductionHours ?? DEFAULT_SETTINGS.workReductionHours,
    ),
    vacationRegex: buildInsensitiveRegex(
      stored.vacationRegex ?? DEFAULT_SETTINGS.vacationRegex,
      DEFAULT_SETTINGS.vacationRegex,
    ),
    reductionRegex: buildInsensitiveRegex(
      stored.reductionRegex ?? DEFAULT_SETTINGS.reductionRegex,
      DEFAULT_SETTINGS.reductionRegex,
    ),
  };
}

function isVerseTab(tab) {
  return Number.isInteger(tab?.id) && typeof tab.url === 'string' && isVerseUrl(tab.url);
}

async function sendRefreshMessage(tabId, payload) {
  try {
    await API.tabs.sendMessage(tabId, { refresh: true, ...payload });
  } catch (error) {
    console.warn(`Unable to refresh tab ${tabId}`, error);
  }
}

async function calculateForTab(tab) {
  if (!isVerseTab(tab)) {
    return;
  }

  const origin = new URL(tab.url).origin;
  const settings = await getSettings();
  const { url, year } = buildCalendarUrl(origin);
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    throw new Error(`Calendar request failed with status ${response.status}`);
  }

  const json = await response.json();
  const entries = json?.entries?.viewentry ?? [];
  const { countVacation, countWorkReduction } = summariseEntries(
    entries,
    settings.vacationRegex,
    settings.reductionRegex,
  );

  await sendRefreshMessage(tab.id, {
    leftVacation: settings.vacationDays - countVacation,
    leftWorkReduction: settings.workReductionHours - countWorkReduction,
    year,
  });
}

async function refreshAllTabs() {
  const tabs = await API.tabs.query({ url: PAGE_MATCHES });
  await Promise.allSettled(tabs.map((tab) => calculateForTab(tab)));
}

async function updateActionForTabId(tabId) {
  if (!tabId) {
    return;
  }

  try {
    const tab = await API.tabs.get(tabId);
    if (isVerseTab(tab)) {
      await API.action.enable(tabId);
    } else {
      await API.action.disable(tabId);
    }
  } catch (error) {
    console.warn(`Unable to update action state for tab ${tabId}`, error);
  }
}

API.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === 'recalculate-all') {
    void refreshAllTabs();
  }

  if (message?.type === 'recalculate-tab' && sender.tab) {
    void calculateForTab(sender.tab);
  }
});

API.tabs.onActivated.addListener(({ tabId }) => {
  void updateActionForTabId(tabId);
});

API.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    void updateActionForTabId(tabId);
    void calculateForTab(tab);
  }
});

API.tabs.onCreated.addListener((tab) => {
  void updateActionForTabId(tab.id);
});

API.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId < 0 || details.url.includes('Form=s_ReadViewEntries_JSON')) {
      return;
    }

    void API.tabs.get(details.tabId).then(calculateForTab).catch((error) => {
      console.warn(`Unable to refresh monitored tab ${details.tabId}`, error);
    });
  },
  { urls: MONITORED_REQUESTS, types: ['xmlhttprequest'] },
);
