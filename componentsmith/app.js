// ============================================================
// component smith — engine
// by anymousxe
// ============================================================
const $ = s => document.querySelector(s);
const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };

// ---------- helpers ----------
function hexToRgb(h){ h=h.replace('#',''); if(h.length===3)h=h.split('').map(c=>c+c).join(''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function rgba(hex,a){ const [r,g,b]=hexToRgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; }
function shade(hex,amt){ let [r,g,b]=hexToRgb(hex); r=Math.max(0,Math.min(255,r+amt));g=Math.max(0,Math.min(255,g+amt));b=Math.max(0,Math.min(255,b+amt)); return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join(''); }
function readable(hex){ const [r,g,b]=hexToRgb(hex); return (r*299+g*587+b*114)/1000 > 140 ? '#0b0b0b' : '#ffffff'; }

// ============================================================
// COMPONENT TYPES — each defines fields + a renderer + css builder
// ============================================================
const TYPES = {};

// shared field definitions reused across components
const F = {
  text:(key,label,def)=>({key,label,type:'text',def}),
  range:(key,label,def,min,max,step,unit)=>({key,label,type:'range',def,min,max,step:step||1,unit:unit||'px'}),
  color:(key,label,def)=>({key,label,type:'color',def}),
  seg:(key,label,def,opts)=>({key,label,type:'seg',def,opts}),
  toggle:(key,label,def)=>({key,label,type:'toggle',def}),
  group:(label)=>({type:'group',label}),
};

// -------------------- BUTTON --------------------
TYPES.button = {
  label:'button', icon:'M3 9h18M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
  fields:[
    F.group('content'),
    F.text('label','text','Get started'),
    F.group('shape'),
    F.range('px','padding x',22,4,64),
    F.range('py','padding y',12,2,40),
    F.range('radius','radius',10,0,40),
    F.range('fontSize','font size',15,10,28),
    F.range('fontWeight','font weight',600,300,800,100,''),
    F.range('letter','letter spacing',0,-2,4,0.1,'px'),
    F.seg('uppercase','case','none',['none','UPPER','lower']),
    F.group('color'),
    F.color('bg','background','#f4f4f4'),
    F.color('fg','text','#0b0b0b'),
    F.color('border','border','#f4f4f4'),
    F.range('borderW','border width',1,0,4),
    F.group('depth'),
    F.range('shadow','shadow',0,0,40),
    F.range('shadowSpread','shadow spread',-4,-20,10),
    F.toggle('lift','hover lift',true),
  ],
  state:{hover:false},
  render(v){
    const b = el('button');
    b.textContent = v.uppercase==='UPPER'? v.label.toUpperCase() : v.uppercase==='lower'? v.label.toLowerCase() : v.label;
    Object.assign(b.style, this.style(v));
    return b;
  },
  style(v){
    return {
      padding:`${v.py}px ${v.px}px`, borderRadius:`${v.radius}px`,
      fontSize:`${v.fontSize}px`, fontWeight:v.fontWeight, letterSpacing:`${v.letter}px`,
      background:v.bg, color:v.fg, border:`${v.borderW}px solid ${v.border}`,
      cursor:'pointer', fontFamily:'inherit',
      boxShadow:v.shadow>0?`0 ${Math.round(v.shadow/2)}px ${v.shadow}px ${v.shadowSpread}px ${rgba('#000000',.4)}`:'none',
      transition:'transform .2s, box-shadow .2s, filter .2s'
    };
  },
  css(v){
    const sel='.btn';
    let css=`${sel} {\n`;
    css+=`  padding: ${v.py}px ${v.px}px;\n  border-radius: ${v.radius}px;\n`;
    css+=`  font-size: ${v.fontSize}px;\n  font-weight: ${v.fontWeight};\n`;
    if(+v.letter!==0)css+=`  letter-spacing: ${v.letter}px;\n`;
    if(v.uppercase!=='none')css+=`  text-transform: ${v.uppercase==='UPPER'?'uppercase':'lowercase'};\n`;
    css+=`  background: ${v.bg};\n  color: ${v.fg};\n  border: ${v.borderW}px solid ${v.border};\n`;
    if(v.shadow>0)css+=`  box-shadow: 0 ${Math.round(v.shadow/2)}px ${v.shadow}px ${v.shadowSpread}px ${rgba('#000000',.4)};\n`;
    css+=`  cursor: pointer;\n  transition: transform .2s, box-shadow .2s, filter .2s;\n}\n`;
    css+=`${sel}:hover {\n  filter: brightness(1.08);\n`;
    if(v.lift)css+=`  transform: translateY(-2px);\n`;
    css+=`}`;
    return css;
  },
  html(v){ const t=v.uppercase==='UPPER'?v.label.toUpperCase():v.uppercase==='lower'?v.label.toLowerCase():v.label; return `<button class="btn">${esc(t)}</button>`; }
};

// -------------------- CARD --------------------
TYPES.card = {
  label:'card', icon:'M3 5h18v14H3zM3 9h18',
  fields:[
    F.group('content'),
    F.text('title','title','Component Smith'),
    F.text('body','body','Build polished UI in seconds and copy the code.'),
    F.text('tag','eyebrow','tool'),
    F.group('shape'),
    F.range('w','width',300,180,460),
    F.range('pad','padding',24,8,48),
    F.range('radius','radius',16,0,36),
    F.range('borderW','border width',1,0,4),
    F.group('color'),
    F.color('bg','background','#111111'),
    F.color('bg2','gradient to','#161616'),
    F.toggle('gradient','use gradient',false),
    F.color('border','border','#262626'),
    F.color('title','title color','#f4f4f4'),
    F.color('body','body color','#a4a4a4'),
    F.color('accent','accent','#f4f4f4'),
    F.group('depth'),
    F.range('shadow','shadow',24,0,60),
    F.range('shadowY','shadow y',14,0,40),
  ],
  render(v){
    const c=el('div');
    Object.assign(c.style,this.style(v));
    const tag=el('div'); tag.textContent=v.tag.toUpperCase(); Object.assign(tag.style,{fontFamily:'var(--fm)',fontSize:'11px',letterSpacing:'.12em',color:v.accent,opacity:.8,marginBottom:'12px'});
    const h=el('div'); h.textContent=v.title; Object.assign(h.style,{fontFamily:'var(--fd)',fontSize:'19px',fontWeight:600,letterSpacing:'-.02em',color:v.title,marginBottom:'8px'});
    const p=el('div'); p.textContent=v.body; Object.assign(p.style,{fontSize:'14px',lineHeight:1.55,color:v.body});
    c.append(tag,h,p);
    return c;
  },
  style(v){
    return {
      width:`${v.w}px`, padding:`${v.pad}px`, borderRadius:`${v.radius}px`,
      background:v.gradient?`linear-gradient(160deg, ${v.bg}, ${v.bg2})`:v.bg,
      border:`${v.borderW}px solid ${v.border}`,
      boxShadow:v.shadow>0?`0 ${v.shadowY}px ${v.shadow}px ${rgba('#000000',.45)}`:'none',
      textAlign:'left'
    };
  },
  css(v){
    let css=`.card {\n  width: ${v.w}px;\n  padding: ${v.pad}px;\n  border-radius: ${v.radius}px;\n`;
    css+=`  background: ${v.gradient?`linear-gradient(160deg, ${v.bg}, ${v.bg2})`:v.bg};\n`;
    css+=`  border: ${v.borderW}px solid ${v.border};\n`;
    if(v.shadow>0)css+=`  box-shadow: 0 ${v.shadowY}px ${v.shadow}px ${rgba('#000000',.45)};\n`;
    css+=`}\n.card .eyebrow { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: ${v.accent}; opacity:.8; margin-bottom: 12px; }\n`;
    css+=`.card h3 { font-size: 19px; font-weight: 600; letter-spacing: -.02em; color: ${v.title}; margin-bottom: 8px; }\n`;
    css+=`.card p { font-size: 14px; line-height: 1.55; color: ${v.body}; }`;
    return css;
  },
  html(v){ return `<div class="card">\n  <span class="eyebrow">${esc(v.tag.toUpperCase())}</span>\n  <h3>${esc(v.title)}</h3>\n  <p>${esc(v.body)}</p>\n</div>`; }
};

// -------------------- INPUT --------------------
TYPES.input = {
  label:'input', icon:'M3 7h18v10H3zM7 12h.01',
  fields:[
    F.group('content'),
    F.text('placeholder','placeholder','you@email.com'),
    F.text('labelText','label','Email'),
    F.toggle('showLabel','show label',true),
    F.group('shape'),
    F.range('w','width',280,160,440),
    F.range('px','padding x',14,4,32),
    F.range('py','padding y',11,4,24),
    F.range('radius','radius',10,0,30),
    F.range('fontSize','font size',14,10,22),
    F.range('borderW','border width',1,0,4),
    F.group('color'),
    F.color('bg','background','#141414'),
    F.color('text','text','#f4f4f4'),
    F.color('placeholder','placeholder','#666666'),
    F.color('border','border','#2a2a2a'),
    F.color('focus','focus ring','#f4f4f4'),
    F.color('labelColor','label color','#a4a4a4'),
  ],
  render(v){
    const wrap=el('div'); wrap.style.textAlign='left';
    if(v.showLabel){ const l=el('label'); l.textContent=v.labelText; Object.assign(l.style,{display:'block',fontSize:'12px',marginBottom:'8px',color:v.labelColor,fontFamily:'var(--fm)',letterSpacing:'.02em'}); wrap.append(l); }
    const i=el('input'); i.placeholder=v.placeholder; i.value='';
    Object.assign(i.style,this.style(v));
    i.addEventListener('focus',()=>{ i.style.borderColor=v.focus; i.style.boxShadow=`0 0 0 3px ${rgba(v.focus,.15)}`; });
    i.addEventListener('blur',()=>{ i.style.borderColor=v.border; i.style.boxShadow='none'; });
    const st=el('style'); st.textContent=`.cs-prev-input::placeholder{color:${v.placeholder}}`; i.className='cs-prev-input';
    wrap.append(st,i);
    return wrap;
  },
  style(v){
    return { width:`${v.w}px`, padding:`${v.py}px ${v.px}px`, borderRadius:`${v.radius}px`, fontSize:`${v.fontSize}px`,
      background:v.bg, color:v.text, border:`${v.borderW}px solid ${v.border}`, outline:'none', fontFamily:'inherit', transition:'border-color .2s, box-shadow .2s' };
  },
  css(v){
    let css='';
    if(v.showLabel)css+=`.field label { display:block; font-size:12px; margin-bottom:8px; color:${v.labelColor}; letter-spacing:.02em; }\n`;
    css+=`.field input {\n  width: ${v.w}px;\n  padding: ${v.py}px ${v.px}px;\n  border-radius: ${v.radius}px;\n  font-size: ${v.fontSize}px;\n`;
    css+=`  background: ${v.bg};\n  color: ${v.text};\n  border: ${v.borderW}px solid ${v.border};\n  outline: none;\n  transition: border-color .2s, box-shadow .2s;\n}\n`;
    css+=`.field input::placeholder { color: ${v.placeholder}; }\n`;
    css+=`.field input:focus { border-color: ${v.focus}; box-shadow: 0 0 0 3px ${rgba(v.focus,.15)}; }`;
    return css;
  },
  html(v){ return v.showLabel? `<div class="field">\n  <label>${esc(v.labelText)}</label>\n  <input placeholder="${esc(v.placeholder)}">\n</div>` : `<input class="field" placeholder="${esc(v.placeholder)}">`; }
};

// -------------------- BADGE --------------------
TYPES.badge = {
  label:'badge', icon:'M12 2l3 6 6 .5-4.5 4 1.5 6L12 15l-6 3.5 1.5-6L3 8.5 9 8z',
  fields:[
    F.group('content'),
    F.text('label','text','New'),
    F.toggle('dot','show dot',true),
    F.group('shape'),
    F.range('px','padding x',11,2,28),
    F.range('py','padding y',5,1,16),
    F.range('radius','radius',999,0,999),
    F.range('fontSize','font size',12,9,18),
    F.range('fontWeight','font weight',500,300,800,100,''),
    F.range('borderW','border width',1,0,3),
    F.group('color'),
    F.color('bg','background','#16221a'),
    F.color('fg','text','#4ade80'),
    F.color('border','border','#1f3326'),
    F.color('dotColor','dot color','#4ade80'),
  ],
  render(v){
    const b=el('span'); Object.assign(b.style,this.style(v));
    if(v.dot){ const d=el('span'); Object.assign(d.style,{width:'7px',height:'7px',borderRadius:'50%',background:v.dotColor,display:'inline-block'}); b.append(d); }
    b.append(document.createTextNode(v.label));
    return b;
  },
  style(v){ return { display:'inline-flex',alignItems:'center',gap:'7px',padding:`${v.py}px ${v.px}px`,borderRadius:`${v.radius}px`,fontSize:`${v.fontSize}px`,fontWeight:v.fontWeight,background:v.bg,color:v.fg,border:`${v.borderW}px solid ${v.border}`,fontFamily:'inherit' }; },
  css(v){
    let css=`.badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  padding: ${v.py}px ${v.px}px;\n  border-radius: ${v.radius}px;\n  font-size: ${v.fontSize}px;\n  font-weight: ${v.fontWeight};\n  background: ${v.bg};\n  color: ${v.fg};\n  border: ${v.borderW}px solid ${v.border};\n}\n`;
    if(v.dot)css+=`.badge .dot { width: 7px; height: 7px; border-radius: 50%; background: ${v.dotColor}; }`;
    return css;
  },
  html(v){ return v.dot? `<span class="badge"><span class="dot"></span>${esc(v.label)}</span>` : `<span class="badge">${esc(v.label)}</span>`; }
};

// -------------------- TOGGLE --------------------
TYPES.toggle = {
  label:'toggle', icon:'M8 7h8a5 5 0 010 10H8a5 5 0 010-10zM8 17a5 5 0 100-10',
  fields:[
    F.group('state'),
    F.toggle('on','on',true),
    F.group('shape'),
    F.range('w','width',48,32,90),
    F.range('h','height',26,16,48),
    F.range('pad','knob inset',3,1,8),
    F.group('color'),
    F.color('trackOff','track off','#222222'),
    F.color('trackOn','track on','#f4f4f4'),
    F.color('knobOff','knob off','#888888'),
    F.color('knobOn','knob on','#0b0b0b'),
    F.color('border','border','#2a2a2a'),
    F.range('borderW','border width',1,0,3),
  ],
  render(v){
    const t=el('div'); Object.assign(t.style,this.style(v));
    const k=el('div'); const ks=v.h-v.pad*2;
    Object.assign(k.style,{position:'absolute',top:`${v.pad}px`,left:`${v.pad}px`,width:`${ks}px`,height:`${ks}px`,borderRadius:'50%',background:v.on?v.knobOn:v.knobOff,transition:'transform .2s var(--ease), background .2s',transform:v.on?`translateX(${v.w-ks-v.pad*2}px)`:'none'});
    t.append(k);
    t.addEventListener('click',()=>{ v.on=!v.on; window.__rerender(); });
    return t;
  },
  style(v){ return { position:'relative',width:`${v.w}px`,height:`${v.h}px`,borderRadius:'999px',background:v.on?v.trackOn:v.trackOff,border:`${v.borderW}px solid ${v.border}`,cursor:'pointer',transition:'background .2s, border-color .2s' }; },
  css(v){
    const ks=v.h-v.pad*2;
    let css=`.switch {\n  position: relative;\n  width: ${v.w}px;\n  height: ${v.h}px;\n  border-radius: 999px;\n  background: ${v.trackOff};\n  border: ${v.borderW}px solid ${v.border};\n  cursor: pointer;\n  transition: background .2s;\n}\n`;
    css+=`.switch::after {\n  content: '';\n  position: absolute;\n  top: ${v.pad}px;\n  left: ${v.pad}px;\n  width: ${ks}px;\n  height: ${ks}px;\n  border-radius: 50%;\n  background: ${v.knobOff};\n  transition: transform .2s, background .2s;\n}\n`;
    css+=`.switch.on { background: ${v.trackOn}; }\n`;
    css+=`.switch.on::after { transform: translateX(${v.w-ks-v.pad*2}px); background: ${v.knobOn}; }`;
    return css;
  },
  html(v){ return `<div class="switch${v.on?' on':''}"></div>`; }
};

// -------------------- ALERT --------------------
TYPES.alert = {
  label:'alert', icon:'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  fields:[
    F.group('content'),
    F.text('title','title','Heads up'),
    F.text('body','message','Your changes were saved automatically.'),
    F.toggle('showIcon','show icon',true),
    F.group('shape'),
    F.range('w','width',360,220,520),
    F.range('pad','padding',16,6,32),
    F.range('radius','radius',12,0,28),
    F.range('borderW','border width',1,0,4),
    F.range('accentW','accent bar',0,0,8),
    F.group('color'),
    F.color('bg','background','#101418'),
    F.color('border','border','#1e2a33'),
    F.color('accent','accent','#5cc8ff'),
    F.color('title','title color','#f4f4f4'),
    F.color('body','body color','#9aa6b0'),
  ],
  render(v){
    const a=el('div'); Object.assign(a.style,this.style(v));
    if(v.showIcon){ const ic=el('div'); ic.textContent='!'; Object.assign(ic.style,{flexShrink:0,width:'22px',height:'22px',borderRadius:'6px',display:'grid',placeItems:'center',background:rgba(v.accent,.15),color:v.accent,fontFamily:'var(--fm)',fontWeight:600,fontSize:'13px'}); a.append(ic); }
    const txt=el('div');
    const h=el('div'); h.textContent=v.title; Object.assign(h.style,{fontWeight:600,fontSize:'14px',color:v.title,marginBottom:'3px'});
    const p=el('div'); p.textContent=v.body; Object.assign(p.style,{fontSize:'13px',lineHeight:1.5,color:v.body});
    txt.append(h,p); a.append(txt);
    return a;
  },
  style(v){ return { display:'flex',gap:'12px',width:`${v.w}px`,padding:`${v.pad}px`,borderRadius:`${v.radius}px`,background:v.bg,border:`${v.borderW}px solid ${v.border}`,borderLeft:v.accentW>0?`${v.accentW}px solid ${v.accent}`:`${v.borderW}px solid ${v.border}`,textAlign:'left' }; },
  css(v){
    let css=`.alert {\n  display: flex;\n  gap: 12px;\n  width: ${v.w}px;\n  padding: ${v.pad}px;\n  border-radius: ${v.radius}px;\n  background: ${v.bg};\n  border: ${v.borderW}px solid ${v.border};\n`;
    if(v.accentW>0)css+=`  border-left: ${v.accentW}px solid ${v.accent};\n`;
    css+=`}\n`;
    if(v.showIcon)css+=`.alert .icon { flex-shrink:0; width:22px; height:22px; border-radius:6px; display:grid; place-items:center; background:${rgba(v.accent,.15)}; color:${v.accent}; font-weight:600; font-size:13px; }\n`;
    css+=`.alert h4 { font-weight:600; font-size:14px; color:${v.title}; margin-bottom:3px; }\n`;
    css+=`.alert p { font-size:13px; line-height:1.5; color:${v.body}; }`;
    return css;
  },
  html(v){ return `<div class="alert">\n${v.showIcon?'  <div class="icon">!</div>\n':''}  <div>\n    <h4>${esc(v.title)}</h4>\n    <p>${esc(v.body)}</p>\n  </div>\n</div>`; }
};

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ============================================================
// STYLE PRESETS — 24 professional looks.
// Each is a partial that overrides the active component's values.
// Presets are smart: they map to whatever fields the component has.
// ============================================================
const STYLES = {
  'minimal':      { _all:{radius:8,borderW:1}, button:{bg:'#f4f4f4',fg:'#0b0b0b',border:'#f4f4f4',shadow:0,fontWeight:500}, card:{bg:'#101010',border:'#222',shadow:0}, input:{bg:'#0e0e0e',border:'#262626'}, badge:{bg:'#171717',fg:'#e4e4e4',border:'#262626'}, alert:{bg:'#101010',border:'#222',accentW:0} },
  'soft':         { _all:{radius:14}, button:{bg:'#ffffff',fg:'#111',border:'#ffffff',shadow:24,shadowSpread:-6,fontWeight:600}, card:{bg:'#141414',border:'#262626',shadow:36,shadowY:18}, input:{bg:'#161616',border:'#2c2c2c',radius:12}, badge:{bg:'#1a1a1a',fg:'#ddd',border:'#2a2a2a'}, alert:{bg:'#141414',border:'#262626'} },
  'outline':      { _all:{borderW:1}, button:{bg:'transparent',fg:'#f4f4f4',border:'#f4f4f4',shadow:0,borderW:1}, card:{bg:'transparent',border:'#333',shadow:0}, input:{bg:'transparent',border:'#3a3a3a'}, badge:{bg:'transparent',fg:'#e4e4e4',border:'#3a3a3a'}, alert:{bg:'transparent',border:'#333'} },
  'ghost':        { button:{bg:'#1a1a1a',fg:'#e4e4e4',border:'#1a1a1a',shadow:0,radius:10}, card:{bg:'#0e0e0e',border:'#1a1a1a'}, input:{bg:'#121212',border:'#1c1c1c'}, badge:{bg:'#1c1c1c',fg:'#c4c4c4',border:'#1c1c1c'}, alert:{bg:'#0e0e0e',border:'#1a1a1a'} },
  'brutalist':    { _all:{radius:0,borderW:2}, button:{bg:'#f4f4f4',fg:'#000',border:'#000',shadow:8,shadowSpread:0,radius:0,borderW:2,fontWeight:700,uppercase:'UPPER'}, card:{bg:'#fff',border:'#000',borderW:2,radius:0,title:'#000',body:'#333',accent:'#000',shadow:14,shadowY:8}, input:{bg:'#fff',text:'#000',border:'#000',borderW:2,radius:0,placeholder:'#777'}, badge:{bg:'#000',fg:'#fff',border:'#000',radius:0,borderW:2}, alert:{bg:'#fff',title:'#000',body:'#333',border:'#000',borderW:2,radius:0} },
  'pill':         { _all:{radius:999}, button:{radius:999,bg:'#f4f4f4',fg:'#0b0b0b',border:'#f4f4f4'}, badge:{radius:999}, input:{radius:999,px:18}, alert:{radius:18} },
  'sharp':        { _all:{radius:2}, button:{radius:2}, card:{radius:2}, input:{radius:2}, badge:{radius:3}, alert:{radius:2} },
  'glass':        { button:{bg:'#1f1f1fcc',fg:'#fff',border:'#ffffff22',shadow:30,shadowSpread:-8,radius:14}, card:{bg:'#161616',bg2:'#1e1e1e',gradient:true,border:'#ffffff14',radius:18,shadow:40,shadowY:16}, input:{bg:'#1a1a1acc',border:'#ffffff1a',radius:12}, badge:{bg:'#ffffff14',fg:'#fff',border:'#ffffff22'}, alert:{bg:'#16161acc',border:'#ffffff14'} },
  'neon':         { button:{bg:'#0b0b0b',fg:'#5cffd0',border:'#5cffd0',borderW:1,shadow:30,radius:10}, card:{bg:'#0a0a0a',border:'#1affc8',accent:'#5cffd0',title:'#eafff8',shadow:30}, input:{bg:'#0a0a0a',border:'#1affc8',focus:'#5cffd0',text:'#eafff8'}, badge:{bg:'#06140f',fg:'#5cffd0',border:'#11402f',dotColor:'#5cffd0'}, alert:{bg:'#06140f',border:'#11402f',accent:'#5cffd0',title:'#eafff8',body:'#7fb3a3'} },
  'crimson':      { button:{bg:'#e63946',fg:'#fff',border:'#e63946',shadow:18,radius:10}, card:{bg:'#1a0e10',border:'#3a1a1e',accent:'#ff6b78',title:'#ffe9eb'}, input:{bg:'#160c0d',border:'#3a1a1e',focus:'#e63946'}, badge:{bg:'#2a0e12',fg:'#ff6b78',border:'#4a1a22',dotColor:'#e63946'}, alert:{bg:'#1a0e10',border:'#3a1a1e',accent:'#e63946',title:'#ffe9eb',body:'#c79aa0'} },
  'royal':        { button:{bg:'#4f46e5',fg:'#fff',border:'#4f46e5',shadow:22,radius:12}, card:{bg:'#0f0f1e',border:'#262648',accent:'#a5a0ff',title:'#e9e8ff'}, input:{bg:'#0d0d1a',border:'#262648',focus:'#6d63ff'}, badge:{bg:'#14142e',fg:'#a5a0ff',border:'#2a2a55',dotColor:'#6d63ff'}, alert:{bg:'#0f0f1e',border:'#262648',accent:'#6d63ff',title:'#e9e8ff',body:'#9a98c0'} },
  'forest':       { button:{bg:'#16a34a',fg:'#fff',border:'#16a34a',shadow:18,radius:10}, card:{bg:'#0b160f',border:'#1c3324',accent:'#4ade80',title:'#e7fbee'}, input:{bg:'#0a140d',border:'#1c3324',focus:'#16a34a'}, badge:{bg:'#0e2417',fg:'#4ade80',border:'#1c3a26',dotColor:'#4ade80'}, alert:{bg:'#0b160f',border:'#1c3324',accent:'#16a34a',title:'#e7fbee',body:'#8fb89c'} },
  'amber':        { button:{bg:'#f59e0b',fg:'#1a1206',border:'#f59e0b',shadow:18,radius:10,fontWeight:600}, card:{bg:'#19140a',border:'#3a2e16',accent:'#fbbf24',title:'#fdf3df'}, input:{bg:'#16110a',border:'#3a2e16',focus:'#f59e0b'}, badge:{bg:'#231a0a',fg:'#fbbf24',border:'#3e3016',dotColor:'#f59e0b'}, alert:{bg:'#19140a',border:'#3a2e16',accent:'#f59e0b',title:'#fdf3df',body:'#c4b594'} },
  'ocean':        { button:{bg:'#0ea5e9',fg:'#04141d',border:'#0ea5e9',shadow:18,radius:10}, card:{bg:'#091620',border:'#16323f',accent:'#5cc8ff',title:'#e2f5ff'}, input:{bg:'#08131c',border:'#16323f',focus:'#0ea5e9'}, badge:{bg:'#0a1f2b',fg:'#5cc8ff',border:'#163847',dotColor:'#0ea5e9'}, alert:{bg:'#091620',border:'#16323f',accent:'#0ea5e9',title:'#e2f5ff',body:'#8fb2c2'} },
  'rose':         { button:{bg:'#f43f8e',fg:'#fff',border:'#f43f8e',shadow:18,radius:12}, card:{bg:'#1a0c14',border:'#3a1a2a',accent:'#ff8fc0',title:'#ffe9f3'}, input:{bg:'#160a11',border:'#3a1a2a',focus:'#f43f8e'}, badge:{bg:'#260e1a',fg:'#ff8fc0',border:'#451a30',dotColor:'#f43f8e'}, alert:{bg:'#1a0c14',border:'#3a1a2a',accent:'#f43f8e',title:'#ffe9f3',body:'#c79ab0'} },
  'mono dark':    { _all:{radius:8}, button:{bg:'#1c1c1c',fg:'#f0f0f0',border:'#2a2a2a',shadow:0}, card:{bg:'#0d0d0d',border:'#1c1c1c',title:'#f0f0f0',body:'#888',accent:'#f0f0f0'}, input:{bg:'#0d0d0d',border:'#1c1c1c'}, badge:{bg:'#161616',fg:'#ccc',border:'#262626',dotColor:'#888'}, alert:{bg:'#0d0d0d',border:'#1c1c1c',accent:'#f0f0f0',title:'#f0f0f0',body:'#888'} },
  'mono light':   { _all:{radius:8}, button:{bg:'#0b0b0b',fg:'#fff',border:'#0b0b0b',shadow:0}, card:{bg:'#f6f6f6',border:'#e2e2e2',title:'#0b0b0b',body:'#555',accent:'#0b0b0b'}, input:{bg:'#fff',text:'#0b0b0b',border:'#ddd',placeholder:'#999',labelColor:'#555',focus:'#0b0b0b'}, badge:{bg:'#eee',fg:'#0b0b0b',border:'#ddd',dotColor:'#0b0b0b'}, alert:{bg:'#f6f6f6',border:'#e2e2e2',accent:'#0b0b0b',title:'#0b0b0b',body:'#555'} },
  'gradient':     { button:{bg:'#7c5cff',fg:'#fff',border:'#7c5cff',shadow:24,radius:12}, card:{bg:'#1a1230',bg2:'#0f1a30',gradient:true,border:'#2e2a55',accent:'#b9a8ff',title:'#f0ecff'}, input:{bg:'#15102a',border:'#2e2a55',focus:'#7c5cff'}, badge:{bg:'#1c1640',fg:'#b9a8ff',border:'#2e2a55',dotColor:'#7c5cff'}, alert:{bg:'#1a1230',border:'#2e2a55',accent:'#7c5cff',title:'#f0ecff',body:'#a39ec4'} },
  'elevated':     { button:{bg:'#fff',fg:'#111',border:'#fff',shadow:36,shadowSpread:-8,radius:12,lift:true}, card:{bg:'#161616',border:'#2a2a2a',radius:18,shadow:50,shadowY:24}, input:{bg:'#181818',border:'#2c2c2c',radius:12}, badge:{bg:'#1c1c1c',fg:'#eee',border:'#2c2c2c'}, alert:{bg:'#161616',border:'#2a2a2a',radius:14} },
  'flat':         { _all:{shadow:0,borderW:0}, button:{bg:'#2b2b2b',fg:'#f0f0f0',border:'#2b2b2b',shadow:0,borderW:0,radius:8}, card:{bg:'#161616',border:'#161616',borderW:0,shadow:0}, input:{bg:'#1c1c1c',border:'#1c1c1c',borderW:0}, badge:{bg:'#262626',fg:'#ddd',border:'#262626',borderW:0}, alert:{bg:'#161616',border:'#161616',borderW:0,accentW:0} },
  'terminal':     { _all:{radius:4}, button:{bg:'#0b0b0b',fg:'#4ade80',border:'#1f3326',borderW:1,radius:4,uppercase:'lower',fontWeight:500}, card:{bg:'#080808',border:'#1f3326',accent:'#4ade80',title:'#cfeed9',body:'#6f8f7a',radius:4}, input:{bg:'#080808',border:'#1f3326',text:'#4ade80',focus:'#4ade80',radius:4}, badge:{bg:'#06140f',fg:'#4ade80',border:'#1f3326',radius:4,dotColor:'#4ade80'}, alert:{bg:'#080808',border:'#1f3326',accent:'#4ade80',title:'#cfeed9',body:'#6f8f7a',radius:4} },
  'pastel':       { button:{bg:'#cdb4ff',fg:'#2a1d4a',border:'#cdb4ff',shadow:14,radius:14,fontWeight:600}, card:{bg:'#17151f',border:'#2c2740',accent:'#cdb4ff',title:'#efeaff'}, input:{bg:'#15131d',border:'#2c2740',focus:'#cdb4ff'}, badge:{bg:'#1e1a2e',fg:'#cdb4ff',border:'#2c2740',dotColor:'#cdb4ff'}, alert:{bg:'#17151f',border:'#2c2740',accent:'#cdb4ff',title:'#efeaff',body:'#9a93b8'} },
  'high contrast':{ _all:{borderW:2,radius:6}, button:{bg:'#fff',fg:'#000',border:'#fff',borderW:2,shadow:0}, card:{bg:'#000',border:'#fff',borderW:2,title:'#fff',body:'#ccc',accent:'#fff'}, input:{bg:'#000',text:'#fff',border:'#fff',borderW:2,placeholder:'#888',focus:'#fff'}, badge:{bg:'#fff',fg:'#000',border:'#fff',borderW:2}, alert:{bg:'#000',border:'#fff',borderW:2,accent:'#fff',title:'#fff',body:'#ccc'} },
  'subtle':       { button:{bg:'#151515',fg:'#cfcfcf',border:'#222',shadow:0,radius:9}, card:{bg:'#0f0f0f',border:'#1a1a1a',title:'#dadada',body:'#777',accent:'#999'}, input:{bg:'#101010',border:'#1c1c1c',focus:'#3a3a3a'}, badge:{bg:'#151515',fg:'#aaa',border:'#222',dotColor:'#777'}, alert:{bg:'#0f0f0f',border:'#1a1a1a',accent:'#999',title:'#dadada',body:'#777'} },
};

// ============================================================
// FONTS — global, flows into preview + exported code
// ============================================================
const FONTS = {
  'Geist':       { stack:"'Geist', system-ui, sans-serif", import:"@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap');" },
  'Inter':       { stack:"'Inter', system-ui, sans-serif", import:"@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');" },
  'system':      { stack:"system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", import:"" },
  'mono':        { stack:"'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace", import:"@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');" },
  'serif':       { stack:"'Fraunces', Georgia, 'Times New Roman', serif", import:"@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&display=swap');" },
  'Space Grotesk':{ stack:"'Space Grotesk', system-ui, sans-serif", import:"@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');" },
  'Sora':        { stack:"'Sora', system-ui, sans-serif", import:"@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');" },
  'DM Sans':     { stack:"'DM Sans', system-ui, sans-serif", import:"@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');" },
};
let curFont = 'Geist';
function fontStack(){ return FONTS[curFont].stack; }
function loadFont(name){
  const f=FONTS[name]; if(!f||!f.import) return;
  const id='csfont-'+name.replace(/\W/g,'');
  if(document.getElementById(id)) return;
  const url=f.import.replace("@import url('","").replace("');","");
  const l=document.createElement('link'); l.id=id; l.rel='stylesheet'; l.href=url; document.head.append(l);
}
Object.keys(FONTS).forEach(loadFont);

// ============================================================
// STATE + ENGINE
// ============================================================
let curType='button', curStyle='minimal', vals={};

function defaults(type){ const o={}; TYPES[type].fields.forEach(f=>{ if(f.type!=='group') o[f.key]=f.def; }); return o; }

function applyStyle(type,styleName){
  const base=defaults(type);
  const preset=STYLES[styleName]||{};
  const all=preset._all||{};
  const spec=preset[type]||{};
  // only apply keys that exist on this component
  const merged={...base};
  Object.keys(all).forEach(k=>{ if(k in merged) merged[k]=all[k]; });
  Object.keys(spec).forEach(k=>{ if(k in merged) merged[k]=spec[k]; });
  return merged;
}

function selectType(type){ curType=type; vals=applyStyle(type,curStyle); _structural=true; buildTypeList(); buildFields(); rerender(); }
function selectStyle(name){ curStyle=name; vals=applyStyle(curType,name); _structural=true; buildFields(); rerender(); }

window.__rerender = () => { rerender(); };

const G = typeof gsap !== 'undefined' ? gsap : null;
let _structural = true; // animate the preview only on type/style change, not on every slider tick

function rerender(){
  const mount=$('#mount'); mount.innerHTML='';
  mount.style.fontFamily = fontStack();
  const node = TYPES[curType].render(vals);
  mount.append(node);
  $('#topTag').textContent=`${TYPES[curType].label} · ${curStyle}`;
  $('#stageMeta').textContent=`${TYPES[curType].label} / ${Object.keys(vals).length} props`;
  updateCode();
  if(G && _structural && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    G.fromTo(node, {scale:0.94, opacity:0, y:8}, {scale:1, opacity:1, y:0, duration:0.5, ease:'power3.out'});
  }
  _structural = false;
}

// ---------- UI builders ----------
function buildTypeList(){
  const list=$('#typeList'); list.innerHTML='';
  Object.keys(TYPES).forEach(k=>{
    const t=TYPES[k];
    const b=el('button','type-btn'+(k===curType?' active':''));
    b.innerHTML=`<svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${t.icon}"/></svg> ${t.label}`;
    b.onclick=()=>selectType(k);
    list.append(b);
  });
}
function buildStyleList(){
  const list=$('#styleList'); list.innerHTML='';
  const names=Object.keys(STYLES);
  const sc=$('#styleCount'); if(sc) sc.textContent=names.length;
  names.forEach(n=>{
    const b=el('button','style-btn'+(n===curStyle?' active':''));
    b.textContent=n;
    b.onclick=()=>{ list.querySelectorAll('.style-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); selectStyle(n); };
    list.append(b);
  });
}
function buildFields(){
  const c=$('#fields'); c.innerHTML='';
  TYPES[curType].fields.forEach(f=>{
    if(f.type==='group'){ const g=el('div','fgroup-label'); g.textContent=f.label; c.append(g); return; }
    const wrap=el('div','field');
    if(f.type==='range'){
      const unit=f.unit;
      wrap.innerHTML=`<div class="field-row"><label>${f.label}</label><span class="val">${vals[f.key]}${unit}</span></div>`;
      const r=el('input'); r.type='range'; r.min=f.min; r.max=f.max; r.step=f.step; r.value=vals[f.key];
      r.oninput=()=>{ vals[f.key]=+r.value; wrap.querySelector('.val').textContent=r.value+unit; rerender(); };
      wrap.append(r);
    } else if(f.type==='color'){
      wrap.innerHTML=`<div class="field-row"><label>${f.label}</label></div>`;
      const row=el('div','color-row');
      const c2=el('input'); c2.type='color'; c2.value=normHex(vals[f.key]);
      const hx=el('input','hex'); hx.type='text'; hx.value=vals[f.key];
      c2.oninput=()=>{ vals[f.key]=c2.value; hx.value=c2.value; rerender(); };
      hx.onchange=()=>{ let x=hx.value.trim(); if(!/^#/.test(x))x='#'+x; vals[f.key]=x; c2.value=normHex(x); rerender(); };
      row.append(c2,hx); wrap.append(row);
    } else if(f.type==='text'){
      wrap.innerHTML=`<div class="field-row"><label>${f.label}</label></div>`;
      const t=el('input'); t.type='text'; t.value=vals[f.key];
      t.oninput=()=>{ vals[f.key]=t.value; rerender(); };
      wrap.append(t);
    } else if(f.type==='seg'){
      wrap.innerHTML=`<div class="field-row"><label>${f.label}</label></div>`;
      const s=el('div','seg');
      f.opts.forEach(o=>{ const b=el('button',vals[f.key]===o?'active':''); b.textContent=o; b.onclick=()=>{ vals[f.key]=o; s.querySelectorAll('button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); rerender(); }; s.append(b); });
      wrap.append(s);
    } else if(f.type==='toggle'){
      const row=el('div','field-row'); row.innerHTML=`<label>${f.label}</label>`;
      const sw=el('div','switch'+(vals[f.key]?' on':'')); sw.onclick=()=>{ vals[f.key]=!vals[f.key]; sw.classList.toggle('on'); rerender(); };
      row.append(sw); wrap.append(row);
    }
    c.append(wrap);
  });
}
function normHex(h){ if(typeof h!=='string')return '#000000'; let x=h.replace('#',''); x=x.slice(0,6); if(x.length===3)x=x.split('').map(c=>c+c).join(''); return '#'+x.padEnd(6,'0'); }

// ---------- code ----------
let codeTab='html';
// the root selector for each component (so we can inject font-family into the CSS)
const ROOT_SEL = { button:'.btn', card:'.card', input:'.field', badge:'.badge', toggle:'.switch', alert:'.alert' };

function cssWithFont(){
  const T=TYPES[curType];
  let css=T.css(vals);
  const sel=ROOT_SEL[curType];
  // inject font-family into the first rule for this component if not already there
  if(sel && css.includes(sel+' {') && !css.includes('font-family')){
    css=css.replace(sel+' {', sel+' {\n  font-family: '+fontStack()+';');
  }
  return css;
}

function updateCode(){
  const T=TYPES[curType];
  const html=T.html(vals);
  const css=cssWithFont();
  const fontImport=FONTS[curFont].import;
  let out;
  if(codeTab==='html'){
    out=html;
  } else if(codeTab==='css'){
    out=(fontImport?fontImport+'\n\n':'')+css;
  } else if(codeTab==='all'){
    out=html+'\n\n<style>\n'+(fontImport?fontImport+'\n\n':'')+css+'\n</style>';
  } else { // 'page' — full runnable doc
    out=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${curType} — made with component smith</title>
<style>
${fontImport?fontImport+'\n':''}
  body { margin:0; min-height:100vh; display:grid; place-items:center;
    background:#0b0b0b; font-family:${fontStack()}; }
${css.split('\n').map(l=>'  '+l).join('\n')}
</style>
</head>
<body>
${html.split('\n').map(l=>'  '+l).join('\n')}
</body>
</html>`;
  }
  $('#code').textContent=out;
}

// ---------- font picker ----------
function buildFontList(){
  const c=$('#fontList'); if(!c) return; c.innerHTML='';
  Object.keys(FONTS).forEach(name=>{
    const b=el('button','font-btn'+(name===curFont?' active':''));
    b.textContent=name;
    b.style.fontFamily=FONTS[name].stack;
    b.onclick=()=>{ curFont=name; loadFont(name); c.querySelectorAll('.font-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); rerender(); };
    c.append(b);
  });
}

// ---------- stage bg ----------
const BGS=[['#0b0b0b','dark'],['#ffffff','light'],['#16161a','panel'],['#1e1633','tint']];
function buildBgs(){
  const c=$('#bgSwatches'); c.innerHTML='';
  BGS.forEach(([hex],i)=>{ const s=el('button','bg-sw'+(i===0?' active':'')); s.style.background=hex; s.onclick=()=>{ c.querySelectorAll('.bg-sw').forEach(x=>x.classList.remove('active')); s.classList.add('active'); document.documentElement.style.setProperty('--stage-bg',hex); document.documentElement.style.setProperty('--stage-grid', readable(hex)==='#0b0b0b'?'rgba(0,0,0,.04)':'rgba(255,255,255,.022)'); }; c.append(s); });
}

// ---------- events ----------
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1500); }

document.querySelectorAll('.code-tab').forEach(b=>b.onclick=()=>{ document.querySelectorAll('.code-tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); codeTab=b.dataset.tab; updateCode(); });
$('#copy').onclick=async()=>{ await navigator.clipboard.writeText($('#code').textContent); const b=$('#copy'); b.textContent='copied'; b.classList.add('done'); toast('code copied to clipboard'); setTimeout(()=>{ b.textContent='copy'; b.classList.remove('done'); },1300); };
$('#reset').onclick=()=>{ vals=applyStyle(curType,curStyle); buildFields(); rerender(); toast('reset to '+curStyle); };

// ---------- init ----------
buildTypeList(); buildStyleList(); buildFontList(); buildBgs();
vals=applyStyle(curType,curStyle);
_structural=true;
buildFields(); rerender();

// gsap entrance for the shell
if(G && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  G.from('.top', {y:-14, opacity:0, duration:0.6, ease:'power3.out'});
  G.from('.rail .type-btn', {x:-12, opacity:0, duration:0.4, stagger:0.04, ease:'power2.out', delay:0.1});
  G.from('.style-btn', {opacity:0, y:8, duration:0.35, stagger:0.015, ease:'power2.out', delay:0.2});
  G.from('.panel', {x:16, opacity:0, duration:0.55, ease:'power3.out', delay:0.15});
}
