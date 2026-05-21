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
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

const cycleMonthlyFactor = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  annual: 1 / 12,
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
  subscriptionList: document.querySelector("#subscriptionList"),
  emptyState: document.querySelector("#emptyState"),
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
  nameInput: document.querySelector("#nameInput"),
  domainInput: document.querySelector("#domainInput"),
  ownerInput: document.querySelector("#ownerInput"),
  categoryInput: document.querySelector("#categoryInput"),
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
      showToast("Local data migrated to Cloudflare D1");
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
    owner: String(item.owner || "Family").trim() || "Family",
    category: categories.includes(item.category) ? item.category : "Other",
    price: Number(item.price) || 0,
    currency: item.currency || "EUR",
    cycle: Object.keys(cycleLabels).includes(item.cycle) ? item.cycle : "monthly",
    renewalDate: item.renewalDate || "",
    notes: String(item.notes || "").trim(),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
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
    showToast("Saved locally, but Cloudflare sync failed");
    return false;
  }
}

function setStorageStatus(mode, updatedAt = null) {
  storageMode = mode;
  els.storageStatus.classList.toggle("local", mode === "local");
  els.storageStatus.classList.toggle("error", mode === "error");

  if (mode === "remote") {
    els.storageStatus.textContent = updatedAt ? `Cloudflare D1 synced ${shortDateTime(updatedAt)}` : "Cloudflare D1 synced";
  } else if (mode === "local") {
    els.storageStatus.textContent = "Local browser storage";
  } else if (mode === "error") {
    els.storageStatus.textContent = "Cloudflare sync needs attention";
  } else {
    els.storageStatus.textContent = "Loading storage...";
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
  if (!value) return "No date";
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

function serviceKey(subscription) {
  return `${subscription.name} ${subscription.domain}`.toLowerCase();
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
  return subscriptions[0]?.currency || els.currencyInput.value || "EUR";
}

function aggregateBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "Unknown";
    acc.set(key, (acc.get(key) || 0) + monthlyCost(item));
    return acc;
  }, new Map());
}

function render() {
  const filtered = getFilteredSubscriptions();
  renderFilters();
  renderSummary();
  renderBreakdowns();
  renderSubscriptions(filtered);
  window.lucide?.createIcons();
}

function renderFilters() {
  const selectedCategory = els.categoryFilter.value || "all";
  const selectedOwner = els.ownerFilter.value || "all";
  const usedCategories = [...new Set(subscriptions.map((item) => item.category))].sort();
  const owners = [...new Set(subscriptions.map((item) => item.owner))].sort();

  els.categoryFilter.innerHTML = [
    `<option value="all">All categories</option>`,
    ...usedCategories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`),
  ].join("");
  els.ownerFilter.innerHTML = [
    `<option value="all">All owners</option>`,
    ...owners.map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`),
  ].join("");

  els.categoryFilter.value = usedCategories.includes(selectedCategory) ? selectedCategory : "all";
  els.ownerFilter.value = owners.includes(selectedOwner) ? selectedOwner : "all";
}

function renderSummary() {
  const currency = currentCurrency();
  const monthly = subscriptions.reduce((sum, item) => sum + monthlyCost(item), 0);
  const dueSoon = subscriptions.filter((item) => {
    const days = daysUntil(item.renewalDate);
    return days !== null && days >= 0 && days <= 30;
  });
  const next = subscriptions
    .filter((item) => daysUntil(item.renewalDate) !== null && daysUntil(item.renewalDate) >= 0)
    .sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate))[0];
  const categoryTotals = aggregateBy(subscriptions, (item) => item.category);
  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  els.monthlyTotal.textContent = money(monthly, currency);
  els.yearlyTotal.textContent = money(monthly * 12, currency);
  els.dueSoonTotal.textContent = String(dueSoon.length);
  els.nextRenewal.textContent = next ? `${next.name}, ${shortDate(next.renewalDate)}` : "No date yet";
  els.topCategory.textContent = topCategory ? `${topCategory[0]} (${money(topCategory[1], currency)})` : "None";
  els.averageMonthly.textContent = money(subscriptions.length ? monthly / subscriptions.length : 0, currency);
  els.unknownRenewals.textContent = String(subscriptions.filter((item) => !item.renewalDate).length);
}

function renderBreakdowns() {
  renderBreakdown(els.categoryBreakdown, aggregateBy(subscriptions, (item) => item.category));
  renderBreakdown(els.memberBreakdown, aggregateBy(subscriptions, (item) => item.owner));
  els.categoryCount.textContent = String(new Set(subscriptions.map((item) => item.category)).size);
  els.memberCount.textContent = String(new Set(subscriptions.map((item) => item.owner)).size);
}

function renderBreakdown(container, totals) {
  const currency = currentCurrency();
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map(([, value]) => value), 1);
  container.innerHTML = rows.length
    ? rows
        .map(
          ([label, value]) => `
            <div class="breakdown-row">
              <div><strong>${escapeHtml(label)}</strong><span>${money(value, currency)}/mo</span></div>
              <div class="bar" aria-hidden="true"><i style="--value:${Math.round((value / max) * 100)}%"></i></div>
            </div>
          `,
        )
        .join("")
    : `<p class="subscription-notes">Nothing tracked yet.</p>`;
}

function getFilteredSubscriptions() {
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const owner = els.ownerFilter.value;
  const sort = els.sortSelect.value;

  return subscriptions
    .filter((item) => {
      const matchesQuery = !query || `${item.name} ${item.domain} ${item.owner} ${item.category} ${item.notes}`.toLowerCase().includes(query);
      const matchesCategory = category === "all" || item.category === category;
      const matchesOwner = owner === "all" || item.owner === owner;
      return matchesQuery && matchesCategory && matchesOwner;
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
  els.emptyState.hidden = subscriptions.length !== 0;
  els.subscriptionList.hidden = subscriptions.length === 0;
  els.subscriptionList.innerHTML = items.map(subscriptionRow).join("");
}

function subscriptionRow(item) {
  const days = daysUntil(item.renewalDate);
  const warning = days !== null && days >= 0 && days <= 30;
  const dateText = item.renewalDate
    ? `${shortDate(item.renewalDate)}${days !== null && days >= 0 ? ` · in ${days}d` : ""}`
    : "Unknown";
  const logos = logoUrls(item.domain);

  return `
    <button class="subscription-row" type="button" data-id="${item.id}">
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
          <span class="subscription-domain">${escapeHtml(item.domain || "No website")}</span>
        </span>
      </span>
      <span class="subscription-label" data-label="Owner">${escapeHtml(item.owner)}</span>
      <span class="pill">${escapeHtml(item.category)}</span>
      <span class="subscription-label" data-label="Billing">${money(item.price, item.currency)} · ${cycleLabels[item.cycle]}</span>
      <span class="subscription-meta" data-label="Renewal">
        <i class="status-dot ${item.renewalDate ? (warning ? "warning" : "") : "missing"}"></i>
        <span class="subscription-label">${escapeHtml(dateText)}</span>
      </span>
      <span class="subscription-actions">
        <span class="mini-button" title="Edit"><i data-lucide="pencil"></i></span>
      </span>
    </button>
  `;
}

function openDialog(id = null) {
  editingId = id;
  userEditedDomain = Boolean(id);
  const item = subscriptions.find((subscription) => subscription.id === id);
  els.form.reset();
  els.categoryInput.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join("");
  els.dialogMode.textContent = item ? "Edit subscription" : "New subscription";
  els.dialogTitle.textContent = item ? item.name : "Add details";
  els.deleteButton.hidden = !item;

  els.nameInput.value = item?.name || "";
  els.domainInput.value = item?.domain || "";
  els.ownerInput.value = item?.owner || "Family";
  els.categoryInput.value = item?.category || "Other";
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
    price: els.priceInput.value,
    currency: els.currencyInput.value,
    cycle: els.cycleInput.value,
    renewalDate: els.renewalInput.value,
    notes: els.notesInput.value,
    createdAt: subscriptions.find((item) => item.id === editingId)?.createdAt || now,
    updatedAt: now,
  });

  if (editingId) {
    subscriptions = subscriptions.map((item) => (item.id === editingId ? data : item));
  } else {
    subscriptions = [data, ...subscriptions];
  }

  await persistSubscriptions();
  closeDialog();
  render();
  showToast(`${data.name} saved`);
}

async function deleteEditingItem() {
  if (!editingId) return;
  const item = subscriptions.find((subscription) => subscription.id === editingId);
  subscriptions = subscriptions.filter((subscription) => subscription.id !== editingId);
  await persistSubscriptions();
  closeDialog();
  render();
  showToast(`${item?.name || "Subscription"} deleted`);
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
  showToast("Data exported");
}

async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = Array.isArray(parsed) ? parsed : parsed.subscriptions;
    if (!Array.isArray(incoming)) throw new Error("Invalid subscription file");
    subscriptions = incoming.map(normalizeSubscription);
    await persistSubscriptions();
    render();
    showToast("Data imported");
  } catch {
    showToast("Import failed: choose a valid JSON export");
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
  els.deleteButton.addEventListener("click", deleteEditingItem);
  els.form.addEventListener("submit", handleSubmit);
  els.exportButton.addEventListener("click", exportData);
  els.importInput.addEventListener("change", importData);
  els.searchInput.addEventListener("input", render);
  els.categoryFilter.addEventListener("change", render);
  els.ownerFilter.addEventListener("change", render);
  els.sortSelect.addEventListener("change", render);
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
