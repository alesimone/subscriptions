const STORAGE_KEY = "family-subscriptions:v1";
const API_URL = "/api/subscriptions";

const categories = [
  "Streaming",
  "Music",
  "Software",
  "Cloud",
  "Gaming",
  "News",
  "Fitness",
  "Finance",
  "Education",
  "Utilities",
  "Shopping",
  "Other",
];

const categoryLabels = {
  Streaming: "Streaming",
  Music: "Musica",
  Software: "Software",
  Cloud: "Cloud",
  Gaming: "Gaming",
  News: "News",
  Fitness: "Fitness",
  Finance: "Finanza",
  Education: "Formazione",
  Utilities: "Utility",
  Shopping: "Shopping",
  Other: "Altro",
};

const categoryRules = [
  ["Streaming", ["netflix", "disney", "prime video", "hulu", "max", "paramount", "nowtv", "dazn", "sky", "spotify video"]],
  ["Music", ["spotify", "apple music", "tidal", "deezer", "youtube music", "soundcloud"]],
  ["Software", ["adobe", "microsoft", "office", "notion", "canva", "figma", "github", "chatgpt", "openai", "slack", "zoom"]],
  ["Cloud", ["icloud", "google one", "dropbox", "onedrive", "drive", "backblaze", "cloudflare"]],
  ["Gaming", ["playstation", "xbox", "nintendo", "steam", "game pass", "geforce"]],
  ["News", ["new york times", "nytimes", "guardian", "reuters", "bloomberg", "economist", "corriere", "repubblica"]],
  ["Fitness", ["strava", "peloton", "fitbit", "freeletics", "myfitnesspal", "calm", "headspace"]],
  ["Finance", ["revolut", "wise", "ynab", "tradingview", "paypal"]],
  ["Education", ["coursera", "udemy", "skillshare", "duolingo", "brilliant", "masterclass"]],
  ["Shopping", ["amazon", "costco", "walmart", "esselunga"]],
  ["Utilities", ["vpn", "nord", "proton", "1password", "bitwarden", "dashlane"]],
];

const serviceDirectory = {
  "1password": "1password.com",
  adobe: "adobe.com",
  amazon: "amazon.com",
  "amazon prime": "amazon.com",
  "apple music": "music.apple.com",
  backblaze: "backblaze.com",
  bitwarden: "bitwarden.com",
  canva: "canva.com",
  chatgpt: "chatgpt.com",
  cloudflare: "cloudflare.com",
  coursera: "coursera.org",
  dazn: "dazn.com",
  deezer: "deezer.com",
  disney: "disneyplus.com",
  dropbox: "dropbox.com",
  duolingo: "duolingo.com",
  figma: "figma.com",
  github: "github.com",
  "google one": "one.google.com",
  hulu: "hulu.com",
  icloud: "icloud.com",
  max: "max.com",
  microsoft: "microsoft.com",
  netflix: "netflix.com",
  notion: "notion.so",
  now: "nowtv.it",
  "now tv": "nowtv.it",
  openai: "openai.com",
  paramount: "paramountplus.com",
  proton: "proton.me",
  revolut: "revolut.com",
  sky: "sky.it",
  slack: "slack.com",
  spotify: "spotify.com",
  strava: "strava.com",
  tidal: "tidal.com",
  udemy: "udemy.com",
  wise: "wise.com",
  xbox: "xbox.com",
  "youtube music": "music.youtube.com",
  zoom: "zoom.us",
};

const cycleLabels = {
  weekly: "Settimanale",
  monthly: "Mensile",
  quarterly: "Trimestrale",
  annual: "Annuale",
};

const cycleMonthlyFactor = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  annual: 1 / 12,
};

const necessityLabels = {
  cancellable: "Disattivabile",
  necessary: "Necessario",
};

const els = {
  monthlyTotal: document.querySelector("#monthlyTotal"),
  yearlyTotal: document.querySelector("#yearlyTotal"),
  dueSoonTotal: document.querySelector("#dueSoonTotal"),
  nextRenewal: document.querySelector("#nextRenewal"),
  topCategory: document.querySelector("#topCategory"),
  averageMonthly: document.querySelector("#averageMonthly"),
  unknownRenewals: document.querySelector("#unknownRenewals"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  memberBreakdown: document.querySelector("#memberBreakdown"),
  categoryCount: document.querySelector("#categoryCount"),
  memberCount: document.querySelector("#memberCount"),
  quickFilterCount: document.querySelector("#quickFilterCount"),
  quickFilterList: document.querySelector("#quickFilterList"),
  subscriptionList: document.querySelector("#subscriptionList"),
  emptyState: document.querySelector("#emptyState"),
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyDescription: document.querySelector("#emptyDescription"),
  activeCount: document.querySelector("#activeCount"),
  inactiveCount: document.querySelector("#inactiveCount"),
  categoryFilter: document.querySelector("#categoryFilter"),
  ownerFilter: document.querySelector("#ownerFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  searchInput: document.querySelector("#searchInput"),
  newButton: document.querySelector("#newButton"),
  emptyAddButton: document.querySelector("#emptyAddButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  dialog: document.querySelector("#subscriptionDialog"),
  form: document.querySelector("#subscriptionForm"),
  dialogMode: document.querySelector("#dialogMode"),
  dialogTitle: document.querySelector("#dialogTitle"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  cancelButton: document.querySelector("#cancelButton"),
  deleteButton: document.querySelector("#deleteButton"),
  deleteButtonText: document.querySelector("#deleteButton span"),
  nameInput: document.querySelector("#nameInput"),
  domainInput: document.querySelector("#domainInput"),
  ownerInput: document.querySelector("#ownerInput"),
  categoryInput: document.querySelector("#categoryInput"),
  necessityInput: document.querySelector("#necessityInput"),
  priceInput: document.querySelector("#priceInput"),
  currencyInput: document.querySelector("#currencyInput"),
  cycleInput: document.querySelector("#cycleInput"),
  renewalInput: document.querySelector("#renewalInput"),
  notesInput: document.querySelector("#notesInput"),
  toast: document.querySelector("#toast"),
  storageStatus: document.querySelector("#storageStatus"),
};

let subscriptions = [];
let editingId = null;
let toastTimer = null;
let userEditedDomain = false;
let storageMode = "loading";
let statusView = "active";
let quickFilter = { type: "all", value: "all" };

function readLocalSubscriptions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeSubscription) : [];
  } catch {
    return [];
  }
}

async function loadSubscriptions() {
  setStorageStatus("loading");
  try {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`API unavailable: ${response.status}`);
    const payload = await response.json();
    subscriptions = Array.isArray(payload.subscriptions) ? payload.subscriptions.map(normalizeSubscription) : [];
    storageMode = "remote";
    setStorageStatus("remote", payload.updatedAt);

    const localSubscriptions = readLocalSubscriptions();
    if (subscriptions.length === 0 && localSubscriptions.length > 0) {
      subscriptions = localSubscriptions;
      await persistSubscriptions();
      showToast("Dati locali migrati su Cloudflare D1");
    }
  } catch {
    subscriptions = readLocalSubscriptions();
    storageMode = "local";
    setStorageStatus("local");
  }
  render();
}

function normalizeSubscription(item) {
  return {
    id: item.id || crypto.randomUUID(),
    name: String(item.name || "").trim(),
    domain: normalizeDomain(item.domain || ""),
    owner: String(item.owner || "Famiglia").trim() || "Famiglia",
    category: categories.includes(item.category) ? item.category : "Other",
    price: Number(item.price) || 0,
    currency: item.currency || "EUR",
    cycle: Object.keys(cycleLabels).includes(item.cycle) ? item.cycle : "monthly",
    renewalDate: item.renewalDate || "",
    notes: String(item.notes || "").trim(),
    status: item.status === "inactive" ? "inactive" : "active",
    necessity: normalizeNecessity(item.necessity || item.priority || item.cleanupType),
    deactivatedAt: item.deactivatedAt || "",
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

function normalizeNecessity(value) {
  return ["necessary", "necessario", "essenziale"].includes(String(value || "").toLowerCase())
    ? "necessary"
    : "cancellable";
}

function saveLocalSubscriptions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

async function persistSubscriptions() {
  saveLocalSubscriptions();

  if (storageMode !== "remote") {
    setStorageStatus("local");
    return false;
  }

  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ subscriptions }),
    });
    if (!response.ok) throw new Error(`Save failed: ${response.status}`);
    const payload = await response.json();
    setStorageStatus("remote", payload.updatedAt);
    return true;
  } catch {
    setStorageStatus("error");
    showToast("Salvato in locale, ma la sincronizzazione Cloudflare non è riuscita");
    return false;
  }
}

function setStorageStatus(mode, updatedAt = null) {
  storageMode = mode;
  els.storageStatus.classList.toggle("local", mode === "local");
  els.storageStatus.classList.toggle("error", mode === "error");

  if (mode === "remote") {
    els.storageStatus.textContent = updatedAt ? `Cloudflare D1 sincronizzato ${shortDateTime(updatedAt)}` : "Cloudflare D1 sincronizzato";
  } else if (mode === "local") {
    els.storageStatus.textContent = "Archivio locale del browser";
  } else if (mode === "error") {
    els.storageStatus.textContent = "Sincronizzazione Cloudflare da controllare";
  } else {
    els.storageStatus.textContent = "Caricamento archivio...";
  }
}

function money(value, currency = "EUR") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value || 0);
}

function shortDate(value) {
  if (!value) return "Nessuna data";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function shortDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function daysUntil(value) {
  if (!value) return null;
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(`${value}T12:00:00`));
  return Math.round((target - today) / 86400000);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthlyCost(subscription) {
  return subscription.price * (cycleMonthlyFactor[subscription.cycle] || 1);
}

function normalizeDomain(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function inferCategory(name, domain) {
  const haystack = `${name} ${domain}`.toLowerCase();
  const match = categoryRules.find(([, words]) => words.some((word) => haystack.includes(word)));
  return match?.[0] || "Other";
}

function inferDomain(name) {
  const cleaned = String(name || "").trim().toLowerCase();
  if (!cleaned) return "";
  const exact = serviceDirectory[cleaned];
  if (exact) return exact;
  const match = Object.entries(serviceDirectory)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([label]) => cleaned.includes(label));
  return match?.[1] || "";
}

function logoUrls(domain) {
  if (!domain) return [];
  return [
    `https://logo.clearbit.com/${domain}`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];
}

function initials(name) {
  return (name || "?").trim().slice(0, 1).toUpperCase();
}

function currentCurrency() {
  return activeSubscriptions()[0]?.currency || subscriptions[0]?.currency || els.currencyInput.value || "EUR";
}

function aggregateBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "Sconosciuto";
    acc.set(key, (acc.get(key) || 0) + monthlyCost(item));
    return acc;
  }, new Map());
}

function activeSubscriptions() {
  return subscriptions.filter((item) => item.status !== "inactive");
}

function inactiveSubscriptions() {
  return subscriptions.filter((item) => item.status === "inactive");
}

function render() {
  const filtered = getFilteredSubscriptions();
  renderFilters();
  renderSummary();
  renderBreakdowns();
  renderQuickFilters();
  renderStatusCounts();
  renderSubscriptions(filtered);
  window.lucide?.createIcons();
}

function renderFilters() {
  const selectedCategory = els.categoryFilter.value || "all";
  const selectedOwner = els.ownerFilter.value || "all";
  const scoped = statusView === "active" ? activeSubscriptions() : inactiveSubscriptions();
  const usedCategories = [...new Set(scoped.map((item) => item.category))].sort();
  const owners = [...new Set(scoped.map((item) => item.owner))].sort();

  els.categoryFilter.innerHTML = [
    `<option value="all">Tutte le categorie</option>`,
    ...usedCategories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(categoryLabels[category] || category)}</option>`),
  ].join("");
  els.ownerFilter.innerHTML = [
    `<option value="all">Tutte le persone</option>`,
    ...owners.map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`),
  ].join("");

  els.categoryFilter.value = usedCategories.includes(selectedCategory) ? selectedCategory : "all";
  els.ownerFilter.value = owners.includes(selectedOwner) ? selectedOwner : "all";
}

function renderSummary() {
  const currency = currentCurrency();
  const active = activeSubscriptions();
  const monthly = active.reduce((sum, item) => sum + monthlyCost(item), 0);
  const dueSoon = active.filter((item) => {
    const days = daysUntil(item.renewalDate);
    return days !== null && days >= 0 && days <= 30;
  });
  const next = active
    .filter((item) => daysUntil(item.renewalDate) !== null && daysUntil(item.renewalDate) >= 0)
    .sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate))[0];
  const categoryTotals = aggregateBy(active, (item) => item.category);
  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  els.monthlyTotal.textContent = money(monthly, currency);
  els.yearlyTotal.textContent = money(monthly * 12, currency);
  els.dueSoonTotal.textContent = String(dueSoon.length);
  els.nextRenewal.textContent = next ? `${next.name}, ${shortDate(next.renewalDate)}` : "Nessuna data";
  els.topCategory.textContent = topCategory ? `${categoryLabels[topCategory[0]] || topCategory[0]} (${money(topCategory[1], currency)})` : "Nessuna";
  els.averageMonthly.textContent = money(active.length ? monthly / active.length : 0, currency);
  els.unknownRenewals.textContent = String(active.filter((item) => !item.renewalDate).length);
}

function renderBreakdowns() {
  const active = activeSubscriptions();
  renderBreakdown(els.categoryBreakdown, aggregateBy(active, (item) => item.category), "category");
  renderBreakdown(els.memberBreakdown, aggregateBy(active, (item) => item.owner), "owner");
  els.categoryCount.textContent = String(new Set(active.map((item) => item.category)).size);
  els.memberCount.textContent = String(new Set(active.map((item) => item.owner)).size);
}

function renderBreakdown(container, totals, type) {
  const currency = currentCurrency();
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map(([, value]) => value), 1);
  container.innerHTML = rows.length
    ? rows
        .map(
          ([label, value]) => `
            <div class="breakdown-row">
              <div><strong>${escapeHtml(type === "category" ? categoryLabels[label] || label : label)}</strong><span>${money(value, currency)}/mese</span></div>
              <div class="bar" aria-hidden="true"><i style="--value:${Math.round((value / max) * 100)}%"></i></div>
            </div>
          `,
        )
        .join("")
    : `<p class="subscription-notes">Nessun dato ancora.</p>`;
}

function renderQuickFilters() {
  const active = activeSubscriptions();
  const categoryTotals = [...aggregateBy(active, (item) => item.category).entries()].sort((a, b) => b[1] - a[1]);
  const cancellableCount = active.filter((item) => item.necessity === "cancellable").length;
  const necessaryCount = active.filter((item) => item.necessity === "necessary").length;
  const buttons = [
    { type: "all", value: "all", label: "Tutti gli attivi", count: active.length, icon: "list-filter" },
    { type: "necessity", value: "cancellable", label: "Disattivabili", count: cancellableCount, icon: "scissors" },
    { type: "necessity", value: "necessary", label: "Necessari", count: necessaryCount, icon: "shield-check" },
    ...categoryTotals.map(([category]) => ({
      type: "category",
      value: category,
      label: categoryLabels[category] || category,
      count: active.filter((item) => item.category === category).length,
      icon: "tag",
    })),
  ];

  const activeButton = buttons.find((button) => button.type === quickFilter.type && button.value === quickFilter.value);
  els.quickFilterCount.textContent = String(activeButton?.count || active.length);
  els.quickFilterList.innerHTML = buttons
    .map(
      (button) => `
        <button
          class="quick-filter ${button.type === quickFilter.type && button.value === quickFilter.value ? "active" : ""}"
          type="button"
          data-quick-type="${escapeHtml(button.type)}"
          data-quick-value="${escapeHtml(button.value)}"
        >
          <i data-lucide="${button.icon}"></i>
          <span>${escapeHtml(button.label)}</span>
          <strong>${button.count}</strong>
        </button>
      `,
    )
    .join("");
}

function renderStatusCounts() {
  els.activeCount.textContent = String(activeSubscriptions().length);
  els.inactiveCount.textContent = String(inactiveSubscriptions().length);
  document.querySelectorAll("[data-status-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.statusView === statusView);
  });
}

function getFilteredSubscriptions() {
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const owner = els.ownerFilter.value;
  const sort = els.sortSelect.value;

  return subscriptions
    .filter((item) => item.status === statusView)
    .filter((item) => {
      const categoryLabel = categoryLabels[item.category] || item.category;
      const necessityLabel = necessityLabels[item.necessity] || item.necessity;
      const matchesQuery =
        !query ||
        `${item.name} ${item.domain} ${item.owner} ${item.category} ${categoryLabel} ${necessityLabel} ${item.notes}`
          .toLowerCase()
          .includes(query);
      const matchesCategory = category === "all" || item.category === category;
      const matchesOwner = owner === "all" || item.owner === owner;
      const matchesQuickFilter =
        quickFilter.type === "all" ||
        (quickFilter.type === "category" && item.category === quickFilter.value) ||
        (quickFilter.type === "necessity" && item.necessity === quickFilter.value);
      return matchesQuery && matchesCategory && matchesOwner && matchesQuickFilter;
    })
    .sort((a, b) => {
      if (sort === "costDesc") return monthlyCost(b) - monthlyCost(a);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      const aDays = daysUntil(a.renewalDate);
      const bDays = daysUntil(b.renewalDate);
      return (aDays ?? 99999) - (bDays ?? 99999);
    });
}

function renderSubscriptions(items) {
  const currentTotal = statusView === "active" ? activeSubscriptions().length : inactiveSubscriptions().length;
  const hasRows = items.length > 0;
  els.emptyState.hidden = hasRows;
  els.subscriptionList.hidden = !hasRows;
  els.emptyAddButton.hidden = statusView === "inactive";
  els.emptyTitle.textContent = statusView === "active" ? "Nessun abbonamento attivo" : "Nessun abbonamento disattivato";
  els.emptyDescription.textContent =
    statusView === "active"
      ? "Aggiungi il primo servizio ricorrente e il riepilogo calcolerà i totali automaticamente."
      : "Quando disattivi un abbonamento, lo troverai qui senza perdere lo storico.";
  if (currentTotal > 0 && !hasRows) {
    els.emptyTitle.textContent = "Nessun risultato";
    els.emptyDescription.textContent = "Prova a cambiare ricerca o filtri.";
  }
  els.subscriptionList.innerHTML = items.map(subscriptionRow).join("");
}

function subscriptionRow(item) {
  const days = daysUntil(item.renewalDate);
  const warning = days !== null && days >= 0 && days <= 30;
  const dateText = item.renewalDate
    ? `${shortDate(item.renewalDate)}${days !== null && days >= 0 ? ` · tra ${days}g` : ""}`
    : "Sconosciuto";
  const logos = logoUrls(item.domain);
  const statusNote = item.status === "inactive" && item.deactivatedAt ? `<span class="subscription-domain">Disattivato ${shortDateTime(item.deactivatedAt)}</span>` : "";
  const necessityClass = item.necessity === "necessary" ? "necessary" : "cancellable";

  return `
    <button class="subscription-row ${item.status === "inactive" ? "inactive" : ""}" type="button" data-id="${item.id}">
      <span class="subscription-main">
        <span class="logo-wrap">
          ${
            logos.length
              ? `<img src="${logos[0]}" data-fallback="${logos[1]}" alt="" loading="lazy" />`
              : `<span class="logo-fallback">${escapeHtml(initials(item.name))}</span>`
          }
        </span>
        <span>
          <span class="subscription-title">${escapeHtml(item.name)}</span>
          <span class="subscription-domain">${escapeHtml(item.domain || "Nessun sito")}</span>
          ${statusNote}
        </span>
      </span>
      <span class="subscription-label" data-label="Persona">${escapeHtml(item.owner)}</span>
      <span class="pill-stack" data-label="Categoria">
        <span class="pill">${escapeHtml(categoryLabels[item.category] || item.category)}</span>
        <span class="pill necessity-pill ${necessityClass}">${escapeHtml(necessityLabels[item.necessity] || "Disattivabile")}</span>
      </span>
      <span class="subscription-label" data-label="Pagamento">${money(item.price, item.currency)} · ${cycleLabels[item.cycle]}</span>
      <span class="subscription-meta" data-label="Rinnovo">
        <i class="status-dot ${item.renewalDate ? (warning ? "warning" : "") : "missing"}"></i>
        <span class="subscription-label">${escapeHtml(dateText)}</span>
      </span>
      <span class="subscription-actions">
        <span class="mini-button" title="Modifica"><i data-lucide="pencil"></i></span>
      </span>
    </button>
  `;
}

function openDialog(id = null) {
  editingId = id;
  userEditedDomain = Boolean(id);
  const item = subscriptions.find((subscription) => subscription.id === id);
  els.form.reset();
  els.categoryInput.innerHTML = categories.map((category) => `<option value="${category}">${categoryLabels[category] || category}</option>`).join("");
  els.dialogMode.textContent = item ? (item.status === "inactive" ? "Abbonamento disattivato" : "Modifica abbonamento") : "Nuovo abbonamento";
  els.dialogTitle.textContent = item ? item.name : "Aggiungi dettagli";
  els.deleteButton.hidden = !item;
  els.deleteButton.classList.toggle("restore-button", item?.status === "inactive");
  els.deleteButtonText.textContent = item?.status === "inactive" ? "Riattiva" : "Disattiva";
  els.deleteButton.querySelector("i")?.setAttribute("data-lucide", item?.status === "inactive" ? "rotate-ccw" : "archive");

  els.nameInput.value = item?.name || "";
  els.domainInput.value = item?.domain || "";
  els.ownerInput.value = item?.owner || "Famiglia";
  els.categoryInput.value = item?.category || "Other";
  els.necessityInput.value = item?.necessity || "cancellable";
  els.priceInput.value = item?.price || "";
  els.currencyInput.value = item?.currency || currentCurrency();
  els.cycleInput.value = item?.cycle || "monthly";
  els.renewalInput.value = item?.renewalDate || "";
  els.notesInput.value = item?.notes || "";

  els.dialog.showModal();
  els.nameInput.focus();
}

function closeDialog() {
  els.dialog.close();
  editingId = null;
}

async function handleSubmit(event) {
  event.preventDefault();
  const now = new Date().toISOString();
  const data = normalizeSubscription({
    id: editingId || crypto.randomUUID(),
    name: els.nameInput.value,
    domain: els.domainInput.value,
    owner: els.ownerInput.value,
    category: els.categoryInput.value,
    necessity: els.necessityInput.value,
    price: els.priceInput.value,
    currency: els.currencyInput.value,
    cycle: els.cycleInput.value,
    renewalDate: els.renewalInput.value,
    notes: els.notesInput.value,
    status: subscriptions.find((item) => item.id === editingId)?.status || "active",
    deactivatedAt: subscriptions.find((item) => item.id === editingId)?.deactivatedAt || "",
    createdAt: subscriptions.find((item) => item.id === editingId)?.createdAt || now,
    updatedAt: now,
  });

  if (editingId) {
    subscriptions = subscriptions.map((item) => (item.id === editingId ? data : item));
  } else {
    subscriptions = [data, ...subscriptions];
    statusView = "active";
  }

  await persistSubscriptions();
  closeDialog();
  render();
  showToast(`${data.name} salvato`);
}

async function toggleEditingStatus() {
  if (!editingId) return;
  let changedItem = null;
  subscriptions = subscriptions.map((subscription) => {
    if (subscription.id !== editingId) return subscription;
    const isInactive = subscription.status === "inactive";
    changedItem = {
      ...subscription,
      status: isInactive ? "active" : "inactive",
      deactivatedAt: isInactive ? "" : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return changedItem;
  });
  await persistSubscriptions();
  closeDialog();
  statusView = changedItem?.status || statusView;
  render();
  showToast(
    changedItem?.status === "inactive"
      ? `${changedItem.name} spostato negli abbonamenti disattivati`
      : `${changedItem?.name || "Abbonamento"} riattivato`,
  );
}

function exportData() {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), subscriptions }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `family-subscriptions-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Dati esportati");
}

async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = Array.isArray(parsed) ? parsed : parsed.subscriptions;
    if (!Array.isArray(incoming)) throw new Error("File abbonamenti non valido");
    subscriptions = incoming.map(normalizeSubscription);
    await persistSubscriptions();
    render();
    showToast("Dati importati");
  } catch {
    showToast("Importazione non riuscita: scegli un export JSON valido");
  } finally {
    event.target.value = "";
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wireEvents() {
  els.newButton.addEventListener("click", () => openDialog());
  els.emptyAddButton.addEventListener("click", () => openDialog());
  els.closeDialogButton.addEventListener("click", closeDialog);
  els.cancelButton.addEventListener("click", closeDialog);
  els.deleteButton.addEventListener("click", toggleEditingStatus);
  els.form.addEventListener("submit", handleSubmit);
  els.exportButton.addEventListener("click", exportData);
  els.importInput.addEventListener("change", importData);
  els.searchInput.addEventListener("input", render);
  els.categoryFilter.addEventListener("change", render);
  els.ownerFilter.addEventListener("change", render);
  els.sortSelect.addEventListener("change", render);
  document.querySelectorAll("[data-status-view]").forEach((button) => {
    button.addEventListener("click", () => {
      statusView = button.dataset.statusView;
      quickFilter = { type: "all", value: "all" };
      render();
    });
  });
  els.quickFilterList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-type]");
    if (!button) return;
    quickFilter = {
      type: button.dataset.quickType,
      value: button.dataset.quickValue,
    };
    statusView = "active";
    els.searchInput.value = "";
    els.categoryFilter.value = "all";
    els.ownerFilter.value = "all";
    render();
  });
  els.subscriptionList.addEventListener("click", (event) => {
    const row = event.target.closest(".subscription-row");
    if (row) openDialog(row.dataset.id);
  });
  els.nameInput.addEventListener("input", maybeSuggestCategory);
  els.domainInput.addEventListener("input", () => {
    userEditedDomain = true;
    maybeSuggestCategory();
  });
  els.subscriptionList.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement)) return;
      const fallback = img.dataset.fallback;
      if (fallback && img.src !== fallback) {
        img.src = fallback;
      } else {
        img.replaceWith(Object.assign(document.createElement("span"), {
          className: "logo-fallback",
          textContent: initials(img.closest(".subscription-row")?.querySelector(".subscription-title")?.textContent || "?"),
        }));
      }
    },
    true,
  );
}

function maybeSuggestCategory() {
  if (editingId) return;
  if (!userEditedDomain && !els.domainInput.value.trim()) {
    els.domainInput.value = inferDomain(els.nameInput.value);
  }
  const suggested = inferCategory(els.nameInput.value, els.domainInput.value);
  els.categoryInput.value = suggested;
}

wireEvents();
render();
loadSubscriptions();
