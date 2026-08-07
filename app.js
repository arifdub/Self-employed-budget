/* Self Employed Budget — app.js — v0.1
   Entries live in memory only. Device storage arrives in v0.2. */

const APP_VERSION = '0.2.3';

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
  draft: { type: 'income', cat: 'Fare', pay: 'Cash', val: '' }
};

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
  $('list').innerHTML = rows.length ? rows.map(e =>
    '<div class="row"><div class="dot">' + (ICON[e.cat] || '•') + '</div><div><div class="rn">' + e.cat + '</div>' +
    '<div class="rs">' + e.at.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' }) + ' · ' + e.pay + '</div></div>' +
    '<div class="rv ' + (e.type === 'income' ? '' : 'neg') + '">' + (e.type === 'income' ? '+' : '−') + money(e.amt) + '</div></div>'
  ).join('') : '<div class="empty">Nothing logged yet today. Tap the + button to add your first job.</div>';
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
  $('hint').textContent = d.type === 'income' ? 'Counts towards today, this week and this month'
    : d.type === 'business' ? 'Comes off your net income'
    : 'Comes off your take-home only';
  $('tileLab').textContent = d.type === 'income' ? 'Where did it come from?'
    : d.type === 'business' ? 'What was the cost for?' : 'What was it for?';
  $('payLab').textContent = d.type === 'income' ? 'How was it paid?' : 'How did you pay?';

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
  $('quick').innerHTML = q.length
    ? q.map(e => '<button type="button" class="qc" data-c="' + e.cat + '" data-a="' + e.amt + '" data-p="' + e.pay + '">' +
      (ICON[e.cat] || '•') + ' ' + e.cat + ' <span>' + money(e.amt) + '</span></button>').join('')
    : '<span class="qc" style="border-style:dashed;color:var(--mut)">Your repeats will appear here</span>';
  $('quick').querySelectorAll('.qc[data-c]').forEach(b => b.onclick = () => {
    d.cat = b.dataset.c; d.val = b.dataset.a; d.pay = b.dataset.p; drawDraft();
  });
}

$('save').onclick = () => {
  const d = state.draft, v = parseFloat(d.val);
  if (!v || v <= 0) { toast('Enter an amount first'); return; }
  state.entries.push({
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
    type: d.type, cat: d.cat, amt: v, pay: d.pay, at: new Date()
  });
  closeSheet('sheet');
  render(true);
  const dayInc = total(bucket('income', 'day'));
  toast(d.type === 'income'
    ? money(v) + ' from ' + d.cat + ' · ' + money(dayInc) + ' today'
    : money(v) + ' ' + (d.type === 'business' ? 'business' : 'home') + ' cost recorded');
};

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
  state.draft = { type: 'income', cat: 'Fare', pay: 'Cash', val: '' };
  drawDraft(); openSheet('sheet');
};
$('closeAdd').onclick = () => closeSheet('sheet');
$('closeRep').onclick = () => closeSheet('rep');
$('closeMore').onclick = () => closeSheet('more');

document.querySelectorAll('.nb').forEach(b => b.onclick = () => {
  const go = b.dataset.go;
  document.querySelectorAll('.nb').forEach(x => x.classList.toggle('on', x === b));
  if (go === 'reports') { renderReport(); openSheet('rep'); }
  else if (go === 'more') {
    if (!$('diag')) {
      const wrap = document.createElement('div');
      wrap.innerHTML = '<div class="sec">Display info</div><div class="card" id="diag"></div>' +
        '<div class="crange" style="margin:-4px 0 8px">Screenshot this and send it over if the layout ' +
        'looks wrong — these are the numbers iOS is reporting.</div>';
      $('more').querySelector('.body').appendChild(wrap);
    }
    renderDiagnostics();
    openSheet('more');
  }
  else { closeSheet('rep'); closeSheet('more'); if (go === 'entries') toast('Full entry history arrives in v0.2'); }
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
  closeTargets(); render(); toast('Targets updated');
};

/* ---------- theme ---------- */
function setSkin(s) {
  state.skin = s;
  document.documentElement.dataset.skin = s;
  $('themeName').textContent = s === 'night' ? 'Night' : 'Day';
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
setSkin('night');
drawDraft();
render();
