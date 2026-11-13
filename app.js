// Product analytics dashboard.
// Flow: read filters -> filter USERS -> render every section from that one slice,
// so all numbers always agree.

const ALL = window.USERS;
const $ = (id) => document.getElementById(id);
const fmtInt = (n) => n.toLocaleString("en-US");
const fmtPct = (x) => `${(x * 100).toFixed(1)}%`;

const FILTERS = [
  { id: "f-device", key: "device", all: "All devices" },
  { id: "f-region", key: "region", all: "All regions" },
  { id: "f-referral", key: "referral", all: "All sources" },
  { id: "f-feature", key: "feature", all: "All features" },
];

const DIMENSIONS = {
  device: "Device",
  region: "Region",
  referral: "Referral source",
  feature: "Feature",
  subscribed: "Subscription",
};
const MEASURES = {
  completed: { label: "completed the funnel", known: (u) => u.completed },
  subscribed: { label: "subscribed", known: (u) => u.subscribed },
  day7: { label: "came back after 7 days", known: (u) => u.day7 },
  day30: { label: "came back after 30 days", known: (u) => u.day30 },
};

// ---------- Small helpers ----------
// Share of users with value 1 among those whose value is known (blank never counts as 0).
function rate(users, getter) {
  const known = users.map(getter).filter((v) => v === 0 || v === 1);
  const yes = known.reduce((a, b) => a + b, 0);
  return { n: known.length, yes, p: known.length ? yes / known.length : null };
}
// Typical chance wobble (95% interval half-width) for a share p based on n users.
const wobble = (p, n) => (n ? 1.96 * Math.sqrt((p * (1 - p)) / n) : null);

function groupLabel(dim, value) {
  if (dim === "subscribed") return value === 1 ? "Subscribed" : value === 0 ? "Not subscribed" : "Unknown";
  return value === "" || value == null ? "Unknown" : String(value).replaceAll("_", " ");
}

// ---------- Tooltip (one shared element; text only, never innerHTML) ----------
const tip = $("tip");
function showTip(event, lines) {
  tip.replaceChildren();
  lines.forEach(([text, cls]) => {
    const d = document.createElement("div");
    d.textContent = text;
    if (cls) d.className = cls;
    tip.append(d);
  });
  tip.hidden = false;
  const pad = 14;
  const x = Math.min(event.clientX + pad, window.innerWidth - tip.offsetWidth - 8);
  const y = Math.min(event.clientY + pad, window.innerHeight - tip.offsetHeight - 8);
  tip.style.left = `${Math.max(8, x)}px`;
  tip.style.top = `${Math.max(8, y)}px`;
}
const hideTip = () => { tip.hidden = true; };

// ---------- One reusable horizontal bar row ----------
// {label, value 0..1 (bar length), text, small, tip lines, ref 0..1 (dashed marker)}
function barRow(spec) {
  const row = document.createElement("div");
  row.className = "row";
  row.tabIndex = 0;

  const label = document.createElement("div");
  label.className = "row-label";
  label.textContent = spec.label;

  const track = document.createElement("div");
  track.className = "track";
  const fill = document.createElement("div");
  fill.className = "fill";
  fill.style.width = `${Math.max(0, Math.min(1, spec.value || 0)) * 100}%`;
  track.append(fill);
  if (spec.ref != null) {
    const ref = document.createElement("div");
    ref.className = "ref-line";
    ref.style.left = `${spec.ref * 100}%`;
    track.append(ref);
  }

  const value = document.createElement("div");
  value.className = "row-value";
  value.textContent = spec.text;
  if (spec.small) {
    const s = document.createElement("small");
    s.textContent = ` ${spec.small}`;
    value.append(s);
  }

  row.append(label, track, value);
  const lines = spec.tip;
  row.addEventListener("pointermove", (e) => showTip(e, lines));
  row.addEventListener("pointerleave", hideTip);
  row.addEventListener("focus", () => {
    const r = row.getBoundingClientRect();
    showTip({ clientX: r.left + 40, clientY: r.bottom }, lines);
  });
  row.addEventListener("blur", hideTip);
  return row;
}

function emptyNote(text) {
  const p = document.createElement("div");
  p.className = "empty";
  p.textContent = text;
  return p;
}

// ---------- Filters ----------
function setupFilters() {
  for (const f of FILTERS) {
    const counts = new Map();
    for (const u of ALL) counts.set(u[f.key], (counts.get(u[f.key]) || 0) + 1);
    const values = [...counts.keys()].sort((a, b) => String(a).localeCompare(String(b)));
    const sel = $(f.id);
    sel.append(new Option(f.all, ""));
    for (const v of values) sel.append(new Option(`${groupLabel(f.key, v)} (${fmtInt(counts.get(v))})`, v));
    sel.addEventListener("input", render);
  }
  for (const id of ["f-subscribed", "seg-measure", "seg-dimension"]) $(id).addEventListener("input", render);
  $("reset").addEventListener("click", () => {
    for (const f of FILTERS) $(f.id).value = "";
    $("f-subscribed").value = "";
    render();
  });
}

function currentUsers() {
  const sel = {};
  for (const f of FILTERS) sel[f.key] = $(f.id).value;
  const sub = $("f-subscribed").value;
  return ALL.filter(
    (u) =>
      FILTERS.every((f) => !sel[f.key] || String(u[f.key]) === sel[f.key]) &&
      (sub === "" || String(u.subscribed) === sub)
  );
}

// ---------- Sections ----------
function renderKpis(users) {
  const completed = rate(users, (u) => u.completed);
  const subscribed = rate(users, (u) => u.subscribed);
  const d30 = rate(users, (u) => u.day30);
  const tiles = [
    ["Users", fmtInt(users.length), "matching the filters"],
    ["Completed the funnel", completed.p == null ? "–" : fmtPct(completed.p), `${fmtInt(completed.yes)} of ${fmtInt(completed.n)} users`],
    ["Subscribed", subscribed.p == null ? "–" : fmtPct(subscribed.p), `${fmtInt(subscribed.yes)} of ${fmtInt(subscribed.n)} with a known status`],
    ["Back after 30 days", d30.p == null ? "–" : fmtPct(d30.p), `${fmtInt(d30.yes)} of ${fmtInt(d30.n)} with a known value`],
  ];
  const box = $("kpis");
  box.replaceChildren();
  for (const [label, value, note] of tiles) {
    const t = document.createElement("div");
    t.className = "kpi";
    for (const [cls, text] of [["kpi-label", label], ["kpi-value", value], ["kpi-note", note]]) {
      const d = document.createElement("div");
      d.className = cls;
      d.textContent = text;
      t.append(d);
    }
    box.append(t);
  }
}

function renderFunnel(users) {
  const box = $("funnel");
  box.replaceChildren();
  if (!users.length) return box.append(emptyNote("No users match these filters."));
  const steps = [
    ["Visited", "s1"],
    ["Clicked", "s2"],
    ["Submitted", "s3"],
    ["Confirmed", "s4"],
  ];
  let prev = null;
  steps.forEach(([name, key], i) => {
    const r = rate(users, (u) => u[key]);
    box.append(
      barRow({
        label: `${i + 1}. ${name}`,
        value: r.p,
        text: r.p == null ? "–" : fmtPct(r.p),
        small: `${fmtInt(r.yes)} users`,
        tip: [
          [`${name}: ${r.p == null ? "–" : fmtPct(r.p)}`, ""],
          [`${fmtInt(r.yes)} of ${fmtInt(r.n)} users`, "t-sub"],
        ],
      })
    );
    if (prev && prev.yes > 0 && r.p != null) {
      const lost = prev.yes - r.yes;
      const d = document.createElement("div");
      d.className = "drop";
      d.textContent = `↓ ${fmtInt(lost)} users dropped here (${fmtPct(lost / prev.yes)} of the previous step)`;
      box.append(d);
    }
    prev = r;
  });
}

function renderRetention(users) {
  const box = $("retention");
  box.replaceChildren();
  if (!users.length) return box.append(emptyNote("No users match these filters."));
  for (const [name, key] of [["After 1 day", "day1"], ["After 7 days", "day7"], ["After 30 days", "day30"]]) {
    const r = rate(users, (u) => u[key]);
    box.append(
      barRow({
        label: name,
        value: r.p,
        text: r.p == null ? "–" : fmtPct(r.p),
        small: `${fmtInt(r.yes)} of ${fmtInt(r.n)}`,
        tip: [
          [`${name}: ${r.p == null ? "–" : fmtPct(r.p)}`, ""],
          [`${fmtInt(r.yes)} of ${fmtInt(r.n)} users with a known value`, "t-sub"],
        ],
      })
    );
  }
}

function renderSegments(users) {
  const measureKey = $("seg-measure").value;
  const dim = $("seg-dimension").value;
  const measure = MEASURES[measureKey];
  const box = $("segments");
  box.replaceChildren();
  $("seg-sub").textContent = `Share of users who ${measure.label}, by ${DIMENSIONS[dim].toLowerCase()}. Dashed line = all users matching the filters.`;
  $("seg-caution").textContent = "";
  if (!users.length) return box.append(emptyNote("No users match these filters."));

  const overall = rate(users, measure.known);
  const groups = new Map();
  for (const u of users) {
    const k = u[dim] == null ? "" : u[dim];
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(u);
  }
  const rows = [...groups.entries()]
    .map(([k, us]) => ({ k, ...rate(us, measure.known) }))
    .filter((g) => g.n > 0)
    .sort((a, b) => b.p - a.p);

  let smallest = Infinity;
  for (const g of rows) {
    smallest = Math.min(smallest, g.n);
    const w = wobble(g.p, g.n);
    box.append(
      barRow({
        label: groupLabel(dim, g.k),
        value: g.p,
        ref: overall.p,
        text: fmtPct(g.p),
        small: `n = ${fmtInt(g.n)}`,
        tip: [
          [`${groupLabel(dim, g.k)}: ${fmtPct(g.p)}`, ""],
          [`${fmtInt(g.yes)} of ${fmtInt(g.n)} users`, "t-sub"],
          [`Chance alone could move this by about ±${(w * 100).toFixed(1)} points`, "t-sub"],
        ],
      })
    );
  }
  const overallText = overall.p == null ? "" : ` All matching users: ${fmtPct(overall.p)} (n = ${fmtInt(overall.n)}).`;
  const small = smallest < 30 ? " Some groups have fewer than 30 users, so treat them as very uncertain." : "";
  $("seg-caution").textContent = `Hover a bar to see how much chance alone could move it. Gaps smaller than that are not evidence of a real difference.${overallText}${small}`;
}

// ---------- Observations (saved in this browser only) ----------
const OBS_KEY = "dashboard-observations";
function loadObs() {
  try {
    const v = JSON.parse(localStorage.getItem(OBS_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return []; // storage blocked or corrupted: start empty, the page still works
  }
}
function saveObs(list) {
  try {
    localStorage.setItem(OBS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
function renderObs(list) {
  const ul = $("obs-list");
  ul.replaceChildren();
  list.forEach((text, i) => {
    const li = document.createElement("li");
    li.append(document.createTextNode(text)); // text only, never HTML
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Remove";
    del.addEventListener("click", () => {
      list.splice(i, 1);
      saveObs(list);
      renderObs(list);
    });
    li.append(del);
    ul.append(li);
  });
}
function setupObservations() {
  const list = loadObs();
  renderObs(list);
  $("obs-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("obs-text").value.trim();
    if (!text) return;
    list.push(text);
    renderObs(list);
    $("obs-text").value = "";
    if (!saveObs(list)) {
      $("obs-note").textContent = "Couldn't save in this browser, so this observation will disappear when you leave the page.";
    }
  });
}

// ---------- Main ----------
function render() {
  hideTip();
  const users = currentUsers();
  renderKpis(users);
  renderFunnel(users);
  renderRetention(users);
  renderSegments(users);
}

setupFilters();
setupObservations();
render();
