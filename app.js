/* Self Employed Budget — app.js — v0.1
   Entries live in memory only. Device storage arrives in v0.2. */

/* ---------- crash guard ----------
   If anything throws while the app is starting, every button stops responding and
   the screen looks frozen with no clue why. This surfaces the error instead. */
window.addEventListener('error', ev => {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:9999;background:#FF7A66;' +
    'color:#20060a;font:600 12px/1.4 system-ui,sans-serif;padding:10px 14px;text-align:left';
  bar.textContent = 'App error: ' + (ev.message || 'unknown') +
    (ev.lineno ? ' (line ' + ev.lineno + ')' : '');
  if (document.body && !document.querySelector('[data-errbar]')) {
    bar.setAttribute('data-errbar', '1');
    document.body.appendChild(bar);
  }
});

const APP_VERSION = '0.4.1';

/* ---------- config ---------- */
const CURRENCY = '€';
const LOCALE = 'en-IE';

const SOURCES = [['Fare', '🚕'], ['Free Now', 'FN'], ['Uber', 'U'], ['Others', '⋯']];
const CATS = {
  income: SOURCES,
  business: [['Fuel', '⛽'], ['Insurance', '🛡'], ['Repairs', '🔧'], ['Car wash', '🫧'],
             ['Licence', '📄'], ['Phone', '📱'], ['Parking', '🅿️'], ['Tolls', '🛣'], ['Other', '➕']],
  personal: [['Groceries', '🧺'], ['Rent', '🏠'], ['Utilities', '💡'], ['Kids', '🎒'],
             ['Eating out', '🍽'], ['Transport', '🚌'], ['Health', '⚕️'], ['Other', '➕']]
};
const PAYS = {
  income: ['Cash', 'Card in car', 'App payout', 'Bank transfer', 'Invoice — unpaid'],
  business: ['Cash', 'Card', 'Direct debit', 'On account'],
  personal: ['Cash', 'Card', 'Direct debit']
};
const ICON = Object.fromEntries(Object.values(CATS).flat());

/* ---------- state ---------- */
const state = {
  targets: { day: 200, week: 1200, month: 4800 },
  entries: [],
  period: 'day',
  rperiod: 'day',
  skin: 'night',
  draft: { type: 'income', cat: 'Fare', pay: 'Cash', val: '',
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
      .filter(e => e.id && e.amt > 0 && !isNaN(e.at));
  } catch (err) {
    return [];
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      targets: state.targets, skin: state.skin
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
  } catch (err) { /* defaults stand */ }
}

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const money = n => CURRENCY + (Math.round(n * 100) / 100).toLocaleString(LOCALE, {
  minimumFractionDigits: Math.round(n * 100) % 100 ? 2 : 0, maximumFractionDigits: 2
});
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
  if (p === 'day')   return { from: startOfDay(now),   to: addDays(startOfDay(now), 1) };
  if (p === 'week')  return { from: startOfWeek(now),  to: addDays(startOfWeek(now), 7) };
  if (p === 'month') return { from: startOfMonth(now), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  return { from: startOfYear(now), to: new Date(now.getFullYear() + 1, 0, 1) };
}
function rangeLabel(p, now = new Date()) {
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
function bucket(type, p) {
  const r = periodRange(p), out = {};
  state.entries.filter(e => e.type === type && inRange(e, r)).forEach(e => { out[e.cat] = (out[e.cat] || 0) + e.amt; });
  return out;
}
const total = o => Object.values(o).reduce((a, b) => a + b, 0);
const countOf = (type, p) => state.entries.filter(e => e.type === type && inRange(e, periodRange(p))).length;

/* ---------- gauge ticks ---------- */
(function buildTicks() {
  const g = $('ticks'), cx = 111, cy = 104, N = 30;
  for (let i = 0; i <= N; i++) {
    const a = (135 + 270 * i / N) * Math.PI / 180;
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', cx + 96 * Math.cos(a)); l.setAttribute('y1', cy + 96 * Math.sin(a));
    l.setAttribute('x2', cx + 102 * Math.cos(a)); l.setAttribute('y2', cy + 102 * Math.sin(a));
    l.setAttribute('class', 'tick'); l.dataset.i = i; g.appendChild(l);
  }
})();


/* ---------- swipeable entry rows ----------
   One builder used by both the home Today list and the Entries screen.
   Swipe left to reveal Edit and Delete; tapping the row also opens Edit.
   Delete here asks for one confirm via the edit sheet's Delete, so a stray
   swipe cannot destroy an entry silently. */
function entryRowHTML(e) {
  return '<div class="swipe-wrap" data-eid="' + e.id + '">' +
    '<div class="swipe-actions">' +
      '<button class="swact edit" data-act="edit" aria-label="Edit entry">Edit</button>' +
      '<button class="swact del" data-act="del" aria-label="Delete entry">Delete</button>' +
    '</div>' +
    '<div class="row swipe-row" tabindex="0">' +
      '<span class="dot">' + (ICON[e.cat] || '•') + '</span>' +
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
      dx = Math.min(0, Math.max(-140, mx));
      row.style.transform = 'translateX(' + dx + 'px)';
    }, { passive: true });

    row.addEventListener('touchend', () => {
      dragging = false;
      row.style.transition = '';
      if (dx < -60) {
        closeOpenSwipe();
        row.style.transform = 'translateX(-132px)';
        wrap.classList.add('swiped');
        openSwipe = row;
      } else {
        row.style.transform = '';
        wrap.classList.remove('swiped');
        if (openSwipe === row) openSwipe = null;
        // A plain tap deliberately does nothing on touch devices — entries are
        // touched accidentally far too often in a moving car. Edit and Delete
        // are reachable only through the swipe actions.
      }
      dx = 0;
    });

    // desktop / non-touch: click opens edit
    row.addEventListener('click', ev => {
      if (!('ontouchstart' in window)) openEdit(id);
    });

    wrap.querySelectorAll('.swact').forEach(b => b.addEventListener('click', ev => {
      ev.stopPropagation();
      closeOpenSwipe();
      if (b.dataset.act === 'edit') openEdit(id);
      else openEdit(id, true);
    }));
  });
}
document.addEventListener('touchstart', ev => {
  if (openSwipe && !ev.target.closest('.swipe-wrap')) closeOpenSwipe();
}, { passive: true });

/* ---------- render: home ---------- */
function render(flash) {
  const now = new Date();
  const cssV = (getComputedStyle(document.documentElement)
    .getPropertyValue('--css-version') || '').trim().replace(/['"]/g, '');
  const stamp = (cssV && cssV !== APP_VERSION) ? ' · v' + APP_VERSION + ' css' + cssV
                                               : ' · v' + APP_VERSION;
  $('hDate').textContent = now.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })
    + stamp;
  const h = now.getHours();
  $('hGreet').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

  const P = state.period;
  const val = total(bucket('income', P));
  const tgt = state.targets[P];
  const jobs = countOf('income', P);
  const label = P === 'day' ? 'today' : P === 'week' ? 'this week' : 'this month';
  const pct = tgt ? Math.min(val / tgt, 1) : 0;
  const pctN = tgt ? Math.round(val / tgt * 100) : 0;

  $('fill').setAttribute('stroke-dasharray', (395.8 * pct) + ' 528');
  $('fill').style.stroke = val >= tgt ? 'var(--good)' : 'var(--acc)';
  $('gAmt').textContent = money(val);
  $('gOf').textContent = 'of ' + money(tgt) + ' ' + label;
  $('gPct').textContent = val >= tgt ? 'Target hit · ' + pctN + '%' : pctN + '%';
  document.querySelectorAll('.tick').forEach(t => t.classList.toggle('hot', (+t.dataset.i) / 30 <= pct));

  $('sJobs').textContent = jobs;
  $('sAvg').textContent = money(jobs ? val / jobs : 0);
  $('kLeft').textContent = val >= tgt ? 'Over' : 'To go';
  $('sLeft').textContent = money(Math.abs(tgt - val));

  drawTargetCard('w', 'week', now);
  drawTargetCard('m', 'month', now);
  drawWeekBars(now);
  drawList();

  $('tSummary').textContent = money(state.targets.day) + ' / day';
  $('verOut').textContent = 'v' + APP_VERSION;

  if (flash) ['cWeek', 'cMonth'].forEach(id => {
    const c = $(id); c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 900);
  });

  renderReport();
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

function drawWeekBars(now) {
  const from = startOfWeek(now), tgt = state.targets.day;
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i), r = { from: d, to: addDays(d, 1) };
    days.push({
      l: d.toLocaleDateString(LOCALE, { weekday: 'narrow' }),
      v: state.entries.filter(e => e.type === 'income' && inRange(e, r)).reduce((a, e) => a + e.amt, 0),
      today: startOfDay(d).getTime() === startOfDay(now).getTime()
    });
  }
  const max = Math.max(tgt * 1.3, ...days.map(x => x.v));
  $('hist').innerHTML = '<div class="goalline" style="top:' + (76 - (tgt / max) * 58 - 12) + 'px"></div>' +
    days.map(x => '<div class="dayw"><div class="hb ' + (x.today ? 'today' : x.v >= tgt ? 'hit' : '') +
      '" style="height:' + Math.max((x.v / max) * 58, 2) + 'px"></div><div class="dl">' + x.l + '</div></div>').join('');
}

function drawList() {
  const r = periodRange('day');
  const rows = state.entries.filter(e => inRange(e, r)).sort((a, b) => b.at - a.at);
  $('list').innerHTML = rows.length
    ? rows.map(entryRowHTML).join('')
    : '<div class="empty">Nothing logged yet today. Tap the + button to add your first job.</div>';
  wireSwipeRows($('list'));
}

/* ---------- render: reports ---------- */
function renderReport() {
  const p = state.rperiod;
  const inc = bucket('income', p), biz = bucket('business', p), home = bucket('personal', p);
  const I = total(inc), B = total(biz), H = total(home), net = I - B, take = net - H;

  $('rWhen').textContent = rangeLabel(p);
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
  $('pBiz').textContent = I ? Math.round(B / I * 100) + '% of income — fuel, repairs, insurance, licence' : '';
  $('pHome').textContent = I ? Math.round(H / I * 100) + '% of income — rent, food, bills, family' : '';
  $('pTake').textContent = I ? 'What you actually kept this ' + p : 'Log some income to see this';

  breakdown('srcBrk', inc, I, false, 'No income recorded in this period yet');
  breakdown('bizBrk', biz, B, true, 'No business costs recorded yet');
  breakdown('homeBrk', home, H, true, 'No home costs recorded yet');
}

function breakdown(id, obj, tot, isCost, emptyMsg) {
  const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  $(id).innerHTML = rows.length ? rows.map(([k, v]) =>
    '<div class="br"><div class="brt"><span class="l">' + k + '</span>' +
    '<span><span class="n">' + money(v) + '</span><span class="s">' + (tot ? Math.round(v / tot * 100) : 0) + '%</span></span></div>' +
    '<div class="brb' + (isCost ? ' cost' : '') + '"><i style="width:' + (tot ? v / tot * 100 : 0) + '%"></i></div></div>'
  ).join('') : '<div class="br"><div class="brt"><span class="l" style="color:var(--mut);font-weight:400">' + emptyMsg + '</span></div></div>';
}


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
['1','2','3','4','5','6','7','8','9','.','0','⌫'].forEach(k => {
  const b = document.createElement('button');
  b.className = 'key'; b.textContent = k; b.type = 'button';
  b.onclick = () => {
    const d = state.draft;
    if (k === '⌫') d.val = d.val.slice(0, -1);
    else if (k === '.' && d.val.includes('.')) { /* ignore */ }
    else if (k === '.' && !d.val) d.val = '0.';
    else if (d.val.replace('.', '').length < 7) {
      const next = d.val + k;
      if (!/\.\d{3,}$/.test(next)) d.val = next;
    }
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
    '<span class="ic">' + i + '</span><span class="tl">' + n + '</span></button>').join('');
  $('tiles').querySelectorAll('.tile').forEach(b => b.onclick = () => { d.cat = b.dataset.c; drawDraft(); });

  $('pays').innerHTML = PAYS[d.type].map(p =>
    '<button type="button" class="pill" data-p="' + p + '" aria-pressed="' + (p === d.pay) + '">' + p + '</button>').join('');
  $('pays').querySelectorAll('.pill').forEach(b => b.onclick = () => { d.pay = b.dataset.p; drawDraft(); });

  const seen = new Set(), q = [];
  [...state.entries].sort((a, b) => b.at - a.at).forEach(e => {
    const k = e.cat + e.amt;
    if (e.type === d.type && !seen.has(k) && q.length < 4) { seen.add(k); q.push(e); }
  });
  $('quick').innerHTML = q.map(e =>
    '<button type="button" class="qc" data-c="' + e.cat + '" data-a="' + e.amt + '" data-p="' + e.pay + '">' +
    (ICON[e.cat] || '•') + ' ' + e.cat + ' <span>' + money(e.amt) + '</span></button>').join('');
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
    type: d.type, cat: d.cat, amt: v, pay: d.pay, at
  });
  saveEntries();
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
  e.amt = v;
  saveEntries(); closeEdit(); render();
  if ($('ent').classList.contains('up')) renderEntries();
  toast('Entry updated');
};

$('eDel').onclick = () => {
  const i = state.entries.findIndex(x => x.id === editingId);
  if (i < 0) return;
  const gone = state.entries[i];
  state.entries.splice(i, 1);
  saveEntries(); closeEdit(); render();
  if ($('ent').classList.contains('up')) renderEntries();
  toast(money(gone.amt) + ' ' + gone.cat + ' deleted');
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
  state.draft = { type: 'income', cat: 'Fare', pay: 'Cash', val: '', date: startOfDay(new Date()) };
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
    if (!$('diag')) {
      const wrap = document.createElement('div');
      wrap.innerHTML = '<div class="sec">Display info</div><div class="card" id="diag"></div>' +
        '<div class="crange" style="margin:-4px 0 8px">Screenshot this and send it over if the layout ' +
        'looks wrong — these are the numbers iOS is reporting.</div>';
      $('more').querySelector('.body').appendChild(wrap);
    }
    renderDiagnostics();
    const n = state.entries.length;
    $('resetCount').textContent = n + ' entr' + (n === 1 ? 'y' : 'ies');
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
  document.querySelectorAll('#rtabs button').forEach(x => x.setAttribute('aria-pressed', x === b));
  renderReport();
});
$('rPrev').onclick = () => toast('Browsing past periods arrives in v0.7');
document.querySelectorAll('.exp button').forEach(b => b.onclick = () => toast('Exports arrive in v0.8'));

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
  saveSettings();
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
  state.entries = [];
  saveEntries();
  closeReset();
  render();
  if (typeof renderEntries === 'function') renderEntries();
  toast(n + ' entr' + (n === 1 ? 'y' : 'ies') + ' deleted — starting fresh');
};

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

/* ---------- install prompt ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  $('installBtn').textContent = 'Add to home screen';
});
$('installBtn').onclick = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    toast(outcome === 'accepted' ? 'Added to your home screen' : 'You can add it any time');
  } else if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
    toast('Self Employed Budget is already installed');
  } else {
    toast('On iPhone: tap Share, then Add to Home Screen');
  }
};
if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
  $('installHelp').textContent = 'Self Employed Budget is installed and running as an app.';
  $('installBtn').style.display = 'none';
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const e = $('toast');
  e.textContent = msg; e.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => e.classList.remove('on'), 2600);
}

/* ---------- display diagnostics ----------
   iOS reports several different heights and they disagree in standalone mode.
   This panel shows the actual numbers so the next fix is aimed, not guessed. */
function renderDiagnostics() {
  const el = $('diag');
  if (!el) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || !!navigator.standalone;
  const vv = window.visualViewport;
  const probe = getComputedStyle(document.createElement('div'));
  const safeB = getComputedStyle(document.documentElement).getPropertyValue('--safe-b').trim();
  const navRect = document.querySelector('.nav').getBoundingClientRect();

  const rows = [
    ['Standalone', standalone ? 'yes' : 'no (in browser)'],
    ['screen.height', Math.round(window.screen.height)],
    ['innerHeight', Math.round(window.innerHeight)],
    ['visualViewport', vv ? Math.round(vv.height) : 'n/a'],
    ['documentElement', Math.round(document.documentElement.clientHeight)],
    ['safe-area-bottom', safeB || '0px'],
    ['nav bottom edge', Math.round(navRect.bottom)],
    ['app height', Math.round(document.querySelector('.app').getBoundingClientRect().height)],
    ['deficit', Math.round(window.screen.height - window.innerHeight)]
  ];

  el.innerHTML = rows.map(([k, v]) =>
    '<div class="crow" style="padding:5px 0"><span class="clab">' + k + '</span>' +
    '<span class="cval" style="font-size:14px">' + v + '</span></div>').join('');
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

/* ---------- go ---------- */
loadSettings();
state.entries = loadEntries();
setSkin(state.skin);
drawDraft();
render();
