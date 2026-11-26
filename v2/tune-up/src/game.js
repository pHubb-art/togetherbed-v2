const RULES = __RULES__;
const COLS = ['rule_id','status','chapter','question','answer','zone','layer','effect','current_value','unit','team_weight','team_notes','plain_explanation','source'];
const ROUND = 20;
const GENERIC = new Set(['Any', 'Everyone', 'Both', 'Both true']);
const STARTERS = ['POS-SIDE-01', 'SOR-SHO-01', 'NEW-24'];
const NAMES = ['Maya', 'Sam', 'Jordan', 'Priya', 'Luis', 'Noor', 'Kai', 'Imani', 'Theo', 'Jun', 'Dana', 'Remy'];
/* size choices: [label, hint, feel steps, strength 0-3] */
const FEEL_SIZES = [['A touch', 'A quarter step', .25, 1], ['Half a step', '', .5, 1.5], ['A full step', 'Like Medium to Plush', 1, 2], ['Two steps', 'Like Firm to Plush', 2, 3]];
const PULL_SIZES = [['A nudge', 'One voice among many', 0, 1], ['A real pull', 'Usually wins', 0, 2], ['It decides', 'Outranks the body answers', 0, 3]];
/* sleeper presets for built rules: [field, what is different, compared with] */
const SAME = 'a back sleeper with the same body', AVG = 'a sleeper with an average frame', NOSORE = 'the same sleeper with no sore spots';
const SIDE = ['sleeps', 'Sleeps on the side', SAME], STOM = ['sleeps', 'Sleeps on the stomach', SAME];
const MALE = ['frame', 'Typical male frame, broader shoulders', AVG], FEM = ['frame', 'Typical female frame, fuller hips', AVG];
const SHO = ['frame', 'Very broad shoulders', 'a sleeper with average shoulders'], HIP = ['frame', 'Very wide hips', 'a sleeper with average hips'], CRV = ['frame', 'Very curvy waist and seat', 'a sleeper with an average shape'];
const BMI = ['build', 'Heavier build: 5’8”, 224 lb', 'the same sleeper at 158 lb'];
const sore = w => ['sore', 'Wakes up with ' + w, NOSORE];
const P = {
  'POS-SIDE-01': SIDE, 'POS-SIDE-02': SIDE, 'POS-SIDE-03': SIDE, 'POS-STOM-01': STOM, 'POS-STOM-02': STOM, 'POS-STOM-03': STOM, 'POS-STOM-04': STOM,
  'FRM-MALE-01': MALE, 'FRM-MALE-02': MALE, 'FRM-MALE-03': MALE, 'FRM-MALE-04': ['frame', 'Typical male frame with narrow hips', AVG], 'FRM-FEM-01': FEM, 'FRM-FEM-02': FEM,
  'SHP-SHO-01': SHO, 'SHP-SHO-02': SHO, 'SHP-HIP-01': HIP, 'SHP-HIP-02': HIP, 'SHP-CRV-01': CRV, 'SHP-CRV-02': CRV, 'SHP-LEG-01': ['frame', 'Very long legs', 'a sleeper with average legs'],
  'WGT-BMI-01': BMI, 'WGT-BMI-02': BMI, 'WGT-BMI-03': BMI, 'WGT-BMI-04': BMI, 'WGT-BMI-05': ['build', 'Heavy build: 5’8”, 205 lb', 'the same sleeper at 158 lb'], 'WGT-BMI-06': ['build', 'Very heavy build: 5’8”, 270 lb', 'the same sleeper at 158 lb'],
  'SOR-SHO-01': sore('sore shoulders'), 'SOR-HIP-01': sore('sore hips'), 'SOR-HIP-02': sore('sore hips'), 'SOR-BCK-01': sore('a stiff lower back'), 'SOR-BCK-02': sore('a stiff lower back'), 'SOR-BCK-03': sore('a stiff lower back'), 'SOR-KNE-01': sore('sore knees')
};
const AGREE_NEW = new Set(['NEW-01','NEW-07','NEW-12','NEW-24','NEW-25','NEW-27','NEW-28','NEW-29','NEW-30','NEW-31','NEW-32','NEW-34','NEW-35','NEW-36','NEW-37','NEW-38']);
RULES.forEach((r, i) => {
  const num = typeof r.current_value === 'number' && r.current_value !== 0, built = r.status === 'Built';
  r.dir = /soft/i.test(r.effect) ? 'softer' : 'firmer';
  r.who = NAMES[i % NAMES.length];
  if (built) { if (P[r.rule_id]) { r.kind = 'feel'; r.fixed = !num; r.p = P[r.rule_id]; } else r.kind = num ? 'tune' : 'agree'; }
  else if (AGREE_NEW.has(r.rule_id)) r.kind = 'agree';
  else r.kind = /^(Softer|Firmer|One step)/.test(r.effect) ? 'feel' : 'pull';
  r.step = r.layer === 'Support' ? 0.28 : r.layer === 'Comfort' ? 0.26 : 0.27;
  r.mult = r.unit.startsWith('score points across') ? 2 : 1;      /* asked against an average sleeper = half the range */
  r.per = r.unit.startsWith('score points per BMI') ? 10 : 1;     /* asked for a sleeper ten BMI points heavier */
});
const BY_ID = Object.fromEntries(RULES.map(r => [r.rule_id, r]));

const S = { db: null, uid: null, mode: 'loading', name: '', mine: {}, team: {}, session: 0, skipped: new Set(), revisited: new Set(), cur: null, phase: 'intro', filter: 'All', saving: false, dirty: false, isOwner: false };
const $ = id => document.getElementById(id);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) { const v = attrs[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v === true ? '' : v); }
  for (const kid of kids.flat(3)) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return e;
}
const fmt = v => { const a = Math.abs(v); const d = a >= 10 ? 1 : a >= 1 ? 2 : 3; return String(parseFloat(v.toFixed(d))); };
const pc = x => Math.round(x * 100);
const ls = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

/* ---------- scoring ---------- */
function scaled(r, f) { const base = r.unit.startsWith('times') ? 1 : 0; return base + (r.current_value - base) * f; }
function cleanVote(r, a) {
  if (!a || typeof a !== 'object') return null;
  const sz = n => Number.isInteger(a.s) && a.s >= 0 && a.s < n;
  if (r.kind === 'tune') return ['less', 'right', 'more'].includes(a.c) ? a : null;
  if (r.kind === 'agree') return ['keep', 'drop'].includes(a.c) ? a : null;
  if (r.kind === 'pull') return a.c === 'no' || (a.c === 'yes' && sz(3)) ? a : null;
  return a.c === 'same' || (['softer', 'firmer'].includes(a.c) && (r.fixed || sz(4))) ? a : null;
}
function votesFor(r) {
  const out = [];
  for (const uid in S.team) { const p = S.team[uid]; const a = cleanVote(r, (p.a || {})[r.rule_id]); if (a) out.push({ uid, name: p.name, c: a.c, s: a.s, t: typeof a.t === 'number' ? a.t : 0, n: typeof a.n === 'string' ? a.n.slice(0, 300) : '' }); }
  return out;
}
/* what one vote is worth, in the unit the team weight is averaged in */
function worth(r, v) {
  if (r.kind === 'pull') return v.c === 'yes' ? PULL_SIZES[v.s][3] : 0;
  if (r.status === 'Proposed') return v.c === r.dir ? FEEL_SIZES[v.s][3] : 0;
  return v.c === 'same' ? 0 : (v.c === r.dir ? 1 : -1) * FEEL_SIZES[v.s][2];
}
function stat(r, exceptUid) {
  const vs = votesFor(r).filter(v => v.uid !== exceptUid), n = vs.length;
  const s = { n, vs, team: null, agree: 0, conf: 'none', c: {}, top: null, net: 0, keep: null };
  if (!n) return s;
  const c = { tune: { less: 0, right: 0, more: 0 }, agree: { keep: 0, drop: 0 }, pull: { yes: 0, no: 0 }, feel: { softer: 0, same: 0, firmer: 0 } }[r.kind];
  vs.forEach(v => c[v.c]++); s.c = c;
  s.top = Object.keys(c).sort((a, b) => c[b] - c[a])[0]; s.agree = c[s.top] / n;
  if (r.kind === 'tune') { s.net = (c.more - c.less) / n; s.team = scaled(r, 1 + 0.5 * s.net); }
  else if (r.kind === 'agree') s.keep = c.keep >= c.drop;
  else if (r.kind === 'feel' && r.fixed) s.keep = c[r.dir] >= n / 2;
  else { const mean = vs.reduce((t, v) => t + worth(r, v), 0) / n; s.team = (r.kind === 'feel' && r.status === 'Built') ? mean * r.step * r.mult / r.per : mean; }
  s.conf = n < 3 ? 'thin' : s.agree >= 0.6 ? 'valid' : 'split';
  return s;
}
const CONF = { none: 'No answers', thin: 'Answered', valid: 'Validated', split: 'Split' };
const strengthWords = m => m < 0.5 ? 'ignore it' : m < 1.5 ? 'a nudge' : m < 2.5 ? 'a full step' : 'outranks the body answers';
function teamText(r, s) {
  if (!s.n) return '–';
  if (s.keep != null) return s.keep ? 'Keep' : 'Drop';
  if (r.kind === 'tune') { const d = Math.round(s.net * 50); return `${fmt(s.team)}${d ? ` (${d > 0 ? '+' : ''}${d}%)` : ' (no change)'}`; }
  if (r.status === 'Proposed') return `${s.team.toFixed(1)} of 3, ${strengthWords(s.team)}`;
  const opp = r.dir === 'softer' ? 'firmer' : 'softer';
  return Math.abs(s.team) < 0.0005 ? '0 (no change)' : `${s.team < 0 ? opp : r.dir} by ${fmt(Math.abs(s.team))}`;
}
function draftText(r) {
  if (r.kind === 'tune') return fmt(r.current_value);
  if (r.status === 'Proposed') return r.kind === 'agree' ? 'Proposed rule' : 'No weight yet';
  if (r.kind === 'agree' || r.fixed) return r.kind === 'agree' ? 'Fixed rule' : r.effect;
  return `${r.dir} by ${fmt(r.current_value)}`;
}
function breakdown(r, s) {
  if (!s.n) return 'No answers yet';
  const c = s.c;
  if (r.kind === 'tune') return `${c.less} down · ${c.right} right · ${c.more} up`;
  if (r.kind === 'agree') return `${c.keep} keep · ${c.drop} drop`;
  if (r.kind === 'pull') return `${c.yes} yes · ${c.no} no`;
  return `${c.softer} softer · ${c.same} same · ${c.firmer} firmer`;
}
function scores() {
  const pts = {}, cnt = {};
  for (const r of RULES) votesFor(r).sort((a, b) => a.t - b.t).forEach((v, i) => { pts[v.uid] = (pts[v.uid] || 0) + (i === 0 ? 15 : i < 3 ? 12 : 10) + (v.n ? 2 : 0); cnt[v.uid] = (cnt[v.uid] || 0) + 1; });
  return Object.keys(pts).map(uid => ({ uid, name: (S.team[uid] || {}).name || 'Someone', pts: pts[uid], n: cnt[uid] })).sort((a, b) => b.pts - a.pts);
}
function progress() {
  let ans = 0, val = 0, split = 0, total = 0;
  RULES.forEach(r => { const s = stat(r); total += s.n; if (s.n) ans++; if (s.conf === 'valid') val++; if (s.conf === 'split') split++; });
  return { ans, val, split, total, N: RULES.length };
}

/* ---------- adaptive question picker ---------- */
function pick() {
  let pool = RULES.filter(r => !S.mine[r.rule_id] && !S.skipped.has(r.rule_id)), again = false;
  if (!pool.length) { pool = RULES.filter(r => S.mine[r.rule_id] && !S.revisited.has(r.rule_id) && stat(r).conf === 'split'); again = true; }
  if (!pool.length) return null;
  const done = Object.keys(S.mine).length;
  if (!again && done < 3) {
    const strong = pool.map(r => [r, stat(r)]).filter(x => x[1].conf === 'valid').sort((a, b) => b[1].agree * b[1].n - a[1].agree * a[1].n).slice(0, 4);
    const r = strong.length ? strong[Math.floor(Math.random() * strong.length)][0] : pool.find(r => r.rule_id === STARTERS[done]) || pool[0];
    return { r, tag: 'Warm-up' };
  }
  const need = { none: 100, thin: 70, split: 45, valid: 4 };
  let best = null, bestScore = -1, bestSt = null;
  for (const r of pool) { const st = stat(r, S.uid); const sc = need[st.conf] - (st.conf === 'thin' ? st.n * 10 : 0) + Math.random() * 12; if (sc > bestScore) { bestScore = sc; best = r; bestSt = st; } }
  const tag = again ? 'Team is split · second look' : { none: 'New', thin: bestSt.n === 2 ? 'One more validates it' : 'Needs a second answer', split: 'Team is split', valid: 'Confirming' }[bestSt.conf];
  return { r: best, tag, again };
}

/* ---------- standalone database (used when the page is hosted outside Claude) ---------- */
const CFG = (window.TB_CONFIG && /^https:\/\//.test(window.TB_CONFIG.url || '') && window.TB_CONFIG.key) ? window.TB_CONFIG : null;
function remoteDb(cfg, secret) {
  const base = cfg.url.replace(/\/+$/, '') + '/rest/v1', hd = { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key, 'Content-Type': 'application/json' };
  const fail = async res => { if (!res.ok) throw { code: res.status >= 500 || res.status === 429 ? 'unavailable' : 'invalid_argument', message: await res.text().catch(() => '') }; return res; };
  let listener = null, onErr = null, timer = 0, failed = 0;
  async function poll() {
    clearTimeout(timer);
    try {
      const rows = await (await fail(await fetch(base + '/votes?select=id,name,a,u', { headers: hd, cache: 'no-store' }))).json();
      failed = 0;
      if (listener) listener({ docs: rows.map(r => ({ id: r.id, data: () => ({ name: r.name, a: r.a, u: r.u }) })), metadata: { fromCache: false } });
    } catch (e) { if (++failed === 3 && onErr && !S.first) onErr(e); }
    timer = setTimeout(poll, document.hidden ? 30000 : 8000);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && listener) poll(); });
  return {
    doc: () => ({ set: async d => { await fail(await fetch(base + '/rpc/save_votes', { method: 'POST', headers: hd, body: JSON.stringify({ secret, player: d.name, answers: d.a }) })); } }),
    collection: () => ({ onSnapshot: (next, err) => { listener = next; onErr = err; poll(); } })
  };
}
async function deviceIdentity() {
  let secret = ls.get('tb-secret');
  if (typeof secret !== 'string' || secret.length < 32) { secret = [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, '0')).join(''); ls.set('tb-secret', secret); }
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return { secret, uid: [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('') };
}
function saveFile(filename, data) { const u = URL.createObjectURL(data instanceof Blob ? data : new Blob([data])); const a = h('a', { href: u, download: filename }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }

/* ---------- storage ---------- */
function meDoc() { return { name: S.name, a: S.mine, u: Date.now() }; }
function syncMe() { if (S.uid) S.team[S.uid] = { name: S.name, a: S.mine }; }
async function save() {
  syncMe();
  if (S.mode !== 'team') { ls.set('tb-tune2', { name: S.name, a: S.mine }); return; }
  if (S.saving) { S.dirty = true; return; }
  S.saving = true;
  do {
    S.dirty = false;
    try { await S.db.doc('votes/' + S.uid).set(meDoc()); }
    catch (e) {
      if (e && e.code === 'unavailable') { try { await new Promise(r => setTimeout(r, 800 + Math.random() * 800)); await S.db.doc('votes/' + S.uid).set(meDoc()); continue; } catch (e2) { e = e2; } }
      S.mode = 'local'; ls.set('tb-tune2', { name: S.name, a: S.mine });
      banner(LOCAL_MSG);
      break;
    }
  } while (S.dirty);
  S.saving = false;
}
const LOCAL_MSG = 'Your answers are saved on this device only. After a round, tap Send my answers.';
function myCode() { return 'TB1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ name: S.name, a: S.mine })))); }
function sendBox() {
  if (S.mode !== 'local' || !Object.keys(S.mine).length) return null;
  const ta = h('textarea', { class: 'field', id: 'my-code', readonly: true, 'aria-label': 'Your answer code' }); ta.value = myCode();
  const msg = h('span', { role: 'status' });
  const copy = () => { const done = () => { msg.textContent = 'Copied. Paste it in a message to the game owner.'; }; try { navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); msg.textContent = 'Select all and copy it.'; }); } catch (e) { ta.select(); msg.textContent = 'Select all and copy it.'; } };
  return h('div', { class: 'reveal' }, h('h3', null, 'Send my answers'), h('p', null, 'Your answers are not reaching the team from this device. Copy this code and send it to the game owner.'), h('div', { class: 'row' }, ta, h('button', { class: 'btn', type: 'button', onclick: copy }, 'Copy code'), msg));
}
function banner(t) { const b = $('banner'); b.textContent = t || ''; b.hidden = !t; }
function ingest(docs) {
  const team = {};
  for (const d of docs) { const x = d.data() || {}; team[d.id] = { name: typeof x.name === 'string' ? x.name.slice(0, 40) : '', a: (x.a && typeof x.a === 'object') ? x.a : {} }; }
  if (S.uid) {
    const srv = team[S.uid];
    if (srv && !S.gotMine) { S.mine = Object.assign({}, srv.a, S.mine); if (!S.name) S.name = srv.name; }
    S.gotMine = true;
    if (S.name || Object.keys(S.mine).length) team[S.uid] = { name: S.name, a: S.mine };
  }
  S.team = team;
}
async function boot() {
  const use = n => (window.claude && window.claude.use) ? window.claude.use(n).catch(() => null) : Promise.resolve(null);
  let db = null, user = null, uid = null;
  if (CFG) { try { const me = await deviceIdentity(); uid = me.uid; db = remoteDb(CFG, me.secret); } catch (e) {} }
  else [db, user] = await Promise.all([use('db'), use('user')]);
  if (user) { try { uid = await user.id(); S.isOwner = !!(await user.isOwner()); } catch (e) {} }
  const local = ls.get('tb-tune2');
  if (!db) {
    S.mode = 'local'; if (local) { S.name = local.name || ''; S.mine = local.a || {}; }
    S.uid = 'me'; syncMe();
    banner(LOCAL_MSG);
    loaded(); return;
  }
  S.db = db; S.uid = uid;
  if (!uid) { S.mode = 'local'; if (local) { S.name = local.name || ''; S.mine = local.a || {}; } banner(LOCAL_MSG); }
  const timer = setTimeout(() => { if (!S.first) { $('pulse').textContent = 'The team answers cannot be reached yet'; if (S.mode === 'loading') { S.mode = 'team'; loaded(); } } }, 10000);
  db.collection('votes').onSnapshot(snap => {
    ingest(snap.docs);
    if (!snap.metadata.fromCache) { clearTimeout(timer); S.first = true; }
    if (S.mode === 'loading') { S.mode = 'team'; loaded(); } else live();
  }, () => { clearTimeout(timer); if (S.mode === 'loading') { S.mode = 'local'; loaded(); } banner(LOCAL_MSG); });
}
function loaded() { if (S.phase === 'intro') intro(); live(); }
let liveT = 0;
function live() { clearTimeout(liveT); liveT = setTimeout(() => { pulse(); if (!$('v-results').hidden) results(); }, 150); }

/* ---------- stage art ---------- */
const MATS = ['241 228 234', '242 193 78', '247 215 116', '247 169 128', '240 155 184', '227 166 214'], ALPH = [.18, .4, .64, .82];
const rnd = (a, b) => a + Math.random() * (b - a);
const cards = [];
for (let i = 0; i < ROUND; i++) $('pips').append(h('i'));
document.querySelectorAll('.stack').forEach((st, si) => { for (let k = 0; k < 4; k++) { const c = h('i', { class: 'card' }); st.append(c); cards.push(c); setCard(c, (si + k) % 6); } });
function setCard(c, m) { c.style.setProperty('--bg', `rgb(${MATS[m == null ? Math.floor(rnd(0, 6)) : m]} / ${ALPH[Math.floor(rnd(0, 4))]})`); c.style.setProperty('--x', rnd(-8, 8).toFixed(1) + '%'); c.style.setProperty('--y', rnd(-7, 7).toFixed(1) + '%'); c.style.setProperty('--r', rnd(-3, 3).toFixed(1) + 'deg'); }
function shuffle() { for (let i = 0; i < 4; i++) setCard(cards[Math.floor(rnd(0, cards.length))]); const f = cards[Math.floor(rnd(0, cards.length))]; f.classList.remove('flip'); void f.offsetWidth; f.classList.add('flip'); }
function progressLine(p) {
  if (!p.total) return 'No answers yet. Be the first.';
  if (p.ans < p.N) return `${p.N - p.ans} rules still need a first answer · ${p.val} validated`;
  if (p.val < p.N) return `Every rule has an answer. ${p.N - p.val} left to validate`;
  return 'All 99 rules validated';
}
function pulse() {
  const inRound = S.session % ROUND, full = S.session > 0 && inRound === 0 && S.phase !== 'q';
  $('cnt').firstChild.nodeValue = String(S.phase === 'intro' ? 0 : full ? ROUND : inRound + (S.phase === 'q' ? 1 : 0));
  const filled = S.phase === 'intro' ? 0 : full ? ROUND : inRound;
  [...$('pips').children].forEach((e, i) => e.classList.toggle('on', i < filled));
  const me = S.uid && scores().find(x => x.uid === S.uid);
  $('rnd').textContent = `Round ${Math.floor((S.session - (full ? 1 : 0)) / ROUND) + 1}${me ? ` · ${me.pts} points` : ''}`;
  if (S.mode === 'loading') return;
  const p = progress();
  $('m-a').style.width = pc(p.ans / p.N) + '%'; $('m-v').style.width = pc(p.val / p.N) + '%';
  $('meter').setAttribute('aria-label', `${p.ans} of ${p.N} rules answered, ${p.val} validated`);
  $('pulse').textContent = progressLine(p);
}

/* ---------- sound and touch ---------- */
let AC = null, muted = ls.get('tb-mute') === true;
function sfx(name) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const t = AC.currentTime + 0.01;
    const note = (f, at, len, vol) => { [[f, vol], [f * 2, vol * .22]].forEach(([fr, v]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = fr; g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(v, t + at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + at + len); o.connect(g).connect(AC.destination); o.start(t + at); o.stop(t + at + len + 0.05); }); };
    ({ tap: () => note(494, 0, .09, .05), skip: () => note(294, 0, .1, .035),
      pick: () => { note(392, 0, .2, .07); note(587, .08, .3, .07); },
      first: () => { note(392, 0, .2, .07); note(523, .08, .22, .07); note(784, .16, .4, .07); },
      valid: () => { note(523, 0, .2, .07); note(659, .09, .2, .07); note(784, .18, .22, .07); note(1047, .27, .6, .08); },
      round: () => { [262, 392, 523, 659].forEach((f, i) => note(f, i * .07, 1.4, .06)); note(1047, .42, 1.2, .05); } })[name]();
  } catch (e) {}
}
function buzz(p) { try { if (!muted && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
function setSnd() { const b = $('snd'); b.setAttribute('aria-label', muted ? 'Sound is off' : 'Sound is on'); b.setAttribute('aria-pressed', muted ? 'false' : 'true'); }
$('snd').onclick = () => { muted = !muted; ls.set('tb-mute', muted); setSnd(); sfx('tap'); };
setSnd();
function pop(text) { const e = h('div', { class: 'pop' }, text); $('hud').append(e); setTimeout(() => e.remove(), 1400); const c = $('cnt'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
function countUp(el, to) { const t0 = performance.now(), dur = 900; if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.firstChild.nodeValue = String(to); return; } (function f(now) { const k = Math.min(1, (now - t0) / dur); el.firstChild.nodeValue = String(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(f); })(t0); }

/* ---------- play views ---------- */
const panel = $('panel');
function show(...kids) { panel.replaceChildren(...kids.flat(3).filter(Boolean)); }
function intro() {
  S.phase = 'intro';
  const done = Object.keys(S.mine).length, back = !!S.name && done > 0;
  const inp = h('input', { class: 'field', id: 'player-name', type: 'text', maxlength: '24', placeholder: 'Your first name', autocomplete: 'given-name', 'aria-label': 'Your first name', value: S.name || '' });
  const go = () => { const v = inp.value.trim().slice(0, 24); if (!v) { inp.focus(); return; } S.name = v; sfx('pick'); save(); next(); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  show(h('div', { class: 'qcard' },
    h('h1', { class: 'big' }, back ? `Welcome back, ${S.name}.` : 'Fit the bed to the sleeper.'),
    h('p', { class: 'lead' }, back ? `${done} of ${RULES.length} answered. Pick up where the team needs you.` : 'You meet a sleeper. You say softer, firmer or the same. 20 questions a round.'),
    h('div', { class: 'row' }, inp, h('button', { class: 'btn', type: 'button', onclick: go }, back ? 'Keep going' : 'Start'))));
  pulse();
}
function valuePhrase(r) {
  const v = r.current_value, u = r.unit, pct = x => Math.round(Math.abs(x) / r.step * 100);
  if (u === 'score points') return `${fmt(v)} score points, about ${pct(v)}% of one feel step`;
  if (u.startsWith('score points across')) return `${fmt(v)} score points from the narrowest to the widest sleeper, so about ${fmt(v / 2 / r.step)} feel steps from average to the far end`;
  if (u.startsWith('score points per BMI')) return `${fmt(v)} per BMI point, so about ${pct(v * 10)}% of a feel step for this sleeper`;
  if (u.startsWith('times')) return `${fmt(v)} times the load of back sleeping`;
  if (u.startsWith('share of body weight')) return `${fmt(v * 100)} points of body weight${u.includes('base') ? ' (' + u.split('(')[1] : ''}`;
  if (u.startsWith('penalty')) return `${fmt(v)} ${u}`;
  if (u.startsWith('allowed alignment')) return `${fmt(v)} allowed error. Lower is stricter${u.includes('normally') ? '; normal is 0.30' : ''}`;
  if (u.startsWith('meters')) return `${fmt(v * 1000)} mm across the full range`;
  if (u.startsWith('share of the default')) return `${v > 0 ? '+' : ''}${fmt(v * 100)}% of the default weight`;
  return `${fmt(v)} ${u}`;
}
const zoneWords = r => ({ 'All zones': 'whole side of the bed', 'Whole side': 'whole side of the bed', 'Whole bed': 'bed' }[r.zone] || r.zone.toLowerCase());
const layerWords = r => r.layer === 'Support' ? 'the support underneath' : r.layer.startsWith('Comfort and s') ? 'comfort and support together' : 'the comfort layer on top';
function elseLine(skip) {
  const parts = { sleeps: 'sleeps on the back', frame: 'average frame', build: '5’8” and 158 lb', sore: 'no sore spots' };
  return 'Everything else is average: ' + Object.keys(parts).filter(k => k !== skip).map(k => parts[k]).join(', ') + '.';
}
function next() {
  const p = pick();
  if (!p) return allDone();
  S.phase = 'q'; S.cur = p; p.pend = null;
  renderQ(); pulse(); window.scrollTo({ top: 0 });
}
function renderQ() {
  const { r, tag, pend } = S.cur, built = r.status === 'Built', generic = GENERIC.has(r.answer);
  const lock = S.phase === 'reveal', mineV = lock ? S.mine[r.rule_id] : null, picked = lock ? mineV.c : pend;
  const opt = (c, title, sub, fn, on) => h('button', { class: 'opt', type: 'button', 'aria-pressed': on ? 'true' : 'false', disabled: lock, onclick: fn }, h('b', null, title), sub ? h('span', null, sub) : null);
  const choose = c => () => { if (S.phase !== 'q') return; S.cur.pend = c; sfx('tap'); buzz(8); renderQ(); const f = panel.querySelector('.quad .opt, .sizes .opt'); if (f) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  const sizes = (list, cls) => h('div', { class: cls + ' sizes' }, list.map((z, i) => opt(i, z[0], z[1], () => answer(S.cur.pend, i), lock && mineV.s === i)));
  let top, ask, sub = null, body, mid = null;
  if (r.kind === 'feel' || r.kind === 'pull') {
    const preset = r.p, sized = lock ? mineV.s != null : (pend && pend !== 'same' && pend !== 'no' && !r.fixed);
    top = preset
      ? [h('p', { class: 'kicker' }, `Meet ${r.who}`), h('h1', { class: 'big' }, preset[1]), h('p', { class: 'kicker' }, 'Otherwise average.')]
      : [h('p', { class: 'kicker' }, `Meet ${r.who}`), h('h1', { class: 'big sm' }, r.question), h('p', { class: 'ansline' }, `${r.who}: `, h('b', null, `\u201C${r.answer}\u201D`))];
    if (r.kind === 'feel') {
      ask = `${r.who}\u2019s ${zoneWords(r)}, ${layerWords(r)}, should be`;
      sub = `Compared with ${preset ? preset[2] : 'the same sleeper without that answer'}.`;
      const d = c => r.fixed ? () => answer(c) : c === 'same' ? () => answer('same') : choose(c);
      body = [h('div', { class: 'trio' }, opt('softer', 'Softer', '', d('softer'), picked === 'softer'), opt('same', 'The same', '', d('same'), picked === 'same'), opt('firmer', 'Firmer', '', d('firmer'), picked === 'firmer')),
        sized ? [h('h2', { class: 'ask solo' }, `How much ${picked}?`), sizes(FEEL_SIZES, 'quad')] : null];
    } else {
      ask = `Should that steer ${r.who}\u2019s bed?`; sub = r.effect + '.';
      body = [h('div', { class: 'duo' }, opt('yes', 'Yes', '', choose('yes'), picked === 'yes'), opt('no', 'No', '', () => answer('no'), picked === 'no')),
        sized ? [h('h2', { class: 'ask solo' }, 'How hard?'), sizes(PULL_SIZES, 'trio')] : null];
    }
  } else {
    top = [h('p', { class: 'kicker' }, generic ? r.chapter : r.question), h('h1', { class: 'big sm' }, generic ? r.question : `\u201C${r.answer}\u201D`),
      h('p', { class: 'fact' }, `${r.zone} · ${r.layer}: ${r.effect}`), r.kind === 'tune' ? h('p', { class: 'kicker' }, valuePhrase(r)) : null];
    if (r.kind === 'tune') {
      const tol = r.unit.startsWith('allowed alignment');
      ask = 'Is that the right size?';
      body = h('div', { class: 'duo' }, opt('less', tol ? 'Stricter' : 'Turn it down', 'Toward ' + fmt(scaled(r, .5)), () => answer('less'), picked === 'less'), opt('more', tol ? 'Looser' : 'Turn it up', 'Toward ' + fmt(scaled(r, 1.5)), () => answer('more'), picked === 'more'));
      mid = h('button', { class: 'link', type: 'button', 'aria-pressed': picked === 'right' ? 'true' : 'false', disabled: lock, onclick: () => answer('right') }, `It\u2019s right at ${fmt(r.current_value)}`);
    } else {
      ask = built ? 'Keep this rule?' : 'Add this rule?';
      body = h('div', { class: 'duo' }, opt('keep', built ? 'Keep it' : 'Add it', '', () => answer('keep'), picked === 'keep'), opt('drop', built ? 'Drop it' : 'Leave it out', '', () => answer('drop'), picked === 'drop'));
    }
  }
  show(h('span', { class: 'why-tag' }, tag), h('div', { class: 'qcard' }, top, h('h2', { class: 'ask' }, ask), sub ? h('p', { class: 'kicker' }, sub) : null), body,
    h('div', { class: 'mid' }, mid, lock ? null : h('button', { class: 'link q', type: 'button', onclick: skip }, 'Not sure, skip')),
    lock ? revealBox(r) : null);
  if (lock) { const b = $('next-btn'); if (b) { b.focus({ preventScroll: true }); b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
}
function revealBox(r) {
  const mineV = S.mine[r.rule_id], others = stat(r, S.uid), all = stat(r);
  const same = others.vs.filter(v => v.c === mineV.c).length;
  const head = S.cur.justValid ? `Validated. You locked it in. +${S.cur.pts}` : !others.n ? 'First answer. +15' : same === others.n ? (others.n === 1 ? 'Your teammate said the same.' : `All ${others.n} teammates said the same.`) : same === 0 ? `You stand alone. None of ${others.n} agreed.` : `${same} of ${others.n} teammates said the same.`;
  const hasDraft = r.kind === 'feel' && r.status === 'Built' && !r.fixed;
  const now = all.keep != null ? `Team: ${breakdown(r, all)}` : `Team: ${teamText(r, all)}` + (hasDraft ? ` · draft: ${fmt(r.current_value)}` : '');
  const status = all.conf === 'valid' ? 'Validated.' : all.conf === 'split' ? 'Team is split, so it stays open.' : `${3 - all.n} more to validate.`;
  const note = h('input', { class: 'field', id: 'note-' + r.rule_id, type: 'text', maxlength: '200', placeholder: 'Your note for the team', 'aria-label': 'Note for the team', value: mineV.n || '', hidden: !mineV.n });
  const add = h('button', { class: 'link q', type: 'button', hidden: !!mineV.n, onclick: () => { note.hidden = false; add.hidden = true; note.focus(); } }, 'Add a note (+2)');
  const go = () => { const t = note.value.trim(); if (t !== (mineV.n || '')) { mineV.n = t; save(); } S.session % ROUND === 0 ? roundEnd() : next(); };
  note.addEventListener('keydown', e => { if (e.key === 'Enter') { e.stopPropagation(); go(); } });
  return h('div', { class: 'reveal', role: 'status' }, h('h3', null, head), h('p', null, h('b', null, now), h('br'), status), h('div', { class: 'row' }, note, h('button', { class: 'btn', type: 'button', id: 'next-btn', onclick: go }, 'Next')), add);
}
function answer(c, s) {
  if (S.phase !== 'q') return;
  const r = S.cur.r, rec = { c, t: Date.now() };
  if (s != null) rec.s = s;
  if (!cleanVote(r, rec)) return;
  if (S.cur.again) S.revisited.add(r.rule_id);
  const before = stat(r, S.uid);
  S.mine[r.rule_id] = rec; S.session++; S.phase = 'reveal';
  const after = stat(r), pts = before.n === 0 ? 15 : before.n < 3 ? 12 : 10;
  S.cur.pts = pts; S.cur.justValid = after.conf === 'valid' && before.n < 3;
  if (S.cur.justValid) { sfx('valid'); buzz([12, 50, 22]); } else if (before.n === 0) { sfx('first'); buzz(14); } else { sfx('pick'); buzz(12); }
  pop('+' + pts);
  save(); shuffle(); renderQ(); pulse();
}
function skip() { sfx('skip'); const id = S.cur.r.rule_id; S.skipped.add(id); if (S.cur.again) S.revisited.add(id); next(); }
function myStats() {
  let seen = 0, match = 0, soft = 0, firm = 0, same = 0;
  for (const id in S.mine) { const r = BY_ID[id]; if (!r) continue; const m = cleanVote(r, S.mine[id]); if (!m) continue;
    if (r.kind === 'feel') { m.c === 'softer' ? soft++ : m.c === 'firmer' ? firm++ : same++; }
    const o = stat(r, S.uid); if (!o.n) continue; seen++; if (m.c === o.top) match++; }
  const n = soft + firm + same;
  const lean = n < 4 ? null : same / n > .45 ? ['Steady hand', 'You leave the bed alone more often than you change it.'] : soft > firm * 1.5 ? ['Soft touch', 'You reach for softer more often than firmer.'] : firm > soft * 1.5 ? ['Firm hand', 'You reach for firmer more often than softer.'] : ['Even hand', 'You go softer and firmer in about equal measure.'];
  return { seen, match, lean };
}
function tiles(list) { return h('div', { class: 'tiles' }, list.map(([b, s]) => h('div', { class: 'tile' }, h('b', null, b), h('span', null, s)))); }
function boardRows(limit) { return scores().slice(0, limit || 99).map(x => h('li', null, h('b', null, x.name + (x.uid === S.uid ? ' (you)' : '')), h('em', null, `${x.n} answers`), h('strong', null, x.pts))); }
function roundEnd() {
  S.phase = 'round';
  const m = myStats(), left = RULES.filter(r => !S.mine[r.rule_id]).length, sc = scores(), rank = sc.findIndex(x => x.uid === S.uid), me = sc[rank] || { pts: 0 }, p = progress(), ahead = rank > 0 ? sc[rank - 1] : null;
  const score = h('div', { class: 'scoreline' }, '0', h('small', null, 'points'));
  const place = rank < 0 ? '' : sc.length === 1 ? 'You are the first on the board.' : rank === 0 ? `You lead the board of ${sc.length}.` : `You are #${rank + 1} of ${sc.length}. ${ahead.pts - me.pts + 1} points to pass ${ahead.name}.`;
  show(
    h('span', { class: 'why-tag' }, `Round ${S.session / ROUND} done`),
    h('div', { class: 'qcard' }, score, h('h1', { class: 'h2' }, place), h('ol', { class: 'board' }, boardRows(5))),
    h('p', { class: 'kicker' }, (m.lean ? `Your style: ${m.lean[0].toLowerCase()}. ` : '') + (m.seen ? `With the team ${pc(m.match / m.seen)}% of the time. ` : '') + (left ? `${left} to go.` : 'Only split ones left.')),
    sendBox(),
    h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', id: 'next-btn', onclick: () => { sfx('tap'); next(); } }, 'Keep going'), h('button', { class: 'btn ghost', type: 'button', onclick: () => go('results') }, 'See team results')));
  countUp(score, me.pts); sfx('round'); buzz([20, 60, 20, 60, 40]);
  for (let i = 0; i < 4; i++) setTimeout(shuffle, i * 180);
  pulse(); window.scrollTo({ top: 0 });
}
function allDone() {
  S.phase = 'done';
  show(h('div', { class: 'qcard' }, h('h1', { class: 'big' }, 'All caught up.'), h('p', { class: 'lead' }, 'Come back after your teammates have played. Anything the team splits on returns to you.')), sendBox(), h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => go('results') }, 'See team results'), h('button', { class: 'btn ghost', type: 'button', onclick: () => { S.skipped.clear(); next(); } }, 'Check again')));
  pulse();
}
document.addEventListener('keydown', e => {
  if ($('v-play').hidden || e.target.matches('input')) return;
  if (S.phase === 'q' && /^[1-4]$/.test(e.key)) { const g = panel.querySelector('.sizes') || panel.querySelector('.trio, .duo'); const b = g && g.querySelectorAll('.opt')[+e.key - 1]; if (b) { e.preventDefault(); b.click(); } }
  else if (e.key === 'Enter' && (S.phase === 'reveal' || S.phase === 'round')) { const b = $('next-btn'); if (b && document.activeElement !== b) { e.preventDefault(); b.click(); } }
});

/* ---------- results ---------- */
const FILTERS = { All: () => true, Built: r => r.status === 'Built', Proposed: r => r.status === 'Proposed', Validated: (r, s) => s.conf === 'valid', Split: (r, s) => s.conf === 'split', 'Needs answers': (r, s) => s.n < 3 };
function results() {
  const stats = RULES.map(r => [r, stat(r)]), p = progress(), sc = scores();
  $('m2-a').style.width = pc(p.ans / p.N) + '%'; $('m2-v').style.width = pc(p.val / p.N) + '%';
  $('meter2').setAttribute('aria-label', `${p.ans} of ${p.N} rules answered, ${p.val} validated`);
  $('k-a').textContent = `Answered ${p.ans} of ${p.N}` + (p.ans < p.N ? `, ${p.N - p.ans} to go` : '');
  $('k-v').textContent = `Validated ${p.val} of ${p.N}` + (p.val < p.N ? `, ${p.N - p.val} to go` : '');
  $('sum').replaceChildren(...tiles([[String(sc.length), sc.length === 1 ? 'player' : 'players'], [String(p.total), 'answers'], [String(p.split), 'rules split'], [String(Math.max(0, p.N * 3 - stats.reduce((t, x) => t + Math.min(3, x[1].n), 0))), 'answers still needed, at least']]).children);
  $('board').replaceChildren(...(sc.length ? boardRows() : [h('li', null, h('b', null, 'Nobody yet'), h('em', null, 'Play a round to get on the board'), h('strong', null, '0'))]));
  $('chips').replaceChildren(...Object.keys(FILTERS).map(f => h('button', { type: 'button', 'aria-pressed': S.filter === f ? 'true' : 'false', onclick: () => { S.filter = f; results(); } }, f)));
  const rows = stats.filter(([r, s]) => FILTERS[S.filter](r, s)).map(([r, s]) => {
    const notes = s.vs.filter(v => v.n).map(v => `${v.name || 'Someone'}: ${v.n}`);
    return h('div', { class: 'r' },
      h('div', { class: 'id' }, r.rule_id, h('br'), r.status),
      h('div', { class: 't' }, h('b', null, GENERIC.has(r.answer) ? r.question : `${r.question} ${r.answer}`), h('span', null, `${r.zone} · ${r.layer} · ${r.effect}`)),
      h('div', { class: 'nums' }, h('div', null, h('em', null, 'Draft'), draftText(r)), h('div', { class: 'team' }, h('em', null, 'Team'), teamText(r, s)), h('div', null, h('em', null, 'Answers'), breakdown(r, s))),
      h('div', null, h('span', { class: 'bar', role: 'img', 'aria-label': `Agreement ${pc(s.agree)}%` }, h('i', { style: `width:${pc(s.agree)}%` })), h('span', { class: 'pill ' + (s.conf === 'valid' ? 'strong' : s.conf) }, CONF[s.conf] + (s.n ? ` ${pc(s.agree)}%` : ''))),
      notes.length ? h('div', { class: 'notes' }, notes.join('  ·  ')) : null);
  });
  $('list').replaceChildren(...(rows.length ? rows : [h('p', { class: 'empty' }, p.total ? 'No rules match this filter.' : 'No answers yet. Once the team starts playing, every rule shows its draft number, the team number and how much the team agrees.')]));
  $('owner').hidden = !(S.isOwner && S.mode === 'team');
}

/* ---------- export ---------- */
function exportRows() {
  return RULES.map(r => {
    const s = stat(r), row = COLS.map(c => r[c] == null ? '' : r[c]);
    if (s.n) {
      const flipped = r.kind === 'feel' && r.status === 'Built' && !r.fixed && s.team < 0;
      row[10] = s.team == null ? '' : r.kind === 'tune' ? (s.net ? parseFloat(s.team.toFixed(4)) : '') : parseFloat(s.team.toFixed(r.status === 'Proposed' ? 1 : 3));
      const notes = s.vs.filter(v => v.n).map(v => `${v.name || 'Someone'}: ${v.n}`).join(' | ');
      const verdict = s.keep != null ? (s.keep ? 'Keep. ' : 'Drop. ') : r.kind === 'tune' && !s.net ? 'Keep current value. ' : flipped ? 'Team says the OPPOSITE direction (negative weight). ' : '';
      row[11] = `${verdict}Team game: ${CONF[s.conf].toLowerCase()}, ${s.n} answers (${breakdown(r, s)}), agreement ${pc(s.agree)}%.${notes ? ' Notes: ' + notes : ''}`;
    }
    return row;
  });
}
function voteRows() {
  const head = ['rule_id', 'status', 'question_type', 'answers', 'breakdown', 'agreement_pct', 'state', 'draft_value', 'team_value', 'unit'];
  const type = { feel: 'sleeper: softer, same or firmer', pull: 'sleeper: should it count', tune: 'turn down or up', agree: 'keep or drop' };
  return [head, ...RULES.map(r => { const s = stat(r); return [r.rule_id, r.status, type[r.kind], s.n, breakdown(r, s), s.n ? pc(s.agree) : '', CONF[s.conf], r.current_value == null ? '' : r.current_value, s.team == null ? (s.keep == null ? '' : s.keep ? 'keep' : 'drop') : parseFloat(Number(s.team).toFixed(4)), r.status === 'Proposed' ? 'strength 0 to 3' : r.unit]; })];
}
const csvSafe = v => { let t = String(v); if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(t)) t = "'" + t; return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
function loadXlsx() { return new Promise((ok, no) => { if (window.XLSX) return ok(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = no; document.head.append(s); }); }
async function doExport(kind) {
  const msg = $('x-msg'); msg.textContent = '';
  const dl = CFG ? { save: async ({ filename, data }) => saveFile(filename, data) } : (window.claude && window.claude.use) ? await window.claude.use('downloads').catch(() => null) : null;
  if (!dl) { msg.textContent = 'Downloads are not available in this view. Open the page in a browser on a computer.'; return; }
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === 'csv') await dl.save({ filename: `sleep-fit-rule-table-team-${stamp}.csv`, data: '﻿' + [COLS, ...exportRows()].map(r => r.map(csvSafe).join(',')).join('\r\n') });
    else {
      await loadXlsx();
      const wb = XLSX.utils.book_new(), safe = rows => rows.map(r => r.map(v => typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v));
      const ws = XLSX.utils.aoa_to_sheet(safe([COLS, ...exportRows()])); ws['!cols'] = [14, 10, 20, 34, 26, 16, 20, 30, 12, 24, 12, 60, 60, 20].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, 'Rules');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(safe(voteRows())), 'Game votes');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(safe([['player', 'points', 'answers'], ...scores().map(x => [x.name, x.pts, x.n])])), 'Leaderboard');
      await dl.save({ filename: `sleep-fit-rule-table-team-${stamp}.xlsx`, data: XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) });
    }
    msg.textContent = 'Saved.';
  } catch (e) { msg.textContent = e && e.code === 'declined' ? '' : 'The file could not be saved here. Try again from a browser on a computer.'; }
}
$('x-xlsx').onclick = () => doExport('xlsx'); $('x-csv').onclick = () => doExport('csv');
$('import').onclick = async () => {
  const msg = $('import-msg'), raw = $('import-code').value.trim().replace(/^TB1:/, '').replace(/\s+/g, '');
  try {
    const x = JSON.parse(decodeURIComponent(escape(atob(raw))));
    const name = String(x.name || 'Someone').slice(0, 24), a = {};
    for (const id in (x.a || {})) { const r = BY_ID[id], v = r && cleanVote(r, x.a[id]); if (v) a[id] = { c: v.c, t: typeof v.t === 'number' ? v.t : Date.now(), ...(Number.isInteger(v.s) ? { s: v.s } : {}), ...(typeof v.n === 'string' && v.n ? { n: v.n.slice(0, 200) } : {}) }; }
    if (!Object.keys(a).length) throw 0;
    await S.db.doc('votes/imp-' + (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'someone')).set({ name, a, u: Date.now() });
    $('import-code').value = ''; msg.textContent = `Added ${Object.keys(a).length} answers from ${name}.`;
  } catch (e) { msg.textContent = 'That code could not be read or saved. Ask for a fresh copy.'; }
};
const rs = on => { $('reset').hidden = on; $('reset2').hidden = !on; $('reset3').hidden = !on; };
$('reset').onclick = () => rs(true); $('reset3').onclick = () => rs(false);
$('reset2').onclick = async () => { rs(false); for (const id of Object.keys(S.team)) { try { await S.db.doc('votes/' + id).delete(); } catch (e) {} } S.mine = {}; S.team = {}; S.session = 0; S.skipped.clear(); S.revisited.clear(); results(); intro(); };

/* ---------- routing ---------- */
function go(v) { location.hash = v; }
function route() {
  const v = ['play', 'results', 'how'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'play';
  ['play', 'results', 'how'].forEach(k => { $('v-' + k).hidden = k !== v; });
  document.querySelectorAll('.nav button').forEach(b => b.setAttribute('aria-current', b.dataset.go === v ? 'true' : 'false'));
  if (v === 'results') results();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.nav button').forEach(b => b.onclick = () => go(b.dataset.go));
addEventListener('hashchange', route);
window.__test = { S, stat, RULES, exportRows, scores, progress, live };
intro(); route(); boot();
