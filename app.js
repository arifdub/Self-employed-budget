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

const APP_VERSION = '0.11.2';

/* ---------- config ---------- */
const CURRENCY = '€';
const LOCALE = 'en-IE';

const SOURCES = [['Income', ''], ['Free Now', 'FN'], ['Uber', 'U'], ['Others', '⋯']];
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


/* ---------- source and payment icons ----------
   Emoji cannot be recoloured, so the branded sources use an inline taxi glyph on
   a coloured chip instead: FREENOW red, Uber black. Uber's mark is black, which
   would disappear against a navy background, so the chip carries the black and
   the glyph sits on it in white. */
const TAXI_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M10 2.6h4v1.9h-4z"/>' +
  '<path d="M5 11l1.5-4.4A2.2 2.2 0 018.6 5h6.8a2.2 2.2 0 012.1 1.6L19 11h.4A1.6 1.6 0 0121 12.6V17a1 1 0 01-1 1h-1v.4a1.5 1.5 0 01-3 0V18H8v.4a1.5 1.5 0 01-3 0V18H4a1 1 0 01-1-1v-4.4A1.6 1.6 0 014.6 11H5zm2.3-.6h9.4l-1.1-3.1a.6.6 0 00-.6-.4H9a.6.6 0 00-.6.4L7.3 10.4zM6.6 15.2a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zm10.8 0a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z"/></svg>';

const CHIP = {
  'Income':   '<span class="chip c-income">€</span>',
  'Free Now': '<span class="chip c-freenow">' + TAXI_SVG + '</span>',
  'Uber':     '<span class="chip c-uber">' + TAXI_SVG + '</span>',
  'Others':   '<span class="chip c-others">⋯</span>'
};

const PAY_ICON = {
  'Cash': '💵', 'Card in car': '💳', 'App payout': '📲', 'Bank transfer': '🏦',
  'Invoice — unpaid': '🧾', 'Card': '💳', 'Direct debit': '🔁', 'On account': '📄'
};

const iconHTML = cat => CHIP[cat] || (ICON[cat] || '•');

/* ---------- state ---------- */
const state = {
  targets: { day: 200, week: 1200, month: 4800 },
  entries: [],
  period: 'day',
  rperiod: 'day',
  rOffset: 0,
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
      .map(e => (e.cat === 'Fare' ? { ...e, cat: 'Income' } : e));
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

function renderReport() {
  const p = state.rperiod, ref = refDate();
  const inc = bucket('income', p, ref), biz = bucket('business', p, ref), home = bucket('personal', p, ref);
  const I = total(inc), B = total(biz), H = total(home), net = I - B, take = net - H;

  $('rWhen').textContent = periodTitle(p, ref);
  $('rDate').value = isoDay(ref);
  $('rDate').max = isoDay(new Date());
  $('rNext').disabled = (state.rOffset || 0) <= 0;
  $('rToday').hidden = (state.rOffset || 0) === 0;
  $('rSub').textContent = rangeLabel(p, ref);

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

  breakdown('srcBrk', inc, I, false, 'No income recorded in this period');
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

function breakdown(id, obj, tot, isCost, emptyMsg) {
  const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  $(id).innerHTML = rows.length ? rows.map(([k, v]) =>
    '<div class="br"><div class="brt"><span class="l">' + k + '</span>' +
    '<span><span class="n">' + money(v) + '</span><span class="s">' + (tot ? Math.round(v / tot * 100) : 0) + '%</span></span></div>' +
    '<div class="brb' + (isCost ? ' cost' : '') + '"><i style="width:' + (tot ? v / tot * 100 : 0) + '%"></i></div></div>'
  ).join('') : '<div class="br"><div class="brt"><span class="l" style="color:var(--mut);font-weight:400">' + emptyMsg + '</span></div></div>';
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
    e.amt.toFixed(2)
  ]);
  const inc = rows.filter(e => e.type === 'income').reduce((a, e) => a + e.amt, 0);
  const biz = rows.filter(e => e.type === 'business').reduce((a, e) => a + e.amt, 0);
  const per = rows.filter(e => e.type === 'personal').reduce((a, e) => a + e.amt, 0);

  return [head, ...body, [],
    ['', '', '', '', 'Gross income', inc.toFixed(2)],
    ['', '', '', '', 'Business expenses', biz.toFixed(2)],
    ['', '', '', '', 'Net income', (inc - biz).toFixed(2)],
    ['', '', '', '', 'Personal & home', per.toFixed(2)],
    ['', '', '', '', 'Disposable income', (inc - biz - per).toFixed(2)]
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

function buildPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) return null;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 42;
  const eur = n => '\u20AC' + n.toFixed(2);
  let y = M;

  const ref = refDate(), p = state.rperiod;
  const year = ref.getFullYear();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text('SE Budget — income summary', M, y); y += 20;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(110);
  doc.text((currentName() || 'Self-employed') + '   ·   ' + rangeLabel(p, ref), M, y); y += 13;
  doc.text('Generated ' + new Date().toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' }), M, y);
  y += 24;
  doc.setTextColor(0);

  /* selected period */
  const I = total(bucket('income', p, ref));
  const B = total(bucket('business', p, ref));
  const H = total(bucket('personal', p, ref));

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(rangeLabel(p, ref), M, y); y += 6;
  doc.setDrawColor(210); doc.line(M, y, W - M, y); y += 16;

  doc.setFontSize(10.5);
  [['Gross income', I, false], ['Business expenses', -B, false], ['Net income', I - B, true],
   ['Personal & home expenses', -H, false], ['Disposable income', I - B - H, true]
  ].forEach(([label, val, bold]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, M, y);
    doc.text(eur(val), W - M, y, { align: 'right' });
    y += 16;
  });
  y += 12;

  /* month by month */
  const months = monthlyRows(year);
  if (months.length) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Month by month — ' + year, M, y); y += 6;
    doc.setDrawColor(210); doc.line(M, y, W - M, y); y += 15;

    const cols = [M, M + 140, M + 240, M + 330, M + 415, W - M];
    const head = ['Month', 'Gross', 'Business', 'Net', 'Personal', 'Disposable'];
    doc.setFontSize(9); doc.setTextColor(110);
    head.forEach((t, i) => doc.text(t, cols[i], y, { align: i === 0 ? 'left' : (i === 5 ? 'right' : 'right') }));
    doc.setTextColor(0); y += 12;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const tot = { inc: 0, biz: 0, net: 0, per: 0, disp: 0 };
    months.forEach(m => {
      if (y > doc.internal.pageSize.getHeight() - 90) { doc.addPage(); y = M; }
      doc.text(m.name, cols[0], y);
      [m.inc, m.biz, m.net, m.per, m.disp].forEach((v, i) => doc.text(eur(v), cols[i + 1], y, { align: 'right' }));
      tot.inc += m.inc; tot.biz += m.biz; tot.net += m.net; tot.per += m.per; tot.disp += m.disp;
      y += 14;
    });

    y += 2; doc.setDrawColor(180); doc.line(M, y, W - M, y); y += 14;
    doc.setFont('helvetica', 'bold');
    doc.text('Year to date', cols[0], y);
    [tot.inc, tot.biz, tot.net, tot.per, tot.disp].forEach((v, i) =>
      doc.text(eur(v), cols[i + 1], y, { align: 'right' }));
    y += 26;
  }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(130);
  doc.text('Net income is gross income less business expenses — the figure used for tax.', M, y); y += 11;
  doc.text('Disposable income is what remains after personal and household costs.', M, y); y += 11;
  doc.text('Prepared from records kept in SE Budget. Not a substitute for professional advice.', M, y);

  return doc;
}

async function exportPDF(forAccountant) {
  const doc = buildPDF();
  if (!doc) { toast('PDF tool did not load — check your connection'); return; }
  const ref = refDate();
  const name = 'SE-Budget-summary-' + isoDay(ref) + '.pdf';
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
  { type:'income',   cat:'Others',      words:['other income','others'] },
  { type:'business', cat:'Fuel',        words:['fuel','petrol','diesel','gas','filled up'] },
  { type:'business', cat:'Insurance',   words:['insurance'] },
  { type:'business', cat:'Repairs',     words:['repair','repairs','garage','mechanic','service','tyre','tyres','tire'] },
  { type:'business', cat:'Car wash',    words:['car wash','carwash','wash'] },
  { type:'business', cat:'Licence',     words:['licence','license','psv','permit'] },
  { type:'business', cat:'Phone',       words:['phone','mobile','data'] },
  { type:'business', cat:'Parking',     words:['parking','park'] },
  { type:'business', cat:'Tolls',       words:['toll','tolls','m50','motorway'] },
  { type:'personal', cat:'Groceries',   words:['groceries','grocery','shopping','food shop','tesco','lidl','aldi','dunnes'] },
  { type:'personal', cat:'Rent',        words:['rent','mortgage'] },
  { type:'personal', cat:'Utilities',   words:['utilities','electricity','gas bill','bills','bill','esb','heating'] },
  { type:'personal', cat:'Kids',        words:['kids','kid','school','children','childcare'] },
  { type:'personal', cat:'Eating out',  words:['eating out','lunch','dinner','coffee','takeaway','restaurant']},
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

/* ---------- microphone ---------- */
let recog = null, listening = false, pending = null;

function openVoice() {
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
  $('vHeard').textContent = text;
  handleHeard(text);
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
  state.entries.push({ id, type: p.type, cat: p.cat, amt: p.amount, pay: p.pay, at });
  saveEntries();
  markDirty(id);
  closeVoice();
  render(true);
  toast(money(p.amount) + ' · ' + p.cat + ' saved');
};

/* the button only appears where it can actually work */
if (!voiceSupported()) $('micBtn').style.display = 'none';
$('micBtn').onclick = openVoice;

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
    '<span class="ic">' + (CHIP[n] || i) + '</span><span class="tl">' + n + '</span></button>').join('');
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
    type: d.type, cat: d.cat, amt: v, pay: d.pay, at
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
  e.amt = v;
  saveEntries(); markDirty(e.id); closeEdit(); render();
  if ($('ent').classList.contains('up')) renderEntries();
  toast('Entry updated');
};

$('eDel').onclick = () => {
  const i = state.entries.findIndex(x => x.id === editingId);
  if (i < 0) return;
  const gone = state.entries[i];
  state.entries.splice(i, 1);
  saveEntries(); markDeleted(gone.id); closeEdit(); render();
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

['sheet', 'rep', 'ent', 'more'].forEach(enablePullToDismiss);

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
  amt: Number(r.amount), pay: r.pay_method || 'Cash',
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
    // 1. push everything queued
    const rows = [], deletes = [];
    dirty.forEach(id => {
      const e = state.entries.find(x => x.id === id);
      if (e) rows.push(toRow(e));
      else if (tombstones[id]) deletes.push({ id, user_id: session.user.id, deleted_at: tombstones[id] });
    });

    if (rows.length) {
      const { error } = await sb.from('entries').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    }
    for (const d of deletes) {
      const { error } = await sb.from('entries')
        .update({ deleted_at: d.deleted_at }).eq('id', d.id);
      if (error) throw error;
    }
    dirty.clear(); saveQueue();

    // 2. pull the authoritative copy
    if (full) {
      const { data, error } = await sb.from('entries')
        .select('*').is('deleted_at', null).order('occurred_at', { ascending: false });
      if (error) throw error;
      state.entries = (data || []).map(fromRow);
      saveEntries();
      render();
      if ($('ent').classList.contains('up')) renderEntries();
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
    skin: state.skin
  }, { onConflict: 'user_id' });
}

async function pullSettings() {
  if (!sb || !session) return;
  const { data } = await sb.from('settings').select('*').eq('user_id', session.user.id).maybeSingle();
  if (data) {
    state.targets = { day: Number(data.target_day), week: Number(data.target_week), month: Number(data.target_month) };
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
  state.rperiod = state.period;
  document.querySelectorAll('#rtabs button').forEach(x =>
    x.setAttribute('aria-pressed', x.dataset.p === state.period));
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
loadSettings();
state.entries = loadEntries();
// Anything relabelled from Fare needs re-uploading so the database matches.
state.entries.forEach(e => { if (e.cat === 'Income') dirty.add(e.id); });
setSkin(state.skin);
drawDraft();
render();
initAuth();
