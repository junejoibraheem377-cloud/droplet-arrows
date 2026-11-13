const $ = s => document.querySelector(s);
const st = Object.assign({level:1,drops:0,sound:1,vib:0,music:1,guide:0,theme:0},
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
const tick = () => { beep(720, .05, .12); vib(15); };   // halki "tick"
const bad  = () => { beep(150, .25, .22, 'triangle'); vib(80); };
let mt;
function music(){
  clearInterval(mt);
  if(!st.music) return;
  const n = [261,294,329,392,440];
  mt = setInterval(() => {
    const a = AC(), o = a.createOscillator(), g = a.createGain();
    o.frequency.value = n[Math.random()*5|0];
    g.gain.setValueAtTime(.0001, a.currentTime);
    g.gain.linearRampToValueAtTime(.03, a.currentTime + .5);
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + 2.2);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 2.3);
  }, 2200);
}
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

/* ---------- Level generation (hamesha solvable) ---------- */
const D = [[0,-1],[1,0],[0,1],[-1,0]];   // up, right, down, left
let G, lives, hintId = -1, cs = 30;

function gen(level){
  const tier = tierOf(level);                          // har 3 level par +1
  const W = Math.min(5 + tier, 11), H = W;             // 5x5 se 11x11 tak
  const maxL = Math.min(3 + tier, 14);                 // arrow ki zyada se zyada lambai
  const minL = Math.min(2 + (tier >> 1), 6);           // arrow ki kam se kam lambai
  const passes = Math.min(3 + tier, 10);               // khali jagah bharne ke daure
  const occ = Array.from({length:H}, () => Array(W).fill(-1)), sn = [];
  const inb = (x,y) => x >= 0 && y >= 0 && x < W && y < H;

  function trySnake(sx, sy, one){
    let x = sx, y = sy;
    const p = [[x,y]], seen = new Set([x+','+y]);
    const L = one ? 1 : minL + (Math.random() * (maxL - minL + 1) | 0);
    let dir = Math.random() * 4 | 0;
    while(p.length < L){
      const o = [0,1,2,3].sort(() => Math.random() - .5); let ok = 0;
      for(const d of o){
        const nx = x + D[d][0], ny = y + D[d][1];
        if(inb(nx,ny) && occ[ny][nx] < 0 && !seen.has(nx+','+ny)){
          x = nx; y = ny; dir = d; p.push([x,y]); seen.add(x+','+y); ok = 1; break;
        }
      }
      if(!ok) break;
    }
    if(p.length < (one ? 1 : 2)) return null;
    let cx = x, cy = y; const ray = [];
    for(;;){
      cx += D[dir][0]; cy += D[dir][1];
      if(!inb(cx,cy)) break;
      if(occ[cy][cx] > -1 || seen.has(cx+','+cy)) return null;
      ray.push([cx,cy]);
    }
    const ext = p.concat(ray);
    let ex = cx - D[dir][0], ey = cy - D[dir][1];
    for(let i = 0; i <= p.length + 1; i++){ ex += D[dir][0]; ey += D[dir][1]; ext.push([ex,ey]); }
    return {p, dir, ray, ext, s:0, state:0, t:0};   // state 0 idle, 1 moving, 2 blocked, 3 gone
  }

  const cells = [];
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) cells.push([x,y]);
  for(let pass = 0; pass < passes; pass++){
    cells.sort(() => Math.random() - .5);
    for(const [sx,sy] of cells){
      if(occ[sy][sx] > -1) continue;
      for(let tr = 0; tr < 8; tr++){
        // aakhri daouron mein chhote (1 khane ke) arrow bhi, taake khali jagah na bache
        const s = trySnake(sx, sy, pass >= passes - 2 && tr >= 4);
        if(s){ s.p.forEach(([a,b]) => occ[b][a] = sn.length); sn.push(s); break; }
      }
    }
  }
  return {W, H, sn, occ, tier, alive: sn.length, total: sn.length};
}

function startLevel(){
  G = gen(st.level); lives = 3; hintId = -1;
  $('#gl').textContent = 'Level ' + st.level;
  $('#gd').textContent = diff(st.level);
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

/* ---------- Start ---------- */
applyTheme();
setTimeout(() => show('loading'), 2000);
setTimeout(() => show(st.accepted ? 'home' : 'welcome'), 4200);
