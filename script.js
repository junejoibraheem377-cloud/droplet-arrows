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
function click(){                                   // asli "tik" jaisa chhota click + Eagle Eye ka hisaab
  if(st.sound){
    const a = AC(), n = Math.floor(a.sampleRate * .03), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
    const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800; g.gain.value = .6;
    src.buffer = b; src.connect(f); f.connect(g); g.connect(a.destination); src.start();
  }
  const now = Date.now(), gap = now - lastOk; lastOk = now;
  if(gap >= 8000 && st.level >= 6){                   // 8 second se zyada soch kar sahi arrow mila
    eagleEl.classList.remove('on'); void eagleEl.offsetWidth; eagleEl.classList.add('on');
    setTimeout(chime, 150);
    setTimeout(() => eagleEl.classList.remove('on'), 1700);
  }
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
    const col = sn.state === 2 ? '#d62828' : i === hintId ? accent : (G.mask && sn.inside) ? accent : ln;
    ctx.globalAlpha = (G.mask && !sn.inside && sn.state === 0 && i !== hintId) ? .45 : 1;
    drawSnake(sn, col, i === hintId ? lw * 1.5 : lw);
    ctx.globalAlpha = 1;
  });
  // shakal peeche halke rang se
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

/* ---------- Welcome (sirf pehli baar) + Privacy / Terms links ---------- */
const SITE = 'https://junejoibraheem377-cloud.github.io/droplet-arrows/';
const TERMS_URL = SITE + 'terms.html';
const PRIVACY_URL = SITE + 'privacy.html';
const openLink = url => window.open(url, '_blank');
document.querySelectorAll('#settings .row').forEach(r => {     // Settings ke Privacy / Terms
  if(r.textContent.includes('Privacy')) r.onclick = () => openLink(PRIVACY_URL);
  if(r.textContent.includes('Terms')) r.onclick = () => openLink(TERMS_URL);
});
$('#terms').onclick = () => openLink(TERMS_URL);
$('#privacy').onclick = () => openLink(PRIVACY_URL);
$('#accept').onclick = () => { st.accepted = 1; save(); show('home'); };

/* ===== LEVEL SYSTEM ===== */
const FIXED = [4, 8, 12, 16, 20];            // level 1-5 mein arrows ki tadaad
// janwar / cheezon ki shakal: ['e',cx,cy,rx,ry,jodo(1)/hatao(0)], ['t',x1,y1,x2,y2,x3,y3,jodo/hatao], ['p',[[x,y],...],jodo/hatao]
const STAR = Array.from({length:10}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .24 : .48; return [+(.5 + r * Math.cos(a)).toFixed(3), +(.54 + r * Math.sin(a)).toFixed(3)]; });
const SHAPES = [
  {n:'Cat', w:18, h:18, p:[['e',.5,.6,.34,.3,1],['t',.17,.35,.2,.05,.43,.3,1],['t',.83,.35,.8,.05,.57,.3,1],['e',.38,.56,.05,.06,0],['e',.62,.56,.05,.06,0]]},
  {n:'Dog', w:18, h:18, p:[['e',.5,.46,.27,.3,1],['e',.2,.5,.1,.24,1],['e',.8,.5,.1,.24,1],['e',.5,.7,.15,.12,1],['e',.4,.4,.04,.05,0],['e',.6,.4,.04,.05,0],['e',.5,.64,.05,.035,0]]},
  {n:'Butterfly', w:20, h:16, p:[['e',.26,.33,.2,.27,1],['e',.74,.33,.2,.27,1],['e',.29,.72,.16,.21,1],['e',.71,.72,.16,.21,1],['e',.5,.5,.045,.38,1]]},
  {n:'Fish', w:20, h:14, p:[['e',.45,.5,.38,.3,1],['t',.78,.5,.99,.18,.99,.82,1],['e',.27,.43,.05,.07,0]]},
  {n:'Glasses', w:24, h:15, p:[['e',.27,.5,.24,.46,1],['e',.27,.5,.12,.24,0],['e',.73,.5,.24,.46,1],['e',.73,.5,.12,.24,0],['e',.5,.36,.07,.1,1],['e',.025,.36,.03,.16,1],['e',.975,.36,.03,.16,1]]},
  {n:'Rabbit', w:18, h:20, p:[['e',.5,.72,.27,.25,1],['e',.5,.4,.19,.17,1],['e',.4,.14,.06,.16,1],['e',.6,.14,.06,.16,1],['e',.44,.38,.035,.04,0],['e',.56,.38,.035,.04,0]]},
  {n:'Fan', w:20, h:20, p:[['e',.5,.2,.11,.2,1],['e',.5,.8,.11,.2,1],['e',.2,.5,.2,.11,1],['e',.8,.5,.2,.11,1],['e',.5,.5,.12,.12,1],['e',.5,.5,.04,.04,0]]},
  {n:'Turtle', w:20, h:18, p:[['e',.5,.52,.31,.26,1],['e',.88,.5,.1,.1,1],['e',.28,.82,.08,.09,1],['e',.72,.82,.08,.09,1],['e',.28,.22,.08,.09,1],['e',.72,.22,.08,.09,1],['t',.2,.5,.04,.42,.04,.58,1]]},
  {n:'Heart', w:18, h:17, p:[['e',.32,.33,.22,.24,1],['e',.68,.33,.22,.24,1],['t',.11,.42,.89,.42,.5,.93,1]]},
  {n:'Bird', w:20, h:18, p:[['e',.5,.58,.3,.24,1],['e',.76,.34,.14,.14,1],['t',.88,.31,1,.37,.88,.43,1],['t',.24,.52,.02,.3,.02,.66,1],['e',.8,.31,.035,.035,0]]},
  {n:'Star', w:22, h:22, p:[['p',STAR,1]]},
  {n:'Umbrella', w:20, h:20, p:[['e',.5,.45,.46,.4,1],['p',[[0,.45],[1,.45],[1,1],[0,1]],0],['p',[[.47,.44],[.53,.44],[.53,.85],[.47,.85]],1],['e',.42,.86,.07,.06,1],['e',.42,.86,.03,.025,0]]},
  {n:'Moon', w:18, h:18, p:[['e',.5,.5,.46,.46,1],['e',.72,.46,.3,.32,0]]},
  {n:'Tree', w:18, h:20, p:[['e',.5,.36,.34,.32,1],['p',[[.44,.6],[.56,.6],[.58,.95],[.42,.95]],1]]},
  {n:'Flower', w:20, h:20, p:[['e',.5,.18,.13,.17,1],['e',.5,.82,.13,.17,1],['e',.18,.5,.17,.13,1],['e',.82,.5,.17,.13,1],['e',.28,.28,.13,.13,1],['e',.72,.28,.13,.13,1],['e',.28,.72,.13,.13,1],['e',.72,.72,.13,.13,1],['e',.5,.5,.15,.15,1]]},
  {n:'House', w:20, h:20, p:[['p',[[.5,.06],[.96,.48],[.04,.48]],1],['p',[[.14,.46],[.86,.46],[.86,.95],[.14,.95]],1],['p',[[.68,.12],[.8,.12],[.8,.3],[.68,.3]],1],['p',[[.42,.66],[.58,.66],[.58,.95],[.42,.95]],0],['p',[[.2,.56],[.34,.56],[.34,.7],[.2,.7]],0],['p',[[.66,.56],[.8,.56],[.8,.7],[.66,.7]],0]]},
  {n:'Rocket', w:16, h:22, p:[['e',.5,.45,.22,.36,1],['t',.3,.62,.04,.9,.32,.82,1],['t',.7,.62,.96,.9,.68,.82,1],['t',.38,.8,.62,.8,.5,.99,1],['e',.5,.34,.09,.07,0]]},
  {n:'Crown', w:22, h:16, p:[['p',[[.05,.88],[.05,.22],[.27,.5],[.5,.1],[.73,.5],[.95,.22],[.95,.88]],1],['e',.5,.7,.05,.08,0]]},
  {n:'Apple', w:18, h:20, p:[['e',.36,.6,.3,.3,1],['e',.64,.6,.3,.3,1],['e',.5,.64,.32,.28,1],['p',[[.47,.2],[.53,.2],[.55,.36],[.45,.36]],1],['e',.66,.2,.12,.07,1]]},
  {n:'Mushroom', w:20, h:20, p:[['e',.5,.4,.46,.34,1],['p',[[0,.5],[1,.5],[1,1],[0,1]],0],['p',[[.36,.48],[.64,.48],[.68,.95],[.32,.95]],1],['e',.3,.35,.07,.07,0],['e',.55,.24,.08,.08,0],['e',.74,.38,.06,.06,0]]}
];
function ptIn(poly, u, v){
  let c = false;
  for(let i = 0, j = poly.length - 1; i < poly.length; j = i++){
    const [xi,yi] = poly[i], [xj,yj] = poly[j];
    if(((yi > v) !== (yj > v)) && (u < (xj - xi) * (v - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}
function inPrim(q, u, v){
  if(q[0] === 'e') return ((u - q[1]) / q[3]) ** 2 + ((v - q[2]) / q[4]) ** 2 <= 1;
  if(q[0] === 'p') return ptIn(q[1], u, v);
  return ptIn([[q[1],q[2]],[q[3],q[4]],[q[5],q[6]]], u, v);
}
function shapeMask(sh, W, H){
  return Array.from({length:H}, (_, y) => Array.from({length:W}, (_, x) => {
    const u = (x + .5) / W, v = (y + .5) / H; let on = false;
    for(const q of sh.p){ if(inPrim(q, u, v)) on = !!(q[0] === 'e' ? q[5] : q[0] === 't' ? q[7] : q[2]); }
    return on;
  }));
}
const freeCount = (sn, occ) => sn.filter(s => s.ray.every(([x,y]) => occ[y][x] < 0)).length;
function finish(W, H, sn, occ, mask, name, tier){
  return {W, H, sn, occ, mask, name, tier, alive: sn.length, total: sn.length};
}

/* --- pehle 5 levels: tay shuda tadaad, aasan --- */
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

// arrows ko aapas mein aur jakra hua banao: har arrow ke raaste mein kam az kam K doosre arrows hon (jahan tak mumkin ho)
function interlock(g, K){
  const n = g.sn.length, occ = g.occ, W = g.W, H = g.H;
  const inb = (x,y) => x >= 0 && y >= 0 && x < W && y < H;
  const opts = g.sn.map((s, i) => [0,1].map(o => {
    const p = o ? s.p.slice().reverse() : s.p;
    const h = p[p.length-1], pr = p[p.length-2];
    const d = D.findIndex(v => v[0] === h[0] - pr[0] && v[1] === h[1] - pr[1]);
    const ray = []; const deps = new Set(); let ok = true, cx = h[0], cy = h[1];
    for(;;){ cx += D[d][0]; cy += D[d][1]; if(!inb(cx,cy)) break; ray.push([cx,cy]); const id = occ[cy][cx]; if(id === i){ ok = false; break; } if(id > -1) deps.add(id); }
    return {p, d, ray, deps, ok};
  }));
  const cur = g.sn.map(() => 0);
  const acyclic = () => {                       // kya sab arrows nikal sakte hain?
    const left = new Set(); for(let i = 0; i < n; i++) left.add(i);
    let prog = true;
    while(left.size && prog){ prog = false;
      for(const i of [...left]){ let free = true; for(const j of opts[i][cur[i]].deps) if(left.has(j)){ free = false; break; } if(free){ left.delete(i); prog = true; } } }
    return left.size === 0;
  };
  for(let pass = 0; pass < 4; pass++){
    const order = [...Array(n).keys()].sort(() => Math.random() - .5);
    for(const i of order){
      const a = opts[i][cur[i]], b = opts[i][1 - cur[i]];
      if(!b.ok) continue;
      const pa = Math.max(0, K - a.deps.size), pb = Math.max(0, K - b.deps.size);
      if(pb < pa || (pb === pa && b.deps.size > a.deps.size && b.deps.size <= K + 2)){
        cur[i] = 1 - cur[i];
        if(!acyclic()) cur[i] = 1 - cur[i];
      }
    }
  }
  g.sn = g.sn.map((s, i) => {
    const o = opts[i][cur[i]], ext = o.p.concat(o.ray), h = ext[ext.length-1];
    let ex = h[0], ey = h[1];
    for(let k = 0; k <= o.p.length + 1; k++){ ex += D[o.d][0]; ey += D[o.d][1]; ext.push([ex,ey]); }
    return {p:o.p, dir:o.d, ray:o.ray, ext, s:0, state:0, t:0};
  });
  return g;
}

/* --- lambe, seedhe raaste wale arrows: seedha chalte raho, diwar aur doosre arrows se chipak kar --- */
function tilePieces(W, H, mask, minL, maxL, straight){
  const inb = (x,y) => x >= 0 && y >= 0 && x < W && y < H;
  const used = Array.from({length:H}, () => Array(W).fill(false));
  const okm = (x,y) => inb(x,y) && !used[y][x] && (!mask || mask[y][x]);
  const nbc = (x,y) => D.filter(d => okm(x + d[0], y + d[1])).length;
  const pieces = [];
  for(;;){
    let best = null, bc = 9;
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
      if(!okm(x,y)) continue;
      const c = nbc(x,y) + Math.random() * 2.4;
      if(c < bc){ bc = c; best = [x,y]; }
    }
    if(!best) break;
    const L = minL + (Math.random() * (maxL - minL + 1) | 0);
    const p = [best]; used[best[1]][best[0]] = true; let ld = -1;
    while(p.length < L){
      const [x,y] = p[p.length-1], cand = [];
      for(let d = 0; d < 4; d++){
        const nx = x + D[d][0], ny = y + D[d][1];
        if(!okm(nx,ny)) continue;
        let sc = nbc(nx,ny) * .8 + Math.random() * .6;
        if(d === ld) sc -= straight;
        cand.push([sc, d, nx, ny]);
      }
      if(!cand.length) break;
      cand.sort((a,b) => a[0] - b[0]);
      const [, d, nx, ny] = cand[0];
      p.push([nx,ny]); used[ny][nx] = true; ld = d;
    }
    if(p.length >= 2) pieces.push(p);
  }
  return pieces;
}
function adjustPieces(pieces, target){               // arrows ki tadaad bilkul tay shuda karo
  let g2 = 0;
  while(pieces.length > target && g2++ < 600){       // zyada hon to aamne saamne ke do chhote arrows jodo
    let bi = -1, bj = -1, ba = 0, bb = 0, bl = 1e9;
    for(let i = 0; i < pieces.length; i++) for(let j = 0; j < pieces.length; j++){
      if(i === j) continue;
      const A = pieces[i], B = pieces[j], tl = A.length + B.length;
      if(tl >= bl) continue;
      for(const a of [0,1]) for(const b of [0,1]){
        const ea = a ? A[0] : A[A.length-1], eb = b ? B[0] : B[B.length-1];
        if(Math.abs(ea[0] - eb[0]) + Math.abs(ea[1] - eb[1]) === 1){ bl = tl; bi = i; bj = j; ba = a; bb = b; }
      }
    }
    if(bi < 0) break;
    const A = pieces[bi], B = pieces[bj];
    pieces[bi] = (ba ? A.slice().reverse() : A).concat(bb ? B : B.slice().reverse());
    pieces.splice(bj, 1);
  }
  while(pieces.length < target){                     // kam hon to sab se lambe ko todo
    let bi = 0; pieces.forEach((p, i) => { if(p.length > pieces[bi].length) bi = i; });
    const p = pieces[bi]; if(p.length < 4) break;
    const cut = 2 + (Math.random() * (p.length - 3) | 0);
    pieces.splice(bi, 1, p.slice(0, cut), p.slice(cut));
  }
}
function peelBoard(W, H, mask, pieces, chain){       // raaste tay karo (hamesha hal ho sakne wala)
  const inb = (x,y) => x >= 0 && y >= 0 && x < W && y < H;
  const occ = Array.from({length:H}, () => Array(W).fill(-1));
  const alive = new Map(); let nid = 0;
  const add = p => { const id = nid++; alive.set(id, p); p.forEach(([x,y]) => occ[y][x] = id); };
  pieces.forEach(add);
  const orig = occ.map(r => r.slice()); let pure = 0;
  const rayOf = (x, y, d) => { const r = []; let cx = x, cy = y; for(;;){ cx += D[d][0]; cy += D[d][1]; if(!inb(cx,cy)) break; if(occ[cy][cx] > -1) return null; r.push([cx,cy]); } return r; };
  const pidx = Array.from({length:H}, () => Array(W).fill(-1));
  const out = []; let guard = 0;
  while(alive.size && guard++ < 6000){
    const cands = [];
    for(const [id,p] of alive) for(const rev of [0,1]){
      const q = rev ? p.slice().reverse() : p, h = q[q.length-1], pr = q[q.length-2];
      const d = D.findIndex(v => v[0] === h[0] - pr[0] && v[1] === h[1] - pr[1]);
      const ray = rayOf(h[0], h[1], d);
      if(ray){
        let dep = -1, cnt = 0;
        for(const [x,y] of ray) if(pidx[y][x] > -1){ cnt++; if(pidx[y][x] > dep) dep = pidx[y][x]; }
        cands.push({id, q, d, ray, dep, cnt, pure: ray.every(([x,y]) => orig[y][x] < 0)});
      }
    }
    if(!cands.length){                               // atak gaye: ek lamba arrow tod do
      const longs = [...alive.keys()].filter(k => alive.get(k).length >= 4);
      const ids = longs.length ? longs : [...alive.keys()], id = ids[Math.random() * ids.length | 0], p = alive.get(id);
      alive.delete(id); p.forEach(([x,y]) => occ[y][x] = -1);
      if(p.length < 4) continue;
      const cut = 2 + (Math.random() * (p.length - 3) | 0);
      add(p.slice(0, cut)); add(p.slice(cut));
      continue;
    }
    if(pure >= 1){ const bl = cands.filter(v => !v.pure); if(bl.length) cands.splice(0, cands.length, ...bl); }   // seedha nikalne wale arrows gine chune hon
    let c;
    if(Math.random() < chain){ cands.sort((a, b) => b.dep - a.dep || b.cnt - a.cnt); const top = cands.filter(v => v.dep === cands[0].dep); c = top[Math.random() * top.length | 0]; }
    else c = cands[Math.random() * cands.length | 0];
    if(c.pure) pure++;
    alive.get(c.id).forEach(([x,y]) => { occ[y][x] = -1; pidx[y][x] = out.length; });
    out.push(c); alive.delete(c.id);
  }
  const occ2 = Array.from({length:H}, () => Array(W).fill(-1));
  const sn = out.map((c, i) => {
    c.q.forEach(([x,y]) => occ2[y][x] = i);
    const ext = c.q.concat(c.ray), h = ext[ext.length-1]; let ex = h[0], ey = h[1];
    for(let k = 0; k <= c.q.length + 1; k++){ ex += D[c.d][0]; ey += D[c.d][1]; ext.push([ex,ey]); }
    return {p:c.q, dir:c.d, ray:c.ray, ext, s:0, state:0, t:0};
  });
  return finish(W, H, sn, occ2, mask, '', 0);
}
function makeLong(W, H, minL, maxL, chain, n, K){
  const pieces = tilePieces(W, H, null, minL, maxL, 1.0);
  adjustPieces(pieces, n);
  const g = peelBoard(W, H, null, pieces, chain);
  return K ? interlock(g, K) : g;
}

// level 6 tak aasan; level 7 se 14 tak dheere dheere cousin ki level 14 jaisi (20x27, lambe jakre arrows); phir aur zyada
function arrowsLong(level){ return level <= 14 ? Math.round(22 + (level - 6) * 2.9) : Math.min(64, 45 + (level - 14)); }

function gen(level){
  const tier = tierOf(level);
  let g;
  if(level <= 5){                                      // level 1-5: aasan
    const W = 4 + level;
    g = bestOf(60, () => buildFixed(W, W, FIXED[level-1]), FIXED[level-1]);
  } else {
    const n = arrowsLong(level);
    const easy = level <= 6;                          // level 6 bhi aasan
    const chain = easy ? 0 : Math.min(1, (level - 6) / 2);
    const avg = Math.min(12, 5 + (level - 6) * .85);                       // arrows ki ausat lambai badhti hai
    const cells = n * avg;
    const H = Math.min(27, Math.max(12, Math.round(Math.sqrt(cells / .74))));
    const W = Math.min(20, Math.max(9, Math.round(cells / H)));
    const minL = Math.max(3, Math.round(avg * .35)), maxL = Math.round(avg * 2.2);
    g = easy ? makeLong(W, H, minL, maxL, 0, n, 0) : bestOf(16, () => makeLong(W, H, minL, maxL, chain, n, 4), n);
    if(level >= 11 && (level - 11) % 3 === 0){        // har 3rd level: shakal (andar wale arrows gehre rang ke)
      const sh = SHAPES[((level - 11) / 3) % SHAPES.length], mask = shapeMask(sh, W, H);
      g.mask = mask; g.name = sh.n;
      g.sn.forEach(s => { const inn = s.p.filter(([x,y]) => mask[y][x]).length; s.inside = inn * 2 >= s.p.length; });
    }
  }
  g.tier = tier; lastOk = Date.now();
  return g;
}

// har qadam par kitne arrows nikal sakte hain, uska ausat (kam = zyada sochna padega)
function hardness(g){
  let tot = 0; const runs = 4;
  for(let r = 0; r < runs; r++){
    const occ = g.occ.map(x => x.slice()); let left = g.sn.map((s, i) => i), steps = 0, sum = 0;
    while(left.length){
      const fr = left.filter(i => g.sn[i].ray.every(([x,y]) => occ[y][x] < 0));
      if(!fr.length) break;
      sum += fr.length; steps++;
      const pick = fr[Math.random() * fr.length | 0];
      g.sn[pick].p.forEach(([x,y]) => occ[y][x] = -1);
      left = left.filter(i => i !== pick);
    }
    tot += steps ? sum / steps : 99;
  }
  return tot / runs;
}
// kai board bana kar sab se mushkil chuno
function bestOf(n, make, target, wFree){
  const N = target ? n : Math.round(n * 2.5);
  let best = null, bs = 1e9;
  for(let i = 0; i < N; i++){
    const g = make();
    if(!g.sn.length) continue;
    const miss = target ? Math.abs(g.sn.length - target) : 0;
    const score = miss * 1000 + (N > 1 ? hardness(g) + (wFree || .4) * freeCount(g.sn, g.occ) : 0);
    if(score < bs){ bs = score; best = g; }
  }
  return best;
}

/* ---------- Eagle Eye: der tak soch kar sahi arrow dhoondo to awaaz + 🦅👍 ---------- */
let lastOk = Date.now();
const eagleEl = document.createElement('div');
eagleEl.id = 'eagle'; eagleEl.innerHTML = '<span class="ee">🦅</span><b>Eagle Eye!</b><span class="ee">👍</span>';
document.body.appendChild(eagleEl);
function chime(){                                     // khushi ki 3 awaazein
  beep(784, .14, .14); setTimeout(() => beep(988, .14, .14), 120); setTimeout(() => beep(1319, .3, .16), 240);
}

/* ---------- home ke upar left mein chhota avatar ---------- */
const AVATARS = ['💧','🐱','🐶','🦊','🐼','🐸','🦋','🐢','🐰','🐯','🦁','🐵'];
const avBtn = document.createElement('button');
avBtn.id = 'avatarBtn'; avBtn.className = 'avatar';
document.querySelector('#home .top').prepend(avBtn);
function renderAvatar(){
  const a = st.avatar || 'e:💧';
  avBtn.innerHTML = '';
  if(a.startsWith('i:')){ const im = document.createElement('img'); im.src = a.slice(2); avBtn.appendChild(im); }
  else avBtn.textContent = a.slice(2);
}
const photoInput = document.createElement('input');
photoInput.type = 'file'; photoInput.accept = 'image/*'; photoInput.style.display = 'none';
document.body.appendChild(photoInput);
photoInput.onchange = () => {                       // photo ko chhota (96x96) karke save karo
  const f = photoInput.files && photoInput.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 96;
      const s = Math.min(im.width, im.height);
      c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 96, 96);
      st.avatar = 'i:' + c.toDataURL('image/jpeg', .8); save(); renderAvatar(); closeModal();
    };
    im.src = rd.result;
  };
  rd.readAsDataURL(f); photoInput.value = '';
};
avBtn.onclick = () => {
  modal('Apna avatar chuno', [['Band karo', 'b']]);
  const box = $('#mb'), grid = document.createElement('div');
  grid.className = 'avgrid';
  AVATARS.forEach(e => {
    const b = document.createElement('button');
    b.className = 'avopt'; b.textContent = e;
    b.onclick = () => { st.avatar = 'e:' + e; save(); renderAvatar(); closeModal(); };
    grid.appendChild(b);
  });
  const ph = document.createElement('button');
  ph.className = 'mb a'; ph.textContent = '📷 Apni photo lagao';
  ph.onclick = () => photoInput.click();
  box.prepend(ph); box.prepend(grid);
};
renderAvatar();

// TEST KE LIYE: link ke aakhir mein ?level=8 likho to seedha wahi level khulega
// (Play Store par bhejne se pehle ye line delete kar dena)
{ const j = +new URLSearchParams(location.search).get('level'); if(j > 0){ st.level = j; save(); } }

/* ---------- Start ---------- */
applyTheme();
setTimeout(() => show('loading'), 2000);
setTimeout(() => show(st.accepted ? 'home' : 'welcome'), 4200);
