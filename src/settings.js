/**
 * Settings page — manages the list of custom streaming sources.
 *
 * Sources are stored in chrome.storage.sync so they persist across
 * sessions, windows, and (if signed in) Chrome profiles.
 *
 * Each source: { id, name, icon, link, playLink }
 *   - id:       auto-generated unique key
 *   - name:     display name (e.g. "456Movie")
 *   - icon:     URL to a favicon/icon image
 *   - link:     URL template with $tmdbid placeholder
 *   - playLink: URL template for the "Play" action
 */

const listEl = document.getElementById("sources-list");
const formEl = document.getElementById("source-form");
const formTitle = document.getElementById("form-title");
const addBtn = document.getElementById("add-btn");
const cancelBtn = document.getElementById("cancel-btn");
const statusEl = document.getElementById("status");

const fName = document.getElementById("f-name");
const fIcon = document.getElementById("f-icon");
const fLink = document.getElementById("f-link");
const fPlay = document.getElementById("f-play");

let sources = [];
let editingId = null;

// --- Storage helpers ---

async function loadSources() {
  const data = await chrome.storage.sync.get({ sources: [] });
  sources = data.sources;
  return sources;
}

async function saveSources() {
  await chrome.storage.sync.set({ sources });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// --- Rendering ---

function renderList() {
  listEl.innerHTML = "";

  if (sources.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No sources yet. Click "Add source" to get started.</div>';
    return;
  }

  for (const src of sources) {
    const card = document.createElement("div");
    card.className = "source-card";

    const img = document.createElement("img");
    img.className = "icon-preview";
    img.src = src.icon;
    img.alt = src.name;
    img.onerror = () => { img.style.display = "none"; };

    const details = document.createElement("div");
    details.className = "details";

    const name = document.createElement("div");
    name.className = "source-name";
    name.textContent = src.name;

    const url = document.createElement("div");
    url.className = "source-url";
    url.textContent = src.link;

    const playUrl = document.createElement("div");
    playUrl.className = "source-url";
    playUrl.textContent = "Play: " + src.playLink;

    details.appendChild(name);
    details.appendChild(url);
    details.appendChild(playUrl);

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-small btn-secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEdit(src));

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-small btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteSource(src.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(img);
    card.appendChild(details);
    card.appendChild(actions);
    listEl.appendChild(card);
  }
}

// --- Form ---

function showForm() {
  formEl.classList.add("visible");
  addBtn.style.display = "none";
}

function hideForm() {
  formEl.classList.remove("visible");
  addBtn.style.display = "";
  formEl.reset();
  editingId = null;
  formTitle.textContent = "Add source";
}

function startEdit(src) {
  editingId = src.id;
  formTitle.textContent = "Edit source";
  fName.value = src.name;
  fIcon.value = src.icon;
  fLink.value = src.link;
  fPlay.value = src.playLink;
  showForm();
  fName.focus();
}

async function deleteSource(id) {
  sources = sources.filter((s) => s.id !== id);
  await saveSources();
  renderList();
  flash("Deleted");
}

function flash(msg) {
  statusEl.textContent = msg;
  statusEl.classList.add("show");
  setTimeout(() => statusEl.classList.remove("show"), 1500);
}

// --- Events ---

addBtn.addEventListener("click", () => {
  editingId = null;
  formTitle.textContent = "Add source";
  showForm();
  fName.focus();
});

cancelBtn.addEventListener("click", hideForm);

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const entry = {
    id: editingId || generateId(),
    name: fName.value.trim(),
    icon: fIcon.value.trim(),
    link: fLink.value.trim(),
    playLink: fPlay.value.trim(),
  };

  if (!entry.name || !entry.link || !entry.playLink) return;

  if (editingId) {
    sources = sources.map((s) => (s.id === editingId ? entry : s));
  } else {
    sources.push(entry);
  }

  await saveSources();
  renderList();
  hideForm();
  flash("Saved!");
});

// --- Init ---

loadSources().then(renderList);
