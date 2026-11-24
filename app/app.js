// Agenda de Auditorios — versión web (Supabase)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_KEY, LOGIN_DOMAIN } from './config.js';

const $app = document.getElementById('app');
const sb = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ---------------------------------------------------------------- utilidades
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loginName = (n) => (n || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeKey = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const mondayOf = (d) => { const x = startOfDay(d); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtTime = (d) => timeKey(new Date(d));
const fmtDay = (d) => cap(new Date(d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }));
const fmtShort = (d) => cap(new Date(d).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, ''));
const fmtDateTime = (d) => new Date(d).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, '');
const fmtMins = (m) => (m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`);
const leadLabel = (m) => (m === 1440 ? '1 día' : fmtMins(m));
function relative(d) {
  const mins = Math.round((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return 'justo ahora';
  if (mins < 60) return `hace ${mins} min`;
  if (mins < 1440) return `hace ${Math.floor(mins / 60)} h`;
  if (mins < 2880) return 'ayer';
  if (mins < 10080) return `hace ${Math.floor(mins / 1440)} días`;
  return fmtDateTime(d);
}
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const ICONS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  cal: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4',
  scout: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',
  outbox: 'M4 13v6h16v-6M12 15V4M8 8l4-4 4 4',
  box: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10',
  note: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  plus: 'M12 5v14M5 12h14',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
  place: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  check: 'M5 12l5 5 9-10',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  grid: 'M4 4h16v16H4zM4 10h16M10 4v16',
  pin: 'M9 4h6l-1 6 3 3H7l3-3zM12 13v7',
  today: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M12 14h.01',
};
const icon = (n) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

const VENUE_COLORS = ['#9C1C45', '#3D5A98', '#2E7D6B', '#7A5900', '#4F7A28', '#C0392B', '#00838F', '#6A4C93', '#6D6D6D'];
const CATEGORIES = ['Microfonía', 'Audio', 'Accesorios', 'Cableado', 'Iluminación', 'Video', 'Mobiliario', 'Otro'];
const AVATAR = ['#9C1C45', '#3D5A98', '#2E7D6B', '#7A5900', '#6A4C93', '#00838F'];

// ---------------------------------------------------------------- estado
const S = {
  session: null, me: null, settings: null,
  venues: [], equip: [], events: [], loans: [], notes: [], profiles: new Map(), history: {},
  route: 'calendario', weekStart: mondayOf(new Date()), selDay: dateKey(new Date()),
  gridMode: false, venueFilter: null, scoutTab: 0, loanTab: 0, navOpen: false,
  modal: null, loginError: '',
};
try { S.gridMode = localStorage.getItem('agenda-vista') === 'semana'; } catch (e) { /* sin almacenamiento */ }

const venueById = (id) => S.venues.find((v) => v.id === id);
const venueColor = (id) => { const i = S.venues.findIndex((v) => v.id === id); return VENUE_COLORS[i >= 0 ? i % VENUE_COLORS.length : 8]; };
const venueLabel = (e, short) => { const v = venueById(e.venue_id); if (!v) return 'Por definir'; if (v.requires_detail) return e.venue_other || 'Otro lugar'; return short ? v.name.replace(/ Ing\..*$/, '') : v.name; };
const equipById = (id) => S.equip.find((q) => q.id === id);
const person = (id) => S.profiles.get(id);
const personName = (id) => person(id)?.full_name || 'Alguien';
const roleLabel = (p) => p?.job_title || (p?.area === 'tecnica' ? `Técnico${p.shift ? ` · turno ${p.shift}` : ''}` : 'Administración');
const avatar = (id, size = 34) => { const p = person(id); const n = p?.full_name || '?'; let h = 0; for (const c of id || n) h = (h * 31 + c.charCodeAt(0)) | 0;
  return `<span class="avatar" style="width:${size}px;height:${size}px;background:${AVATAR[Math.abs(h) % AVATAR.length]}">${esc(n.slice(0, 2))}</span>`; };
const isOngoing = (e, now = new Date()) => e.status !== 'cancelado' && new Date(e.starts_at) <= now && new Date(e.ends_at) > now;
const isAdmin = () => S.me?.role === 'admin';

// ---------------------------------------------------------------- avisos
let toastTimer;
function toast(msg, action) {
  const t = document.getElementById('toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" id="toast-act">${esc(action.label)}</button>` : ''}`;
  t.hidden = false;
  if (action) document.getElementById('toast-act').onclick = () => { t.hidden = true; action.run(); };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, action ? 7000 : 3500);
}
async function run(promise, okMsg) {
  const { data, error } = await promise;
  if (error) { console.error(error); toast(`No se pudo guardar: ${error.message}`); throw error; }
  if (okMsg) toast(okMsg);
  return data;
}

// ---------------------------------------------------------------- tema y recordatorios
function applyTheme() {
  const t = S.settings?.theme || 'sistema';
  if (t === 'sistema') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t === 'oscuro' ? 'dark' : 'light';
  try { localStorage.setItem('agenda-tema', t); } catch (e) { /* sin almacenamiento */ }
}
let timers = [];
function scheduleReminders() {
  timers.forEach(clearTimeout); timers = [];
  if (!('Notification' in window) || Notification.permission !== 'granted' || !S.settings?.notifications_enabled) return;
  const lead = S.settings.notify_minutes_before * 60000; const now = Date.now();
  for (const e of S.events) {
    if (e.status === 'cancelado') continue;
    const at = new Date(e.starts_at).getTime() - lead;
    if (at > now && at - now < 864e5) timers.push(setTimeout(() => notify(e), at - now));
  }
}
function notify(e, test) {
  const mins = S.settings?.notify_minutes_before ?? 30;
  const title = e ? `En ${leadLabel(mins)}: ${e.title}` : 'Notificación de prueba';
  const body = e ? [`${fmtTime(e.starts_at)}–${fmtTime(e.ends_at)}`, venueLabel(e), e.responsible && `Encargado: ${e.responsible}`].filter(Boolean).join(' · ') : 'Así te avisaremos antes de cada evento.';
  try { new Notification(title, { body: test ? `${body}\n(Prueba)` : body, icon: '../vistas/logo_claro.png', tag: e?.id || 'prueba' }); }
  catch (err) { toast('Este navegador no permite mostrar la notificación.'); }
}

// ---------------------------------------------------------------- datos
async function loadAll() {
  const uid = S.session.user.id;
  const since = addDays(new Date(), -180).toISOString();
  const [v, eq, ev, lo, no, pr, st] = await Promise.all([
    sb.from('venues').select('*').eq('is_active', true).order('sort_order'),
    sb.from('equipment').select('id,name,category,total_quantity,notes').eq('is_active', true).order('name'),
    sb.from('events').select('*, event_requirements(equipment_id,quantity)').is('deleted_at', null).gt('ends_at', since).order('starts_at'),
    sb.from('loans').select('*, loan_items(equipment_id,quantity,returned_quantity)').order('loaned_at', { ascending: false }),
    sb.from('notes').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
    sb.from('profiles').select('id,full_name,area,shift,job_title,role,is_active'),
    sb.from('user_settings').select('*').eq('user_id', uid).maybeSingle(),
  ]);
  const err = [v, eq, ev, lo, no, pr, st].find((r) => r.error);
  if (err) { console.error(err.error); toast(`Error al cargar: ${err.error.message}`); }
  S.venues = v.data || []; S.events = ev.data || []; S.loans = lo.data || []; S.notes = no.data || [];
  S.profiles = new Map((pr.data || []).map((p) => [p.id, p]));
  S.me = S.profiles.get(uid) || null; S.settings = st.data || { theme: 'sistema', notifications_enabled: true, notify_minutes_before: 30 };
  const onLoan = {};
  for (const l of S.loans) if (!l.returned_at) for (const it of l.loan_items) onLoan[it.equipment_id] = (onLoan[it.equipment_id] || 0) + it.quantity - it.returned_quantity;
  S.equip = (eq.data || []).map((q) => ({ ...q, on_loan: onLoan[q.id] || 0, available: q.total_quantity - (onLoan[q.id] || 0) }));
  applyTheme(); scheduleReminders();
}
const reloadSoon = debounce(async () => { await loadAll(); render(); }, 500);
let channel;
function subscribe() {
  if (channel) return;
  channel = sb.channel('agenda')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => reloadSoon())
    .subscribe();
}

// ---------------------------------------------------------------- arranque y sesión
async function boot() {
  if (!sb) { $app.innerHTML = `<div class="login"><div class="login-card">${logos(84)}<form><h2>Falta configurar la conexión</h2><p class="muted">Agrega la URL y la clave publicable de Supabase en <code>app/config.js</code>.</p></form></div></div>`; return; }
  window.addEventListener('hashchange', () => { S.route = location.hash.slice(1) || 'calendario'; S.navOpen = false; render(); });
  S.route = location.hash.slice(1) || 'calendario';
  const { data } = await sb.auth.getSession();
  S.session = data.session;
  sb.auth.onAuthStateChange((_e, session) => { S.session = session; });
  if (S.session) await enter(); else renderLogin();
  setInterval(() => { if (S.me && !S.modal && S.route === 'calendario') render(); }, 60000);
}
async function enter() {
  await loadAll();
  if (!S.me || !S.me.is_active) {
    await sb.auth.signOut(); S.session = null;
    S.loginError = 'Tu cuenta todavía no está activa. Pide a la administradora que la active.';
    renderLogin(); return;
  }
  subscribe(); render();
}
const logos = (h) => `<img class="logo-l" src="../vistas/logo_claro.png" alt="Dirección de Difusión Cultural" style="height:${h}px;width:auto"><img class="logo-d" src="../vistas/logo_oscuro.png" alt="Dirección de Difusión Cultural" style="height:${h}px;width:auto">`;
function renderLogin() {
  $app.innerHTML = `
  <div class="login"><div class="login-card">
    <div>${logos(84)}</div>
    <div><h1>Agenda de Auditorios</h1><p class="muted">Eventos, scouting y material del departamento</p></div>
    <form id="login-form" autocomplete="on">
      <label class="field"><span>Tu nombre</span><input class="input" id="login-name" name="username" autocomplete="username" required placeholder="Ej. Román" autocapitalize="words"></label>
      <label class="field"><span>Contraseña</span><input class="input" id="login-pass" name="password" type="password" autocomplete="current-password" required></label>
      ${S.loginError ? `<p class="error">${esc(S.loginError)}</p>` : ''}
      <button class="btn primary" type="submit">Iniciar sesión</button>
    </form>
    <p class="muted" style="font-size:.85rem">Acceso exclusivo para el personal del Departamento de Auditorios.</p>
  </div></div>`;
  document.getElementById('login-form').onsubmit = async (ev) => {
    ev.preventDefault();
    const name = document.getElementById('login-name').value; const password = document.getElementById('login-pass').value;
    const btn = ev.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Entrando…';
    const { data, error } = await sb.auth.signInWithPassword({ email: `${loginName(name)}@${LOGIN_DOMAIN}`, password });
    if (error) { S.loginError = 'Nombre o contraseña incorrectos.'; renderLogin(); return; }
    S.session = data.session; S.loginError = ''; await enter();
  };
}

// ---------------------------------------------------------------- estructura
const NAV = [
  ['calendario', 'Calendario', 'cal'], ['scouting', 'Scouting', 'scout'], ['prestamos', 'Material prestado', 'outbox'],
  ['catalogo', 'Catálogo de material', 'box'], ['notas', 'Notas', 'note'],
];
function render() {
  if (!S.me) return;
  const now = new Date();
  const upcomingScouts = S.events.filter((e) => e.kind === 'scouting' && new Date(e.ends_at) > now).length;
  const overdue = S.loans.filter((l) => !l.returned_at && l.due_at && new Date(l.due_at) < now).length;
  const views = { calendario: viewCalendar, scouting: viewScouting, prestamos: viewLoans, catalogo: viewCatalog, notas: viewNotes, ajustes: viewSettings };
  const view = views[S.route] || viewCalendar;
  const modalScroll = document.querySelector('.modal')?.scrollTop || 0;
  $app.innerHTML = `
  <div class="shell ${S.navOpen ? 'open' : ''}">
    <aside class="sidebar" aria-label="Menú">
      <div class="brand">${logos(52)}</div>
      <div class="me">${avatar(S.me.id, 38)}<div><b>${esc(S.me.full_name)}</b><br><small class="muted">${esc(roleLabel(S.me))}</small></div></div>
      ${NAV.map(([r, label, ic]) => `<a class="nav-item ${S.route === r ? 'active' : ''}" href="#${r}">${icon(ic)}${label}${
        r === 'scouting' && upcomingScouts ? `<span class="badge soft">${upcomingScouts}</span>` : r === 'prestamos' && overdue ? `<span class="badge">${overdue}</span>` : ''}</a>`).join('')}
      <div class="spacer"></div>
      <a class="nav-item ${S.route === 'ajustes' ? 'active' : ''}" href="#ajustes">${icon('settings')}Ajustes</a>
      <a class="nav-item" href="#" data-a="logout">${icon('logout')}Cerrar sesión</a>
    </aside>
    <div class="scrim" data-a="nav-close"></div>
    <main class="main">${view()}</main>
  </div>
  ${S.modal ? renderModal() : ''}`;
  const m = document.querySelector('.modal'); if (m) m.scrollTop = modalScroll;
}
const topbar = (title, extra = '') => `<div class="topbar"><button class="icon-btn menu-btn" data-a="nav-open" aria-label="Abrir menú">${icon('menu')}</button><h1>${esc(title)}</h1>${extra}</div>`;

// ---------------------------------------------------------------- calendario
function evCard(e, { showDate } = {}) {
  const now = new Date(); const c = venueColor(e.venue_id);
  const past = new Date(e.ends_at) < now; const cancelled = e.status === 'cancelado'; const live = isOngoing(e, now);
  const reqs = e.event_requirements || []; const pieces = reqs.reduce((a, r) => a + r.quantity, 0);
  let progress = '';
  if (live) { const tot = new Date(e.ends_at) - new Date(e.starts_at); const done = now - new Date(e.starts_at);
    progress = `<div class="progress"><div style="width:${Math.min(100, (done / tot) * 100)}%"></div></div><small style="color:var(--accent)">Termina en ${fmtMins(Math.round((new Date(e.ends_at) - now) / 60000))}</small>`; }
  return `<button class="ev ${past ? 'past' : ''} ${cancelled ? 'cancelled' : ''}" style="--c:${c}" data-a="open-event" data-id="${e.id}">
    <span class="bar"></span>
    <span class="time"><b>${fmtTime(e.starts_at)}</b><small>${fmtTime(e.ends_at)}</small></span>
    <span class="body">
      <span class="tags-row">${e.kind === 'scouting' ? '<span class="pill scout">Scouting</span>' : ''}${live ? '<span class="pill live">En curso</span>' : ''}${cancelled ? '<span class="pill cancel">Cancelado</span>' : ''}</span>
      ${showDate ? `<small style="color:var(--accent);font-weight:600">${fmtShort(e.starts_at)}</small>` : ''}
      <span class="title">${esc(e.title)}</span>
      <span class="meta"><span style="color:color-mix(in srgb, ${c} 65%, var(--ink))">${icon('place')}${esc(venueLabel(e, true))}</span>${e.responsible ? `<span>${icon('person')}${esc(e.responsible)}</span>` : ''}${reqs.length ? `<span>${icon('box')}${reqs.length} requerimientos · ${pieces} piezas</span>` : ''}</span>
      ${progress}
    </span>
  </button>`;
}
function weekEvents() {
  const a = S.weekStart; const b = addDays(a, 7);
  return S.events.filter((e) => new Date(e.starts_at) < b && new Date(e.ends_at) > a && (S.venueFilter == null || e.venue_id === S.venueFilter));
}
function viewCalendar() {
  const days = [...Array(7)].map((_, i) => addDays(S.weekStart, i));
  const today = dateKey(new Date()); const evs = weekEvents();
  const first = days[0], last = days[6];
  const label = first.getMonth() === last.getMonth()
    ? `${first.getDate()} – ${last.getDate()} de ${last.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`
    : `${first.getDate()} ${first.toLocaleDateString('es-MX', { month: 'short' })} – ${last.getDate()} ${last.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`;
  const strip = days.map((d) => { const k = dateKey(d); const dots = evs.filter((e) => dateKey(new Date(e.starts_at)) === k).slice(0, 3);
    return `<button class="day ${k === S.selDay ? 'sel' : ''} ${k === today ? 'today' : ''}" data-a="sel-day" data-day="${k}">
      <span class="dow">${cap(d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''))}</span><span class="num">${d.getDate()}</span>
      <span class="dots">${dots.map((e) => `<i style="background:${venueColor(e.venue_id)}"></i>`).join('')}</span></button>`; }).join('');
  const chips = `<button class="chip ${S.venueFilter == null ? 'on' : ''}" data-a="venue-filter" data-id="">Todos los lugares</button>` +
    S.venues.map((v) => `<button class="chip ${S.venueFilter === v.id ? 'on' : ''}" data-a="venue-filter" data-id="${v.id}"><i style="background:${venueColor(v.id)}"></i>${esc(v.name.replace(/ Ing\..*$/, ''))}</button>`).join('');
  return `${topbar('Calendario', `<div class="segmented" role="group" aria-label="Vista"><button class="${S.gridMode ? '' : 'on'}" data-a="mode" data-v="lista">${icon('list')} Lista</button><button class="${S.gridMode ? 'on' : ''}" data-a="mode" data-v="semana">${icon('grid')} Semana</button></div>`)}
    <div class="weekbar"><button class="icon-btn" data-a="week" data-d="-1" aria-label="Semana anterior">${icon('left')}</button><span class="label">${esc(cap(label))}</span><button class="icon-btn" data-a="week" data-d="1" aria-label="Semana siguiente">${icon('right')}</button><button class="btn outline small" data-a="today">${icon('today')}Hoy</button></div>
    <div class="days">${strip}</div>
    <div class="chips">${chips}</div>
    ${S.gridMode ? weekGrid(days, evs) : weekList(days, evs)}
    <button class="btn primary fab" data-a="new-event">${icon('plus')}Nuevo evento</button>`;
}
function weekList(days, evs) {
  const now = new Date(); const today = dateKey(now);
  const live = evs.filter((e) => isOngoing(e, now));
  let html = '';
  if (live.length) html += `<p class="section-label">En curso ahora</p><div class="list">${live.map((e) => evCard(e)).join('')}</div>`;
  for (const d of days) {
    const k = dateKey(d); const list = evs.filter((e) => dateKey(new Date(e.starts_at)) === k && !live.includes(e));
    const diff = Math.round((startOfDay(d) - startOfDay(now)) / 864e5);
    const pre = diff === 0 ? 'Hoy · ' : diff === 1 ? 'Mañana · ' : diff === -1 ? 'Ayer · ' : '';
    html += `<p class="day-head ${k === today ? 'today' : ''}" id="dia-${k}">${pre}${fmtDay(d)}</p>`;
    html += list.length ? `<div class="list">${list.map((e) => evCard(e)).join('')}</div>` : '<p class="empty-day">Sin eventos</p>';
  }
  return html;
}
function weekGrid(days, evs) {
  const H0 = 7, H1 = 23, HH = 48; const now = new Date(); const today = dateKey(now);
  const hours = [...Array(H1 - H0)].map((_, i) => `<div style="top:${i * HH}px">${pad(H0 + i)}</div>`).join('');
  const cols = days.map((d) => {
    const k = dateKey(d); const list = evs.filter((e) => dateKey(new Date(e.starts_at)) === k).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    // Carriles para eventos que se empalman
    const lanes = []; const pos = new Map(); let cluster = []; let clusterEnd = 0;
    const flush = () => { const ends = []; const lane = new Map();
      for (const e of cluster) { const s = new Date(e.starts_at).getTime(); let i = ends.findIndex((t) => t <= s); if (i < 0) { ends.push(0); i = ends.length - 1; } ends[i] = new Date(e.ends_at).getTime(); lane.set(e.id, i); }
      for (const e of cluster) pos.set(e.id, [lane.get(e.id), ends.length]); cluster = []; };
    for (const e of list) { const s = new Date(e.starts_at).getTime(); if (cluster.length && s >= clusterEnd) flush(); cluster.push(e); clusterEnd = Math.max(clusterEnd, new Date(e.ends_at).getTime()); }
    if (cluster.length) flush(); void lanes;
    const blocks = list.map((e) => {
      const s = new Date(e.starts_at); const en = new Date(e.ends_at);
      const sm = Math.max(0, (s.getHours() - H0) * 60 + s.getMinutes());
      const em = dateKey(en) !== k ? (H1 - H0) * 60 : Math.min((H1 - H0) * 60, (en.getHours() - H0) * 60 + en.getMinutes());
      const [ln, n] = pos.get(e.id); const c = venueColor(e.venue_id);
      return `<button class="blk ${e.status === 'cancelado' ? 'cancelled' : ''}" data-a="open-event" data-id="${e.id}" title="${esc(e.title)}"
        style="--c:${c};--cbg:color-mix(in srgb, ${c} 18%, var(--surface));top:${(sm / 60) * HH}px;height:${Math.max(24, ((em - sm) / 60) * HH - 2)}px;left:calc(${(ln / n) * 100}% + 2px);width:calc(${100 / n}% - 4px)">${esc(e.title)}</button>`;
    }).join('');
    const nowLine = k === today && now.getHours() >= H0 && now.getHours() < H1 ? `<div class="now" style="top:${((now.getHours() - H0) * 60 + now.getMinutes()) / 60 * HH}px"></div>` : '';
    return `<div class="col ${k === today ? 'today' : ''}" style="--hh:${HH}px;height:${(H1 - H0) * HH}px">${blocks}${nowLine}</div>`;
  }).join('');
  const head = `<div></div>${days.map((d) => `<div style="padding:8px;border-left:1px solid var(--line);font-weight:600;font-size:.85rem">${fmtShort(d)}</div>`).join('')}`;
  return `<div class="grid-wrap"><div class="grid" style="border-bottom:1px solid var(--line)">${head}</div><div class="grid"><div class="hours" style="height:${(H1 - H0) * HH}px">${hours}</div>${cols}</div></div>`;
}

// ---------------------------------------------------------------- scouting
function viewScouting() {
  const now = new Date(); const all = S.events.filter((e) => e.kind === 'scouting');
  const list = S.scoutTab === 0 ? all.filter((e) => new Date(e.ends_at) > now) : all.filter((e) => new Date(e.ends_at) <= now).reverse();
  return `${topbar('Scouting')}
    <div class="tabs"><button class="${S.scoutTab === 0 ? 'on' : ''}" data-a="scout-tab" data-t="0">Próximos</button><button class="${S.scoutTab === 1 ? 'on' : ''}" data-a="scout-tab" data-t="1">Realizados</button></div>
    <p class="info-box" style="margin-bottom:14px">Un scouting es la cita para revisar qué necesitará un evento. Lo acordado ahí se registra después como evento con sus requerimientos.</p>
    <div class="list">${list.length ? list.map((s) => { const d = S.events.filter((e) => e.scouting_id === s.id);
      return `<div>${evCard(s, { showDate: true })}<div class="row" style="align-items:center;padding:6px 6px 0;gap:8px">${d.length
        ? `<span style="color:var(--accent);font-weight:600;flex:1">${icon('check')} ${d.length === 1 ? 'Evento registrado' : `${d.length} eventos registrados`}</span>${d.map((x) => `<button class="btn outline small" data-a="open-event" data-id="${x.id}" style="flex:0 0 auto">Ver ${esc(fmtShort(x.starts_at))}</button>`).join('')}`
        : `<span class="muted" style="flex:1">Pendiente de registrar evento</span><button class="btn small" data-a="from-scout" data-id="${s.id}" style="flex:0 0 auto">${icon('plus')}Registrar evento</button>`}</div></div>`; }).join('')
      : `<p class="empty-day">${S.scoutTab === 0 ? 'No hay scoutings programados.' : 'Aún no hay scoutings realizados.'}</p>`}</div>
    <button class="btn primary fab" data-a="new-scout">${icon('plus')}Nuevo scouting</button>`;
}

// ---------------------------------------------------------------- préstamos
function viewLoans() {
  const now = new Date(); const active = S.loans.filter((l) => !l.returned_at); const ret = S.loans.filter((l) => l.returned_at);
  const overdue = active.filter((l) => l.due_at && new Date(l.due_at) < now).length;
  const out = active.reduce((a, l) => a + l.loan_items.reduce((b, i) => b + i.quantity - i.returned_quantity, 0), 0);
  const list = S.loanTab === 0 ? active : ret;
  return `${topbar('Material prestado')}
    <div class="stats"><div class="stat a"><b>${active.length}</b>Préstamos activos</div><div class="stat d"><b>${overdue}</b>Vencidos</div><div class="stat n"><b>${out}</b>Piezas fuera</div></div>
    <div class="tabs"><button class="${S.loanTab === 0 ? 'on' : ''}" data-a="loan-tab" data-t="0">Activos (${active.length})</button><button class="${S.loanTab === 1 ? 'on' : ''}" data-a="loan-tab" data-t="1">Devueltos</button></div>
    <div class="cards-2">${list.length ? list.map((l) => { const late = !l.returned_at && l.due_at && new Date(l.due_at) < now;
      const pill = l.returned_at ? '<span class="pill ok">Devuelto</span>' : late ? '<span class="pill cancel">Vencido</span>' : '<span class="pill scout">Prestado</span>';
      return `<div class="card loan"><div class="loan-head"><div><h3>${esc(l.borrower_name)}</h3><small class="muted">${esc([l.borrower_area, l.borrower_contact].filter(Boolean).join(' · '))}</small></div>${pill}</div>
        <div class="req-chips">${l.loan_items.map((i) => `<span>${esc(equipById(i.equipment_id)?.name || 'Material')} ×${i.quantity}</span>`).join('')}</div>
        ${l.notes ? `<p class="muted" style="white-space:pre-wrap">${esc(l.notes)}</p>` : ''}
        <small class="muted">Salió: ${fmtDateTime(l.loaned_at)}${l.due_at ? ` · Devolver: ${fmtDateTime(l.due_at)}` : ''}${l.returned_at ? ` · Regresó: ${fmtDateTime(l.returned_at)}${l.received_by ? ` (recibió ${esc(personName(l.received_by))})` : ''}` : ''}<br>Registró: ${esc(personName(l.created_by))}</small>
        ${l.returned_at ? '' : `<div><button class="btn small" data-a="return-loan" data-id="${l.id}">${icon('check')}Marcar devuelto</button></div>`}</div>`; }).join('')
      : `<p class="empty-day">${S.loanTab === 0 ? 'No hay material prestado.' : 'Sin devoluciones.'}</p>`}</div>
    <button class="btn primary fab" data-a="new-loan">${icon('plus')}Nuevo préstamo</button>`;
}

// ---------------------------------------------------------------- catálogo
const byCategory = (items) => { const g = {}; for (const q of items) (g[q.category || 'Otro'] ||= []).push(q);
  return Object.entries(g).sort((a, b) => (CATEGORIES.indexOf(a[0]) + 99) % 99 - (CATEGORIES.indexOf(b[0]) + 99) % 99); };
function viewCatalog() {
  return `${topbar('Catálogo de material')}
    <p class="muted" style="margin-bottom:14px">Este catálogo alimenta los requerimientos de los eventos y el material prestado. Toca una pieza para cambiar su inventario.</p>
    <div class="cards-2">${byCategory(S.equip).map(([cat, items]) => `<div class="card"><p class="section-label" style="margin:14px 16px 4px">${esc(cat)}</p>
      ${items.map((q) => { const r = q.total_quantity ? Math.max(0, q.available) / q.total_quantity : 0;
        return `<div class="equip" role="button" tabindex="0" data-a="edit-equip" data-id="${q.id}" style="cursor:pointer"><div><b>${esc(q.name)}</b>${q.notes ? ` <small class="muted">· ${esc(q.notes)}</small>` : ''}
          <div class="bar-bg"><div style="width:${r * 100}%;${r < .3 ? 'background:var(--danger)' : ''}"></div></div><small class="muted">${q.on_loan ? `${q.on_loan} prestados` : 'Todo en almacén'}</small></div>
          <div class="count"><b>${Math.max(0, q.available)}</b><br><small class="muted">de ${q.total_quantity}</small></div></div>`; }).join('')}</div>`).join('')}</div>
    <button class="btn primary fab" data-a="new-equip">${icon('plus')}Agregar material</button>`;
}

// ---------------------------------------------------------------- notas
function viewNotes() {
  return `${topbar('Notas')}
    <div class="cards-2">${S.notes.length ? S.notes.map((n) => { const mine = n.author_id === S.me.id; const canEdit = mine || isAdmin();
      return `<div class="card note ${n.is_pinned ? 'pinned' : ''}"><div class="note-head">${avatar(n.author_id)}<div><b>${esc(personName(n.author_id))}${mine ? ' (tú)' : ''}</b><br><small class="muted">${relative(n.created_at)}</small></div>
        ${canEdit ? `<button class="icon-btn" data-a="pin-note" data-id="${n.id}" aria-label="${n.is_pinned ? 'Desfijar' : 'Fijar arriba'}" title="${n.is_pinned ? 'Desfijar' : 'Fijar arriba'}" style="${n.is_pinned ? 'color:var(--accent)' : ''}">${icon('pin')}</button>
        <button class="icon-btn" data-a="del-note" data-id="${n.id}" aria-label="Eliminar nota" title="Eliminar">${icon('trash')}</button>` : n.is_pinned ? `<span style="color:var(--accent)">${icon('pin')}</span>` : ''}</div>
        ${n.title ? `<h3>${esc(n.title)}</h3>` : ''}<p>${esc(n.content)}</p></div>`; }).join('') : '<p class="empty-day">Todavía no hay notas.</p>'}</div>
    <button class="btn primary fab" data-a="new-note">${icon('edit')}Nueva nota</button>`;
}

// ---------------------------------------------------------------- ajustes
function viewSettings() {
  const st = S.settings; const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  return `${topbar('Ajustes')}<div class="settings">
    <div class="card"><div class="row" style="align-items:center">${avatar(S.me.id, 52)}<div style="flex:1 1 auto"><h2>${esc(S.me.full_name)}</h2><small class="muted">${esc(roleLabel(S.me))} · Departamento de Auditorios</small></div></div></div>
    <div class="card"><h3>Tema</h3><div class="segmented" role="group" aria-label="Tema">${['sistema', 'claro', 'oscuro'].map((t) => `<button class="${st.theme === t ? 'on' : ''}" data-a="theme" data-v="${t}">${cap(t)}</button>`).join('')}</div>
      <div style="padding:14px;background:var(--surface-2);border-radius:14px;justify-self:start">${logos(48)}</div><small class="muted">En modo oscuro el logo se muestra con texto claro.</small></div>
    <div class="card"><h3>Recordatorios</h3>
      <label class="switch"><span>Avisarme antes de cada evento<br><small class="muted">Incluye scoutings</small></span><input type="checkbox" data-a="notif-toggle" ${st.notifications_enabled ? 'checked' : ''}></label>
      <div><p style="font-weight:600;margin-bottom:8px">¿Con cuánto tiempo de anticipación?</p><div class="chips" style="flex-wrap:wrap">${[10, 15, 30, 60, 120, 1440].map((m) => `<button class="chip ${st.notify_minutes_before === m ? 'on' : ''}" data-a="lead" data-v="${m}">${leadLabel(m)}</button>`).join('')}</div>
      <small class="muted">Predeterminado: 30 min. En la versión web los avisos llegan mientras la página esté abierta en el navegador.</small></div>
      <div class="row" style="align-items:center"><span style="flex:1 1 auto" class="muted">${perm === 'granted' ? 'Notificaciones del navegador permitidas.' : perm === 'denied' ? 'El navegador bloqueó las notificaciones. Actívalas en la configuración del sitio.' : perm === 'unsupported' ? 'Este navegador no admite notificaciones.' : 'Permite las notificaciones para recibir los avisos.'}</span>
      <button class="btn" data-a="test-notif" style="flex:0 0 auto">${icon('bell')}Probar notificación</button></div></div>
    <div class="card"><h3>Cambiar contraseña</h3><form id="pass-form" class="row" style="align-items:end"><label class="field"><span>Nueva contraseña</span><input class="input" type="password" id="new-pass" minlength="8" autocomplete="new-password" required></label><button class="btn" type="submit" style="flex:0 0 auto">Guardar</button></form><small class="muted">Mínimo 8 caracteres.</small></div>
    <button class="btn outline" data-a="logout" style="justify-self:start">${icon('logout')}Cerrar sesión</button>
    <p class="muted credits">Desarrollado por Luis Gabriel Manzano Guadarrama.<br>
      Para soporte y contacto de cotizaciones: <a href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=manzano.guadarrama.luisgabriel%40gmail.com" target="_blank" rel="noopener">manzano.guadarrama.luisgabriel@gmail.com</a></p>
  </div>`;
}

// ---------------------------------------------------------------- modales
function renderModal() {
  const m = S.modal; let head = '', body = '';
  if (m.type === 'event') [head, body] = modalEvent(m);
  else if (m.type === 'form') [head, body] = modalForm(m);
  else if (m.type === 'loan') [head, body] = modalLoan(m);
  else if (m.type === 'equip') [head, body] = modalEquip(m);
  else if (m.type === 'note') [head, body] = modalNote(m);
  else if (m.type === 'confirm') [head, body] = [esc(m.title), `<p>${esc(m.text)}</p><div class="actions"><button class="btn danger" data-a="confirm-yes">${esc(m.yes)}</button><button class="btn outline" data-a="close">Cancelar</button></div>`];
  return `<div class="modal-back" data-a="backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(head.replace(/<[^>]+>/g, ''))}">
    <div class="modal-head"><h2>${head}</h2><button class="icon-btn" data-a="close" aria-label="Cerrar">${icon('close')}</button></div>
    <div class="modal-body">${body}</div></div></div>`;
}
function describeHistory(h) {
  const who = personName(h.changed_by);
  const verbs = { creado: 'creó el evento', modificado: 'modificó el evento', eliminado: 'eliminó el evento', restaurado: 'restauró el evento' };
  let detail = '';
  const c = h.changes || {};
  if (c.requerimientos) { const r = c.requerimientos; detail = r.accion === 'cambiado' ? `Cambió ${r.equipo}: ${r.antes} → ${r.despues}` : `${r.accion === 'agregado' ? 'Agregó' : 'Quitó'} ${r.equipo} ×${r.cantidad}`; }
  else if (Object.keys(c).length) {
    const names = { title: 'nombre', responsible: 'encargado', starts_at: 'horario', ends_at: 'horario', venue_id: 'lugar', venue_other: 'lugar', general_notes: 'notas', kind: 'tipo', scouting_id: 'scouting' };
    const parts = [...new Set(Object.keys(c).filter((k) => names[k]).map((k) => names[k]))];
    const st = c.status ? (c.status.despues === 'cancelado' ? 'Marcó el evento como cancelado' : 'Reactivó el evento') : '';
    detail = [st, parts.length ? `Cambió ${parts.join(', ')}` : ''].filter(Boolean).join(' · ');
  }
  return `<div class="item">${avatar(h.changed_by, 32)}<div><b>${esc(who)}</b> ${verbs[h.action] || h.action}${detail ? `<br><span class="muted">${esc(detail)}</span>` : ''}<br><small>${relative(h.changed_at)} · ${fmtDateTime(h.changed_at)}</small></div></div>`;
}
function modalEvent(m) {
  const e = S.events.find((x) => x.id === m.id);
  if (!e) return ['Evento', '<p class="muted">Este evento ya no existe.</p>'];
  const c = venueColor(e.venue_id); const cancelled = e.status === 'cancelado'; const sc = e.kind === 'scouting';
  const mins = Math.round((new Date(e.ends_at) - new Date(e.starts_at)) / 60000);
  const reqs = e.event_requirements || [];
  const derived = S.events.filter((x) => x.scouting_id === e.id); const origin = e.scouting_id && S.events.find((x) => x.id === e.scouting_id);
  const hist = S.history[e.id];
  const lead = S.settings.notify_minutes_before;
  return [sc ? 'Scouting' : 'Evento', `
    <div class="hero-ev ${cancelled ? 'cancelled' : ''}" style="--cbg:color-mix(in srgb, ${c} 16%, var(--surface))">
      <div class="tags-row">${sc ? '<span class="pill scout">Scouting</span>' : ''}${isOngoing(e) ? '<span class="pill live">En curso</span>' : ''}${cancelled ? '<span class="pill cancel">Cancelado</span>' : ''}</div>
      <h2>${esc(e.title)}</h2><b>${fmtDay(e.starts_at)}</b><span>${fmtTime(e.starts_at)} – ${fmtTime(e.ends_at)} · ${fmtMins(mins)}</span></div>
    <dl class="kv"><dt>Lugar</dt><dd style="color:color-mix(in srgb, ${c} 65%, var(--ink));font-weight:600">${esc(venueLabel(e))}</dd><dt>Encargado</dt><dd>${esc(e.responsible || 'Sin asignar')}</dd>
      <dt>Recordatorio</dt><dd>${cancelled ? 'Sin recordatorio (cancelado)' : S.settings.notifications_enabled ? `${leadLabel(lead)} antes · ${fmtTime(new Date(new Date(e.starts_at) - lead * 60000))}` : 'Recordatorios desactivados'}</dd></dl>
    <div class="actions"><button class="btn" data-a="edit-event" data-id="${e.id}">${icon('edit')}Editar</button>
      <button class="btn outline" data-a="toggle-cancel" data-id="${e.id}">${cancelled ? 'Reactivar' : 'Marcar como cancelado'}</button>
      <button class="btn danger" data-a="del-event" data-id="${e.id}">${icon('trash')}Eliminar</button></div>
    ${sc ? `<div><p class="section-label">Resultado del scouting</p>${derived.length ? derived.map((d) => `<button class="btn outline" data-a="open-event" data-id="${d.id}">${esc(d.title)} · ${fmtShort(d.starts_at)}</button>`).join(' ') : `<p class="muted" style="margin-bottom:8px">Aún no se registra el evento que salió de este scouting.</p><button class="btn primary" data-a="from-scout" data-id="${e.id}">${icon('plus')}Registrar evento a partir de este scouting</button>`}</div>` : ''}
    ${origin ? `<div><p class="section-label">Origen</p><button class="btn outline" data-a="open-event" data-id="${origin.id}">Viene del scouting: ${esc(origin.title)}</button></div>` : ''}
    <div><p class="section-label">${sc ? 'Requerimientos solicitados' : 'Requerimientos'}</p>${reqs.length ? `<div class="req-chips">${reqs.map((r) => `<span>${esc(equipById(r.equipment_id)?.name || 'Material')} <b>×${r.quantity}</b></span>`).join('')}</div>` : '<p class="muted">Sin requerimientos registrados.</p>'}</div>
    <div><p class="section-label">Notas generales</p><div class="notes-box">${esc(e.general_notes || 'Sin notas.')}</div></div>
    <div><p class="section-label">Historial</p><div class="timeline">${hist ? hist.map(describeHistory).join('') || '<p class="muted">Sin movimientos.</p>' : '<p class="muted">Cargando…</p>'}</div></div>`];
}
function blankDraft(kind = 'evento', date = S.selDay) {
  return { id: null, kind, title: '', responsible: '', date, start: '10:00', end: '12:00', venue_id: null, venue_other: '', status: 'confirmado', general_notes: '', scouting_id: null, q: {} };
}
function draftFrom(e) {
  const s = new Date(e.starts_at), en = new Date(e.ends_at);
  return { id: e.id, kind: e.kind, title: e.title, responsible: e.responsible || '', date: dateKey(s), start: timeKey(s), end: timeKey(en), venue_id: e.venue_id, venue_other: e.venue_other || '',
    status: e.status, general_notes: e.general_notes || '', scouting_id: e.scouting_id, q: Object.fromEntries((e.event_requirements || []).map((r) => [r.equipment_id, r.quantity])) };
}
const draftTimes = (d) => { const s = new Date(`${d.date}T${d.start}`); const e = new Date(`${d.date}T${d.end}`); return [s, e]; };
async function refreshFormChecks() {
  const m = S.modal; if (m?.type !== 'form') return; const d = m.draft; const [s, e] = draftTimes(d);
  if (!(e > s)) { m.avail = null; m.conflicts = []; render(); return; }
  const v = venueById(d.venue_id);
  const [a, c] = await Promise.all([
    sb.rpc('equipment_availability', { p_starts_at: s.toISOString(), p_ends_at: e.toISOString(), p_exclude_event: d.id }),
    d.venue_id && !v?.requires_detail ? sb.rpc('venue_conflicts', { p_venue_id: d.venue_id, p_starts_at: s.toISOString(), p_ends_at: e.toISOString(), p_exclude_event: d.id }) : Promise.resolve({ data: [] }),
  ]);
  if (S.modal !== m) return;
  m.avail = Object.fromEntries((a.data || []).map((r) => [r.equipment_id, r.available]));
  m.conflicts = c.data || []; render();
}
function modalForm(m) {
  const d = m.draft; const [s, e] = draftTimes(d); const timeErr = !(e > s);
  const v = venueById(d.venue_id); const other = v?.requires_detail;
  const t = m.tried;
  const title = d.id ? (d.kind === 'scouting' ? 'Editar scouting' : 'Editar evento') : d.kind === 'scouting' ? 'Nuevo scouting' : 'Nuevo evento';
  const reqRows = byCategory(S.equip).map(([cat, items]) => `<p class="req-cat">${esc(cat)}</p>${items.map((q) => { const n = d.q[q.id] || 0; const av = m.avail?.[q.id] ?? q.available;
    return `<div class="req-row"><div>${esc(q.name)}<small class="${n > av ? 'over' : ''}">Disponibles: ${Math.max(0, av)} de ${q.total_quantity}</small></div>
      <div class="stepper"><button type="button" data-a="step" data-id="${q.id}" data-d="-1" aria-label="Menos ${esc(q.name)}">−</button><output>${n}</output><button type="button" data-a="step" data-id="${q.id}" data-d="1" aria-label="Más ${esc(q.name)}">+</button></div></div>`; }).join('')}`).join('');
  return [title, `
    ${!d.id && !m.fromScout ? `<div class="segmented" role="group" aria-label="Tipo"><button class="${d.kind === 'evento' ? 'on' : ''}" data-a="kind" data-v="evento">Evento</button><button class="${d.kind === 'scouting' ? 'on' : ''}" data-a="kind" data-v="scouting">Scouting</button></div>` : ''}
    ${m.fromScout ? `<p class="info-box">Se copiaron encargado, lugar, requerimientos y notas del scouting «${esc(m.fromScout)}».</p>` : ''}
    <label class="field"><span>${d.kind === 'scouting' ? 'Nombre del scouting' : 'Nombre del evento'}</span><input class="input" data-f="title" value="${esc(d.title)}" ${t && !d.title.trim() ? 'aria-invalid="true" style="border-color:var(--danger)"' : ''}></label>
    <label class="field"><span>Encargado</span><input class="input" data-f="responsible" value="${esc(d.responsible)}" placeholder="Persona o dependencia (ej. DFA)"></label>
    <div class="row"><label class="field"><span>Fecha</span><input class="input" type="date" data-f="date" data-check value="${d.date}"></label>
      <label class="field"><span>Hora del evento</span><input class="input" type="time" data-f="start" data-check value="${d.start}"></label>
      <label class="field"><span>Desmontaje / término</span><input class="input" type="time" data-f="end" data-check value="${d.end}"></label></div>
    ${timeErr ? '<p class="warn-box">La hora de término debe ser después del inicio.</p>' : ''}
    <small class="muted">La hora de montaje anótala en las notas.</small>
    <label class="field"><span>Lugar</span><select class="input" data-f="venue_id" data-check ${t && d.kind === 'evento' && !d.venue_id ? 'style="border-color:var(--danger)"' : ''}><option value="">Selecciona el lugar</option>${S.venues.map((x) => `<option value="${x.id}" ${x.id === d.venue_id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
    ${other ? `<label class="field"><span>¿Dónde será?</span><input class="input" data-f="venue_other" value="${esc(d.venue_other)}" placeholder="Ej. Plaza Lázaro Cárdenas, museo…" ${t && !d.venue_other.trim() ? 'style="border-color:var(--danger)"' : ''}></label>` : ''}
    ${m.conflicts?.length ? `<div class="warn-box"><b>Se empalma en este lugar con:</b><br>${m.conflicts.map((c) => `• ${esc(c.title)} (${fmtTime(c.starts_at)}–${fmtTime(c.ends_at)})`).join('<br>')}</div>` : ''}
    ${d.id ? `<label class="switch card" style="padding:12px 16px"><span><b>Cancelado</b><br><small class="muted">Sigue en el calendario, tachado, y ya no cuenta para empalmes ni material.</small></span><input type="checkbox" data-f="status" ${d.status === 'cancelado' ? 'checked' : ''}></label>` : ''}
    <div><p class="section-label">Requerimientos</p><div class="req-table">${reqRows}</div></div>
    <label class="field"><span>Notas generales</span><textarea class="input" data-f="general_notes" placeholder="Montaje, accesos, contactos, pendientes…">${esc(d.general_notes)}</textarea></label>
    <div class="actions"><button class="btn primary" data-a="save-event" ${m.saving ? 'disabled' : ''}>${m.saving ? 'Guardando…' : 'Guardar'}</button><button class="btn outline" data-a="close">Cancelar</button></div>`];
}
function modalLoan(m) {
  const d = m.draft; const t = m.tried;
  return ['Nuevo préstamo', `
    <label class="field"><span>Nombre / evento</span><input class="input" data-f="borrower_name" value="${esc(d.borrower_name)}" ${t && !d.borrower_name.trim() ? 'style="border-color:var(--danger)"' : ''}></label>
    <div class="row"><label class="field"><span>Escuela, área o dependencia</span><input class="input" data-f="borrower_area" value="${esc(d.borrower_area)}" ${t && !d.borrower_area.trim() ? 'style="border-color:var(--danger)"' : ''}></label>
      <label class="field"><span>Teléfono o extensión</span><input class="input" data-f="borrower_contact" value="${esc(d.borrower_contact)}"></label></div>
    <div class="row"><label class="field"><span>Devolver el día</span><input class="input" type="date" data-f="due_date" value="${d.due_date}"></label><label class="field"><span>A las</span><input class="input" type="time" data-f="due_time" value="${d.due_time}"></label></div>
    <div><p class="section-label">Material ${t && !Object.values(d.q).some((n) => n > 0) ? '<span style="color:var(--danger)">· elige al menos uno</span>' : ''}</p><div class="req-table">${byCategory(S.equip).map(([cat, items]) => `<p class="req-cat">${esc(cat)}</p>${items.map((q) => { const n = d.q[q.id] || 0;
      return `<div class="req-row"><div>${esc(q.name)}<small>Disponibles: ${Math.max(0, q.available)}</small></div><div class="stepper"><button type="button" data-a="step" data-id="${q.id}" data-d="-1" aria-label="Menos">−</button><output>${n}</output><button type="button" data-a="step" data-id="${q.id}" data-d="1" data-max="${Math.max(0, q.available)}" aria-label="Más">+</button></div></div>`; }).join('')}`).join('')}</div></div>
    <label class="field"><span>Notas</span><textarea class="input" data-f="notes" placeholder="Estado del equipo, números de serie…">${esc(d.notes)}</textarea></label>
    <div class="actions"><button class="btn primary" data-a="save-loan">Guardar préstamo</button><button class="btn outline" data-a="close">Cancelar</button></div>`];
}
function modalEquip(m) {
  const d = m.draft;
  return [d.id ? esc(d.name) : 'Agregar material', `
    ${d.id ? '' : `<label class="field"><span>Nombre</span><input class="input" data-f="name" value="${esc(d.name)}" placeholder="Ej. Shure Beta 52"></label>
    <label class="field"><span>Categoría</span><select class="input" data-f="category">${CATEGORIES.map((c) => `<option ${c === d.category ? 'selected' : ''}>${c}</option>`).join('')}</select></label>`}
    <div class="req-row card"><div><b>Piezas en inventario</b></div><div class="stepper"><button type="button" data-a="qty" data-d="-1" aria-label="Menos">−</button><output>${d.total_quantity}</output><button type="button" data-a="qty" data-d="1" aria-label="Más">+</button></div></div>
    <div class="actions"><button class="btn primary" data-a="save-equip">Guardar</button><button class="btn outline" data-a="close">Cancelar</button></div>`];
}
function modalNote(m) {
  const d = m.draft;
  return ['Nueva nota', `<p class="row" style="align-items:center;gap:8px">${avatar(S.me.id, 26)}<span>Se publicará como <b>${esc(S.me.full_name)}</b></span></p>
    <label class="field"><span>Título (opcional)</span><input class="input" data-f="title" value="${esc(d.title)}"></label>
    <label class="field"><span>Nota</span><textarea class="input" data-f="content">${esc(d.content)}</textarea></label>
    <div class="actions"><button class="btn primary" data-a="save-note">Publicar</button><button class="btn outline" data-a="close">Cancelar</button></div>`];
}

// ---------------------------------------------------------------- acciones
function openForm(draft, extra = {}) { S.modal = { type: 'form', draft, avail: null, conflicts: [], ...extra }; render(); refreshFormChecks(); }
async function openEvent(id) {
  S.modal = { type: 'event', id }; render();
  const { data } = await sb.from('event_history').select('*').eq('event_id', id).order('changed_at', { ascending: false });
  S.history[id] = data || []; if (S.modal?.type === 'event' && S.modal.id === id) render();
}
const A = {
  'nav-open': () => { S.navOpen = true; render(); },
  'nav-close': () => { S.navOpen = false; render(); },
  logout: async (_el, ev) => { ev.preventDefault(); await sb.auth.signOut(); if (channel) { sb.removeChannel(channel); channel = null; } S.me = null; S.session = null; timers.forEach(clearTimeout); renderLogin(); },
  week: (el) => { S.weekStart = addDays(S.weekStart, 7 * +el.dataset.d); const t = new Date(); S.selDay = dateKey(mondayOf(t).getTime() === S.weekStart.getTime() ? t : S.weekStart); render(); },
  today: () => { S.weekStart = mondayOf(new Date()); S.selDay = dateKey(new Date()); render(); },
  'sel-day': (el) => { S.selDay = el.dataset.day; render(); document.getElementById(`dia-${S.selDay}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  'venue-filter': (el) => { S.venueFilter = el.dataset.id ? +el.dataset.id : null; render(); },
  mode: (el) => { S.gridMode = el.dataset.v === 'semana'; try { localStorage.setItem('agenda-vista', el.dataset.v); } catch (e) { /* sin almacenamiento */ } render(); },
  'scout-tab': (el) => { S.scoutTab = +el.dataset.t; render(); },
  'loan-tab': (el) => { S.loanTab = +el.dataset.t; render(); },
  'open-event': (el) => openEvent(el.dataset.id),
  close: () => { S.modal = null; render(); },
  backdrop: (el, ev) => { if (ev.target === el) { S.modal = null; render(); } },
  'new-event': () => openForm(blankDraft('evento')),
  'new-scout': () => openForm(blankDraft('scouting', dateKey(new Date()))),
  'from-scout': (el) => { const s = S.events.find((e) => e.id === el.dataset.id); const d = draftFrom(s);
    openForm({ ...d, id: null, kind: 'evento', status: 'confirmado', title: s.title.replace(/^Scouting · /, ''), scouting_id: s.id, date: dateKey(addDays(new Date(), 7)) }, { fromScout: s.title }); },
  'edit-event': (el) => { const e = S.events.find((x) => x.id === el.dataset.id); openForm(draftFrom(e)); },
  kind: (el) => { S.modal.draft.kind = el.dataset.v; render(); },
  step: (el) => { const q = S.modal.draft.q; const id = +el.dataset.id; const max = el.dataset.max != null ? +el.dataset.max : 999; q[id] = Math.min(max, Math.max(0, (q[id] || 0) + +el.dataset.d)); render(); },
  qty: (el) => { const d = S.modal.draft; d.total_quantity = Math.max(0, d.total_quantity + +el.dataset.d); render(); },
  'save-event': async () => {
    const m = S.modal; const d = m.draft; m.tried = true; const [s, e] = draftTimes(d); const v = venueById(d.venue_id);
    if (!d.title.trim() || !(e > s) || (d.kind === 'evento' && !d.venue_id) || (v?.requires_detail && !d.venue_other.trim())) { render(); toast('Revisa los campos marcados.'); return; }
    m.saving = true; render();
    const p_event = { id: d.id, kind: d.kind, title: d.title.trim(), responsible: d.responsible.trim(), starts_at: s.toISOString(), ends_at: e.toISOString(),
      venue_id: d.venue_id, venue_other: v?.requires_detail ? d.venue_other.trim() : null, status: d.status, general_notes: d.general_notes.trim(), scouting_id: d.scouting_id };
    const p_requirements = Object.entries(d.q).filter(([, n]) => n > 0).map(([id, n]) => ({ equipment_id: +id, quantity: n }));
    try { const id = await run(sb.rpc('save_event', { p_event, p_requirements }), d.id ? 'Cambios guardados' : 'Guardado. Quedó en el historial.');
      await loadAll(); delete S.history[id]; openEvent(id); }
    catch (err) { m.saving = false; render(); }
  },
  'toggle-cancel': async (el) => { const e = S.events.find((x) => x.id === el.dataset.id); const ns = e.status === 'cancelado' ? 'confirmado' : 'cancelado';
    await run(sb.from('events').update({ status: ns }).eq('id', e.id), ns === 'cancelado' ? 'Marcado como cancelado' : 'Reactivado'); await loadAll(); delete S.history[e.id]; openEvent(e.id); },
  'del-event': (el) => { const e = S.events.find((x) => x.id === el.dataset.id);
    S.modal = { type: 'confirm', title: `¿Eliminar ${e.kind === 'scouting' ? 'scouting' : 'evento'}?`, text: `«${e.title}» dejará de aparecer en el calendario. Su historial se conserva y podrás deshacerlo.`, yes: 'Eliminar',
      run: async () => { await run(sb.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', e.id)); S.modal = null; await loadAll(); render();
        toast('Evento eliminado', { label: 'Deshacer', run: async () => { await run(sb.from('events').update({ deleted_at: null }).eq('id', e.id), 'Evento restaurado'); await loadAll(); render(); } }); } }; render(); },
  'confirm-yes': () => S.modal.run(),
  'new-loan': () => { const due = addDays(new Date(), 2); S.modal = { type: 'loan', draft: { borrower_name: '', borrower_area: '', borrower_contact: '', due_date: dateKey(due), due_time: '18:00', notes: '', q: {} } }; render(); },
  'save-loan': async () => { const m = S.modal; const d = m.draft; m.tried = true; const items = Object.entries(d.q).filter(([, n]) => n > 0);
    if (!d.borrower_name.trim() || !d.borrower_area.trim() || !items.length) { render(); toast('Revisa los campos marcados.'); return; }
    const loan = await run(sb.from('loans').insert({ borrower_name: d.borrower_name.trim(), borrower_area: d.borrower_area.trim(), borrower_contact: d.borrower_contact.trim() || null,
      due_at: d.due_date ? new Date(`${d.due_date}T${d.due_time || '18:00'}`).toISOString() : null, notes: d.notes.trim() || null }).select('id').single());
    await run(sb.from('loan_items').insert(items.map(([id, n]) => ({ loan_id: loan.id, equipment_id: +id, quantity: n }))), 'Préstamo registrado');
    S.modal = null; await loadAll(); render(); },
  'return-loan': (el) => { const l = S.loans.find((x) => x.id === el.dataset.id);
    S.modal = { type: 'confirm', title: '¿Marcar como devuelto?', text: `Confirma que recibiste todo el material de ${l.borrower_name} (${l.borrower_area}).`, yes: 'Sí, devuelto',
      run: async () => { await run(sb.from('loans').update({ returned_at: new Date().toISOString(), received_by: S.me.id }).eq('id', l.id), `Devolución registrada por ${S.me.full_name}`); S.modal = null; await loadAll(); render(); } }; render(); },
  'new-equip': () => { S.modal = { type: 'equip', draft: { id: null, name: '', category: 'Audio', total_quantity: 1 } }; render(); },
  'edit-equip': (el) => { const q = equipById(+el.dataset.id); S.modal = { type: 'equip', draft: { ...q } }; render(); },
  'save-equip': async () => { const d = S.modal.draft;
    if (d.id) await run(sb.from('equipment').update({ total_quantity: d.total_quantity }).eq('id', d.id), 'Inventario actualizado');
    else { if (!d.name.trim()) { toast('Escribe el nombre del material.'); return; } await run(sb.from('equipment').insert({ name: d.name.trim(), category: d.category, total_quantity: d.total_quantity }), 'Material agregado'); }
    S.modal = null; await loadAll(); render(); },
  'new-note': () => { S.modal = { type: 'note', draft: { title: '', content: '' } }; render(); },
  'save-note': async () => { const d = S.modal.draft; if (!d.content.trim()) { toast('Escribe la nota.'); return; }
    await run(sb.from('notes').insert({ title: d.title.trim() || null, content: d.content.trim() }), 'Nota publicada'); S.modal = null; await loadAll(); render(); },
  'pin-note': async (el) => { const n = S.notes.find((x) => x.id === el.dataset.id); await run(sb.from('notes').update({ is_pinned: !n.is_pinned }).eq('id', n.id)); await loadAll(); render(); },
  'del-note': (el) => { const n = S.notes.find((x) => x.id === el.dataset.id);
    S.modal = { type: 'confirm', title: '¿Eliminar nota?', text: 'La nota se borrará para todo el equipo.', yes: 'Eliminar',
      run: async () => { await run(sb.from('notes').delete().eq('id', n.id), 'Nota eliminada'); S.modal = null; await loadAll(); render(); } }; render(); },
  theme: async (el) => { S.settings.theme = el.dataset.v; applyTheme(); render(); await run(sb.from('user_settings').update({ theme: el.dataset.v }).eq('user_id', S.me.id)); },
  lead: async (el) => { S.settings.notify_minutes_before = +el.dataset.v; render(); scheduleReminders(); await run(sb.from('user_settings').update({ notify_minutes_before: +el.dataset.v }).eq('user_id', S.me.id)); },
  'test-notif': async () => {
    if (!('Notification' in window)) { toast('Este navegador no admite notificaciones.'); return; }
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== 'granted') { toast('Las notificaciones están bloqueadas para esta página.'); render(); return; }
    const next = S.events.filter((e) => e.status !== 'cancelado' && new Date(e.starts_at) > new Date()).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
    notify(next, true); scheduleReminders(); render();
  },
};
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-a]'); if (!el || el.tagName === 'INPUT') return;
  const fn = A[el.dataset.a]; if (fn) { if (el.tagName === 'A' && el.getAttribute('href') === '#') ev.preventDefault(); fn(el, ev); }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && S.modal) { S.modal = null; render(); }
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[role="button"][data-a]')) { ev.preventDefault(); ev.target.click(); }
});
document.addEventListener('input', (ev) => {
  const f = ev.target.dataset?.f; if (!f || !S.modal?.draft) return;
  const d = S.modal.draft;
  if (f === 'venue_id') d.venue_id = ev.target.value ? +ev.target.value : null;
  else if (f === 'status') d.status = ev.target.checked ? 'cancelado' : 'confirmado';
  else d[f] = ev.target.value;
});
document.addEventListener('change', async (ev) => {
  const t = ev.target;
  if (t.dataset?.check != null && S.modal?.type === 'form') { render(); refreshFormChecks(); }
  if (t.dataset?.a === 'notif-toggle') { S.settings.notifications_enabled = t.checked; scheduleReminders(); render(); await run(sb.from('user_settings').update({ notifications_enabled: t.checked }).eq('user_id', S.me.id)); }
});
document.addEventListener('submit', async (ev) => {
  if (ev.target.id !== 'pass-form') return; ev.preventDefault();
  const p = document.getElementById('new-pass').value;
  const { error } = await sb.auth.updateUser({ password: p });
  if (error) toast(`No se pudo cambiar: ${error.message}`); else { toast('Contraseña actualizada'); ev.target.reset(); }
});

boot();
