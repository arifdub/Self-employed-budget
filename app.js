/* Self Employed Budget — app.js */

/* ---------- crash guard ----------
   Reports genuine script errors so a frozen app is never a mystery. Two things
   it deliberately does NOT report:
   - failed resource loads (a missing icon or a blocked font) fire an error event
     too, but the app still works and a red bar there is just noise
   - "Script error." with no detail, which is what browsers give for errors inside
     cross-origin files and carries no useful information
   Tap the bar to dismiss it. */
window.addEventListener('error', ev => {
  const isResource = ev.target && ev.target !== window && ev.target.tagName;
  if (isResource) {
    console.warn('Failed to load:', ev.target.tagName, ev.target.src || ev.target.href);
    return;
  }
  if (!ev.message || ev.message === 'Script error.') return;

  if (document.querySelector('[data-errbar]')) return;
  const bar = document.createElement('div');
  bar.setAttribute('data-errbar', '1');
  bar.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:9999;background:#FB7185;' +
    'color:#2A0710;font:600 12px/1.45 system-ui,sans-serif;padding:10px 14px;text-align:left;cursor:pointer';
  bar.textContent = ev.message +
    (ev.lineno ? '  (line ' + ev.lineno + (ev.colno ? ':' + ev.colno : '') + ')' : '') + '   — tap to dismiss';
  bar.onclick = () => bar.remove();
  if (document.body) document.body.appendChild(bar);
}, true);

const APP_VERSION = '1.7.3';

/* ---------- config ---------- */
const CURRENCY = '€';
const LOCALE = 'en-IE';

/* ---------- categories ----------
   Categories are data, not code. The built-in set below is only a starting
   point — everything is editable in Settings, so a plumber can have "Callout"
   where a driver has "Uber". Custom categories are stored per user and synced,
   which is why entries record the category NAME rather than an id: renaming a
   category should not silently rewrite history.

   Each category is { name, icon, colour, hidden }. Colour is a token from
   PALETTE, so a category always matches the theme rather than carrying a raw
   hex value that looks wrong in the light skin. */

const TAXI_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M10 2.6h4v1.9h-4z"/>' +
  '<path d="M5 11l1.5-4.4A2.2 2.2 0 018.6 5h6.8a2.2 2.2 0 012.1 1.6L19 11h.4A1.6 1.6 0 0121 12.6V17a1 1 0 01-1 1h-1v.4a1.5 1.5 0 01-3 0V18H8v.4a1.5 1.5 0 01-3 0V18H4a1 1 0 01-1-1v-4.4A1.6 1.6 0 014.6 11H5zm2.3-.6h9.4l-1.1-3.1a.6.6 0 00-.6-.4H9a.6.6 0 00-.6.4L7.3 10.4zM6.6 15.2a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zm10.8 0a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z"/></svg>';

/* Icons available when creating a category. "car" renders the taxi glyph so it
   can be recoloured; the rest are emoji, which cannot be. */
const ICON_SET = [
  ['car', 'car'], ['€', 'euro'], ['💶', 'notes'], ['💳', 'card'], ['🏦', 'bank'],
  ['📲', 'app'], ['⋯', 'other'], ['⛽', 'fuel'], ['🔧', 'spanner'], ['🛠', 'tools'],
  ['🚗', 'car2'], ['🛞', 'tyre'], ['🅿️', 'parking'], ['🛣', 'road'], ['🛡', 'shield'],
  ['📄', 'document'], ['📱', 'phone'], ['💻', 'laptop'], ['🫧', 'wash'], ['🧾', 'receipt'],
  ['🏠', 'house'], ['🧺', 'basket'], ['💡', 'bulb'], ['🎒', 'school'], ['🍽', 'meal'],
  ['☕', 'coffee'], ['🚌', 'bus'], ['⚕️', 'health'], ['🐾', 'pet'], ['🎁', 'gift'],
  ['✈️', 'travel'], ['📚', 'books'], ['🏋️', 'gym'], ['✂️', 'haircut'], ['➕', 'plus']
];

/* Named colours rather than hex, so both themes stay legible. */
const PALETTE = {
  green:  { bg: 'rgba(52,211,153,.22)',  fg: '#34D399' },
  amber:  { bg: 'rgba(255,176,32,.22)',  fg: '#FFB020' },
  red:    { bg: '#E8362D',               fg: '#ffffff' },
  black:  { bg: '#0B0B0B',               fg: '#ffffff' },
  blue:   { bg: '#5AC8FA',               fg: '#0B1B2B' },
  purple: { bg: '#8B5CF6',               fg: '#ffffff' },
  pink:   { bg: 'rgba(251,113,133,.22)', fg: '#FB7185' },
  teal:   { bg: 'rgba(45,212,191,.22)',  fg: '#2DD4BF' },
  yellow: { bg: '#FFD400',               fg: '#2A2200' },
  grey:   { bg: 'var(--surf2)',          fg: 'var(--mut)' }
};

const DEFAULT_CATS = {
  income: [
    { name: 'Income',   icon: '€',   colour: 'green'  },
    { name: 'Free Now', icon: 'car', colour: 'red'    },
    { name: 'Uber',     icon: 'car', colour: 'black'  },
    { name: 'TapTaxi',  icon: 'car', colour: 'blue'   },
    { name: 'Cabbi',    icon: 'car', colour: 'purple' },
    { name: 'Lynk',     icon: 'car', colour: 'yellow' },
    { name: 'Others',   icon: '⋯',   colour: 'grey'   }
  ],
  business: [
    { name: 'Fuel',      icon: '⛽',  colour: 'amber' },
    { name: 'App costs', icon: '📲', colour: 'pink'  },
    { name: 'Insurance', icon: '🛡',  colour: 'blue'  },
    { name: 'Repairs',   icon: '🔧', colour: 'grey'  },
    { name: 'Car wash',  icon: '🫧', colour: 'teal'  },
    { name: 'Licence',   icon: '📄', colour: 'grey'  },
    { name: 'Phone',     icon: '📱', colour: 'grey'  },
    { name: 'Parking',   icon: '🅿️', colour: 'grey'  },
    { name: 'Tolls',     icon: '🛣',  colour: 'grey'  },
    { name: 'Other',     icon: '➕', colour: 'grey'  }
  ],
  personal: [
    { name: 'Groceries',  icon: '🧺', colour: 'green' },
    { name: 'Rent',       icon: '🏠', colour: 'amber' },
    { name: 'Utilities',  icon: '💡', colour: 'amber' },
    { name: 'Kids',       icon: '🎒', colour: 'blue'  },
    { name: 'Eating out', icon: '🍽',  colour: 'pink'  },
    { name: 'Transport',  icon: '🚌', colour: 'grey'  },
    { name: 'Health',     icon: '⚕️', colour: 'teal'  },
    { name: 'Other',      icon: '➕', colour: 'grey'  }
  ]
};

/* The live set. Replaced by the user's own on load. */
let categories = JSON.parse(JSON.stringify(DEFAULT_CATS));

const visibleCats = type => categories[type].filter(c => !c.hidden);

/* CATS keeps the old [name, icon] shape so existing render code is untouched. */
const CATS = {
  get income()   { return visibleCats('income').map(c => [c.name, c.icon]); },
  get business() { return visibleCats('business').map(c => [c.name, c.icon]); },
  get personal() { return visibleCats('personal').map(c => [c.name, c.icon]); }
};

const PAYS = {
  income: ['Cash', 'Card in car', 'App payout', 'Bank transfer', 'Invoice — unpaid'],
  business: ['Cash', 'Card', 'Direct debit', 'On account'],
  personal: ['Cash', 'Card', 'Direct debit']
};

function findCat(name) {
  for (const t of ['income', 'business', 'personal']) {
    const hit = categories[t].find(c => c.name === name);
    if (hit) return hit;
  }
  return null;
}

/* One renderer for every category badge in the app. */
function chipHTML(cat) {
  const c = findCat(cat);
  if (!c) return '<span class="chip" style="background:var(--surf2);color:var(--mut)">•</span>';
  const p = PALETTE[c.colour] || PALETTE.grey;
  const inner = c.icon === 'car' ? TAXI_SVG : c.icon;
  const ring = c.colour === 'black' ? ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)' : '';
  return '<span class="chip" style="background:' + p.bg + ';color:' + p.fg + ring + '">' + inner + '</span>';
}

const PAY_ICON = {
  'Cash': '💵', 'Card in car': '💳', 'App payout': '📲', 'Bank transfer': '🏦',
  'Invoice — unpaid': '🧾', 'Card': '💳', 'Direct debit': '🔁', 'On account': '📄'
};

const iconHTML = cat => chipHTML(cat);
const ICON = new Proxy({}, { get: (_, k) => { const c = findCat(String(k)); return c ? c.icon : '•'; } });

/* ---------- state ---------- */
const state = {
  targets: { day: 200, week: 1200, month: 4800 },
  entries: [],
  period: 'day',
  rperiod: 'week',
  rOffset: 0,
  // Inline rather than calling addDays(): the helpers are declared further down
  // and a const cannot be read before its own definition runs.
  rFrom: (() => { const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0,0,0,0); return d; })(),
  rTo: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })(),
  skin: 'night',
  draft: { type: 'income', cat: 'Income', pay: 'Cash', val: '',
    // Inline rather than calling startOfDay(): that helper is declared further
    // down the file, and a const is not readable before its own definition runs.
    date: (() => { const x = new Date(); x.setHours(0, 0, 0, 0); return x; })() }
};


/* ---------- storage ----------
   Entries and settings persist in localStorage on the device. This is v0.3's
   foundation; cloud sync in v0.5 will layer on top of the same functions.
   Dates are stored as ISO strings and revived to Date objects on load. */
const STORE_KEY = 'seb.entries.v1';
const SETTINGS_KEY = 'seb.settings.v1';

function saveEntries() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(
      state.entries.map(e => ({ ...e, at: e.at.toISOString() }))
    ));
  } catch (err) {
    toast('Could not save — storage may be full');
  }
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(e => ({ ...e, at: new Date(e.at) }))
      .filter(e => e.id && e.amt > 0 && !isNaN(e.at))
      // "Fare" was renamed to "Income" in v0.9.1. Entries logged before that
      // are relabelled on load so the history reads consistently.
      .map(e => (e.cat === 'Fare' ? { ...e, cat: 'Income' } : e))
      // v0.13.0 moved to whole euros; older entries are rounded so totals and
      // rows always agree.
      .map(e => (e.amt % 1 ? { ...e, amt: roundEuro(e.amt) } : e))
      // Belt and braces: anything with a tombstone is deleted, whatever the
      // stored list still says.
      .filter(e => !tombstones[e.id]);
  } catch (err) {
    return [];
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      targets: state.targets, skin: state.skin, categories
    }));
  } catch (err) { /* non-fatal */ }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.targets && s.targets.day > 0) state.targets = s.targets;
    if (s.skin === 'day' || s.skin === 'night') state.skin = s.skin;
    if (s.categories && s.categories.income && s.categories.business && s.categories.personal) {
      // Merge rather than replace: a category added to the defaults in a later
      // release should appear for people who already have saved settings.
      categories = s.categories;
      ['income','business','personal'].forEach(t => {
        DEFAULT_CATS[t].forEach(d => {
          if (!categories[t].some(c => c.name === d.name)) categories[t].push({ ...d });
        });
      });
    }
  } catch (err) { /* defaults stand */ }
}

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
/* Whole euros only. Cents added noise to every screen without changing a single
   decision, so amounts are rounded once, when they are entered, and stored that
   way — rounding only at display time would make a column of rows disagree with
   its own total. Half rounds down: 19.50 becomes 19, 19.60 becomes 20. */
const roundEuro = n => (n < 0 ? -Math.ceil(-n - 0.5) : Math.ceil(n - 0.5));
const money = n => CURRENCY + roundEuro(n).toLocaleString(LOCALE, { maximumFractionDigits: 0 });
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const startOfWeek = d => { // Monday
  const x = startOfDay(d); const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day); return x;
};
const startOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfYear = d => new Date(d.getFullYear(), 0, 1);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtDay = d => d.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });

function periodRange(p, now = new Date()) {
  // A custom range ignores the reference date entirely — it has its own two ends.
  if (p === 'custom') return { from: startOfDay(state.rFrom), to: addDays(startOfDay(state.rTo), 1) };
  if (p === 'day')   return { from: startOfDay(now),   to: addDays(startOfDay(now), 1) };
  if (p === 'week')  return { from: startOfWeek(now),  to: addDays(startOfWeek(now), 7) };
  if (p === 'month') return { from: startOfMonth(now), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  return { from: startOfYear(now), to: new Date(now.getFullYear() + 1, 0, 1) };
}
function rangeLabel(p, now = new Date()) {
  if (p === 'custom') {
    const a = startOfDay(state.rFrom), b = startOfDay(state.rTo);
    return a.getTime() === b.getTime() ? fmtDay(a) : fmtDay(a) + ' – ' + fmtDay(b);
  }
  const { from } = periodRange(p, now);
  if (p === 'day')   return now.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
  if (p === 'week')  return fmtDay(from) + ' – ' + fmtDay(addDays(from, 6));
  if (p === 'month') return now.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
  return String(now.getFullYear());
}
function elapsed(p, now = new Date()) {
  const { from, to } = periodRange(p, now);
  const total = Math.round((to - from) / 864e5);
  const done = Math.round((startOfDay(now) - from) / 864e5) + 1;
  return { done, total };
}
const inRange = (e, r) => e.at >= r.from && e.at < r.to;
function bucket(type, p, ref) {
  const r = periodRange(p, ref || new Date()), out = {};
  state.entries.filter(e => e.type === type && inRange(e, r)).forEach(e => { out[e.cat] = (out[e.cat] || 0) + e.amt; });
  return out;
}
const total = o => Object.values(o).reduce((a, b) => a + b, 0);
const countOf = (type, p) => state.entries.filter(e => e.type === type && inRange(e, periodRange(p))).length;

/* ---------- swipeable entry rows ----------
   One builder used by both the home Today list and the Entries screen.
   Swipe left to reveal Edit and Delete. A plain tap does nothing on touch
   devices — entries get brushed constantly in a moving car. */
function entryRowHTML(e) {
  return '<div class="swipe-wrap" data-eid="' + e.id + '">' +
    '<div class="swipe-actions">' +
      '<button class="swact edit" data-act="edit" aria-label="Edit entry">Edit</button>' +
      '<button class="swact del" data-act="del" aria-label="Delete entry">Delete</button>' +
    '</div>' +
    '<div class="row swipe-row" tabindex="0">' +
      '<span class="dot">' + iconHTML(e.cat) + '</span>' +
      '<span class="rmain"><span class="rn">' + e.cat + '</span>' +
      '<span class="rs">' + e.at.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' }) + ' · ' + e.pay + '</span></span>' +
      '<span class="rv ' + (e.type === 'income' ? '' : 'neg') + '">' +
      (e.type === 'income' ? '+' : '−') + money(e.amt) + '</span>' +
    '</div></div>';
}

let openSwipe = null;
function closeOpenSwipe() {
  if (openSwipe) { openSwipe.style.transform = ''; openSwipe.parentElement.classList.remove('swiped'); openSwipe = null; }
}

function wireSwipeRows(container) {
  container.querySelectorAll('.swipe-wrap').forEach(wrap => {
    const row = wrap.querySelector('.swipe-row');
    const id = wrap.dataset.eid;
    let startX = 0, startY = 0, dx = 0, dragging = false, horizontal = null;

    const WIDTH = () => wrap.getBoundingClientRect().width || 320;
    const FULL = () => Math.max(WIDTH() * 0.55, 180);   // past this, a release deletes

    row.addEventListener('touchstart', ev => {
      const t = ev.touches[0];
      startX = t.clientX; startY = t.clientY; dx = 0; dragging = true; horizontal = null;
      row.style.transition = 'none';
    }, { passive: true });

    row.addEventListener('touchmove', ev => {
      if (!dragging) return;
      const t = ev.touches[0];
      const mx = t.clientX - startX, my = t.clientY - startY;
      if (horizontal === null && (Math.abs(mx) > 8 || Math.abs(my) > 8))
        horizontal = Math.abs(mx) > Math.abs(my);
      if (!horizontal) return;

      dx = Math.min(0, Math.max(-WIDTH(), mx));
      row.style.transform = 'translateX(' + dx + 'px)';

      /* Past the threshold the whole row turns red and the action panel reads
         "Release to delete", so a full swipe never deletes as a surprise. */
      const armed = dx < -FULL();
      if (armed !== wrap.classList.contains('armed')) {
        wrap.classList.toggle('armed', armed);
        if (armed && navigator.vibrate) navigator.vibrate(10);
      }
    }, { passive: true });

    row.addEventListener('touchend', () => {
      dragging = false;
      row.style.transition = '';

      if (dx < -FULL()) {                       // full swipe: delete straight away
        wrap.classList.remove('armed');
        row.style.transform = 'translateX(-100%)';
        wrap.style.maxHeight = wrap.scrollHeight + 'px';
        requestAnimationFrame(() => wrap.classList.add('collapsing'));
        setTimeout(() => deleteEntry(id, true), 180);
      } else if (dx < -60) {                    // part swipe: reveal the buttons
        closeOpenSwipe();
        row.style.transform = 'translateX(-132px)';
        wrap.classList.add('swiped');
        openSwipe = row;
      } else {
        row.style.transform = '';
        wrap.classList.remove('swiped', 'armed');
        if (openSwipe === row) openSwipe = null;
      }
      dx = 0;
    });

    row.addEventListener('click', () => { if (!('ontouchstart' in window)) openEdit(id); });

    wrap.querySelectorAll('.swact').forEach(b => b.addEventListener('click', ev => {
      ev.stopPropagation();
      closeOpenSwipe();
      if (b.dataset.act === 'edit') openEdit(id);
      else openEdit(id, true);
    }));
  });
}

/* ---------- delete, with a way back ----------
   A full swipe skips the confirmation, so the safety net moves to an Undo that
   sits on screen for six seconds. Deleting income records with no route back
   would be the wrong trade: fast is only worth having if a mistake is cheap. */
let lastDeleted = null, undoTimer = null;

function deleteEntry(id, withUndo) {
  const i = state.entries.findIndex(e => e.id === id);
  if (i < 0) return;
  const gone = state.entries[i];

  state.entries.splice(i, 1);
  saveEntries(); markDeleted(gone.id);
  render();
  if ($('ent').classList.contains('up')) renderEntries();

  if (!withUndo) { toast(money(gone.amt) + ' ' + gone.cat + ' deleted'); return; }

  lastDeleted = gone;
  clearTimeout(undoTimer);
  showUndo(money(gone.amt) + ' ' + gone.cat + ' deleted');
  undoTimer = setTimeout(hideUndo, 6000);
}

function showUndo(msg) {
  $('undoText').textContent = msg;
  $('undoBar').classList.add('on');
}
function hideUndo() {
  $('undoBar').classList.remove('on');
  lastDeleted = null;
}

$('undoBtn').onclick = () => {
  if (!lastDeleted) return;
  const e = lastDeleted;
  // Bringing it back means clearing the tombstone, or the next sync would
  // dutifully delete it again on the server.
  delete tombstones[e.id];
  dirty.add(e.id);
  state.entries.push(e);
  saveEntries(); saveQueue(); scheduleFlush();
  hideUndo(); render();
  if ($('ent').classList.contains('up')) renderEntries();
  toast(money(e.amt) + ' ' + e.cat + ' restored');
};

document.addEventListener('touchstart', ev => {
  if (openSwipe && !ev.target.closest('.swipe-wrap')) closeOpenSwipe();
}, { passive: true });

/* ---------- render: home ---------- */
function render(flash) {
  greet();
  const now = new Date();
  $('hDate').textContent = now.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });

  const P = state.period;
  const inc = total(bucket('income', P));
  const biz = total(bucket('business', P));
  const per = total(bucket('personal', P));
  const expenses = biz + per;
  const net = inc - biz;                 // business net — the taxable figure
  const pocket = inc - expenses;         // what actually stays
  const tgt = state.targets[P];
  const label = P === 'day' ? 'Today' : P === 'week' ? 'This week' : 'This month';

  /* ---- hero ---- */
  const pct = tgt ? Math.min(inc / tgt, 1) : 0;
  const pctN = tgt ? Math.round(inc / tgt * 100) : 0;
  $('heroLab').textContent = (P === 'day' ? "Today's" : P === 'week' ? "This week's" : "This month's") + ' target';
  $('heroVal').textContent = money(inc);
  $('heroTgt').textContent = money(tgt);
  $('heroDone').textContent = inc >= tgt ? 'Target reached' : pctN + '% completed';
  $('heroDone').classList.toggle('hit', inc >= tgt);
  $('heroBar').style.width = (pct * 100) + '%';
  $('heroEarned').textContent = money(inc);
  $('heroToGo').textContent = inc >= tgt ? money(inc - tgt) + ' over' : money(tgt - inc) + ' to go';
  $('ringFill').setAttribute('stroke-dasharray', (314 * pct) + ' 314');
  $('ringPct').textContent = pctN + '%';

  /* ---- stat cards ---- */
  setStat('stInc', inc);
  setStat('stExp', biz);        // business only — the label says so, so the figure must match
  setStat('stNet', net);
  ['Inc', 'Exp', 'Net'].forEach(k => { $('st' + k + 'When').textContent = label; });

  /* ---- breakdown ---- */
  $('bdTitle').firstChild.textContent = label + ' breakdown';
  // The centre shows what is actually left after every cost — the figure that
  // answers "what did I really make", rather than repeating total income.
  $('donutVal').textContent = money(pocket);
  $('donutVal').classList.toggle('neg', pocket < 0);
  $('donutSub').textContent = pocket < 0 ? 'short this ' + (P === 'day' ? 'day' : P) : 'disposable income';
  drawDonut(inc, biz, per, pocket);
  $('bdRows').innerHTML = [
    ['Gross income', inc, 'c-inc', 100],
    ['Business expenses', biz, 'c-biz', inc ? biz / inc * 100 : 0],
    ['Personal &amp; home', per, 'c-per', inc ? per / inc * 100 : 0],
    ['Disposable income', pocket, 'c-pkt', inc ? pocket / inc * 100 : 0]
  ].map(([name, val, cls, share]) =>
    '<div class="bdRow"><span class="bdDot ' + cls + '"></span>' +
    '<span class="bdName">' + name + '</span>' +
    '<span class="bdVal ' + cls + '">' + money(val) + '</span>' +
    '<span class="bdPct">' + Math.round(share) + '%</span></div>').join('');

  /* ---- the rest ---- */
  drawTargetCard('w', 'week', now);
  drawTargetCard('m', 'month', now);
  drawWeekBars(now);

  $('tSummary').textContent = money(state.targets.day) + ' / day';
  $('verOut').textContent = 'v' + APP_VERSION;

  if (flash) ['cWeek', 'cMonth'].forEach(id => {
    const c = $(id); c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 900);
  });

  renderReport();
}

/* Amounts grow but the card does not, so the type steps down rather than
   overflowing — which is what clipped "€158" in the middle card. */
function setStat(id, value) {
  const el = $(id);
  const txt = money(value);
  el.textContent = txt;
  el.classList.toggle('long',  txt.length >= 7 && txt.length < 9);
  el.classList.toggle('xlong', txt.length >= 9);
}

/* ---------- donut ----------
   Income split three ways: business costs, personal costs, and what is left.
   Drawn with stroke-dasharray rather than arc paths — fewer places to get the
   trigonometry wrong, and it animates for free. */
function drawDonut(inc, biz, per, pocket) {
  const C = 314;                         // circumference at r=50
  const parts = inc > 0
    ? [[biz / inc, 'c-biz'], [per / inc, 'c-per'], [Math.max(pocket, 0) / inc, 'c-pkt']]
    : [];
  let offset = 0;
  let svg = '<circle class="donutTrack" cx="60" cy="60" r="50"/>';
  parts.forEach(([share, cls]) => {
    const len = Math.max(share, 0) * C;
    if (len <= 0) return;
    svg += '<circle class="donutSeg ' + cls + '" cx="60" cy="60" r="50" transform="rotate(-90 60 60)" ' +
           'stroke-dasharray="' + len.toFixed(1) + ' ' + C + '" stroke-dashoffset="' + (-offset).toFixed(1) + '"/>';
    offset += len;
  });
  $('donut').innerHTML = svg;
}

function drawTargetCard(k, p, now) {
  const val = total(bucket('income', p)), tgt = state.targets[p];
  const { done, total: tot } = elapsed(p, now);
  const expected = tgt * done / tot, diff = val - expected;
  $(k + 'Val').textContent = money(val);
  $(k + 'Tgt').textContent = '/ ' + money(tgt);
  $(k + 'Bar').style.width = Math.min(val / tgt * 100, 100) + '%';
  $(k + 'Pace').style.left = Math.min(done / tot * 100, 100) + '%';
  $(k + 'Range').textContent = rangeLabel(p, now) + ' · day ' + done + ' of ' + tot;
  const t = $(k + 'PaceTxt');
  t.textContent = diff >= 0 ? '▲ ' + money(diff) + ' ahead of pace' : '▼ ' + money(-diff) + ' behind pace';
  t.className = 'p ' + (diff >= 0 ? 'up' : 'down');
  $(k + 'Left').textContent = val >= tgt ? money(val - tgt) + ' over target' : money(tgt - val) + ' to go';
}

/* ---------- week chart ----------
   Seven days at a glance with the amount printed above each bar. Bars are scaled
   against whichever is larger, the daily target or the best day of the week, so a
   big day makes the others look small — which is the point of the comparison. */
const shortMoney = n =>
  n >= 1000 ? CURRENCY + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'k'
            : CURRENCY + Math.round(n);

function drawWeekBars(now) {
  const from = startOfWeek(now), tgt = state.targets.day;
  const today = startOfDay(now).getTime();
  const days = [];

  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i), r = { from: d, to: addDays(d, 1) };
    days.push({
      label: d.toLocaleDateString(LOCALE, { weekday: 'short' }).slice(0, 3),
      value: state.entries
        .filter(e => e.type === 'income' && inRange(e, r))
        .reduce((a, e) => a + e.amt, 0),
      isToday: startOfDay(d).getTime() === today,
      future: startOfDay(d).getTime() > today
    });
  }

  const weekTotal = days.reduce((a, d) => a + d.value, 0);
  $('weekTotal').textContent = money(weekTotal);

  const AREA = 92;                                   // pixels available to the tallest bar
  const max = Math.max(tgt, ...days.map(d => d.value)) || 1;

  $('hist').innerHTML =
    '<div class="goalline" style="bottom:' + (16 + (tgt / max) * AREA).toFixed(1) + 'px">' +
      '<span>' + shortMoney(tgt) + '</span></div>' +
    days.map(d => {
      const h = d.value > 0 ? Math.max((d.value / max) * AREA, 3) : 2;
      const cls = d.isToday ? 'today' : d.value >= tgt ? 'hit' : d.future ? 'future' : '';
      return '<div class="dayw">' +
        '<div class="dval' + (d.value ? '' : ' none') + '">' + (d.value ? shortMoney(d.value) : '') + '</div>' +
        '<div class="hb ' + cls + '" style="height:' + h.toFixed(1) + 'px"></div>' +
        '<div class="dl' + (d.isToday ? ' now' : '') + '">' + d.label + '</div>' +
      '</div>';
    }).join('');
}

/* ---------- reports ----------
   rOffset counts periods back from now: 0 is the current one, 1 the previous.
   Every figure on the screen is derived from the reference date it produces, so
   navigation is a single number rather than state scattered across the report. */
function refDate() {
  const o = state.rOffset || 0, now = new Date();
  if (state.rperiod === 'day')   return addDays(startOfDay(now), -o);
  if (state.rperiod === 'week')  return addDays(startOfWeek(now), -7 * o);
  if (state.rperiod === 'month') return new Date(now.getFullYear(), now.getMonth() - o, 1);
  return new Date(now.getFullYear() - o, 0, 1);
}

function offsetForDate(p, d) {
  const now = new Date();
  if (p === 'day')   return Math.round((startOfDay(now) - startOfDay(d)) / 864e5);
  if (p === 'week')  return Math.round((startOfWeek(now) - startOfWeek(d)) / (7 * 864e5));
  if (p === 'month') return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return now.getFullYear() - d.getFullYear();
}

function periodTitle(p, ref) {
  const o = state.rOffset || 0;
  if (o === 0) return p === 'day' ? 'Today' : p === 'week' ? 'This week' : p === 'month' ? 'This month' : 'This year';
  if (o === 1) return p === 'day' ? 'Yesterday' : 'Last ' + p;
  return rangeLabel(p, ref);
}


/* ---------- custom date range ----------
   Any two dates. Useful for a tax year that does not line up with the calendar,
   or for pulling the exact period an accountant has asked for. */
/* These are rolling windows, not the calendar periods the tabs above show.
   "Last 7 days" counts back from today; "This week" runs Monday to Sunday. On a
   Tuesday those are entirely different figures, which is the point of having
   both. */
const QUICK_RANGES = [
  ['Last 7 days',  () => [addDays(new Date(), -6),  new Date()]],
  ['Last 30 days', () => [addDays(new Date(), -29), new Date()]],
  ['Last 90 days', () => [addDays(new Date(), -89), new Date()]],
  ['All time', () => {
    if (!state.entries.length) return [new Date(), new Date()];
    const oldest = state.entries.reduce((a, e) => (e.at < a ? e.at : a), state.entries[0].at);
    return [oldest, new Date()];
  }]
];

function drawQuickRanges() {
  $('rQuick').innerHTML = QUICK_RANGES.map((r, i) =>
    '<button class="rq" data-i="' + i + '">' + r[0] + '</button>').join('');
  $('rQuick').querySelectorAll('.rq').forEach(b => b.onclick = () => {
    const [from, to] = QUICK_RANGES[+b.dataset.i][1]();
    setCustomRange(from, to);
  });
}

function setCustomRange(from, to) {
  // Accept them either way round rather than complaining about the order.
  if (from > to) { const t = from; from = to; to = t; }
  state.rFrom = startOfDay(from);
  state.rTo = startOfDay(to);
  $('rFrom').value = isoDay(state.rFrom);
  $('rTo').value = isoDay(state.rTo);
  renderReport();
}

$('rFrom').addEventListener('change', () => {
  if (!$('rFrom').value) return;
  const [y, m, d] = $('rFrom').value.split('-').map(Number);
  setCustomRange(new Date(y, m - 1, d), state.rTo);
});
$('rTo').addEventListener('change', () => {
  if (!$('rTo').value) return;
  const [y, m, d] = $('rTo').value.split('-').map(Number);
  setCustomRange(state.rFrom, new Date(y, m - 1, d));
});

function renderReport() {
  const p = state.rperiod, ref = refDate();
  const inc = bucket('income', p, ref), biz = bucket('business', p, ref), home = bucket('personal', p, ref);
  const I = total(inc), B = total(biz), H = total(home), net = I - B, take = net - H;

  const custom = p === 'custom';
  $('rCustom').hidden = !custom;
  document.querySelector('.rnav').hidden = custom;   // stepping back has no meaning here
  $('rToday').hidden = custom || (state.rOffset || 0) === 0;

  if (custom) {
    $('rFrom').value = isoDay(state.rFrom);
    $('rTo').value = isoDay(state.rTo);
    $('rFrom').max = isoDay(new Date());
    $('rTo').max = isoDay(new Date());
    const days = Math.round((startOfDay(state.rTo) - startOfDay(state.rFrom)) / 864e5) + 1;
    $('rSub').textContent = rangeLabel(p) + ' · ' + days + (days === 1 ? ' day' : ' days');
  } else {
    $('rWhen').textContent = periodTitle(p, ref);
    $('rDate').value = isoDay(ref);
    $('rDate').max = isoDay(new Date());
    $('rNext').disabled = (state.rOffset || 0) <= 0;
    $('rSub').textContent = rangeLabel(p, ref);
  }

  $('fIncome').textContent = money(I);
  $('fBiz').textContent = '−' + money(B);
  $('fNet').textContent = money(net);
  $('fHome').textContent = '−' + money(H);
  $('fTake').textContent = money(take);

  const w = n => I ? Math.max(Math.min(n / I * 100, 100), 1.5) + '%' : '1.5%';
  $('bBiz').style.width = w(B);
  $('bNet').style.width = w(Math.max(net, 0));
  $('bHome').style.width = w(H);
  $('bTake').style.width = w(Math.max(take, 0));
  $('pBiz').textContent = I ? Math.round(B / I * 100) + '% of gross income' : '';
  $('pHome').textContent = I ? Math.round(H / I * 100) + '% of gross income' : '';
  $('pTake').textContent = I ? 'What you kept after everything' : 'Nothing recorded for this period';

  breakdown('srcBrk', inc, I, false, 'No income recorded in this period', countsFor('income', p, ref));
  breakdown('bizBrk', biz, B, true, 'No business costs in this period');
  breakdown('homeBrk', home, H, true, 'No home costs in this period');
}

function stepReport(delta) {
  const next = (state.rOffset || 0) + delta;
  if (next < 0) return;
  state.rOffset = next;
  renderReport();
}

$('rPrev').onclick = () => stepReport(1);
$('rNext').onclick = () => stepReport(-1);
$('rToday').onclick = () => { state.rOffset = 0; renderReport(); };
$('rDate').addEventListener('change', () => {
  if (!$('rDate').value) return;
  const [y, m, d] = $('rDate').value.split('-').map(Number);
  state.rOffset = Math.max(0, offsetForDate(state.rperiod, new Date(y, m - 1, d)));
  renderReport();
});

function breakdown(id, obj, tot, isCost, emptyMsg, counts) {
  const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  $(id).innerHTML = rows.length ? rows.map(([k, v]) => {
    // Income sources carry a job count: knowing Uber brought in €400 is one
    // thing, knowing it took 22 jobs to get there is what tells you whether it
    // was worth driving for.
    const n = counts ? (counts[k] || 0) : 0;
    const sub = counts
      ? '<span class="jobs">' + n + (n === 1 ? ' job' : ' jobs') +
        (n ? ' · ' + money(v / n) + ' each' : '') + '</span>'
      : '';
    return '<div class="br"><div class="brt"><span class="l">' + k + '</span>' +
      '<span><span class="n">' + money(v) + '</span><span class="s">' +
      (tot ? Math.round(v / tot * 100) : 0) + '%</span></span></div>' + sub +
      '<div class="brb' + (isCost ? ' cost' : '') + '"><i style="width:' +
      (tot ? v / tot * 100 : 0) + '%"></i></div></div>';
  }).join('') : '<div class="br"><div class="brt"><span class="l" style="color:var(--mut);font-weight:400">' + emptyMsg + '</span></div></div>';
}

/* How many entries each category has in the period. */
function countsFor(type, p, ref) {
  const r = periodRange(p, ref || new Date()), out = {};
  state.entries.filter(e => e.type === type && inRange(e, r))
    .forEach(e => { out[e.cat] = (out[e.cat] || 0) + 1; });
  return out;
}


/* ============================================================
   EXPORTS — CSV, PDF summary, send to accountant
   ============================================================ */

/* Sharing a real file beats a download on mobile: iOS has no visible downloads
   folder in a home screen app, and the share sheet reaches Mail, Files and
   WhatsApp directly. Falls back to a download link on desktop. */
async function shareOrDownload(blob, filename, title) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}

/* ---------- CSV ---------- */
function periodEntries(p, ref) {
  const r = periodRange(p, ref);
  return state.entries.filter(e => inRange(e, r)).sort((a, b) => a.at - b.at);
}

const csvCell = v => {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

function buildCSV(p, ref) {
  const rows = periodEntries(p, ref);
  const head = ['Date', 'Time', 'Type', 'Category', 'Payment method', 'Amount'];
  const typeName = { income: 'Income', business: 'Business expense', personal: 'Personal expense' };
  const body = rows.map(e => [
    e.at.toISOString().slice(0, 10),
    e.at.toTimeString().slice(0, 5),
    typeName[e.type] || e.type,
    e.cat,
    e.pay || '',
    String(roundEuro(e.amt))
  ]);
  const inc = rows.filter(e => e.type === 'income').reduce((a, e) => a + e.amt, 0);
  const biz = rows.filter(e => e.type === 'business').reduce((a, e) => a + e.amt, 0);
  const per = rows.filter(e => e.type === 'personal').reduce((a, e) => a + e.amt, 0);

  return [head, ...body, [],
    ['', '', '', '', 'Gross income', String(roundEuro(inc))],
    ['', '', '', '', 'Business expenses', String(roundEuro(biz))],
    ['', '', '', '', 'Net income', String(roundEuro(inc - biz))],
    ['', '', '', '', 'Personal & home', String(roundEuro(per))],
    ['', '', '', '', 'Disposable income', String(roundEuro(inc - biz - per))]
  ].map(r => r.map(csvCell).join(',')).join('\r\n');
}

async function exportCSV() {
  const p = state.rperiod, ref = refDate();
  const rows = periodEntries(p, ref);
  if (!rows.length) { toast('Nothing to export for this period'); return; }
  const blob = new Blob(['\uFEFF' + buildCSV(p, ref)], { type: 'text/csv;charset=utf-8' });
  const name = 'SE-Budget-' + p + '-' + isoDay(ref) + '.csv';
  const how = await shareOrDownload(blob, name, 'SE Budget export');
  if (how !== 'cancelled') toast(rows.length + ' entries exported');
}

/* ---------- PDF ---------- */
function monthlyRows(year) {
  const out = [];
  for (let m = 0; m < 12; m++) {
    const ref = new Date(year, m, 1);
    if (ref > new Date()) break;
    const inc = total(bucket('income', 'month', ref));
    const biz = total(bucket('business', 'month', ref));
    const per = total(bucket('personal', 'month', ref));
    if (!inc && !biz && !per) continue;
    out.push({
      name: ref.toLocaleDateString(LOCALE, { month: 'long' }),
      inc, biz, net: inc - biz, per, disp: inc - biz - per
    });
  }
  return out;
}

/* Two documents, not one with a flag bolted on.

   The accountant's copy is a business record: gross income, business expenses
   itemised, and net income. Household spending is deliberately absent — it is
   not deductible, it is nobody else's business, and including it invites
   questions that have nothing to do with the return.

   The full summary is for you, and shows everything down to disposable income. */
function buildPDF(mode) {
  if (!window.jspdf || !window.jspdf.jsPDF) return null;
  const forAccountant = mode === 'accountant';

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 42;
  const eur = n => '\u20AC' + roundEuro(n).toLocaleString('en-IE', { maximumFractionDigits: 0 });
  let y = M;

  const ref = refDate(), p = state.rperiod;

  const room = need => { if (y + need > H - 60) { doc.addPage(); y = M; } };

  const line = (label, value, opts = {}) => {
    room(20);
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size || 10.5);
    doc.setTextColor(opts.muted ? 110 : 0);
    doc.text(label, M + (opts.indent || 0), y);
    doc.text(value, W - M, y, { align: 'right' });
    doc.setTextColor(0);
    y += opts.gap || 16;
  };

  const heading = text => {
    room(40);
    y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text(text, M, y); y += 6;
    doc.setDrawColor(210); doc.line(M, y, W - M, y); y += 16;
  };

  const rule = () => { doc.setDrawColor(180); doc.line(M, y - 11, W - M, y - 11); };

  /* itemise a category bucket, biggest first */
  const items = (obj, totalLabel) => {
    const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    if (!rows.length) { line('None recorded', eur(0), { muted: true }); return 0; }
    let sum = 0;
    rows.forEach(([name, v]) => { sum += v; line(name, eur(v), { indent: 12 }); });
    y += 4; rule();
    line(totalLabel, eur(sum), { bold: true });
    return sum;
  };

  /* ---------- header ---------- */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text(forAccountant ? 'Business income and expenses' : 'Income summary', M, y);
  y += 20;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(110);
  doc.text((currentName() || 'Self-employed') + '   \u00B7   ' + rangeLabel(p, ref), M, y); y += 13;
  doc.text('Generated ' + new Date().toLocaleDateString(LOCALE,
    { day: 'numeric', month: 'long', year: 'numeric' }), M, y);
  y += 10; doc.setTextColor(0);

  const inc  = bucket('income', p, ref);
  const biz  = bucket('business', p, ref);
  const home = bucket('personal', p, ref);
  const I = total(inc), B = total(biz), Hm = total(home);

  /* ---------- income ---------- */
  heading('Income');
  items(inc, 'Gross income');

  /* ---------- business expenses ---------- */
  heading('Business expenses');
  items(biz, 'Total business expenses');

  /* ---------- net ---------- */
  y += 8; room(30);
  doc.setDrawColor(120); doc.line(M, y - 6, W - M, y - 6);
  line('Net income', eur(I - B), { bold: true, size: 13, gap: 20 });

  /* ---------- household, own copy only ---------- */
  if (!forAccountant) {
    heading('Personal and household expenses');
    items(home, 'Total personal and household');

    y += 8; room(30);
    doc.setDrawColor(120); doc.line(M, y - 6, W - M, y - 6);
    line('Disposable income', eur(I - B - Hm), { bold: true, size: 13, gap: 20 });
  }

  /* ---------- month by month ---------- */
  const months = monthlyRows(ref.getFullYear());
  if (months.length) {
    heading('Month by month \u2014 ' + ref.getFullYear());

    const cols = forAccountant
      ? [M, M + 200, M + 340, W - M]
      : [M, M + 130, M + 235, M + 330, M + 425, W - M];
    const head = forAccountant
      ? ['Month', 'Gross income', 'Business', 'Net']
      : ['Month', 'Gross', 'Business', 'Net', 'Personal', 'Disposable'];

    doc.setFontSize(9); doc.setTextColor(110);
    head.forEach((t, i) => doc.text(t, cols[i], y, { align: i === 0 ? 'left' : 'right' }));
    doc.setTextColor(0); y += 12;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const tot = { inc: 0, biz: 0, net: 0, per: 0, disp: 0 };
    months.forEach(m => {
      room(24);
      doc.text(m.name, cols[0], y);
      const vals = forAccountant ? [m.inc, m.biz, m.net] : [m.inc, m.biz, m.net, m.per, m.disp];
      vals.forEach((v, i) => doc.text(eur(v), cols[i + 1], y, { align: 'right' }));
      tot.inc += m.inc; tot.biz += m.biz; tot.net += m.net; tot.per += m.per; tot.disp += m.disp;
      y += 14;
    });

    y += 2; doc.setDrawColor(180); doc.line(M, y, W - M, y); y += 14;
    doc.setFont('helvetica', 'bold');
    doc.text('Year to date', cols[0], y);
    const totals = forAccountant ? [tot.inc, tot.biz, tot.net] : [tot.inc, tot.biz, tot.net, tot.per, tot.disp];
    totals.forEach((v, i) => doc.text(eur(v), cols[i + 1], y, { align: 'right' }));
    y += 26;
  }

  /* ---------- footnotes ---------- */
  room(50);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(130);
  doc.text('Net income is gross income less business expenses.', M, y); y += 11;
  if (forAccountant) {
    doc.text('Personal and household spending is excluded from this report.', M, y); y += 11;
  } else {
    doc.text('Disposable income is what remains after personal and household costs.', M, y); y += 11;
  }
  doc.text('Prepared from records kept in SE Budget. Not a substitute for professional advice.', M, y);

  return doc;
}

async function exportPDF(forAccountant) {
  const doc = buildPDF(forAccountant ? 'accountant' : 'full');
  if (!doc) { toast('PDF tool did not load — check your connection'); return; }
  const ref = refDate();
  const name = (forAccountant ? 'SE-Budget-business-' : 'SE-Budget-summary-') + isoDay(ref) + '.pdf';
  const how = await shareOrDownload(doc.output('blob'), name, 'SE Budget summary');
  if (how === 'cancelled') return;
  toast(forAccountant
    ? (how === 'shared' ? 'Choose Mail to send it on' : 'PDF saved — attach it to an email')
    : 'PDF summary ready');
}

document.querySelectorAll('.exp button').forEach(b => b.onclick = () => {
  if (b.dataset.x === 'csv') exportCSV();
  else exportPDF(b.dataset.x === 'acc');
});


/* ============================================================
   VOICE ENTRY
   ------------------------------------------------------------
   Two layers, neither of which costs anything:
   1. The browser's own SpeechRecognition turns speech into text. It is the same
      engine as the keyboard's dictation button — no API, no key, no quota.
   2. A rule-based parser reads the text. "Add ten euro income" is a predictable
      sentence, so pattern matching handles it without a model.

   Nothing is ever saved straight from speech. A misheard "fifty" for "fifteen"
   in someone's accounts is worse than not having the feature, so every result
   goes through a confirmation card.
   ============================================================ */

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceSupported = () => !!SR;

/* iOS exposes webkitSpeechRecognition inside a home screen app but it does not
   actually produce results there — the microphone opens and nothing comes back.
   Safari proper works. Rather than leave someone tapping a dead button, detect
   the case and say so. */
const iosStandalone = () =>
  (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
  (window.matchMedia('(display-mode: standalone)').matches || !!navigator.standalone);

/* spoken numbers — people say "twenty five euro" as often as "25" */
const NUM_WORDS = {
  zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
  ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16,
  seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30, forty:40, fifty:50,
  sixty:60, seventy:70, eighty:80, ninety:90, hundred:100, grand:1000
};

function wordsToNumber(text) {
  const parts = text.replace(/-/g, ' ').split(/\s+/);
  let total = 0, current = 0, found = false;
  for (const w of parts) {
    const n = NUM_WORDS[w];
    if (n === undefined) {
      if (w === 'and' && found) continue;
      if (found) break;                     // the number has ended
      continue;
    }
    found = true;
    if (n === 100 || n === 1000) current = (current || 1) * n;
    else current += n;
  }
  total += current;
  return found ? total : null;
}

/* every category the app knows, plus the words people actually use for them */
const VOICE_TERMS = [
  { type:'income',   cat:'Income',      words:['income','fare','fair','job','trip','ride','cash job','earned','earning'] },
  { type:'income',   cat:'Free Now',    words:['free now','freenow','free-now'] },
  { type:'income',   cat:'Uber',        words:['uber'] },
  { type:'income',   cat:'TapTaxi',     words:['tap taxi','taptaxi','tap'] },
  { type:'income',   cat:'Cabbi',       words:['cabbi','cabby','cabi'] },
  { type:'income',   cat:'Lynk',        words:['lynk','link taxi'] },
  { type:'income',   cat:'Others',      words:['other income','others'] },
  { type:'business', cat:'Fuel',        words:['fuel','petrol','diesel','gas','filled up',
      'circle k','circlek','applegreen','maxol','texaco','topaz','emo oil','inver','tesco fuel'] },
  { type:'business', cat:'Insurance',   words:['insurance','axa','aviva','allianz','liberty','fbd','its4women'] },
  { type:'business', cat:'Repairs',     words:['repair','repairs','garage','mechanic','service','tyre','tyres','tire',
      'advance pitstop','fastfit','halfords','autozone','motor factors'] },
  { type:'business', cat:'Car wash',    words:['car wash','carwash','wash'] },
  { type:'business', cat:'Licence',     words:['licence','license','psv','permit'] },
  { type:'business', cat:'Phone',       words:['phone','mobile','data','vodafone','three ie','eir','48 months','gomo','tesco mobile'] },
  { type:'business', cat:'Parking',     words:['parking','park','apcoa','q park','qpark','parkrite','parking tag'] },
  { type:'business', cat:'Tolls',       words:['toll','tolls','m50','motorway','eflow','e-flow','payzone toll'] },
  { type:'personal', cat:'Groceries',   words:['groceries','grocery','shopping','food shop','tesco','lidl','aldi','dunnes',
      'supervalu','spar','centra','marks and spencer','m and s'] },
  { type:'personal', cat:'Rent',        words:['rent','mortgage'] },
  { type:'personal', cat:'Utilities',   words:['utilities','electricity','gas bill','bills','bill','esb','heating',
      'electric ireland','bord gais','sse airtricity','energia','virgin media','sky ireland','irish water'] },
  { type:'personal', cat:'Kids',        words:['kids','kid','school','children','childcare'] },
  { type:'personal', cat:'Eating out',  words:['eating out','lunch','dinner','coffee','takeaway','restaurant',
      'mcdonald','supermac','starbucks','costa','insomnia','deliveroo','just eat','domino']},
  { type:'personal', cat:'Transport',   words:['bus','train','luas','taxi home'] },
  { type:'personal', cat:'Health',      words:['health','doctor','pharmacy','chemist','dentist'] }
];

const PAY_TERMS = [
  { pay:'Cash',        words:['cash'] },
  { pay:'Card in car', words:['card','card in car','machine'] },
  { pay:'App payout',  words:['app','app payout','payout'] },
  { pay:'Bank transfer', words:['bank','transfer','revolut'] }
];

function parseVoice(raw) {
  // Strip punctuation, but keep a full stop or comma that sits between two digits:
  // "12.50" must survive, while "add 20, cash." must not become one long token.
  const t = ' ' + raw.toLowerCase()
    .replace(/[!?;:]/g, ' ')
    .replace(/[.,]/g, (m, i, s) =>
      (/\d/.test(s[i - 1] || '') && /\d/.test(s[i + 1] || '')) ? m : ' ')
    .replace(/\s+/g, ' ') + ' ';

  /* amount: digits first, then spoken words */
  let amount = null;
  // Match the decimal form first. Dictation renders "twelve fifty" as "12.50",
  // and a looser pattern would stop at the 12 and drop the cents.
  const dec = t.match(/(\d+)\s*(?:[.,]|point)\s*(\d{1,2})\b/);
  if (dec) amount = parseFloat(dec[1] + '.' + dec[2].padEnd(2, '0'));
  if (amount === null) {
    const whole = t.match(/\b(\d+)\b/);
    if (whole) amount = parseFloat(whole[1]);
  }
  if (amount === null) amount = wordsToNumber(t);

  /* category: longest matching phrase wins, so "car wash" beats "wash" */
  let match = null, best = 0;
  VOICE_TERMS.forEach(term => {
    term.words.forEach(w => {
      if (t.includes(' ' + w + ' ') && w.length > best) { best = w.length; match = term; }
    });
  });

  /* an explicit "expense" or "spent" outranks a bare amount with no category */
  const saysExpense = /\b(expense|expenses|spent|spend|cost|paid|bought)\b/.test(t);
  const saysIncome  = /\b(income|earned|earning|fare|fair|took|made)\b/.test(t);

  let type = match ? match.type : (saysExpense ? 'business' : 'income');
  let cat  = match ? match.cat  : (type === 'income' ? 'Income' : 'Other');
  if (!match && saysIncome) { type = 'income'; cat = 'Income'; }

  let pay = PAYS[type][0];
  PAY_TERMS.forEach(p => p.words.forEach(w => { if (t.includes(' ' + w + ' ')) pay = p.pay; }));
  if (!PAYS[type].includes(pay)) pay = PAYS[type][0];

  /* yesterday is common — you remember the fare you forgot the next morning */
  let date = startOfDay(new Date());
  if (/\byesterday\b/.test(t)) date = addDays(date, -1);

  return { amount, type, cat, pay, date, heard: raw, matched: !!match };
}


/* ---------- batch entry ----------
   Handles a block of text: several spoken sentences, a list written elsewhere,
   or lines pasted straight from a bank or card statement. Each line becomes one
   proposed entry, and nothing is saved until the list has been reviewed. */

/* Statement lines look like: 09/08/2026  CIRCLE K DUBLIN 12  45.20
   A date at the start and an amount at the end, with the merchant between. */
const STATEMENT_RE = /^\s*(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s+(.+?)\s+[-+€$]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*$/;

function parseStatementDate(s) {
  const parts = s.split(/[\/\-.]/).map(Number);
  if (parts.length !== 3) return null;
  let [a, b, c] = parts;
  let y, m, d;
  if (a > 31) { y = a; m = b; d = c; }            // 2026-08-09
  else { d = a; m = b; y = c; }                    // 09/08/2026
  if (y < 100) y += 2000;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt) ? null : startOfDay(dt);
}

function parseBatch(raw) {
  // split on lines first, then on "and" / ";" so one dictated sentence can hold
  // several entries: "twenty euro income and thirty five fuel"
  const chunks = [];
  raw.split(/[\n\r]+/).forEach(line => {
    if (!line.trim()) return;
    if (STATEMENT_RE.test(line)) { chunks.push(line); return; }   // never split a statement row
    line.split(/\s*(?:;|\band then\b|\balso\b|\band\b)\s*/i).forEach(part => {
      // Ask the number parser rather than listing number words in a regex —
      // the hand-written list quietly omitted eleven through nineteen, so
      // "fifteen euro fuel" was being thrown away before it was ever parsed.
      if (part && (/\d/.test(part) || wordsToNumber(part.toLowerCase()) !== null))
        chunks.push(part);
    });
  });

  const out = [];
  chunks.forEach(chunk => {
    const st = chunk.match(STATEMENT_RE);
    if (st) {
      const date = parseStatementDate(st[1]) || startOfDay(new Date());
      const desc = st[2];
      const amount = parseFloat(st[3].replace(/,/g, ''));
      const guess = parseVoice(desc + ' ' + amount);
      out.push({
        amount, type: guess.matched ? guess.type : 'business',
        cat: guess.matched ? guess.cat : 'Other',
        pay: 'Card', date, heard: chunk.trim(),
        matched: guess.matched, include: true
      });
      return;
    }
    const p = parseVoice(chunk);
    if (p.amount && p.amount > 0) out.push({ ...p, heard: chunk.trim(), include: true });
  });
  return out;
}

/* ---------- review list ---------- */
let batchRows = [];
const TYPE_CYCLE = ['income', 'business', 'personal'];
const TYPE_LABEL = { income: 'Income', business: 'Business', personal: 'Home' };
const TYPE_CLASS = { income: 'c-inc', business: 'c-biz', personal: 'c-per' };

function drawBatch() {
  const on = batchRows.filter(r => r.include);
  $('bCount').textContent = on.length
    ? 'Save ' + on.length + ' ' + (on.length === 1 ? 'entry' : 'entries')
    : 'Nothing selected';
  $('bSaveAll').disabled = !on.length;

  $('bList').innerHTML = batchRows.map((r, i) =>
    '<div class="bRow' + (r.include ? '' : ' off') + '" data-i="' + i + '">' +
      '<button class="bChk" data-act="chk" aria-label="Include this entry">' + (r.include ? '✓' : '') + '</button>' +
      '<div class="bMid">' +
        '<div class="bTop">' +
          '<button class="bType ' + TYPE_CLASS[r.type] + '" data-act="type">' + TYPE_LABEL[r.type] + '</button>' +
          '<span class="bCat">' + r.cat + '</span>' +
          (r.matched ? '' : '<span class="bWarn" title="No category recognised">?</span>') +
        '</div>' +
        '<div class="bHeard">' + r.heard.slice(0, 46) + (r.heard.length > 46 ? '…' : '') +
          ' · ' + r.date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }) + '</div>' +
      '</div>' +
      '<span class="bAmt ' + TYPE_CLASS[r.type] + '">' + money(r.amount) + '</span>' +
    '</div>').join('');

  $('bList').querySelectorAll('.bRow').forEach(row => {
    const i = +row.dataset.i;
    row.querySelector('[data-act="chk"]').onclick = () => { batchRows[i].include = !batchRows[i].include; drawBatch(); };
    row.querySelector('[data-act="type"]').onclick = () => {
      const r = batchRows[i];
      r.type = TYPE_CYCLE[(TYPE_CYCLE.indexOf(r.type) + 1) % 3];
      if (!CATS[r.type].some(c => c[0] === r.cat)) r.cat = r.type === 'income' ? 'Income' : 'Other';
      if (!PAYS[r.type].includes(r.pay)) r.pay = PAYS[r.type][0];
      drawBatch();
    };
  });
}

function openBatch(rows) {
  batchRows = rows;
  $('vResult').hidden = true;
  $('vBatch').hidden = false;
  $('vState').textContent = rows.length + ' entries found — check them over';
  $('vHint').textContent = 'Tap the type to change it, or the tick to leave one out.';
  drawBatch();
}

$('bSaveAll').onclick = () => {
  const chosen = batchRows.filter(r => r.include);
  if (!chosen.length) return;
  const now = new Date();

  chosen.forEach((r, k) => {
    const at = new Date(r.date);
    at.setHours(now.getHours(), Math.max(0, now.getMinutes() - (chosen.length - k)), 0, 0);
    const id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random() + k));
    state.entries.push({ id, type: r.type, cat: r.cat, amt: roundEuro(r.amount), pay: r.pay, at });
    markDirty(id);
  });
  saveEntries();
  closeVoice();

  /* A pasted statement is nearly always backdated, so the entries land outside
     the Day view and the home screen looks unchanged — which reads as "it did not
     save". Move the view to the smallest period that actually contains them. */
  const oldest = chosen.reduce((a, r) => (r.date < a ? r.date : a), chosen[0].date);
  const inPeriod = p => oldest >= periodRange(p, new Date()).from;
  const target = inPeriod('day') ? 'day' : inPeriod('week') ? 'week' : 'month';
  const moved = target !== state.period;

  if (moved) {
    state.period = target;
    document.querySelectorAll('#tabs button')
      .forEach(x => x.setAttribute('aria-pressed', x.dataset.p === target));
  }

  render(true);

  const label = target === 'day' ? 'today' : target === 'week' ? 'this week' : 'this month';
  toast(chosen.length + ' entries added' +
    (moved ? ' — showing ' + label : '') +
    (target === 'month' && oldest < periodRange('month', new Date()).from
      ? '. Some are older than this month — see Reports' : ''));
};

/* ---------- microphone ---------- */
let recog = null, listening = false, pending = null;

function openVoice() {
  $('vBatch').hidden = true;
  if (!voiceSupported()) {
    toast('This browser has no voice input — try Safari or Chrome');
    return;
  }
  /* iPhone home screen apps cannot open the microphone directly, but the
     keyboard's own dictation works in any text field — and that is available
     inside a standalone app. So instead of asking for the mic, we hand the job
     to the keyboard and parse whatever it types. Same result, no permission. */
  if (iosStandalone() || !voiceSupported()) {
    pending = null;
    $('vHeard').textContent = '';
    $('vResult').hidden = true;
    $('vMic').classList.add('off');
    $('vTypeBox').hidden = false;
    $('vState').textContent = 'Tap the microphone on your keyboard';
    $('vHint').textContent = 'Tap the box, then the 🎤 key on your keyboard, and speak. ' +
      'You can also just type it.';
    $('voiceModal').classList.add('on');
    $('voiceModal').setAttribute('aria-hidden', 'false');
    $('vText').value = '';
    setTimeout(() => $('vText').focus(), 350);
    return;
  }
  $('vMic').classList.remove('off');
  $('vTypeBox').hidden = true;
  pending = null;
  $('vHeard').textContent = '';
  $('vResult').hidden = true;
  $('vHint').textContent = 'Try: "add twenty euro income" or "thirty five fuel"';
  $('voiceModal').classList.add('on');
  $('voiceModal').setAttribute('aria-hidden', 'false');
  startListening();
}

function closeVoice() {
  stopListening();
  $('voiceModal').classList.remove('on');
  $('voiceModal').setAttribute('aria-hidden', 'true');
}

function startListening() {
  try {
    recog = new SR();
    recog.lang = 'en-IE';
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      listening = true;
      $('vMic').classList.add('live');
      $('vState').textContent = 'Listening…';
    };

    recog.onresult = ev => {
      let text = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) text += ev.results[i][0].transcript;
      $('vHeard').textContent = text;
      if (ev.results[ev.results.length - 1].isFinal) handleHeard(text);
    };

    recog.onerror = ev => {
      listening = false;
      $('vMic').classList.remove('live');
      $('vState').textContent =
        ev.error === 'not-allowed' ? 'Microphone blocked — allow it in Settings'
        : ev.error === 'no-speech' ? 'Did not catch that'
        : ev.error === 'network'   ? 'Voice needs a connection'
        : 'Could not listen';
    };

    recog.onend = () => {
      listening = false;
      $('vMic').classList.remove('live');
      if (!pending && !$('vHeard').textContent) {
        $('vState').textContent = 'Nothing was heard — tap to try again';
        $('vHint').textContent = 'Speak clearly and include the amount, for example "twenty euro fuel".';
      } else if (!pending) {
        $('vState').textContent = 'Tap the microphone to try again';
      }
    };

    recog.start();
  } catch (err) {
    $('vState').textContent = 'Could not start the microphone';
  }
}

function stopListening() {
  if (recog && listening) { try { recog.stop(); } catch (e) {} }
  listening = false;
  $('vMic').classList.remove('live');
}

function handleHeard(text) {
  const p = parseVoice(text);
  if (!p.amount || p.amount <= 0) {
    $('vState').textContent = 'No amount heard — say the number too';
    return;
  }
  pending = p;
  $('vState').textContent = 'Is this right?';
  $('vResult').hidden = false;
  $('vAmt').textContent = money(p.amount);
  $('vAmt').className = 'vAmt ' + (p.type === 'income' ? 'c-inc' : p.type === 'business' ? 'c-biz' : 'c-per');
  $('vCat').textContent = p.cat;
  $('vType').textContent = p.type === 'income' ? 'Income'
    : p.type === 'business' ? 'Business cost' : 'Home cost';
  $('vPay').textContent = p.pay;
  $('vDate').textContent = startOfDay(p.date).getTime() === startOfDay(new Date()).getTime()
    ? 'Today' : 'Yesterday';
  $('vHint').textContent = p.matched
    ? ''
    : 'No category recognised, so this went to ' + p.cat + '. Edit it if that is wrong.';
}

$('vRead').onclick = () => {
  const text = $('vText').value.trim();
  if (!text) { $('vState').textContent = 'Say or type an amount first'; return; }
  const rows = parseBatch(text);
  if (!rows.length) {
    $('vState').textContent = 'No amounts found in that';
    $('vHint').textContent = 'Each line needs a number, for example "35 fuel".';
    return;
  }
  if (rows.length === 1) { $('vHeard').textContent = text; handleHeard(text); }
  else openBatch(rows);
};
$('vText').addEventListener('keydown', e => { if (e.key === 'Enter') $('vRead').click(); });

$('vMic').onclick = () => { if (listening) stopListening(); else { pending = null; $('vResult').hidden = true; startListening(); } };
$('vCancel').onclick = closeVoice;
$('voiceModal').onclick = e => { if (e.target === $('voiceModal')) closeVoice(); };

$('vEdit').onclick = () => {
  if (!pending) return;
  const p = pending;
  closeVoice();
  state.draft = { type: p.type, cat: p.cat, pay: p.pay, val: String(p.amount), date: p.date };
  drawDraft();
  openSheet('sheet');
};

$('vSave').onclick = () => {
  if (!pending) return;
  const p = pending;
  const now = new Date();
  const at = new Date(p.date);
  at.setHours(now.getHours(), now.getMinutes(), 0, 0);
  const id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
  state.entries.push({ id, type: p.type, cat: p.cat, amt: roundEuro(p.amount), pay: p.pay, at });
  saveEntries();
  markDirty(id);
  closeVoice();
  render(true);
  toast(money(p.amount) + ' · ' + p.cat + ' saved');
};

/* the button only appears where it can actually work */
if (!voiceSupported()) $('micBtn').style.display = 'none';
$('micBtn').onclick = openVoice;
$('micBtn2').onclick = () => { closeSheet('sheet'); setTimeout(openVoice, 260); };
if (!voiceSupported() && !iosStandalone()) $('micBtn2').style.display = 'none';

/* ---------- entry date ----------
   Entries default to today but can be backdated, for the fares you forgot to log
   at the time. Future dates are blocked — the date input carries a max of today. */
const isoDay = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

function setDraftDate(d) {
  state.draft.date = startOfDay(d);
  drawDraft();
}

function drawDateRow() {
  const d = state.draft.date;
  const today = startOfDay(new Date());
  const offset = Math.round((today - d) / 864e5);

  document.querySelectorAll('.dchip').forEach(b =>
    b.setAttribute('aria-pressed', +b.dataset.off === offset));

  $('eDate').value = isoDay(d);
  $('eDate').max = isoDay(today);
  $('dLabel').textContent = offset === 0 ? 'Today'
    : offset === 1 ? 'Yesterday'
    : d.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
  $('dLabel').parentElement.setAttribute('aria-pressed', offset > 1);
}

document.querySelectorAll('.dchip').forEach(b => b.onclick = () => {
  const d = new Date();
  d.setDate(d.getDate() - (+b.dataset.off));
  setDraftDate(d);
});
$('eDate').addEventListener('change', () => {
  if (!$('eDate').value) return;
  const [y, m, day] = $('eDate').value.split('-').map(Number);
  setDraftDate(new Date(y, m - 1, day));
});

/* ---------- add sheet ---------- */
['1','2','3','4','5','6','7','8','9','00','0','⌫'].forEach(k => {
  const b = document.createElement('button');
  b.className = 'key'; b.textContent = k; b.type = 'button';
  b.onclick = () => {
    const d = state.draft;
    if (k === '⌫') d.val = d.val.slice(0, -1);
    else if (k === '00') { if (d.val && d.val.length < 6) d.val += '00'; }
    else if (d.val.length < 7) d.val += k;
    drawDraft();
  };
  $('pad').appendChild(b);
});

[5, 10, 20, 50].forEach(n => {
  const b = document.createElement('button');
  b.textContent = '+' + n; b.type = 'button';
  b.onclick = () => { const d = state.draft; d.val = String((parseFloat(d.val) || 0) + n); drawDraft(); };
  $('bump').appendChild(b);
});

$('seg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = state.draft;
  d.type = b.dataset.t; d.cat = CATS[d.type][0][0]; d.pay = PAYS[d.type][0];
  drawDraft();
});

function drawDraft() {
  const d = state.draft;
  $('disp').textContent = d.val ? CURRENCY + d.val : CURRENCY + '0';
  document.querySelectorAll('#seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === d.type));
  drawDateRow();

  $('tiles').innerHTML = CATS[d.type].map(([n, i]) =>
    '<button type="button" class="tile" data-c="' + n + '" aria-pressed="' + (n === d.cat) + '">' +
    '<span class="ic">' + chipHTML(n) + '</span><span class="tl">' + n + '</span></button>').join('');
  $('tiles').querySelectorAll('.tile').forEach(b => b.onclick = () => { d.cat = b.dataset.c; drawDraft(); });

  $('pays').innerHTML = PAYS[d.type].map(p =>
    '<button type="button" class="pill" data-p="' + p + '" aria-pressed="' + (p === d.pay) + '">' +
    '<span class="pico">' + (PAY_ICON[p] || '') + '</span>' + p + '</button>').join('');
  $('pays').querySelectorAll('.pill').forEach(b => b.onclick = () => { d.pay = b.dataset.p; drawDraft(); });

  const seen = new Set(), q = [];
  [...state.entries].sort((a, b) => b.at - a.at).forEach(e => {
    const k = e.cat + e.amt;
    if (e.type === d.type && !seen.has(k) && q.length < 4) { seen.add(k); q.push(e); }
  });
  $('quick').innerHTML = q.map(e =>
    '<button type="button" class="qc" data-c="' + e.cat + '" data-a="' + e.amt + '" data-p="' + e.pay + '">' +
    iconHTML(e.cat) + ' ' + e.cat + ' <span>' + money(e.amt) + '</span></button>').join('');
  $('quick').style.display = q.length ? '' : 'none';
  $('quick').querySelectorAll('.qc[data-c]').forEach(b => b.onclick = () => {
    d.cat = b.dataset.c; d.val = b.dataset.a; d.pay = b.dataset.p; drawDraft();
  });
}

$('save').onclick = () => {
  const d = state.draft, v = parseFloat(d.val);
  if (!v || v <= 0) { toast('Enter an amount first'); return; }
  const now = new Date();
  const at = new Date(d.date);
  at.setHours(now.getHours(), now.getMinutes(), 0, 0);
  state.entries.push({
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
    type: d.type, cat: d.cat, amt: roundEuro(v), pay: d.pay, at
  });
  saveEntries();
  markDirty(state.entries[state.entries.length - 1].id);
  closeSheet('sheet');
  render(true);
  const backdated = startOfDay(d.date).getTime() !== startOfDay(new Date()).getTime();
  const when = backdated ? ' on ' + d.date.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const dayInc = total(bucket('income', 'day'));
  toast(d.type === 'income'
    ? (backdated ? money(v) + ' from ' + d.cat + when
                 : money(v) + ' from ' + d.cat + ' · ' + money(dayInc) + ' today')
    : money(v) + ' ' + (d.type === 'business' ? 'business' : 'home') + ' cost recorded' + when);
};


/* ---------- entries screen ---------- */
let entFilter = 'all';
let editingId = null;

function renderEntries() {
  const rows = [...state.entries]
    .filter(e => entFilter === 'all' || e.type === entFilter)
    .sort((a, b) => b.at - a.at);

  if (!rows.length) {
    $('entList').innerHTML = '<div class="empty">Nothing here yet. ' +
      (entFilter === 'all' ? 'Tap + to log your first entry.' : 'No entries of this type.') + '</div>';
    return;
  }

  // group by calendar day
  const groups = [];
  let curKey = '', cur = null;
  rows.forEach(e => {
    const k = e.at.toDateString();
    if (k !== curKey) {
      curKey = k;
      cur = { date: e.at, items: [], inc: 0, out: 0 };
      groups.push(cur);
    }
    cur.items.push(e);
    if (e.type === 'income') cur.inc += e.amt; else cur.out += e.amt;
  });

  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 864e5).toDateString();

  $('entList').innerHTML = groups.map(g => {
    const k = g.date.toDateString();
    const label = k === today ? 'Today' : k === yest ? 'Yesterday'
      : g.date.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
    const net = g.inc - g.out;
    return '<div class="sec" style="margin-top:16px">' + label +
      '<span style="font-family:var(--mono);letter-spacing:0;text-transform:none;color:' +
      (net >= 0 ? 'var(--good)' : 'var(--bad)') + '">' + (net >= 0 ? '+' : '−') + money(Math.abs(net)) + '</span></div>' +
      g.items.map(entryRowHTML).join('');
  }).join('');

  wireSwipeRows($('entList'));
}

function openEdit(id, deleteFocus) {
  const e = state.entries.find(x => x.id === id);
  if (!e) return;
  editingId = id;
  $('editMeta').textContent = e.cat + ' · ' +
    e.at.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + e.pay;
  $('eAmt').value = e.amt;
  $('editModal').classList.add('on');
  $('editModal').setAttribute('aria-hidden', 'false');
  $('eDel').classList.toggle('armed', !!deleteFocus);
  if (deleteFocus) setTimeout(() => $('eDel').focus(), 60);
}
function closeEdit() {
  editingId = null;
  $('editModal').classList.remove('on');
  $('editModal').setAttribute('aria-hidden', 'true');
}
$('editModal').onclick = e => { if (e.target === $('editModal')) closeEdit(); };

$('eSave').onclick = () => {
  const e = state.entries.find(x => x.id === editingId);
  const v = parseFloat($('eAmt').value);
  if (!e || !v || v <= 0) { toast('Enter a valid amount'); return; }
  e.amt = roundEuro(v);
  saveEntries(); markDirty(e.id); closeEdit(); render();
  if ($('ent').classList.contains('up')) renderEntries();
  toast('Entry updated');
};

$('eDel').onclick = () => {
  const id = editingId;
  closeEdit();
  deleteEntry(id, true);
};

$('etabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  entFilter = b.dataset.f;
  document.querySelectorAll('#etabs button').forEach(x => x.setAttribute('aria-pressed', x === b));
  renderEntries();
});
$('closeEnt').onclick = () => closeSheet('ent');

/* ---------- sheets & nav ---------- */
function openSheet(id) {
  const s = $(id);
  s.classList.add('up'); s.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('locked');
}
function closeSheet(id) {
  const s = $(id);
  s.classList.remove('up'); s.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.sheet.up')) document.documentElement.classList.remove('locked');
}

$('openAdd').onclick = () => {
  state.draft = { type: 'income', cat: 'Income', pay: 'Cash', val: '', date: startOfDay(new Date()) };
  drawDraft(); openSheet('sheet');
};
$('closeAdd').onclick = () => closeSheet('sheet');
$('closeRep').onclick = () => closeSheet('rep');
$('closeMore').onclick = () => closeSheet('more');

document.querySelectorAll('.nb').forEach(b => b.onclick = () => {
  const go = b.dataset.go;
  document.querySelectorAll('.nb').forEach(x => x.classList.toggle('on', x === b));
  if (go === 'reports') { renderReport(); openSheet('rep'); }
  else if (go === 'entries') { renderEntries(); openSheet('ent'); }
  else if (go === 'more') {
    const n = state.entries.length;
    $('resetCount').textContent = n + ' entr' + (n === 1 ? 'y' : 'ies');
    const cc = ['income','business','personal'].reduce((a,t) => a + visibleCats(t).length, 0);
    $('catSummary').textContent = cc + ' in use';
    openSheet('more');
  }
  else { closeSheet('rep'); closeSheet('more'); closeSheet('ent'); }
});

$('tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  state.period = b.dataset.p;
  document.querySelectorAll('#tabs button').forEach(x => x.setAttribute('aria-pressed', x === b));
  render();
});
$('rtabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  state.rperiod = b.dataset.p;
  state.rOffset = 0;
  if (b.dataset.p === 'custom' && !$('rQuick').children.length) drawQuickRanges();
  document.querySelectorAll('#rtabs button').forEach(x => x.setAttribute('aria-pressed', x === b));
  renderReport();
});


/* ---------- pull-to-dismiss ----------
   Drag a sheet down to close it, the way native iOS sheets behave. The gesture
   only arms when the content is already scrolled to the top, so it never fights
   with normal scrolling — you scroll to the top, keep pulling, and the sheet
   follows your finger and closes. Releasing short of the threshold springs back. */
function enablePullToDismiss(id) {
  const sheet = $(id);
  if (!sheet) return;
  const scroller = sheet.querySelector('.sheet-scroll') || sheet.querySelector('.body');

  let startY = 0, startX = 0, dy = 0, active = false, axis = null, t0 = 0;

  const atTop = () => !scroller || scroller.scrollTop <= 0;

  sheet.addEventListener('touchstart', ev => {
    if (ev.touches.length !== 1 || !sheet.classList.contains('up')) { active = false; return; }
    if (!atTop()) { active = false; return; }
    const t = ev.touches[0];
    startY = t.clientY; startX = t.clientX;
    dy = 0; axis = null; active = true; t0 = Date.now();
  }, { passive: true });

  sheet.addEventListener('touchmove', ev => {
    if (!active) return;
    const t = ev.touches[0];
    const my = t.clientY - startY, mx = t.clientX - startX;

    if (axis === null && (Math.abs(my) > 6 || Math.abs(mx) > 6))
      axis = Math.abs(my) > Math.abs(mx) ? 'y' : 'x';
    if (axis !== 'y') return;

    // pulling up, or the user scrolled away from the top mid-gesture: stand down
    if (my <= 0 || !atTop()) {
      dy = 0; sheet.style.transform = ''; sheet.classList.remove('dragging');
      return;
    }

    ev.preventDefault();               // stop the page rubber-banding underneath
    sheet.classList.add('dragging');
    dy = my * 0.9;                     // slight resistance so it feels weighted
    sheet.style.transform = 'translateY(' + dy + 'px)';
  }, { passive: false });

  const release = () => {
    if (!active) return;
    active = false;
    sheet.classList.remove('dragging');
    const velocity = dy / Math.max(Date.now() - t0, 1);
    sheet.style.transform = '';
    // a long pull, or a short fast flick, both mean "close"
    if (dy > 120 || velocity > 0.5) closeSheet(id);
    dy = 0;
  };
  sheet.addEventListener('touchend', release);
  sheet.addEventListener('touchcancel', release);
}

/* Every sheet in the app, so a new one cannot be added without the gesture —
   the categories sheet was missed exactly that way. */
['sheet', 'rep', 'ent', 'more', 'cats', 'admin'].forEach(enablePullToDismiss);

/* ---------- targets ---------- */
function openTargets() {
  $('tD').value = state.targets.day; $('tW').value = state.targets.week; $('tM').value = state.targets.month;
  $('modal').classList.add('on'); $('modal').setAttribute('aria-hidden', 'false');
}
$('editT').onclick = openTargets;
$('editT2').onclick = openTargets;
$('modal').onclick = e => { if (e.target === $('modal')) closeTargets(); };
function closeTargets() { $('modal').classList.remove('on'); $('modal').setAttribute('aria-hidden', 'true'); }
$('saveT').onclick = () => {
  state.targets.day = +$('tD').value || state.targets.day;
  state.targets.week = +$('tW').value || state.targets.week;
  state.targets.month = +$('tM').value || state.targets.month;
  saveSettings(); pushSettings();
  closeTargets(); render(); toast('Targets updated');
};


/* ---------- reset all data ----------
   Deliberately two steps: open the confirm sheet, then type DELETE. A single-tap
   destroyer next to ordinary settings is how people lose a month of records. */
function openReset() {
  const n = state.entries.length;
  $('resetMeta').textContent = n === 0
    ? 'There are no entries to delete.'
    : 'This permanently deletes all ' + n + ' entr' + (n === 1 ? 'y' : 'ies') + ' on this device. Targets and theme are kept.';
  $('rConfirm').value = '';
  $('rGo').disabled = true;
  $('resetModal').classList.add('on');
  $('resetModal').setAttribute('aria-hidden', 'false');
}
function closeReset() {
  $('resetModal').classList.remove('on');
  $('resetModal').setAttribute('aria-hidden', 'true');
}
$('resetBtn').onclick = openReset;
$('rCancel').onclick = closeReset;
$('resetModal').onclick = e => { if (e.target === $('resetModal')) closeReset(); };
$('rConfirm').addEventListener('input', () => {
  $('rGo').disabled = $('rConfirm').value.trim().toUpperCase() !== 'DELETE';
});
$('rGo').onclick = () => {
  if ($('rConfirm').value.trim().toUpperCase() !== 'DELETE') return;
  const n = state.entries.length;
  state.entries.forEach(e => markDeleted(e.id));
  state.entries = [];
  saveEntries();
  closeReset();
  render();
  if (typeof renderEntries === 'function') renderEntries();
  toast(n + ' entr' + (n === 1 ? 'y' : 'ies') + ' deleted — starting fresh');
};


/* ---------- category manager ----------
   Categories live in Settings so the app fits the trade, not the other way
   round. Deleting is deliberately restricted: a category that has entries
   against it cannot simply vanish, because those entries would be left pointing
   at a name that no longer exists. It can be hidden instead — it disappears from
   the entry screen while history stays intact and readable. */

let catType = 'income';
let editingCat = null;          // the category being edited, or null when adding

const catCount = name => state.entries.filter(e => e.cat === name).length;

const TYPE_TITLE = { income: 'Income', business: 'Business expenses', personal: 'Home expenses' };

function openCats() {
  document.querySelectorAll('#catTabs button')
    .forEach(b => b.setAttribute('aria-pressed', b.dataset.t === catType));
  drawCats();
  openSheet('cats');
}

/* ---------- category list, with drag to reorder ----------
   Long-press a row and drag it up or down. The order is the order they appear
   on the entry screen, so the sources you use most can sit first.

   The drag deliberately needs a hold rather than starting immediately: the list
   scrolls, and a drag that engaged on contact would fight every scroll gesture. */
function drawCats() {
  const list = categories[catType];
  $('catList').innerHTML = list.map((c, i) => {
    const used = catCount(c.name);
    return '<div class="catRow' + (c.hidden ? ' hidden' : '') + '" data-i="' + i + '">' +
      '<button class="grip" aria-label="Hold and drag to reorder">' +
        '<svg viewBox="0 0 18 12" aria-hidden="true">' +
          '<rect x="0" y="0"  width="18" height="2" rx="1"/>' +
          '<rect x="0" y="5"  width="18" height="2" rx="1"/>' +
          '<rect x="0" y="10" width="18" height="2" rx="1"/>' +
        '</svg></button>' +
      chipHTML(c.name) +
      '<div class="catInfo"><div class="catName">' + c.name + '</div>' +
      '<div class="catMeta">' + (used ? used + (used === 1 ? ' entry' : ' entries') : 'Not used yet') +
        (c.hidden ? ' · hidden' : '') + '</div></div>' +
      '<button class="catEdit" data-act="edit" aria-label="Edit ' + c.name + '">Edit</button>' +
    '</div>';
  }).join('');

  $('catList').querySelectorAll('.catRow').forEach(row => {
    row.querySelector('[data-act="edit"]').onclick = () => openCatEdit(categories[catType][+row.dataset.i]);
    wireDrag(row);
  });
}

let dragRow = null, dragFrom = -1, dragY = 0, holdTimer = null, rowH = 0;

function wireDrag(row) {
  /* The drag starts on the handle rather than the whole row. Holding anywhere
     on a row is easy to do by accident while scrolling; the handle makes the
     gesture deliberate, and leaves the rest of the row free to be tapped. */
  const handle = row.querySelector('.grip');

  handle.addEventListener('touchstart', ev => {
    const t = ev.touches[0];
    dragY = t.clientY;
    holdTimer = setTimeout(() => {
      dragRow = row;
      dragFrom = +row.dataset.i;
      rowH = row.getBoundingClientRect().height;
      row.classList.add('dragging');
      if (navigator.vibrate) navigator.vibrate(12);   // confirms the hold took
    }, 320);
  }, { passive: true });

  handle.addEventListener('touchmove', ev => {
    if (!dragRow) { clearTimeout(holdTimer); return; }
    ev.preventDefault();                              // the list must not scroll mid-drag
    const dy = ev.touches[0].clientY - dragY;
    dragRow.style.transform = 'translateY(' + dy + 'px)';

    const steps = Math.round(dy / (rowH || 1));
    const target = Math.max(0, Math.min(categories[catType].length - 1, dragFrom + steps));
    if (target !== +dragRow.dataset.i) {
      // Move the item, then redraw once the finger lifts. Reordering the DOM
      // mid-gesture would pull the row out from under the touch.
      dragRow.dataset.pending = target;
    }
  }, { passive: false });

  const end = () => {
    clearTimeout(holdTimer);
    if (!dragRow) return;
    const to = dragRow.dataset.pending !== undefined ? +dragRow.dataset.pending : dragFrom;
    dragRow.classList.remove('dragging');
    dragRow.style.transform = '';
    delete dragRow.dataset.pending;
    dragRow = null;

    if (to !== dragFrom) {
      const arr = categories[catType];
      const [moved] = arr.splice(dragFrom, 1);
      arr.splice(to, 0, moved);
      saveSettings(); pushSettings();
      drawCats(); drawDraft();
    }
  };
  handle.addEventListener('touchend', end);
  handle.addEventListener('touchcancel', end);

  /* Desktop has no long-press, so the arrows in the edit sheet cover it there. */
}

/* Move up / down, for anyone who finds dragging fiddly — and the only route on
   a desktop browser. */
function moveCat(cat, delta) {
  const arr = categories[catType];
  const i = arr.indexOf(cat);
  const to = i + delta;
  if (i < 0 || to < 0 || to >= arr.length) return;
  arr.splice(i, 1);
  arr.splice(to, 0, cat);
  saveSettings(); pushSettings();
  drawCats(); drawDraft();
}

function openCatEdit(cat) {
  editingCat = cat || null;
  const c = cat || { name: '', icon: 'car', colour: 'blue' };

  $('catEditTitle').textContent = cat ? 'Edit category' : 'New ' + TYPE_TITLE[catType].toLowerCase() + ' category';
  $('cName').value = c.name;
  $('cIcon').value = c.icon;
  $('cColour').value = c.colour;

  $('cIcons').innerHTML = ICON_SET.map(([ic, label]) =>
    '<button type="button" class="icPick" data-ic="' + ic + '" aria-pressed="' + (ic === c.icon) + '" ' +
    'aria-label="' + label + '">' + (ic === 'car' ? TAXI_SVG : ic) + '</button>').join('');
  $('cIcons').querySelectorAll('.icPick').forEach(b => b.onclick = () => {
    $('cIcon').value = b.dataset.ic;
    $('cIcons').querySelectorAll('.icPick').forEach(x => x.setAttribute('aria-pressed', x === b));
    paintCatPreview();
  });

  $('cColours').innerHTML = Object.entries(PALETTE).map(([key, p]) =>
    '<button type="button" class="colPick" data-col="' + key + '" aria-pressed="' + (key === c.colour) + '" ' +
    'aria-label="' + key + '" style="background:' + p.bg + ';color:' + p.fg + '">A</button>').join('');
  $('cColours').querySelectorAll('.colPick').forEach(b => b.onclick = () => {
    $('cColour').value = b.dataset.col;
    $('cColours').querySelectorAll('.colPick').forEach(x => x.setAttribute('aria-pressed', x === b));
    paintCatPreview();
  });

  const used = cat ? catCount(cat.name) : 0;
  $('cMoveRow').hidden = !cat;
  if (cat) {
    const arr = categories[catType], i = arr.indexOf(cat);
    $('cUp').disabled = i <= 0;
    $('cDown').disabled = i >= arr.length - 1;
    $('cUp').onclick = () => { moveCat(cat, -1); closeCatEdit(); };
    $('cDown').onclick = () => { moveCat(cat, 1); closeCatEdit(); };
  }
  $('cHideBtn').hidden = !cat;
  $('cHideBtn').textContent = cat && cat.hidden ? 'Show on the entry screen' : 'Hide from the entry screen';
  $('cDelBtn').hidden = !cat;
  $('cDelBtn').disabled = false;
  $('cDelBtn').textContent = used > 0 ? 'Delete and move ' + used + (used === 1 ? ' entry' : ' entries') : 'Delete';
  $('cDelNote').textContent = !cat ? ''
    : used > 0
      ? 'You will be asked where to move its ' + used + (used === 1 ? ' entry' : ' entries') + ' first.'
      : '';
  $('cErr').textContent = '';
  paintCatPreview();

  $('catEditModal').classList.add('on');
  $('catEditModal').setAttribute('aria-hidden', 'false');
}

function paintCatPreview() {
  const p = PALETTE[$('cColour').value] || PALETTE.grey;
  const ic = $('cIcon').value;
  const ring = $('cColour').value === 'black' ? ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)' : '';
  $('cPreview').innerHTML =
    '<span class="chip" style="background:' + p.bg + ';color:' + p.fg + ring + '">' +
    (ic === 'car' ? TAXI_SVG : ic) + '</span>' +
    '<span class="prevName">' + ($('cName').value.trim() || 'Name') + '</span>';
}

function closeCatEdit() {
  $('catEditModal').classList.remove('on');
  $('catEditModal').setAttribute('aria-hidden', 'true');
  editingCat = null;
}

$('cSave').onclick = () => {
  const name = $('cName').value.trim();
  if (!name) { $('cErr').textContent = 'Give it a name.'; return; }

  const clash = categories[catType].some(c => c !== editingCat &&
    c.name.toLowerCase() === name.toLowerCase());
  if (clash) { $('cErr').textContent = 'You already have a category with that name.'; return; }

  if (editingCat) {
    const oldName = editingCat.name;
    editingCat.name = name;
    editingCat.icon = $('cIcon').value;
    editingCat.colour = $('cColour').value;
    // Entries store the category name, so a rename has to carry through or the
    // old entries would point at a category that no longer exists.
    if (oldName !== name) {
      state.entries.forEach(e => {
        if (e.cat === oldName) { e.cat = name; markDirty(e.id); }
      });
      saveEntries();
    }
  } else {
    categories[catType].push({
      name, icon: $('cIcon').value, colour: $('cColour').value, custom: true
    });
  }

  saveSettings(); pushSettings();
  closeCatEdit(); drawCats(); drawDraft(); render();
  toast(editingCat ? 'Category updated' : name + ' added');
};

$('cHideBtn').onclick = () => {
  if (!editingCat) return;
  editingCat.hidden = !editingCat.hidden;
  saveSettings(); pushSettings();
  closeCatEdit(); drawCats(); drawDraft();
  toast(editingCat && editingCat.hidden ? 'Hidden' : 'Shown again');
};

/* Deleting a category that has entries would leave them pointing at a name that
   no longer exists, so the entries are moved somewhere first. The user chooses
   where — silently dumping a month of fuel costs into "Other" is the kind of
   thing you only notice at tax time. */
let pendingDelete = null;

$('cDelBtn').onclick = () => {
  if (!editingCat) return;
  const used = catCount(editingCat.name);

  if (used === 0) {
    const name = editingCat.name;
    categories[catType] = categories[catType].filter(c => c !== editingCat);
    saveSettings(); pushSettings();
    closeCatEdit(); drawCats(); drawDraft(); render();
    toast(name + ' deleted');
    return;
  }

  pendingDelete = { cat: editingCat, type: catType, used };
  const others = categories[catType].filter(c => c !== editingCat);

  $('mvTitle').textContent = 'Delete ' + editingCat.name + '?';
  $('mvNote').textContent = 'It has ' + used + (used === 1 ? ' entry' : ' entries') +
    ' worth ' + money(state.entries.filter(e => e.cat === editingCat.name)
      .reduce((a, e) => a + e.amt, 0)) + '. Choose where they should go.';

  $('mvList').innerHTML = others.length
    ? others.map((c, i) =>
        '<button class="mvOpt" data-i="' + i + '">' + chipHTML(c.name) +
        '<span class="mvName">' + c.name + '</span></button>').join('')
    : '<div class="empty">There is no other category to move them to. Add one first.</div>';

  $('mvList').querySelectorAll('.mvOpt').forEach(b => b.onclick = () => finishDelete(others[+b.dataset.i].name));

  $('moveModal').classList.add('on');
  $('moveModal').setAttribute('aria-hidden', 'false');
};

function finishDelete(intoName) {
  if (!pendingDelete) return;
  const { cat, type, used } = pendingDelete;
  const from = cat.name;

  state.entries.forEach(e => {
    if (e.cat === from) { e.cat = intoName; markDirty(e.id); }
  });
  saveEntries();

  categories[type] = categories[type].filter(c => c !== cat);
  saveSettings(); pushSettings();

  pendingDelete = null;
  closeMove(); closeCatEdit(); drawCats(); drawDraft(); render();
  toast(from + ' deleted — ' + used + (used === 1 ? ' entry' : ' entries') + ' moved to ' + intoName);
}

function closeMove() {
  $('moveModal').classList.remove('on');
  $('moveModal').setAttribute('aria-hidden', 'true');
}
$('mvCancel').onclick = () => { pendingDelete = null; closeMove(); };
$('moveModal').onclick = e => { if (e.target === $('moveModal')) { pendingDelete = null; closeMove(); } };

$('cName').addEventListener('input', paintCatPreview);
$('catAdd').onclick = () => openCatEdit(null);
$('closeCats').onclick = () => closeSheet('cats');
$('catEditModal').onclick = e => { if (e.target === $('catEditModal')) closeCatEdit(); };
$('cCancel').onclick = closeCatEdit;
$('openCats').onclick = openCats;

$('catTabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  catType = b.dataset.t;
  document.querySelectorAll('#catTabs button').forEach(x => x.setAttribute('aria-pressed', x === b));
  drawCats();
});


/* ---------- admin dashboard ----------
   Reads aggregate figures from the admin-stats function. The card stays hidden
   for everyone else, and the function refuses anyone not listed in the admins
   table, so hiding the button is presentation rather than the security itself. */
let adminData = null;

/* Admin status is checked two ways, because either can fail on its own:
   the table read is blocked if the row-level policy does not match, and the
   function call fails if it is not deployed or errors at startup. Whichever
   succeeds is enough. The reason for a failure is kept so it can be shown
   rather than left as a blank space. */
let adminWhy = 'not checked yet';

async function checkAdmin() {
  const show = yes => {
    $('adminSec').hidden = !yes;
    $('adminCard').hidden = !yes;
    $('adminBtn').hidden = !yes;
  };

  if (!sb)      { adminWhy = 'No connection to the account service'; show(false); return; }
  if (!session) { adminWhy = 'Not signed in'; show(false); return; }

  let viaTable = false, tableErr = '';
  try {
    const { data, error } = await sb.from('admins')
      .select('user_id').eq('user_id', session.user.id).maybeSingle();
    if (error) tableErr = error.message;
    else if (data) viaTable = true;
    else tableErr = 'your account is not in the admins table';
  } catch (e) { tableErr = e.message || 'table read failed'; }

  let viaFn = false, fnErr = '';
  try {
    const { data, error } = await sb.functions.invoke('admin-stats');
    if (error) fnErr = error.message || 'function call failed';
    else if (data && data.ok) { viaFn = true; adminData = data; }
    else fnErr = (data && data.message) || 'function returned no data';
  } catch (e) { fnErr = e.message || 'function call failed'; }

  adminWhy = 'signed in as ' + session.user.email +
    '\nuid ' + session.user.id +
    '\ntable check: ' + (viaTable ? 'ok' : 'failed — ' + tableErr) +
    '\nfunction check: ' + (viaFn ? 'ok' : 'failed — ' + fnErr);

  const yes = viaTable || viaFn;
  show(yes);
  if (yes && adminData) $('adminPeek').textContent = adminData.users.total + ' users';
}

async function loadAdmin(quiet) {
  if (!sb || !session) return;
  if (!quiet) $('adminBody').innerHTML = '<div class="empty">Loading…</div>';
  try {
    const { data, error } = await sb.functions.invoke('admin-stats');
    if (error) throw error;
    if (!data || !data.ok) throw new Error((data && data.message) || 'Could not load');
    adminData = data;
    $('adminPeek').textContent = data.users.total + ' users';
    drawAdmin();
  } catch (err) {
    $('adminBody').innerHTML =
      '<div class="empty">Could not load the figures.<br><br>' +
      (err.message || '') + '</div>';
  }
}

/* Tap the version number five times to see why the admin check decided what it
   did. Hidden rather than absent, because a blank space tells you nothing when
   something is misconfigured. */
(function () {
  let taps = 0, timer = null;
  $('verOut').style.cursor = 'pointer';
  $('verOut').onclick = () => {
    taps++;
    clearTimeout(timer);
    timer = setTimeout(() => { taps = 0; }, 1200);
    if (taps >= 5) {
      taps = 0;
      alert('Admin check\n\n' + adminWhy);
    }
  };
})();

function drawAdmin() {
  if (!adminData) return;
  const d = adminData;

  const stat = (label, value, note) =>
    '<div class="aStat"><div class="aVal">' + value + '</div>' +
    '<div class="aLab">' + label + '</div>' +
    (note ? '<div class="aNote">' + note + '</div>' : '') + '</div>';

  const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '0%';

  $('adminBody').innerHTML =
    '<div class="sec">People</div>' +
    '<div class="aGrid">' +
      stat('Signed up', d.users.total, '+' + d.users.new_7d + ' this week') +
      stat('Opened it', d.users.signed_in_7d, 'last 7 days') +
      stat('Logged something', d.users.active_7d, 'last 7 days') +
    '</div>' +

    '<div class="sec">Did they stay</div>' +
    '<div class="card">' +
      row('Ever logged an entry', d.users.ever_logged + ' of ' + d.users.total,
          pct(d.users.ever_logged, d.users.total)) +
      row('Tried once, never again', d.retention.one_day_only, '') +
      row('Used it a few days', d.retention.few_days, '') +
      row('Logged on 7+ days', d.retention.seven_plus, '', true) +
    '</div>' +

    '<div class="sec">Entries</div>' +
    '<div class="aGrid">' +
      stat('Total', d.entries.total.toLocaleString(LOCALE), '+' + d.entries.added_7d + ' this week') +
      stat('Per user', d.entries.per_user, 'average') +
      stat('Active 30d', d.users.active_30d, 'people') +
    '</div>' +
    '<div class="card">' +
      row('Income', d.entries.income, pct(d.entries.income, d.entries.total)) +
      row('Business costs', d.entries.business, pct(d.entries.business, d.entries.total)) +
      row('Home costs', d.entries.personal, pct(d.entries.personal, d.entries.total)) +
    '</div>' +

    '<div class="sec">Sign-ups by week</div>' +
    '<div class="card">' +
      (d.signups_by_week.length
        ? d.signups_by_week.map(([wk, n]) =>
            row(new Date(wk).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }), n, '')).join('')
        : '<div class="empty">Nothing yet</div>') +
    '</div>';

  function row(label, value, extra, strong) {
    return '<div class="aRow"><span class="aRowL">' + label + '</span>' +
      '<span class="aRowV' + (strong ? ' good' : '') + '">' + value + '</span>' +
      (extra ? '<span class="aRowX">' + extra + '</span>' : '') + '</div>';
  }
}

const openAdminPanel = () => { openSheet('admin'); loadAdmin(false); };
$('openAdmin').onclick = openAdminPanel;
$('adminBtn').onclick = openAdminPanel;
$('closeAdmin').onclick = () => closeSheet('admin');
$('adminRefresh').onclick = () => loadAdmin(false);

/* ---------- theme ---------- */
function setSkin(s) {
  state.skin = s;
  document.documentElement.dataset.skin = s;
  $('themeName').textContent = s === 'night' ? 'Night' : 'Day';
  saveSettings();
}
const toggleSkin = () => setSkin(state.skin === 'night' ? 'day' : 'night');
$('themeBtn').onclick = toggleSkin;
$('themeBtn2').onclick = toggleSkin;

/* ---------- install ----------
   Android/Chrome fires beforeinstallprompt, which we capture and replay when the
   button is tapped — that opens the real system install dialog, so the icon really
   is added in one tap.

   iOS has no equivalent. WebKit does not implement beforeinstallprompt and Apple
   exposes no install API at all, so no script can add a home screen icon on an
   iPhone. The only route is Share → Add to Home Screen, by hand. The button
   therefore opens a step-by-step guide instead of pretending it can do it. */
let deferredPrompt = null;

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || !!navigator.standalone;
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isIOSSafari = () => isIOS() && !/crios|fxios|edgios|opios/i.test(navigator.userAgent);

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  $('installBtn').textContent = 'Add to home screen';
  $('installHelp').textContent =
    'Install the app so it opens full screen from your home screen, with no browser bar.';
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  refreshInstallCard();
  toast('Added to your home screen');
});

function refreshInstallCard() {
  if (isStandalone()) {
    $('installHelp').textContent = 'Installed and running as an app.';
    $('installBtn').style.display = 'none';
    return;
  }
  $('installBtn').style.display = '';
  if (isIOS()) {
    $('installBtn').textContent = isIOSSafari() ? 'Show me how' : 'How to install';
    $('installHelp').textContent = isIOSSafari()
      ? 'Opens full screen with no browser bar. Takes three taps.'
      : 'Open this page in Safari first — only Safari can add apps to the iPhone home screen.';
  } else {
    $('installBtn').textContent = 'Add to home screen';
    $('installHelp').textContent =
      'Install the app so it opens full screen from your home screen, with no browser bar.';
  }
}

$('installBtn').onclick = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') refreshInstallCard();
    else toast('You can add it any time from here');
    return;
  }
  if (isIOS()) {
    $('iosNote').textContent = isIOSSafari()
      ? ''
      : 'You are not in Safari. Tap the ••• menu, choose "Open in Safari", then follow these steps.';
    $('iosNote').style.display = isIOSSafari() ? 'none' : '';
    $('iosModal').classList.add('on');
    $('iosModal').setAttribute('aria-hidden', 'false');
    return;
  }
  toast(isStandalone() ? 'Already installed' : 'Use your browser menu to install');
};

function closeIos() {
  $('iosModal').classList.remove('on');
  $('iosModal').setAttribute('aria-hidden', 'true');
}
$('iosClose').onclick = closeIos;
$('iosModal').onclick = e => { if (e.target === $('iosModal')) closeIos(); };

refreshInstallCard();

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const e = $('toast');
  e.textContent = msg; e.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => e.classList.remove('on'), 2600);
}

/* ---------- service worker + auto update ----------
   Without this, a phone that has already cached the app keeps showing the old
   version after a deploy. updateViaCache:'none' forces the browser to fetch a
   fresh sw.js every time, and the controllerchange listener reloads the page
   once as soon as the new worker takes over. */
if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then(reg => {
        reg.update();
        // check again whenever the app is brought back to the foreground
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update();
        });
      })
      .catch(() => { /* offline support unavailable */ });
  });
}


/* ============================================================
   ACCOUNTS AND SYNC
   ------------------------------------------------------------
   Local-first. Every change is written to the phone immediately and
   the app never waits for the network — a driver in a tunnel must be
   able to log a fare. Syncing happens afterwards, in the background,
   and retries when the connection returns.
   ============================================================ */

let sb = null;                 // supabase client, null when offline or unconfigured
let session = null;            // current auth session
const DIRTY_KEY = 'seb.dirty.v1';
const TOMB_KEY  = 'seb.tombstones.v1';

let dirty = new Set();         // ids changed locally and not yet pushed
let tombstones = {};           // id -> ISO time of deletion

function loadQueue() {
  try { dirty = new Set(JSON.parse(localStorage.getItem(DIRTY_KEY) || '[]')); } catch (e) { dirty = new Set(); }
  try { tombstones = JSON.parse(localStorage.getItem(TOMB_KEY) || '{}'); } catch (e) { tombstones = {}; }
}
function saveQueue() {
  try {
    localStorage.setItem(DIRTY_KEY, JSON.stringify([...dirty]));
    localStorage.setItem(TOMB_KEY, JSON.stringify(tombstones));
  } catch (e) { /* storage full; the next sync will still catch up from local state */ }
}
function markDirty(id) { dirty.add(id); saveQueue(); scheduleFlush(); }
function markDeleted(id) { tombstones[id] = new Date().toISOString(); dirty.add(id); saveQueue(); scheduleFlush(); }

function initSupabase() {
  const cfg = window.SEB_CONFIG || {};
  if (!cfg.url || !cfg.anonKey || cfg.anonKey.indexOf('PASTE') === 0) return null;
  if (!window.supabase || !window.supabase.createClient) return null;   // CDN blocked or offline
  try {
    return window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
    });
  } catch (e) { return null; }
}

/* ---------- shape conversion ---------- */
const toRow = e => ({
  id: e.id,
  user_id: session.user.id,
  type: e.type,
  category: e.cat,
  amount: e.amt,
  pay_method: e.pay,
  occurred_at: e.at.toISOString(),
  deleted_at: tombstones[e.id] || null
});
const fromRow = r => ({
  id: r.id, type: r.type, cat: r.category === 'Fare' ? 'Income' : r.category,
  amt: roundEuro(Number(r.amount)), pay: r.pay_method || 'Cash',
  at: new Date(r.occurred_at)
});

/* ---------- push then pull ---------- */
let flushTimer = null, syncing = false;
function scheduleFlush() {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => syncNow(false), 800);
}

async function syncNow(full) {
  if (!sb || !session || syncing || !navigator.onLine) return;
  syncing = true;
  setAcctState('Syncing…');
  try {
    /* 1. push everything queued.
       Snapshot the queue first. Anything added while this runs must survive to
       the next sync, so only the ids actually pushed are cleared afterwards —
       clearing the whole set would silently drop a delete made mid-sync. */
    const queued = [...dirty];
    const rows = [], deletes = [];
    queued.forEach(id => {
      const e = state.entries.find(x => x.id === id);
      if (tombstones[id]) deletes.push({ id, deleted_at: tombstones[id] });
      else if (e) rows.push(toRow(e));
    });

    if (rows.length) {
      const { error } = await sb.from('entries').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    }

    /* Deletes are upserted, not updated. An update matches nothing when the row
       was created offline and never reached the server, so the tombstone would
       be dropped, the row would later be pushed by some other path, and the
       entry would reappear. Upsert writes the row as already-deleted either way. */
    const confirmed = [];
    for (const d of deletes) {
      const { error } = await sb.from('entries').upsert({
        id: d.id,
        user_id: session.user.id,
        type: 'business', category: 'deleted', amount: 0.01,
        occurred_at: d.deleted_at, deleted_at: d.deleted_at
      }, { onConflict: 'id' });
      if (error) throw error;
      confirmed.push(d.id);
    }

    queued.forEach(id => dirty.delete(id));
    saveQueue();

    // 2. pull the authoritative copy
    if (full) {
      const { data, error } = await sb.from('entries')
        .select('*').is('deleted_at', null).order('occurred_at', { ascending: false });
      if (error) throw error;

      /* Never accept a row we have a tombstone for. If a delete has not reached
         the server yet — offline, or a failure mid-push — the pull would
         otherwise hand the entry straight back, which is exactly the "deleted
         entries come back" symptom. */
      state.entries = (data || [])
        .filter(r => !tombstones[r.id])
        .map(fromRow);

      saveEntries();
      render();
      if ($('ent').classList.contains('up')) renderEntries();

      /* A tombstone is only safe to forget once the server has confirmed the
         delete AND the pull no longer returns that row. Keeping them forever
         would grow without limit; dropping them early lets rows return. */
      const live = new Set((data || []).map(r => r.id));
      confirmed.forEach(id => { if (!live.has(id)) delete tombstones[id]; });
      saveQueue();
    }

    // 3. settings
    await pushSettings();

    setAcctState('Signed in');
    if (full) toast('Synced — ' + state.entries.length + ' entries');
  } catch (err) {
    setAcctState('Sync pending');
    console.warn('sync failed:', err.message || err);
  } finally {
    syncing = false;
  }
}

async function pushSettings() {
  if (!sb || !session) return;
  await sb.from('settings').upsert({
    user_id: session.user.id,
    target_day: state.targets.day,
    target_week: state.targets.week,
    target_month: state.targets.month,
    skin: state.skin,
    categories
  }, { onConflict: 'user_id' });
}

async function pullSettings() {
  if (!sb || !session) return;
  const { data } = await sb.from('settings').select('*').eq('user_id', session.user.id).maybeSingle();
  if (data) {
    state.targets = { day: Number(data.target_day), week: Number(data.target_week), month: Number(data.target_month) };
    if (data.categories && data.categories.income) categories = data.categories;
    saveSettings();
  }
}

window.addEventListener('online', () => scheduleFlush());

/* ---------- account card ---------- */
function setAcctState(text) { const el = $('acctState'); if (el) el.textContent = text; }

function refreshAccountCard() {
  const signedIn = !!session;
  $('acctBtn').style.display   = signedIn ? 'none' : '';
  $('signOutBtn').style.display = signedIn ? '' : 'none';
  $('syncNowBtn').style.display = signedIn ? '' : 'none';

  if (!sb) {
    setAcctState('Offline mode');
    $('acctHelp').textContent = 'Accounts are unavailable right now. Your entries are saved on this phone.';
    $('acctBtn').style.display = 'none';
    return;
  }
  refreshIdentity();
  checkAdmin();
  if (signedIn) {
    setAcctState('Signed in');
    $('acctHelp').textContent = session.user.email +
      ' — your entries are backed up and appear on any device you sign in on.';
  } else {
    setAcctState('Not signed in');
    $('acctHelp').textContent = 'Sign in to back up your entries and use them on any device. ' +
      'Without an account they live only on this phone, and deleting the app deletes them.';
  }
}

/* ---------- auth sheet ---------- */
let authMode = 'signup';

function openAuth(mode) {
  authMode = mode || 'signup';
  paintAuth();
  $('authErr').textContent = '';
  $('authModal').classList.add('on');
  $('authModal').setAttribute('aria-hidden', 'false');
}
function closeAuth() {
  $('authModal').classList.remove('on');
  $('authModal').setAttribute('aria-hidden', 'true');
}
function paintAuth() {
  const signup = authMode === 'signup';
  $('authTitle').textContent = signup ? 'Create your account' : 'Welcome back';
  $('authSub').textContent = signup
    ? 'Your entries back up automatically and appear on every device you sign in on.'
    : 'Sign in and your entries come straight back.';
  $('nameField').style.display = signup ? '' : 'none';
  $('authGo').textContent = signup ? 'Create account' : 'Sign in';
  $('authSwitch').textContent = signup ? 'I already have an account' : 'Create a new account instead';
  $('authPass').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
}

$('acctBtn').onclick = () => openAuth('signup');
$('authClose').onclick = closeAuth;
$('authModal').onclick = e => { if (e.target === $('authModal')) closeAuth(); };
$('authSwitch').onclick = () => { authMode = authMode === 'signup' ? 'signin' : 'signup'; paintAuth(); $('authErr').textContent = ''; };

$('authGo').onclick = async () => {
  if (!sb) { $('authErr').textContent = 'No connection to the account service. Try again when you are online.'; return; }
  const name = $('authName').value.trim();
  const email = $('authEmail').value.trim();
  const pass = $('authPass').value;

  if (!email || email.indexOf('@') < 0) { $('authErr').textContent = 'Enter a valid email address.'; return; }
  if (pass.length < 8) { $('authErr').textContent = 'Password must be at least 8 characters.'; return; }
  if (authMode === 'signup' && !name) { $('authErr').textContent = 'Enter your name.'; return; }

  $('authGo').disabled = true;
  $('authGo').textContent = authMode === 'signup' ? 'Creating…' : 'Signing in…';
  $('authErr').textContent = '';

  try {
    let res;
    if (authMode === 'signup') {
      res = await sb.auth.signUp({ email, password: pass, options: { data: { name } } });
    } else {
      res = await sb.auth.signInWithPassword({ email, password: pass });
    }
    if (res.error) throw res.error;

    if (!res.data.session) {
      $('authErr').textContent = 'Check your email to confirm the account, then sign in.';
      return;
    }
    session = res.data.session;
    closeAuth();
    await afterSignIn(authMode === 'signup');
  } catch (err) {
    const m = (err.message || '').toLowerCase();
    $('authErr').textContent =
      m.includes('already registered') ? 'That email already has an account — try signing in instead.'
      : m.includes('invalid login') ? 'Email or password is not right.'
      : (err.message || 'Something went wrong. Try again.');
  } finally {
    $('authGo').disabled = false;
    paintAuth();
  }
};

async function afterSignIn(isNew) {
  refreshAccountCard();
  // Anything already on this phone belongs to this account now, so queue it all.
  state.entries.forEach(e => dirty.add(e.id));
  saveQueue();
  await pullSettings();
  await syncNow(true);
  render();
  toast(isNew ? 'Account created — your entries are backed up' : 'Signed in');
}

$('signOutBtn').onclick = async () => {
  if (dirty.size) { await syncNow(false); }
  if (dirty.size) {
    toast('Some entries have not backed up yet — try Sync now first');
    return;
  }
  await sb.auth.signOut();
  session = null;
  // The cloud copy is the safe one; leaving entries behind would merge them
  // into the next person who signs in on this phone.
  state.entries = [];
  tombstones = {}; dirty.clear();
  saveEntries(); saveQueue();
  refreshAccountCard(); render();
  toast('Signed out');
};

$('syncNowBtn').onclick = () => syncNow(true);


/* ---------- Google sign-in ----------
   Redirect flow rather than a popup: iOS Safari blocks popups aggressively and
   a home screen web app has no popup surface at all, so the redirect is the only
   route that works everywhere. The user leaves, approves, and comes back to the
   same URL with a session already established. */
$('googleBtn').onclick = async () => {
  if (!sb) { $('authErr').textContent = 'No connection to the account service.'; return; }
  $('googleBtn').disabled = true;
  $('authErr').textContent = '';
  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: { prompt: 'select_account' }
      }
    });
    if (error) throw error;
    // the browser navigates away here
  } catch (err) {
    $('googleBtn').disabled = false;
    $('authErr').textContent = err.message || 'Could not reach Google. Try again.';
  }
};

/* ---------- start ---------- */
async function initAuth() {
  loadQueue();
  sb = initSupabase();
  refreshAccountCard();
  if (!sb) return;
  const { data } = await sb.auth.getSession();
  session = data.session || null;
  refreshAccountCard();

  if (session) {
    // Anything logged on this phone before signing in belongs to this account.
    state.entries.forEach(e => dirty.add(e.id));
    saveQueue();
    await pullSettings();
    await syncNow(true);
    render();
  }

  // Clean the OAuth fragment out of the address bar so a refresh does not re-trigger it.
  if (window.location.hash && window.location.hash.indexOf('access_token') > -1) {
    history.replaceState(null, '', window.location.pathname);
  }

  sb.auth.onAuthStateChange(async (evt, s) => {
    const wasSignedOut = !session;
    session = s;
    refreshAccountCard();
    if (evt === 'SIGNED_IN' && wasSignedOut) {
      closeAuth();
      state.entries.forEach(e => dirty.add(e.id));
      saveQueue();
      await pullSettings();
      await syncNow(true);
      render();
      toast('Signed in as ' + (currentName() || s.user.email));
    }
  });
}




/* ---------- quick add ----------
   One tap opens the entry sheet already set to the right type and category.
   These four cover the overwhelming majority of what a driver logs. */
const QUICK = [
  { label: 'Add income', icon: '💶', type: 'income',   cat: 'Income',    cls: 'c-inc' },
  { label: 'Fuel',      icon: '⛽', type: 'business', cat: 'Fuel',      cls: 'c-biz' },
  { label: 'Repairs',   icon: '🔧', type: 'business', cat: 'Repairs',   cls: 'c-biz' },
  { label: 'Home cost', icon: '🏠', type: 'personal', cat: 'Groceries', cls: 'c-per' }
];

$('qacts').innerHTML = QUICK.map((q, i) =>
  '<button class="qact" data-q="' + i + '"><span class="qicon ' + q.cls + '">' + q.icon + '</span>' +
  '<span class="qlab">' + q.label + '</span></button>').join('');

$('qacts').querySelectorAll('.qact').forEach(b => b.onclick = () => {
  const q = QUICK[+b.dataset.q];
  state.draft = {
    type: q.type, cat: q.cat, pay: PAYS[q.type][0], val: '',
    date: startOfDay(new Date())
  };
  drawDraft();
  openSheet('sheet');
});

$('toReports').onclick = () => {
  document.querySelectorAll('.nb').forEach(x => x.classList.toggle('on', x.dataset.go === 'reports'));
  // Reports has no Day tab, so a jump from the home Day view lands on Week.
  state.rperiod = state.period === 'day' ? 'week' : state.period;
  state.rOffset = 0;
  document.querySelectorAll('#rtabs button').forEach(x =>
    x.setAttribute('aria-pressed', x.dataset.p === state.rperiod));
  renderReport();
  openSheet('rep');
};

/* ---------- identity in the header ----------
   The avatar was a hardcoded "ME" placeholder from the first prototype.
   It now shows the signed-in user's initials and opens Settings, or becomes a
   Sign in button when there is no account — which is more use than a dead badge. */
function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();          // one name, one letter
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();   // first and last
}

function currentName() {
  if (!session || !session.user) return '';
  const m = session.user.user_metadata || {};
  return m.name || m.full_name || (session.user.email || '').split('@')[0];
}

function refreshIdentity() {
  const av = $('avatar');
  if (!av) return;
  const name = currentName();

  if (session && name) {
    av.textContent = initials(name);
    av.classList.remove('signin');
    av.setAttribute('aria-label', name + ' — open settings');
    av.title = name;
  } else if (sb) {
    av.textContent = 'Sign in';
    av.classList.add('signin');
    av.setAttribute('aria-label', 'Sign in or create an account');
    av.title = '';
  } else {
    av.textContent = '';
    av.classList.remove('signin');
  }
  greet();
}

function greet() {
  // One short line. The full "Good afternoon, Arif" plus a date beneath it took
  // two rows out of the top of the screen and pushed quick add below the fold.
  const first = (currentName() || '').trim().split(/\s+/)[0] || '';
  $('hGreet').textContent = first ? 'Hi ' + first : 'Welcome back';
}

$('avatar').onclick = () => {
  if (session) {
    document.querySelectorAll('.nb').forEach(x => x.classList.toggle('on', x.dataset.go === 'more'));
    const n = state.entries.length;
    $('resetCount').textContent = n + ' entr' + (n === 1 ? 'y' : 'ies');
    const cc = ['income','business','personal'].reduce((a,t) => a + visibleCats(t).length, 0);
    $('catSummary').textContent = cc + ' in use';
    openSheet('more');
  } else if (sb) {
    openAuth('signin');
  }
};

/* ---------- pull to refresh ----------
   Drag the home screen down to pull fresh data from the database. Armed only
   when the page is already at the very top, so it never interferes with normal
   scrolling, and stood down if a sheet is open or a row is being swiped. */
(function () {
  const ind = $('ptr'), text = $('ptrText'), spin = $('ptrSpin'), content = $('homeBody');
  const THRESHOLD = 72, MAX = 110;
  let startY = 0, startX = 0, dy = 0, active = false, axis = null, busy = false;

  const scrollTop = () => window.scrollY || document.documentElement.scrollTop || 0;
  const sheetOpen = () => !!document.querySelector('.sheet.up') || !!document.querySelector('.modal.on');

  function show(msg, spinning) {
    text.textContent = msg;
    spin.classList.toggle('go', !!spinning);
    ind.classList.add('on');
  }
  function hide() {
    ind.classList.remove('on');
    spin.classList.remove('go');
  }
  function reset() {
    content.classList.remove('pulling');
    content.style.transform = '';
    dy = 0;
  }

  document.addEventListener('touchstart', ev => {
    if (busy || sheetOpen() || ev.touches.length !== 1 || scrollTop() > 0) { active = false; return; }
    startY = ev.touches[0].clientY;
    startX = ev.touches[0].clientX;
    dy = 0; axis = null; active = true;
  }, { passive: true });

  document.addEventListener('touchmove', ev => {
    if (!active) return;
    const my = ev.touches[0].clientY - startY;
    const mx = ev.touches[0].clientX - startX;

    if (axis === null && (Math.abs(my) > 6 || Math.abs(mx) > 6))
      axis = Math.abs(my) > Math.abs(mx) ? 'y' : 'x';
    if (axis !== 'y') return;                      // sideways: leave row swipes alone

    if (my <= 0 || scrollTop() > 0) { reset(); hide(); return; }

    ev.preventDefault();
    content.classList.add('pulling');
    dy = Math.min(my * 0.5, MAX);                  // heavy resistance, like a real pull
    content.style.transform = 'translateY(' + dy + 'px)';
    show(dy >= THRESHOLD ? 'Release to refresh' : 'Pull to refresh', false);
  }, { passive: false });

  async function refresh() {
    busy = true;
    reset();
    show(session ? 'Syncing…' : 'Refreshing…', true);
    try {
      if (session) {
        await syncNow(true);
        show(dirty.size ? 'Some changes still to upload' : 'Up to date', false);
      } else {
        render();
        show('Sign in to back up your entries', false);
      }
    } catch (e) {
      show('Could not sync — try again', false);
    }
    setTimeout(() => { hide(); busy = false; }, 1100);
  }

  const release = () => {
    if (!active) return;
    active = false;
    if (axis === 'y' && dy >= THRESHOLD) refresh();
    else { reset(); hide(); }
  };
  document.addEventListener('touchend', release);
  document.addEventListener('touchcancel', release);
})();

/* ---------- go ---------- */
loadQueue();          // tombstones must exist before entries are filtered against them
loadSettings();
state.entries = loadEntries();
// Anything relabelled from Fare needs re-uploading so the database matches.
state.entries.forEach(e => { if (e.cat === 'Income') dirty.add(e.id); });
setSkin(state.skin);
drawDraft();
render();
initAuth();
