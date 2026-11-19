const $ = s => document.querySelector(s);
const st = Object.assign({level:1,drops:0,sound:1,vib:0,music:0,guide:0,theme:0},
  JSON.parse(localStorage.getItem('droplet-arrows') || '{}'));
const save = () => localStorage.setItem('droplet-arrows', JSON.stringify(st));

/* ---------- Themes ---------- */
const THEMES = [
  {bg:'#f5ebdc', ln:'#6b4a2f', ac:'#c3763a'},
  {bg:'#1f2433', ln:'#e8c98a', ac:'#f0a35e'},
  {bg:'#e4f3fb', ln:'#1f5f7f', ac:'#2a9bd6'}
];
function applyTheme(){
  const t = THEMES[st.theme], r = document.documentElement.style;
  r.setProperty('--bg', t.bg); r.setProperty('--ln', t.ln); r.setProperty('--ac', t.ac);
  document.querySelectorAll('.sw').forEach((e,i) => e.classList.toggle('sel', i === st.theme));
  draw();
}
THEMES.forEach((t,i) => {
  const d = document.createElement('div');
  d.className = 'sw'; d.style.background = t.bg; d.style.borderColor = t.ac;
  d.onclick = () => { st.theme = i; save(); applyTheme(); $('#pm').classList.remove('on'); };
  $('#pm').appendChild(d);
});
$('#pal').onclick = () => $('#pm').classList.toggle('on');

/* ---------- Sound / vibration ---------- */
let ac;
const AC = () => ac || (ac = new (window.AudioContext || window.webkitAudioContext)());
function beep(f, d, v, type){
  if(!st.sound) return;
  const a = AC(), o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(v, a.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + d);
  o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + d);
}
const vib = ms => { if(st.vib && navigator.vibrate) navigator.vibrate(ms); };
function click(){                                   // asli "tik" jaisa chhota click
  if(!st.sound) return;
  const a = AC(), n = Math.floor(a.sampleRate * .03), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for(let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
  const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 1800; g.gain.value = .6;
  src.buffer = b; src.connect(f); f.connect(g); g.connect(a.destination); src.start();
}
const tick = () => { click(); vib(15); };
const bad  = () => { beep(220, .1, .12); vib(60); };   // halki "dhup", bhaari awaaz nahi
function music(){}   // abhi band hai (nakli music se bhinbhinahat aati thi). Baad mein asli music file lagayenge
addEventListener('pointerdown', () => { AC().resume(); music(); }, {once:true});

/* ---------- Screens ---------- */
let cur = 'splash', prev = 'home';
function show(id){
  if(id === 'settings') prev = cur;
  cur = id;
  document.querySelectorAll('.screen').forEach(e => e.classList.toggle('on', e.id === id));
  $('#pm').classList.remove('on');
  if(id === 'home') renderHome();
  if(id === 'game') setTimeout(resize, 30);
}
// har 3 level par difficulty ka naya darja
const tierOf = l => Math.floor((l - 1) / 3);
const diff = l => {
  const t = tierOf(l);
  return t < 2 ? 'Easy' : t < 4 ? 'Normal' : t < 6 ? 'Hard' : 'Expert';
};
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 1800); };

function renderHome(){
  $('#drops').textContent = st.drops;
  $('#date').textContent = new Date().toLocaleDateString('en', {month:'short', day:'numeric'});
  $('#l1').textContent = st.level >= 20 ? 'Play' : 'Unlock Lv.20';
  $('#l2').textContent = st.level >= 16 ? 'Play' : 'Unlock Lv.16';
  $('#strip').innerHTML = [0,1,2,3,4].map(i =>
    `<div class="dot ${i ? '' : 'now'}">${st.level + i}</div>`).join('');
  $('#dif').textContent = diff(st.level);
  $('#lv').textContent = 'Level ' + st.level;
}
$('.c1').onclick = () => st.level >= 20 ? toast('Coming soon') : toast('Reach Level 20');
$('.c2').onclick = () => st.level >= 16 ? toast('Coming soon') : toast('Reach Level 16');
$('#play').onclick = () => startLevel();
$('#homeSet').onclick = $('#gset').onclick = () => show('settings');
$('#sback').onclick = () => show(prev);
$('#back').onclick = () => show('home');

/* ---------- Settings ---------- */
[['sound','🔊','Sound'],['vib','📳','Vibration'],['music','🎵','Music'],['guide','▦','Guideline']].forEach(([k,ic,nm]) => {
  const r = document.createElement('div');
  r.className = 'row';
  r.innerHTML = `<span>${ic} ${nm}</span><div class="sw2 ${st[k] ? 'on' : ''}"></div>`;
  r.onclick = () => {
    st[k] = st[k] ? 0 : 1; save();
    r.querySelector('.sw2').classList.toggle('on', !!st[k]);
    if(k === 'music') music();
    draw();
  };
  $('#tg').appendChild(r);
});
document.querySelectorAll('.row[data-t]').forEach(r => r.onclick = () => toast(r.dataset.t));

/* ---------- Modal + back button ---------- */
let modalOpen = false;
function modal(text, btns){
  $('#mt').textContent = text;
  $('#mb').innerHTML = '';
  btns.forEach(([label, cls, fn]) => {
    const b = document.createElement('button');
    b.className = 'mb ' + cls; b.textContent = label;
    b.onclick = () => { closeModal(); fn && fn(); };
    $('#mb').appendChild(b);
  });
  $('#modal').classList.add('on'); modalOpen = true;
}
function closeModal(){ $('#modal').classList.remove('on'); modalOpen = false; }
const capApp = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App;
function askExit(){
  modal('Are you sure you want to exit?', [
    ['Exit', 'a', () => capApp ? capApp.exitApp() : toast('Exit (app mein kaam karega)')],
    ['Cancel', 'b']
  ]);
}
function onBack(){
  if(modalOpen) return closeModal();
  if(cur === 'settings') show(prev);
  else if(cur === 'game') show('home');
  else if(cur === 'home') askExit();
}
if(capApp) capApp.addListener('backButton', onBack);
history.pushState(null, '');
addEventListener('popstate', () => { history.pushState(null, ''); onBack(); });

/* ---------- Game state ---------- */
const D = [[0,-1],[1,0],[0,1],[-1,0]];   // up, right, down, left
let G, lives, hintId = -1, cs = 30;

function startLevel(){
  G = gen(st.level); lives = 3; hintId = -1;
  $('#gl').textContent = 'Level ' + st.level;
  $('#gd').textContent = diff(st.level) + (G.name ? ' · ' + G.name : '');
  show('game'); updateHUD();
}
function updateHUD(){
  $('#lives').innerHTML = [0,1,2].map(i => `<span class="${i < lives ? '' : 'lost'}">💧</span>`).join('');
  const pct = Math.round((G.total - G.alive) / G.total * 100);
  $('#pf').style.width = pct + '%'; $('#star').style.left = pct + '%'; $('#pp').textContent = pct + '%';
}

/* ---------- Canvas ---------- */
const cv = $('#c'), ctx = cv.getContext('2d');
function resize(){
  if(!G) return;
  const box = $('#cv'), w = box.clientWidth - 16, h = box.clientHeight - 16;
  cs = Math.floor(Math.min(w / G.W, h / G.H));
  const dpr = devicePixelRatio || 1;
  cv.style.width = cs * G.W + 'px'; cv.style.height = cs * G.H + 'px';
  cv.width = cs * G.W * dpr; cv.height = cs * G.H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}
addEventListener('resize', resize);

function at(ext, s){
  const i = Math.floor(s), f = s - i, a = ext[i], b = ext[i+1] || a;
  return [a[0] + (b[0]-a[0])*f, a[1] + (b[1]-a[1])*f];
}
function drawSnake(sn, color, lw){
  const len = sn.p.length - 1, s = sn.s, pts = [at(sn.ext, s)];
  for(let k = Math.ceil(s + 1e-6); k < s + len - 1e-6; k++) pts.push(sn.ext[k]);
  pts.push(at(sn.ext, s + len));
  const P = pts.map(([x,y]) => [(x+.5)*cs, (y+.5)*cs]);
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); P.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
  // chhota arrowhead
  const [hx, hy] = P[P.length-1], [dx, dy] = D[sn.dir], a = Math.max(lw * 1.6, cs * .2);
  ctx.beginPath();
  ctx.moveTo(hx + dx*a, hy + dy*a);
  ctx.lineTo(hx - dx*a*.1 - dy*a*.7, hy - dy*a*.1 + dx*a*.7);
  ctx.lineTo(hx - dx*a*.1 + dy*a*.7, hy - dy*a*.1 - dx*a*.7);
  ctx.closePath(); ctx.fill();
}
function draw(){
  if(!G) return;
  ctx.clearRect(0, 0, cv.width, cv.height);
  const css = getComputedStyle(document.documentElement);
  const ln = css.getPropertyValue('--ln').trim(), accent = css.getPropertyValue('--ac').trim();
  if(st.guide){
    ctx.fillStyle = ln + '44';
    for(let y = 0; y < G.H; y++) for(let x = 0; x < G.W; x++){
      ctx.beginPath(); ctx.arc((x+.5)*cs, (y+.5)*cs, cs*.05, 0, 7); ctx.fill();
    }
  }
  // lakeer ki motai: har 3 level par thodi patli hoti jati hai
  const lw = Math.max(2, cs * Math.max(.05, .11 - G.tier * .007));
  G.sn.forEach((sn, i) => {
    if(sn.state === 3) return;
    const col = sn.state === 2 ? '#d62828' : i === hintId ? accent : ln;
    drawSnake(sn, col, i === hintId ? lw * 1.5 : lw);
  });
  // janwar ki shakal peeche halke rang se
  if(G.mask){
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.globalAlpha = .18; ctx.fillStyle = accent;
    for(let y = 0; y < G.H; y++) for(let x = 0; x < G.W; x++){
      if(G.mask[y][x]) ctx.fillRect(x * cs, y * cs, cs + .5, cs + .5);
    }
    ctx.restore();
  }
}

/* ---------- Gameplay ---------- */
function rayBlocked(sn){
  for(const [x,y] of sn.ray) if(G.occ[y][x] > -1) return true;
  return false;
}
cv.addEventListener('pointerdown', e => {
  if(!G || modalOpen || lives <= 0) return;
  const r = cv.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / cs), y = Math.floor((e.clientY - r.top) / cs);
  if(x < 0 || y < 0 || x >= G.W || y >= G.H) return;
  const id = G.occ[y][x];
  if(id < 0) return;
  const sn = G.sn[id];
  if(sn.state !== 0) return;
  hintId = -1;
  if(rayBlocked(sn)){            // raasta band: laal ho, ruk jao, drop kam
    sn.state = 2; sn.t = 0; bad();
    lives--; updateHUD();
    if(lives <= 0) setTimeout(() => modal('Out of drops!', [['Try Again', 'a', startLevel], ['Home', 'b', () => show('home')]]), 700);
  } else {                        // raasta khula: nikal jao + tick
    sn.state = 1; tick();
    sn.p.forEach(([a,b]) => G.occ[b][a] = -1);
  }
});
$('#hint').onclick = () => {
  if(!G) return;
  const i = G.sn.findIndex(s => s.state === 0 && !rayBlocked(s));
  if(i < 0) return;
  hintId = i; draw(); setTimeout(() => { hintId = -1; draw(); }, 1600);
};

let last = performance.now();
function loop(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if(G && cur === 'game'){
    let need = false;
    G.sn.forEach(sn => {
      if(sn.state === 1){
        sn.s += 16 * dt; need = true;
        if(sn.s >= sn.ray.length + sn.p.length){
          sn.state = 3; G.alive--; updateHUD();
          if(G.alive === 0) win();
        }
      } else if(sn.state === 2){
        sn.t += dt; need = true;
        sn.s = .25 * Math.sin(Math.min(sn.t / .35, 1) * Math.PI);   // halka sa takrana
        if(sn.t > .8){ sn.state = 0; sn.s = 0; }
      }
    });
    if(need) draw();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function win(){
  st.level++; st.drops += 5; save();
  setTimeout(() => modal('Level complete! 🎉', [['Next Level', 'a', startLevel], ['Home', 'b', () => show('home')]]), 350);
}

/* ---------- Welcome (sirf pehli baar) ---------- */
const TERMS_URL = '';     // yahan apna Terms ka link likho
const PRIVACY_URL = '';   // yahan apna Privacy Policy ka link likho
const openLink = (url, name) => url ? window.open(url, '_blank') : toast(name + ' ka link abhi nahi lagaya');
$('#terms').onclick = () => openLink(TERMS_URL, 'Terms');
$('#privacy').onclick = () => openLink(PRIVACY_URL, 'Privacy Policy');
$('#accept').onclick = () => { st.accepted = 1; save(); show('home'); };

/* ===== NAYA LEVEL SYSTEM (v2) ===== */
const FIXED = [4, 8, 12, 16, 20];            // level 1-5 mein arrows ki tadaad
const ANAMES = ['Fish', 'Cat', 'Turtle', 'Bird', 'Rabbit'];
// janwar ki shakal: ['e',cx,cy,rx,ry,jodo(1)/hatao(0)] ya ['t',x1,y1,x2,y2,x3,y3,jodo/hatao]
const ANIMALS = [
  [['e',.45,.5,.38,.25,1],['t',.78,.5,.99,.22,.99,.78,1],['e',.28,.44,.06,.06,0]],
  [['e',.5,.6,.34,.3,1],['t',.17,.35,.2,.05,.43,.3,1],['t',.83,.35,.8,.05,.57,.3,1],['e',.38,.56,.05,.06,0],['e',.62,.56,.05,.06,0]],
  [['e',.5,.52,.31,.26,1],['e',.88,.5,.1,.1,1],['e',.28,.82,.08,.09,1],['e',.72,.82,.08,.09,1],['e',.28,.22,.08,.09,1],['e',.72,.22,.08,.09,1],['t',.2,.5,.04,.42,.04,.58,1]],
  [['e',.5,.58,.3,.24,1],['e',.76,.34,.14,.14,1],['t',.88,.31,1,.37,.88,.43,1],['t',.24,.52,.02,.3,.02,.66,1],['e',.8,.31,.035,.035,0]],
  [['e',.5,.72,.27,.25,1],['e',.5,.4,.19,.17,1],['e',.4,.14,.06,.16,1],['e',.6,.14,.06,.16,1],['e',.44,.38,.035,.04,0],['e',.56,.38,.035,.04,0]]
];
function inPrim(q, u, v){
  if(q[0] === 'e') return ((u - q[1]) / q[3]) ** 2 + ((v - q[2]) / q[4]) ** 2 <= 1;
  const [, x1, y1, x2, y2, x3, y3] = q;
  const s = (ax, ay, bx, by) => (u - bx) * (ay - by) - (ax - bx) * (v - by);
  const d1 = s(x1,y1,x2,y2), d2 = s(x2,y2,x3,y3), d3 = s(x3,y3,x1,y1);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function animalMask(k, W, H){
  const A = ANIMALS[k % ANIMALS.length];
  return Array.from({length:H}, (_, y) => Array.from({length:W}, (_, x) => {
    const u = (x + .5) / W, v = (y + .5) / H; let on = false;
    for(const q of A){ if(inPrim(q, u, v)) on = !!(q[0] === 'e' ? q[5] : q[7]); }
    return on;
  }));
}
const freeCount = (sn, occ) => sn.filter(s => s.ray.every(([x,y]) => occ[y][x] < 0)).length;
function finish(W, H, sn, occ, mask, name, tier){
  return {W, H, sn, occ, mask, name, tier, alive: sn.length, total: sn.length};
}

/* --- pehle 5 levels: tay shuda tadaad --- */
function buildFixed(W, H, target){
  const occ = Array.from({length:H}, () => Array(W).fill(-1));
  const rayMark = Array.from({length:H}, () => Array(W).fill(0)), sn = [];
  const inb = (x,y) => x >= 0 && y >= 0 && x < W && y < H;
  const okc = (x,y) => inb(x,y) && occ[y][x] < 0;
  function trySnake(sx, sy, soft){
    let x = sx, y = sy;
    const p = [[x,y]], seen = new Set([x+','+y]);
    const L = 3 + (Math.random() * 2 | 0);
    let dir = Math.random() * 4 | 0;
    while(p.length < L){
      const o = [0,1,2,3].sort(() => Math.random() - .5); let ok = 0;
      for(const d of o){
        const nx = x + D[d][0], ny = y + D[d][1];
        if(okc(nx,ny) && !seen.has(nx+','+ny)){ x = nx; y = ny; dir = d; p.push([x,y]); seen.add(x+','+y); ok = 1; break; }
      }
      if(!ok) break;
    }
    if(p.length < 2) return null;
    let cx = x, cy = y; const ray = [];
    for(;;){
      cx += D[dir][0]; cy += D[dir][1];
      if(!inb(cx,cy)) break;
      if(occ[cy][cx] > -1 || seen.has(cx+','+cy)) return null;
      ray.push([cx,cy]);
    }
    if(sn.length && !p.some(([a,b]) => rayMark[b][a] > 0) && Math.random() > soft) return null;
    const ext = p.concat(ray);
    let ex = cx - D[dir][0], ey = cy - D[dir][1];
    for(let i = 0; i <= p.length + 1; i++){ ex += D[dir][0]; ey += D[dir][1]; ext.push([ex,ey]); }
    return {p, dir, ray, ext, s:0, state:0, t:0};
  }
  for(let t = 0; t < 6000 && sn.length < target; t++){
    const sx = Math.random() * W | 0, sy = Math.random() * H | 0;
    if(!okc(sx,sy)) continue;
    const s = trySnake(sx, sy, t < 3000 ? .1 : .5);
    if(s){
      s.p.forEach(([a,b]) => occ[b][a] = sn.length);
      s.ray.forEach(([a,b]) => rayMark[b][a]++);
      sn.push(s);
    }
  }
  return finish(W, H, sn, occ, null, '', 0);
}

/* --- ghana maze: poora bharo, phir "peel" se raaste tay karo (hamesha solvable) --- */
function buildDense(W, H, mask, minL, maxL){
  const inb = (x,y) => x >= 0 && y >= 0 && x < W && y < H;
  const used = Array.from({length:H}, () => Array(W).fill(false));
  const okm = (x,y) => inb(x,y) && !used[y][x] && (!mask || mask[y][x]);
  const nb = (x,y) => D.map(d => [x + d[0], y + d[1]]).filter(([a,b]) => okm(a,b));
  const pieces = [];
  for(;;){
    let best = null, bc = 9;
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
      if(!okm(x,y)) continue;
      const c = nb(x,y).length + Math.random() * .9;
      if(c < bc){ bc = c; best = [x,y]; }
    }
    if(!best) break;
    const L = minL + (Math.random() * (maxL - minL + 1) | 0);
    const p = [best]; used[best[1]][best[0]] = true;
    while(p.length < L){
      const [x,y] = p[p.length-1], n = nb(x,y);
      if(!n.length) break;
      n.sort((a,b) => nb(a[0],a[1]).length - nb(b[0],b[1]).length + (Math.random() - .5) * 1.6);
      p.push(n[0]); used[n[0][1]][n[0][0]] = true;
    }
    if(p.length >= 2) pieces.push(p);
  }
  const occ = Array.from({length:H}, () => Array(W).fill(-1));
  const alive = new Map(); let nid = 0;
  const add = p => { const id = nid++; alive.set(id, p); p.forEach(([x,y]) => occ[y][x] = id); };
  pieces.forEach(add);
  const rayOf = (x, y, d) => {
    const r = []; let cx = x, cy = y;
    for(;;){ cx += D[d][0]; cy += D[d][1]; if(!inb(cx,cy)) break; if(occ[cy][cx] > -1) return null; r.push([cx,cy]); }
    return r;
  };
  const out = []; let guard = 0;
  while(alive.size && guard++ < 6000){
    const cands = [];
    for(const [id,p] of alive){
      for(const rev of [0,1]){
        const q = rev ? p.slice().reverse() : p;
        const h = q[q.length-1], pr = q[q.length-2];
        const d = D.findIndex(v => v[0] === h[0] - pr[0] && v[1] === h[1] - pr[1]);
        const ray = rayOf(h[0], h[1], d);
        if(ray) cands.push({id, q, d, ray});
      }
    }
    if(!cands.length){                               // atak gaye: ek arrow ko tod do
      const ids = [...alive.keys()], id = ids[Math.random() * ids.length | 0], p = alive.get(id);
      alive.delete(id); p.forEach(([x,y]) => occ[y][x] = -1);
      if(p.length < 4) continue;
      const cut = 2 + (Math.random() * (p.length - 3) | 0);
      add(p.slice(0, cut)); add(p.slice(cut));
      continue;
    }
    const c = cands[Math.random() * cands.length | 0];
    out.push(c); alive.get(c.id).forEach(([x,y]) => occ[y][x] = -1); alive.delete(c.id);
  }
  const occ2 = Array.from({length:H}, () => Array(W).fill(-1));
  const sn = out.map((c, i) => {
    c.q.forEach(([x,y]) => occ2[y][x] = i);
    const ext = c.q.concat(c.ray), h = ext[ext.length-1];
    let ex = h[0], ey = h[1];
    for(let k = 0; k <= c.q.length + 1; k++){ ex += D[c.d][0]; ey += D[c.d][1]; ext.push([ex,ey]); }
    return {p:c.q, dir:c.d, ray:c.ray, ext, s:0, state:0, t:0};
  });
  return finish(W, H, sn, occ2, mask, '', 0);
}

// kai board bana kar sab se mushkil (kam se kam shuru mein nikalne wale arrows) chuno
function bestOf(n, make, target){
  let best = null, bs = 1e9;
  for(let i = 0; i < n; i++){
    const g = make();
    if(!g.sn.length) continue;
    const miss = target ? Math.abs(g.sn.length - target) : 0;
    const score = miss * 1000 + freeCount(g.sn, g.occ);
    if(score < bs){ bs = score; best = g; }
  }
  return best;
}

function gen(level){
  const tier = tierOf(level);
  let g;
  if(level <= 5){
    const W = 4 + level;
    g = bestOf(60, () => buildFixed(W, W, FIXED[level-1]), FIXED[level-1]);
  } else {
    const k = level - 6, idx = (k / 3) | 0;
    if(k % 3 === 2){                                  // har 3rd level: janwar ki shakal
      const S = Math.min(16 + idx, 20);
      g = bestOf(10, () => buildDense(S, S, animalMask(idx, S, S), 3, 6));
      g.name = ANAMES[idx % ANAMES.length];
    } else {
      const W = Math.min(8 + k, 18), H = Math.min(11 + Math.floor(k * 1.3), 26);
      g = bestOf(12, () => buildDense(W, H, null, 3, Math.min(5 + (k >> 2), 8)));
    }
  }
  g.tier = tier;
  return g;
}

// TEST KE LIYE: link ke aakhir mein ?level=8 likho to seedha wahi level khulega
// (Play Store par bhejne se pehle ye line delete kar dena)
{ const j = +new URLSearchParams(location.search).get('level'); if(j > 0){ st.level = j; save(); } }

/* ---------- Start ---------- */
applyTheme();
setTimeout(() => show('loading'), 2000);
setTimeout(() => show(st.accepted ? 'home' : 'welcome'), 4200);
