// NutriTrack UK — Application Logic
// Depends on: foods.js (FOODS array)
// Depends on: ZXing barcode library

/* ── BARCODE MAP (common UK products) ── */
const BC = {
  "7622210449283":{n:"Cadbury Dairy Milk",b:"Cadbury",c:"Sweets",e:"🍫",cal:534,pro:8,carb:57,fat:30,fib:2,ir:1.5},
  "5000157024671":{n:"Heinz Baked Beans",b:"Heinz",c:"Vegetables",e:"🫘",cal:84,pro:5,carb:14,fat:0.4,fib:4.4,ir:1.4},
  "5010083001219":{n:"Warburtons Toastie White Bread",b:"Warburtons",c:"Bread",e:"🍞",cal:233,pro:8,carb:46,fat:1.4,fib:2.4,ir:1.6},
  "5011796002092":{n:"Quaker Oats",b:"Quaker",c:"Cereals",e:"🌾",cal:366,pro:11,carb:60,fat:7,fib:9,ir:4.1},
  "5000119024809":{n:"Digestive Biscuits",b:"McVitie's",c:"Biscuits",e:"🍪",cal:476,pro:7,carb:65,fat:20,fib:3.5,ir:2.5},
  "5000267024791":{n:"Kit Kat 4 Finger",b:"Nestlé",c:"Sweets",e:"🍫",cal:516,pro:7,carb:62,fat:26,fib:1.7,ir:2.8},
  "5053827101023":{n:"Walkers Ready Salted Crisps",b:"Walkers",c:"Snacks",e:"🥔",cal:527,pro:6.5,carb:52,fat:32,fib:4,ir:1.8},
  "5000159449533":{n:"Weetabix",b:"Weetabix",c:"Cereals",e:"🌾",cal:362,pro:11,carb:69,fat:2,fib:8.4,ir:8.0},
  "5010555103393":{n:"Pringles Original",b:"Pringles",c:"Snacks",e:"🥔",cal:544,pro:5.7,carb:51,fat:35,fib:4.3,ir:1.2},
  "5010477348792":{n:"Lucozade Original",b:"Lucozade",c:"Drinks",e:"🥤",cal:70,pro:0,carb:17,fat:0,fib:0,ir:0},
  "5000112548133":{n:"Ribena Blackcurrant",b:"Ribena",c:"Drinks",e:"🥤",cal:46,pro:0.2,carb:11.4,fat:0,fib:0,ir:0},
  "0075457099631":{n:"Quaker Oat So Simple",b:"Quaker",c:"Cereals",e:"🌾",cal:366,pro:11,carb:60,fat:7,fib:9,ir:4.1},
};

/* ── CORE STATE ── */
const WG=8, DM=["Breakfast","Lunch","Dinner","Snacks"];
const GL={cal:2000,pro:150,carb:250,fat:65,fib:30,ir:14};
const MG={Breakfast:["#FF9A3C","#FF6B6B"],Lunch:["#4ECDC4","#44A08D"],Dinner:["#667eea","#764ba2"],Snacks:["#f093fb","#f5576c"]};
const MI={Breakfast:"☀️",Lunch:"🥗",Dinner:"🌙",Snacks:"✨"};
const MACS=[
  {k:"cal",l:"Calories",u:"kcal",c:"#FF9A3C"},
  {k:"pro",l:"Protein",u:"g",c:"#4ECDC4"},
  {k:"carb",l:"Carbs",u:"g",c:"#667eea"},
  {k:"fat",l:"Fat",u:"g",c:"#f093fb"},
  {k:"fib",l:"Fibre",u:"g",c:"#43e97b"},
  {k:"ir",l:"Iron",u:"mg",c:"#fa709a"},
];
const S={
  tab:"diary",date:td(),
  log:jg("ntl",{}),water:jg("ntw",{}),meals:jg("ntm",DM.slice()),
  modal:null,cm:false,ce:"🌙",cn:"",
  sq:"",sr:[],cat:"",
  bl:false,br:null,be:"",bcam:false,stream:null,zx:null,
};

function td(){return new Date().toISOString().slice(0,10);}
function jg(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}}
function js(){localStorage.setItem("ntl",JSON.stringify(S.log));localStorage.setItem("ntw",JSON.stringify(S.water));localStorage.setItem("ntm",JSON.stringify(S.meals));}
function r1(v){return Math.round(v*10)/10;}
function r2(v){return Math.round(v*100)/100;}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function mg(m){return MG[m]||["#888","#555"];}
function mi(m){return MI[m]||"📋";}
function grd(m){const g=mg(m);return `linear-gradient(135deg,${g[0]},${g[1]})`;}

/* ── FAST LOCAL SEARCH ── */
/* Indexes built once for instant searching */
let IDX = null;
function buildIndex(){
  IDX = FOODS.map((f,i)=>({
    i,
    s:(f.n+" "+f.b+" "+f.c).toLowerCase()
  }));
}

function searchFoods(q,cat){
  if(!IDX) buildIndex();
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if(!terms.length) return [];
  
  let results = IDX.filter(({s})=>terms.every(t=>s.includes(t)));
  if(cat) results = results.filter(({i})=>FOODS[i].c===cat);
  
  // Sort: exact name match first, then brand match, then others
  const ql = q.toLowerCase();
  results.sort((a,b)=>{
    const an=FOODS[a.i].n.toLowerCase(), bn=FOODS[b.i].n.toLowerCase();
    const ab=FOODS[a.i].b.toLowerCase(), bb=FOODS[b.i].b.toLowerCase();
    if(an.startsWith(ql)&&!bn.startsWith(ql)) return -1;
    if(!an.startsWith(ql)&&bn.startsWith(ql)) return 1;
    if(ab.startsWith(ql)&&!bb.startsWith(ql)) return -1;
    if(!ab.startsWith(ql)&&bb.startsWith(ql)) return 1;
    return 0;
  });
  return results.slice(0,30).map(({i})=>FOODS[i]);
}

function totals(entries){
  const t={cal:0,pro:0,carb:0,fat:0,fib:0,ir:0};
  entries.forEach(e=>{
    const f=e.factor;
    t.cal+=Math.round((e.cal||0)*f);
    t.pro+=r1((e.pro||0)*f);t.carb+=r1((e.carb||0)*f);
    t.fat+=r1((e.fat||0)*f);t.fib+=r1((e.fib||0)*f);
    t.ir+=r2((e.ir||0)*f);
  });
  return t;
}

/* ── RING ── */
function ring(v,max,sz,col,lbl,sub){
  const R=(sz-14)/2,C=2*Math.PI*R,pct=Math.min(v/max,1);
  return `<div class="rw" style="width:${sz}px;height:${sz}px">
    <svg width="${sz}" height="${sz}" style="transform:rotate(-90deg)">
      <circle cx="${sz/2}" cy="${sz/2}" r="${R}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="8"/>
      <circle cx="${sz/2}" cy="${sz/2}" r="${R}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round"
        style="stroke-dasharray:${pct*C} ${C};filter:drop-shadow(0 0 8px ${col});transition:stroke-dasharray 0.5s ease"/>
    </svg>
    <div class="rc">
      <div style="font-size:20px;font-weight:800;color:#fff;line-height:1">${lbl}</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.42)">${sub}</div>
    </div>
  </div>`;
}

/* ── DIARY ── */
function rDiary(){
  const ents=S.log[S.date]||[],t=totals(ents),w=S.water[S.date]||0,rem=Math.max(GL.cal-t.cal,0);
  let h=`<div class="gc hero">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      ${ring(t.cal,GL.cal,104,"#4ECDC4",t.cal,"kcal")}
      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="mm"><div class="mml">Remaining</div><div class="mmv" style="color:#FF9A3C">${rem}<span style="font-size:9px;color:rgba(255,255,255,0.33)"> kcal</span></div></div>
        <div class="mm"><div class="mml">Protein</div><div class="mmv" style="color:#4ECDC4">${t.pro}<span style="font-size:9px;color:rgba(255,255,255,0.33)">g</span></div></div>
        <div class="mm"><div class="mml">Carbs</div><div class="mmv" style="color:#667eea">${t.carb}<span style="font-size:9px;color:rgba(255,255,255,0.33)">g</span></div></div>
        <div class="mm"><div class="mml">Fat</div><div class="mmv" style="color:#f093fb">${t.fat}<span style="font-size:9px;color:rgba(255,255,255,0.33)">g</span></div></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">
      <div class="mm"><div class="mml">Fibre</div><div class="mmv" style="color:#43e97b">${t.fib}<span style="font-size:9px;color:rgba(255,255,255,0.33)">g</span></div></div>
      <div class="mm"><div class="mml">Iron</div><div class="mmv" style="color:#fa709a">${t.ir}<span style="font-size:9px;color:rgba(255,255,255,0.33)">mg</span></div></div>
    </div>
    ${MACS.slice(0,4).map(m=>{const v=m.k==="cal"?t.cal:t[m.k];const pct=Math.min(v/GL[m.k],1)*100;
    return `<div class="mb"><div class="mbr"><span class="mbl">${m.l}</span><span class="mbv" style="color:${m.c}">${v}/${GL[m.k]}${m.u}</span></div>
    <div class="mbt"><div class="mbf" style="width:${pct}%;background:linear-gradient(90deg,${m.c}88,${m.c})"></div></div></div>`;}).join("")}
  </div>`;
  const wp=Math.min(w/WG,1)*100;
  h+=`<div class="gc wq">
    <span style="font-size:21px">💧</span>
    <div style="flex:1">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="color:#fff;font-size:13px;font-weight:600">Water</span>
        <span style="color:#378ADD;font-size:12px">${w}/${WG} glasses</span>
      </div>
      <div class="wt"><div class="wf" style="width:${wp}%"></div></div>
    </div>
    <button class="wb" onclick="addW()">+</button>
  </div>`;
  S.meals.forEach(meal=>{
    const items=ents.filter(e=>e.meal===meal);
    const mc=items.reduce((s,e)=>s+Math.round((e.cal||0)*e.factor),0);
    const isC=!DM.includes(meal),g=mg(meal),ms=meal.replace(/"/g,"&quot;");
    h+=`<div class="mc">
      <div class="mh">
        <div class="ms" style="background:${grd(meal)}"></div>
        <span style="font-size:18px;line-height:1">${mi(meal)}</span>
        <div style="flex:1"><div style="color:#fff;font-size:13px;font-weight:600">${esc(meal)}</div><div style="color:rgba(255,255,255,0.36);font-size:11px">${mc} kcal</div></div>
        ${isC?`<button class="del" style="font-size:15px;margin-right:5px" onclick="delCat(this.dataset.m)" data-m="${ms}">×</button>`:""}
        <button onclick="openSrch(this.dataset.m)" data-m="${ms}" style="width:30px;height:30px;border-radius:50%;background:${grd(meal)};border:none;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px ${g[0]}55;flex-shrink:0;line-height:1">+</button>
      </div>
      ${items.length?`<div class="mi">${items.map((e,i)=>`
        <div class="mr">
          <span style="font-size:18px;flex-shrink:0;width:23px;text-align:center;line-height:1">${e.e||"🍽"}</span>
          <div style="flex:1;min-width:0">
            <div style="color:#fff;font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.n||e.name||"")}</div>
            <div style="color:rgba(255,255,255,0.3);font-size:10px">${e.qty}g · P:${r1((e.pro||0)*e.factor)}g C:${r1((e.carb||0)*e.factor)}g F:${r1((e.fat||0)*e.factor)}g</div>
          </div>
          <div style="color:#FF9A3C;font-size:12px;font-weight:700;flex-shrink:0">${Math.round((e.cal||0)*e.factor)}</div>
          <button class="del" onclick="delEnt(this.dataset.m,${i})" data-m="${ms}">×</button>
        </div>`).join("")}</div>`:""}
    </div>`;
  });
  h+=`<button class="ac" onclick="S.cm=true;rCat()"><span style="font-size:17px">+</span> Add custom meal category</button>`;
  return h;
}

/* ── SEARCH ── */
/* KEY FIX: rSearch() only renders the wrapper + input once.
   rResults() updates only the #sr div without touching the input DOM node. */
function rSearch(){
  const pending=S.pendingMeal||"";
  let h="";
  if(pending){
    const g=mg(pending);
    h+=`<div style="padding:7px 12px;border-radius:10px;margin-bottom:10px;font-size:13px;color:#fff;background:linear-gradient(135deg,${g[0]}20,${g[1]}20);border:1px solid ${g[0]}44">${mi(pending)} Adding to <strong>${esc(pending)}</strong></div>`;
  }
  // Category filter chips
  const cats=["","Cereals","Bread","Dairy","Meat","Fish","Vegetables","Fruits","Pasta & Grains","Snacks","Sweets","Biscuits","Sauces","Ready Meals","Fast Food","Drinks","Health","Frozen","Desserts","Baking"];
  h+=`<div style="position:relative;margin-bottom:9px">
    <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none">🔍</span>
    <input class="si" id="sinp" type="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
      placeholder="Search 400+ UK foods instantly..."
      oninput="hSearch(this.value)"/>
  </div>
  <div class="chips" id="cat-chips" style="margin-bottom:9px">
    ${cats.map(c=>`<button class="chip${S.cat===c?" on":""}" onclick="setCat('${c}')">${c||"All"}</button>`).join("")}
  </div>
  <div id="sr"></div>`;
  return h;
}

/* Updates only results div — never touches the input */
function rResults(){
  const el=document.getElementById("sr");
  if(!el) return;
  const q=S.sq;
  if(q.length<1){
    // Show popular/suggested items
    const sugg=["Weetabix","Chicken Breast","Banana","Cheddar","Oats","Salmon","Greek Yogurt","Eggs"];
    el.innerHTML=`<div class="badge">✦ 400+ UK foods · instant search · works offline</div>
    <div class="gc" style="padding:14px">
      <div style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.9">
        Type to search. Tap a suggestion:<br>
        ${sugg.map(s=>`<span style="color:#4ECDC4;cursor:pointer;margin-right:6px;font-size:12px" onclick="setQ('${s}')">${s}</span>`).join("")}
      </div>
    </div>`;
    return;
  }
  const res=S.sr;
  if(!res.length){
    el.innerHTML=`<div class="gc" style="padding:18px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">🔎</div>
      <div style="color:rgba(255,255,255,0.4);font-size:13px">No results for "${esc(q)}"<br><span style="font-size:11px;opacity:0.6">Try a different word or browse by category above</span></div>
    </div>`;
    return;
  }
  el.innerHTML=`<div class="badge">✦ ${res.length} result${res.length!==1?"s":""} ${S.cat?`in ${S.cat}`:""}</div>`+
    res.map((item,i)=>`<div class="sr" onclick="openMod(${i})">
      <span style="font-size:25px;flex-shrink:0">${item.e}</span>
      <div style="flex:1;min-width:0">
        <div style="color:#fff;font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(item.n)}</div>
        <div style="color:rgba(255,255,255,0.36);font-size:11px">${esc(item.b)||"Generic"} · ${item.c} · per 100g</div>
      </div>
      <div style="text-align:right;flex-shrink:0;margin-right:8px">
        <div style="color:#FF9A3C;font-size:13px;font-weight:700">${item.cal}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.26)">kcal</div>
      </div>
      <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#4ECDC4,#44A08D);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:18px;line-height:1">+</div>
    </div>`).join("");
}

/* ── BARCODE ── */
function rBarcode(){
  const samples=[
    {n:"Cadbury Dairy Milk",c:"7622210449283",e:"🍫"},
    {n:"Heinz Baked Beans",c:"5000157024671",e:"🫘"},
    {n:"Warburtons Toastie",c:"5010083001219",e:"🍞"},
    {n:"Quaker Oats",c:"5011796002092",e:"🌾"},
    {n:"McVitie's Digestives",c:"5000119024809",e:"🍪"},
    {n:"Walkers Ready Salted",c:"5053827101023",e:"🥔"},
  ];
  let h=`<div class="gc" style="padding:17px;margin-bottom:12px;background:linear-gradient(135deg,rgba(55,138,221,0.1),rgba(102,126,234,0.1))!important;border-color:rgba(55,138,221,0.22)!important;text-align:center">`;
  if(S.bcam){
    h+=`<div class="camw" id="camw" style="margin-bottom:9px">
      <video id="camv" autoplay muted playsinline style="display:block"></video>
      <div class="sov"><div class="sbox"><div class="sln"></div></div></div>
    </div>
    <div id="cam-status" style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:9px">Align barcode inside the orange frame</div>
    <button class="pill psm" style="background:linear-gradient(135deg,#E24B4A,#A32D2D);margin-bottom:11px" onclick="stopCam()">✕ Stop camera</button>`;
  }else{
    h+=`<div style="font-size:42px;margin-bottom:7px">📸</div>
    <div style="color:#fff;font-size:15px;font-weight:700;margin-bottom:3px">Scan product barcode</div>
    <div style="color:rgba(255,255,255,0.38);font-size:12px;margin-bottom:14px">Works with any UK supermarket product</div>
    <button class="pill" style="background:linear-gradient(135deg,#378ADD,#667eea);margin-bottom:13px" onclick="startCam()">📷 Open camera</button>`;
  }
  h+=`<div style="color:rgba(255,255,255,0.24);font-size:12px;margin:7px 0 9px">— or type barcode number —</div>
    <div style="display:flex;gap:8px;text-align:left">
      <input id="bci" type="text" inputmode="numeric" maxlength="14" placeholder="e.g. 7622210449283"
        style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.07);color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;-webkit-appearance:none"
        onkeydown="if(event.key==='Enter')doBC()"/>
      <button class="pill psm" style="background:linear-gradient(135deg,#4ECDC4,#44A08D);white-space:nowrap" onclick="doBC()">Look up</button>
    </div>
    ${S.be?`<div style="color:#fa709a;font-size:12px;margin-top:7px;text-align:left">${esc(S.be)}</div>`:""}
  </div>`;
  if(S.bl) h+=`<div style="text-align:center;padding:16px"><div class="spin"></div><div style="color:rgba(255,255,255,0.36);font-size:13px;margin-top:9px">Looking up barcode...</div></div>`;
  if(S.br){
    const p=S.br;
    h+=`<div class="gc" onclick="openModD(S.br)" style="padding:13px 14px;margin-bottom:12px;display:flex;align-items:center;gap:12px;border-color:rgba(78,205,196,0.3)!important;background:rgba(78,205,196,0.07)!important;cursor:pointer">
      <span style="font-size:30px">${p.e}</span>
      <div style="flex:1;min-width:0">
        <div style="color:#fff;font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.n||p.name||"")}</div>
        <div style="color:rgba(255,255,255,0.38);font-size:12px">${esc(p.b||p.brand||"")}</div>
        <div style="color:#4ECDC4;font-size:12px;margin-top:2px">${p.cal} kcal per 100g</div>
      </div>
      <button class="pill psm" style="background:linear-gradient(135deg,#4ECDC4,#44A08D);flex-shrink:0">Add</button>
    </div>`;
  }
  h+=`<div style="color:rgba(255,255,255,0.32);font-size:12px;margin-bottom:7px">Sample UK product barcodes</div>
  <div class="gc" style="overflow:hidden">
    ${samples.map((s,i)=>`<div onclick="tryBC('${s.c}')" style="display:flex;align-items:center;gap:10px;padding:10px 13px;cursor:pointer;border-bottom:${i<samples.length-1?"1px solid rgba(255,255,255,0.05)":"none"}">
      <span style="font-size:20px">${s.e}</span>
      <div style="flex:1"><div style="font-size:13px;color:#fff">${s.n}</div><div style="font-size:10px;color:rgba(255,255,255,0.24)">${s.c}</div></div>
      <span style="font-size:12px;color:#378ADD;font-weight:600">Try →</span>
    </div>`).join("")}
  </div>`;
  return h;
}

/* ── WATER ── */
function rWater(){
  const w=S.water[S.date]||0,pct=Math.min(w/WG,1),rem=Math.max(WG-w,0);
  const tips=["Drink a glass first thing in the morning!","Carry a reusable bottle everywhere.","Set hourly reminders to sip.","Add lemon or cucumber for flavour.","Drink a glass before each meal.","Herbal teas count towards your total!","Try sparkling water for variety.","Drink more when exercising or warm."];
  let g="";
  for(let i=0;i<WG;i++){const f=i<w;g+=`<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
    <svg width="21" height="29" viewBox="0 0 21 29"><path d="M3 3 L2 26 Q2 28 4 28 L17 28 Q19 28 19 26 L18 3 Z" fill="${f?"rgba(55,138,221,0.22)":"rgba(255,255,255,0.04)"}" stroke="${f?"#378ADD":"rgba(255,255,255,0.14)"}" stroke-width="1.3"/>
    ${f?`<path d="M2.5 17 L2.5 26 Q2.5 27.5 4 27.5 L17 27.5 Q18.5 27.5 18.5 26 L18.5 17 Z" fill="#378ADD" opacity="0.65"/>`:""}
    </svg><span style="font-size:8px;color:rgba(255,255,255,0.24)">${i+1}</span></div>`;}
  return `<div class="gc" style="padding:19px 15px;margin-bottom:12px;text-align:center;background:linear-gradient(135deg,rgba(55,138,221,0.09),rgba(78,205,196,0.09))!important;border-color:rgba(55,138,221,0.2)!important">
    <div style="font-size:12px;color:rgba(255,255,255,0.38);margin-bottom:3px">Today's hydration</div>
    <div class="wbig">${w}</div>
    <div style="color:rgba(255,255,255,0.36);font-size:14px;margin-bottom:13px">of ${WG} glasses</div>
    <div style="height:9px;background:rgba(255,255,255,0.06);border-radius:5px;margin-bottom:17px;overflow:hidden">
      <div style="height:100%;width:${pct*100}%;background:linear-gradient(90deg,#378ADD,#4ECDC4);border-radius:5px;box-shadow:0 0 14px rgba(55,138,221,0.48);transition:width 0.5s ease"></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin-bottom:19px">${g}</div>
    ${w>=WG?`<div style="padding:9px 14px;background:rgba(78,205,196,0.1);border-radius:11px;border:1px solid rgba(78,205,196,0.27);color:#4ECDC4;font-size:14px;margin-bottom:14px">🎉 Daily goal achieved! Great work!</div>`:
    `<div style="color:rgba(255,255,255,0.36);font-size:13px;margin-bottom:14px">${rem} more glass${rem!==1?"es":""} to go</div>`}
    <div style="display:flex;gap:10px;justify-content:center">
      <button onclick="undoW()" ${w===0?"disabled":""} style="padding:9px 17px;border-radius:10px;border:1px solid rgba(255,255,255,0.11);background:rgba(255,255,255,0.06);color:rgba(255,255,255,${w>0?"0.5":"0.2"});cursor:${w>0?"pointer":"default"};font-size:13px;font-family:'DM Sans',sans-serif">← Undo</button>
      <button class="pill" style="background:linear-gradient(135deg,#378ADD,#4ECDC4);min-width:120px" onclick="addW()">+ Add glass</button>
    </div>
  </div>
  <div class="gc" style="padding:13px;margin-bottom:9px;background:rgba(55,138,221,0.06)!important;border-color:rgba(55,138,221,0.16)!important">
    <div style="font-size:13px;font-weight:600;color:#378ADD;margin-bottom:5px">💡 Tip</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.52);line-height:1.65">${tips[w%tips.length]}</div>
  </div>
  <div style="padding:11px 13px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
    <div style="font-size:12px;color:rgba(255,255,255,0.27);line-height:1.65">NHS recommends 8 glasses (~2 litres) daily. Increase when exercising or in hot weather.</div>
  </div>`;
}

/* ── ADD MODAL ── */
function rMod(){
  const ov=document.getElementById("ovl");
  if(!S.modal){ov.innerHTML="";return;}
  const {food,qty,meal}=S.modal,f=qty/100,g=mg(meal);
  ov.innerHTML=`<div class="mbg" onclick="if(event.target===this)closeMod()">
    <div class="msh" style="max-width:480px;margin:0 auto">
      <div class="hdl"></div>
      <div style="display:flex;gap:11px;align-items:center;margin-bottom:14px">
        <span style="font-size:34px">${food.e}</span>
        <div>
          <div style="color:#fff;font-size:15px;font-weight:700;line-height:1.3">${esc(food.n||food.name||"")}</div>
          <div style="color:rgba(255,255,255,0.38);font-size:12px">${esc(food.b||food.brand||"")||"Generic"} · values per 100g</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">
        <span style="font-size:13px;color:rgba(255,255,255,0.45)">Quantity</span>
        <div class="qs">
          <button class="qsb" onclick="chQ(-10)">−</button>
          <input class="qsn" id="qin" type="number" value="${qty}" min="1" onchange="stQ(this.value)"/>
          <button class="qsb" onclick="chQ(10)">+</button>
        </div>
        <span style="font-size:12px;color:rgba(255,255,255,0.35)">g / ml</span>
      </div>
      <select class="msel" onchange="S.modal.meal=this.value;rMod()">
        ${S.meals.map(m=>`<option value="${m.replace(/"/g,"&quot;")}" ${m===meal?"selected":""} style="background:#1c1c2e">${mi(m)} ${esc(m)}</option>`).join("")}
      </select>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:15px">
        ${MACS.map(m=>{
          const v=m.k==="cal"?Math.round((food.cal||0)*f):r1((food[m.k]||0)*f);
          return `<div class="nc" style="background:${m.c}12;border:1px solid ${m.c}2e">
            <div style="font-size:10px;color:${m.c}bb;margin-bottom:2px">${m.l}</div>
            <div style="font-size:16px;font-weight:700;color:${m.c};line-height:1">${v}<span style="font-size:9px;opacity:0.55"> ${m.u}</span></div>
          </div>`;}).join("")}
      </div>
      <button class="pill" style="width:100%;background:${grd(meal)};box-shadow:0 5px 18px ${g[0]}50" onclick="confAdd()">Add to ${esc(meal)}</button>
    </div>
  </div>`;
}

/* ── CAT MODAL ── */
function rCat(){
  const ov=document.getElementById("covl");
  if(!S.cm){ov.innerHTML="";return;}
  const ems=["🌙","🏋","☕","🎉","🏠","🌿","🧃","🥣","🍵","💪","🎯","🌅","🍳","🥪","🫖","🍰","🏃","🎸"];
  ov.innerHTML=`<div class="cbg" onclick="if(event.target===this){S.cm=false;rCat()}">
    <div class="cm">
      <div style="color:#fff;font-size:16px;font-weight:700;margin-bottom:13px">Add custom category</div>
      <input class="ci" id="cni" type="text" placeholder="e.g. Pre-workout, Late night..." oninput="S.cn=this.value" autofocus/>
      <div style="font-size:11px;color:rgba(255,255,255,0.38);margin-bottom:7px">Pick an icon</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:17px">
        ${ems.map((e,ei)=>`<button class="eo${e===S.ce?" on":""}" onclick="pickEI(${ei})">${e}</button>`).join("")}
      </div>
      <div style="display:flex;gap:9px">
        <button style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.11);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer" onclick="S.cm=false;rCat()">Cancel</button>
        <button class="pill" style="flex:1;background:linear-gradient(135deg,#4ECDC4,#44A08D)" onclick="saveCat()">Add</button>
      </div>
    </div>
  </div>`;
}

/* ── FULL RENDER ── */
function renderAll(){
  const now=td();
  const dates=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);dates.push(d.toISOString().slice(0,10));}
  document.getElementById("hdate").textContent=new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  document.getElementById("ds").innerHTML=dates.map(d=>{
    const dt=new Date(d+"T12:00:00");
    const lbl=d===now?"Today":dt.toLocaleDateString("en-GB",{weekday:"short",day:"numeric"});
    return `<button class="dp${d===S.date?" on":""}" onclick="selD('${d}')"><span>${lbl}</span></button>`;
  }).join("");
  const TABS=[{id:"diary",l:"Diary",ic:"📖"},{id:"search",l:"Search",ic:"🔍"},{id:"barcode",l:"Scan",ic:"📸"},{id:"water",l:"Water",ic:"💧"}];
  document.getElementById("tabs").innerHTML=TABS.map(t=>
    `<button class="tb${S.tab===t.id?" on":""}" onclick="setT('${t.id}')"><span style="font-size:17px;line-height:1">${t.ic}</span>${t.l}</button>`
  ).join("");
  const pg=document.getElementById("pg");
  switch(S.tab){
    case"diary":   pg.innerHTML=rDiary();break;
    case"search":  pg.innerHTML=rSearch();rResults();break;
    case"barcode": pg.innerHTML=rBarcode();break;
    case"water":   pg.innerHTML=rWater();break;
  }
  rMod();rCat();
  if(S.tab==="barcode"&&S.bcam&&S.stream){
    setTimeout(()=>{const v=document.getElementById("camv");if(v){v.srcObject=S.stream;v.play();}},80);
  }
}

/* ── HANDLERS ── */
window.selD=d=>{S.date=d;renderAll();};
window.setT=t=>{S.tab=t;if(t!=="search")S.pendingMeal=null;renderAll();};
window.openSrch=m=>{S.pendingMeal=m;S.tab="search";renderAll();};

/* SEARCH: hSearch never calls renderAll - only updates #sr */
window.hSearch=v=>{
  S.sq=v;
  S.sr=v.length>=1?searchFoods(v,S.cat):[];
  rResults();
  // Also update category chips active state
  const chips=document.getElementById("cat-chips");
  if(chips) chips.querySelectorAll(".chip").forEach(c=>{
    c.classList.toggle("on",c.textContent===(S.cat||"All"));
  });
};
window.setCat=c=>{
  S.cat=c;
  S.sr=S.sq.length>=1?searchFoods(S.sq,c):[];
  rResults();
  // Update chip active state without full re-render
  const chips=document.getElementById("cat-chips");
  if(chips) chips.querySelectorAll(".chip").forEach(chip=>{
    chip.classList.toggle("on",chip.textContent===(c||"All"));
  });
};
window.setQ=q=>{
  S.sq=q;S.sr=searchFoods(q,S.cat);
  const inp=document.getElementById("sinp");
  if(inp) inp.value=q;
  rResults();
};

window.openMod=i=>{S.modal={food:S.sr[i],qty:100,meal:S.pendingMeal||S.meals[0]};rMod();};
window.openModD=f=>{S.modal={food:f,qty:100,meal:S.meals[0]};rMod();};
window.closeMod=()=>{S.modal=null;rMod();};
window.chQ=d=>{S.modal.qty=Math.max(10,(S.modal.qty||100)+d);rMod();};
window.stQ=v=>{S.modal.qty=Math.max(1,parseFloat(v)||1);rMod();};
window.confAdd=()=>{
  const{food,qty,meal}=S.modal;
  if(!S.log[S.date])S.log[S.date]=[];
  S.log[S.date].push({...food,qty,factor:qty/100,meal});
  js();S.modal=null;S.tab="diary";S.pendingMeal=null;renderAll();
};
window.delEnt=(meal,idx)=>{
  const ents=S.log[S.date]||[];
  const mi2=ents.filter(e=>e.meal===meal);
  const target=mi2[idx];const ri=ents.indexOf(target);
  if(ri>-1){ents.splice(ri,1);S.log[S.date]=ents;js();renderAll();}
};
window.delCat=m=>{S.meals=S.meals.filter(x=>x!==m);js();renderAll();};
window.addW=()=>{S.water[S.date]=(S.water[S.date]||0)+1;js();renderAll();};
window.undoW=()=>{if((S.water[S.date]||0)>0){S.water[S.date]--;js();renderAll();}};

/* BARCODE: local lookup first, then nothing (no external API) */
window.doBC=()=>{const v=document.getElementById("bci");if(v)tryBC(v.value.trim());};
/* Parse an OFF product JSON into our food format */
function parseOFFProduct(p){
  const n=p.nutriments||{};
  const cats=((p.categories_tags||[]).join("|")).toLowerCase();
  let e="🍽";
  if(cats.includes("fruit"))e="🍎";
  else if(cats.includes("vegetable"))e="🥦";
  else if(cats.includes("bread")||cats.includes("cereal"))e="🍞";
  else if(cats.includes("dairy")||cats.includes("milk"))e="🥛";
  else if(cats.includes("cheese"))e="🧀";
  else if(cats.includes("meat")||cats.includes("chicken")||cats.includes("beef"))e="🥩";
  else if(cats.includes("fish")||cats.includes("seafood"))e="🐟";
  else if(cats.includes("chocolate"))e="🍫";
  else if(cats.includes("biscuit")||cats.includes("cookie"))e="🍪";
  else if(cats.includes("crisp")||cats.includes("snack"))e="🍿";
  else if(cats.includes("drink")||cats.includes("beverage")||cats.includes("juice"))e="🥤";
  else if(cats.includes("pasta")||cats.includes("noodle"))e="🍝";
  else if(cats.includes("rice"))e="🍚";
  else if(cats.includes("egg"))e="🥚";
  else if(cats.includes("nut")||cats.includes("seed"))e="🥜";
  else if(cats.includes("yogurt")||cats.includes("yoghurt"))e="🫙";
  else if(cats.includes("sauce"))e="🥫";
  else if(cats.includes("soup"))e="🍲";
  else if(cats.includes("pizza"))e="🍕";
  const kcal=n["energy-kcal_100g"]||n["energy-kcal"]||(n["energy_100g"]?Math.round(n["energy_100g"]/4.184):0);
  return {
    n:(p.product_name||p.abbreviated_product_name||"Unknown product").trim(),
    b:(p.brands||"").split(",")[0].trim(),
    c:"Scanned",e,
    cal:Math.round(kcal||0),
    pro:Math.round((n["proteins_100g"]||0)*10)/10,
    carb:Math.round((n["carbohydrates_100g"]||0)*10)/10,
    fat:Math.round((n["fat_100g"]||0)*10)/10,
    fib:Math.round((n["fiber_100g"]||n["fibre_100g"]||0)*10)/10,
    ir:Math.round((n["iron_100g"]||0)*1000*100)/100,
  };
}

window.tryBC=async code=>{
  if(!code)return;
  code=code.trim();
  S.bl=true;S.br=null;S.be="";renderAll();
  const bci=document.getElementById("bci");
  if(bci)bci.value=code;

  /* Step 1: instant local map */
  if(BC[code]){S.br=BC[code];S.bl=false;renderAll();return;}

  /* Step 2: try multiple endpoints in parallel — first to succeed wins */
  const base="https://world.openfoodfacts.org/api/v0/product/"+code+".json";
  const fields="?fields=product_name,brands,nutriments,categories_tags";
  const directURL=base+fields;

  /* Multiple CORS proxies as fallbacks */
  const proxies=[
    "https://api.allorigins.win/raw?url="+encodeURIComponent(directURL),
    "https://corsproxy.io/?"+encodeURIComponent(directURL),
    "https://proxy.cors.sh/"+directURL,
  ];

  async function tryFetch(url,timeout=9000){
    const r=await fetch(url,{signal:AbortSignal.timeout(timeout)});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const d=await r.json();
    if(!d||typeof d.status==="undefined")throw new Error("Bad response");
    return d;
  }

  let data=null;

  /* Try direct first (fastest — works on native/local) */
  try{
    data=await tryFetch(directURL,5000);
    if(data.status!==1)data=null;
  }catch(e){data=null;}

  /* If direct failed, race all proxies */
  if(!data){
    const proxyPromises=proxies.map(url=>
      tryFetch(url,10000).then(d=>{
        if(d&&d.status===1)return d;
        throw new Error("not found");
      }).catch(()=>null)
    );
    /* Try proxies one at a time to avoid hammering */
    for(const url of proxies){
      if(data)break;
      try{data=await tryFetch(url,10000);}catch(e){}
      if(data&&data.status!==1)data=null;
    }
  }

  if(data&&data.status===1&&data.product){
    S.br=parseOFFProduct(data.product);
    S.be="";
  }else if(data&&data.status===0){
    S.be="Barcode "+code+" not found in Open Food Facts database. Try searching by product name in the Search tab.";
  }else{
    S.be="Network error fetching barcode "+code+". Check internet connection and try again, or search by product name.";
  }
  S.bl=false;renderAll();
};

/* CAMERA + ZXING */
window.startCam=async()=>{
  S.be="";
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});
    S.stream=stream;S.bcam=true;renderAll();
    await new Promise(r=>setTimeout(r,150));
    const vid=document.getElementById("camv");
    if(!vid){stopCam();return;}
    vid.srcObject=stream;await vid.play();
    startZX(vid);
  }catch(err){
    S.be=err.name==="NotAllowedError"?"Camera permission denied. Allow camera access in settings.":"Camera unavailable on this device. Type the barcode below.";
    S.bcam=false;renderAll();
  }
};

function setStatus(msg){
  const el=document.getElementById("cam-status");
  if(el)el.textContent=msg;
}

function onBarcodeFound(code){
  setStatus("✅ Found: "+code);
  setTimeout(()=>{stopCam();tryBC(code);},250);
}

function startZX(vid){
  let alive=true;
  S.zx={reset:()=>{alive=false;}};

  /* ── Method 1: Native BarcodeDetector (Android Chrome, iOS 16+, Samsung) ── */
  /* Hardware-accelerated, most reliable on real phones */
  if("BarcodeDetector" in window){
    setStatus("📷 Point camera at barcode...");
    const detector=new BarcodeDetector({
      formats:["ean_13","ean_8","upc_a","upc_e","code_128","code_39","qr_code"]
    });
    async function nativeTick(){
      if(!alive||!S.bcam)return;
      if(!vid.videoWidth){setTimeout(nativeTick,150);return;}
      try{
        const barcodes=await detector.detect(vid);
        if(barcodes.length>0){
          alive=false;
          onBarcodeFound(barcodes[0].rawValue);
          return;
        }
      }catch(e){}
      setTimeout(nativeTick,300);
    }
    vid.addEventListener("playing",()=>setTimeout(nativeTick,500),{once:true});
    if(!vid.paused&&vid.readyState>=2)setTimeout(nativeTick,500);
    return;
  }

  /* ── Method 2: ZXing canvas polling (fallback for older browsers) ── */
  if(typeof ZXing==="undefined"){
    setStatus("📷 Camera active — type barcode number below");
    return;
  }
  setStatus("📷 Point camera at barcode...");
  try{
    const hints=new Map();
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[
      ZXing.BarcodeFormat.EAN_13,ZXing.BarcodeFormat.EAN_8,
      ZXing.BarcodeFormat.UPC_A,ZXing.BarcodeFormat.UPC_E,
      ZXing.BarcodeFormat.CODE_128,ZXing.BarcodeFormat.CODE_39,
    ]);
    hints.set(ZXing.DecodeHintType.TRY_HARDER,true);
    const reader=new ZXing.BrowserMultiFormatReader(hints);
    const canvas=document.createElement("canvas");
    const ctx=canvas.getContext("2d",{willReadFrequently:true});

    function zxTick(){
      if(!alive||!S.bcam)return;
      if(!vid.videoWidth||!vid.videoHeight){setTimeout(zxTick,200);return;}
      try{
        canvas.width=vid.videoWidth;
        canvas.height=vid.videoHeight;
        ctx.drawImage(vid,0,0,canvas.width,canvas.height);
        const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
        /* Only attempt decode if we have real pixel data (not blank) */
        if(imageData.data[3]>0){
          const res=reader.decodeFromCanvas(canvas);
          if(res){alive=false;onBarcodeFound(res.getText());return;}
        }
      }catch(e){/* NotFoundException is normal — keep scanning */}
      setTimeout(zxTick,250);
    }
    S.zx={reset:()=>{alive=false;try{reader.reset();}catch(e){}}};
    /* Wait for video to actually have frames */
    function waitForFrames(){
      if(!alive)return;
      if(vid.readyState>=2&&vid.videoWidth>0){
        setTimeout(zxTick,600);
      }else{
        setTimeout(waitForFrames,200);
      }
    }
    vid.addEventListener("playing",waitForFrames,{once:true});
    if(!vid.paused&&vid.readyState>=2)setTimeout(waitForFrames,100);
  }catch(e){
    setStatus("Camera active — type barcode below");
    console.warn("ZXing:",e);
  }
}

window.stopCam=()=>{
  if(S.zx){try{S.zx.reset();}catch(e){}S.zx=null;}
  if(S.stream){S.stream.getTracks().forEach(t=>t.stop());S.stream=null;}
  S.bcam=false;renderAll();
};

window.pickE=e=>{S.ce=e;rCat();};
window.pickEI=i=>{const ems=["🌙","🏋","☕","🎉","🏠","🌿","🧃","🥣","🍵","💪","🎯","🌅","🍳","🥪","🫖","🍰","🏃","🎸"];S.ce=ems[i]||"📋";rCat();};
window.saveCat=()=>{
  const inp=document.getElementById("cni");
  const name=(inp&&inp.value.trim())||S.cn.trim();
  if(!name)return;
  MI[name]=S.ce;MG[name]=["#888780","#5F5E5A"];
  if(!S.meals.includes(name))S.meals.push(name);
  S.cm=false;S.cn="";js();renderAll();
};

renderAll();
