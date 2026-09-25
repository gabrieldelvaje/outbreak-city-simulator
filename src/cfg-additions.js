import {MAP,places,placeColors} from './city-data.js';

const NS='http://www.w3.org/2000/svg';
const svg=(tag,attrs,parent)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent?.append(el);return el;};
const toWorld=(x,y)=>({x:MAP.x+MAP.scale*x,y:MAP.y+MAP.scale*y});
const region=(x,y)=>x<300&&y<375?'norte-verde':x<490&&y<335?'jardim-do-rio':x>=490&&y<355?'vale-do-sol':x<280?'colinas-do-sul':x>430&&y>510?'vila-industrial':'centro-civico';

// The user's Figma SVG places all additions over a 2160x1133 PNG inside
// x=73..1013 / y=40..533. These constants map those Figma coordinates back to
// the original 740x740 city coordinate system. This keeps every new rectangle
// in the exact block where it was drawn instead of eyeballing/repositioning it.
const CFG={sx:1.5439672550936405,sy:1.551182595081702,tx:-477.83820622443324,ty:-82.84250288228307};

const HOME_DATA=`457.44,340,7,11,r,29.6419,457.44,340|465.44,345,7,11,r,29.6419,465.44,345|473.44,350,7,11,r,29.6419,473.44,350|481.44,355,7,11,r,29.6419,481.44,355|479.44,337,7,11,r,29.6419,479.44,337|486.44,322,16.7142,11,r,29.6419,486.44,322|663.101,229,12.7259,7.81358,r,65.3389,663.101,229|674.101,224,12.7259,7.81358,r,65.3389,674.101,224|548.101,107,12.7259,7.81358,r,65.3389,548.101,107|557.101,103,12.7259,7.81358,r,65.3389,557.101,103|554.101,122,12.7259,7.81358,r,65.3389,554.101,122|414.811,133,12.7259,7.81358,r,88.6063,414.811,133|452.495,199.805,10.4961,16.0068,r,103.751,452.495,199.805|435.043,194.805,10.4961,16.0068,r,103.751,435.043,194.805|420.999,156,10.4961,16.0068,r,88.1725,420.999,156|449.929,117.281,10.4961,13.7153,r,90.5434,449.929,117.281|433.814,117.13,10.4961,13.7153,r,90.5434,433.814,117.13|417.814,117.13,10.4961,13.7153,r,90.5434,417.814,117.13|417.814,105.13,10.4961,13.7153,r,90.5434,417.814,105.13|449.814,105.13,10.4961,13.7153,r,90.5434,449.814,105.13|440.852,89.177,14.4494,13.7153,r,90.5434,440.852,89.177|448,75.8108,8.89315,7.03825,r,133.117,448,75.8108|460.216,87.8106,8.89315,7.03825,r,133.117,460.216,87.8106|466.216,93.8106,8.89315,7.03825,r,133.117,466.216,93.8106|455.216,67.8106,8.89315,7.03825,r,133.117,455.216,67.8106|449.216,61.8106,8.89315,7.03825,r,133.117,449.216,61.8106|462.216,73.8106,8.89315,7.03825,r,133.117,462.216,73.8106|468.216,79.8106,8.89315,7.03825,r,133.117,468.216,79.8106|456.216,54.8106,8.89315,7.03825,r,133.117,456.216,54.8106|463.216,60.8106,8.89315,7.03825,r,133.117,463.216,60.8106|469.216,66.8106,8.89315,7.03825,r,133.117,469.216,66.8106|416.216,88.8106,8.89315,7.03825,r,133.117,416.216,88.8106|424.216,80.8106,8.89315,7.03825,r,133.117,424.216,80.8106|432.216,72.8106,8.89315,7.03825,r,133.117,432.216,72.8106|454.216,81.8106,8.89315,7.03825,r,133.117,454.216,81.8106|433.814,105.13,10.4961,13.7153,r,90.5434,433.814,105.13|403.043,207.805,10.4961,16.0068,r,103.751,403.043,207.805|385.043,202.805,10.4961,16.0068,r,103.751,385.043,202.805|430.466,154.154,12.7259,7.46809,r,88.6063,430.466,154.154|442.466,154,12.7259,7.46809,r,88.6063,442.466,154|454.8,154,12.7259,8.77759,r,88.6063,454.8,154|470.713,133.404,16.3234,16.696,r,88.6063,470.713,133.404|469.691,114,16.3234,16.696,r,88.6063,469.691,114|471.8,154,12.7259,13.8043,r,88.6063,471.8,154|427.811,132,7.09822,7.81358,r,88.6063,427.811,132|427.811,141,7.09822,7.81358,r,88.6063,427.811,141|438.811,133,7.09822,7.81358,r,88.6063,438.811,133|438.811,142,7.09822,7.81358,r,88.6063,438.811,142|0,0,7.09731,5.87332,m,0.0182809,0.999833,-0.999476,0.0323573,447.87,134|0,0,7.09731,5.87332,m,0.0182809,0.999833,-0.999476,0.0323573,447.87,143|0,0,7.09731,5.87332,m,0.0182809,0.999833,-0.999476,0.0323573,447.87,143.286|564.101,118,12.7259,7.81358,r,65.3389,564.101,118|561.101,137,12.7259,7.81358,r,65.3389,561.101,137|571.101,132,12.7259,7.81358,r,65.3389,571.101,132|567.101,152,12.7259,7.81358,r,65.3389,567.101,152|664.211,446.808,12.7259,10.4035,r,88.2549,664.211,446.808|664.399,471,12.7259,10.4035,r,88.2549,664.399,471|678.399,471,12.7259,10.4035,r,88.2549,678.399,471|691.399,471,12.7259,10.4035,r,88.2549,691.399,471|665.399,487,12.7259,10.4035,r,88.2549,665.399,487|629.399,507,12.7259,10.4035,r,88.2549,629.399,507|615.399,507,12.7259,10.4035,r,88.2549,615.399,507|601.399,507,12.7259,10.4035,r,88.2549,601.399,507|587.399,507,12.7259,10.4035,r,88.2549,587.399,507|573.399,507,12.7259,7.11071,r,88.2549,573.399,507|665.107,507,12.7259,7.11071,r,88.2549,665.107,507|676.107,507,12.7259,7.11071,r,88.2549,676.107,507|686.107,507,12.7259,7.11071,r,88.2549,686.107,507|695.107,507,12.7259,7.11071,r,88.2549,695.107,507|678.399,487,12.7259,10.4035,r,88.2549,678.399,487|692.399,487,12.7259,10.4035,r,88.2549,692.399,487|650.399,507,12.7259,17.4099,r,88.2549,650.399,507|677.399,447,12.7259,10.4035,r,88.2549,677.399,447|690.399,447,12.7259,10.4035,r,88.2549,690.399,447|577.101,146,9.65011,7.81358,r,65.3389,577.101,146|569.101,97,9.65011,7.81358,r,65.3389,569.101,97|575.101,109,9.65011,7.81358,r,65.3389,575.101,109|584.101,105,9.65011,7.81358,r,65.3389,584.101,105|581.101,121,15.9343,7.81358,r,65.3389,581.101,121|591.101,116,15.9343,7.81358,r,65.3389,591.101,116|591.101,87,15.9343,7.81358,r,65.3389,591.101,87|601.101,82,15.9343,7.81358,r,65.3389,601.101,82|600.101,104,7.75464,7.81358,r,65.3389,600.101,104|610.729,111.875,7.83986,12.906,r,65.3389,610.729,111.875|614.298,123,6.47469,10.2317,r,65.3389,614.298,123|617.518,133,6.47469,8.2726,r,65.3389,617.518,133|609.101,100,5.5201,7.81358,r,65.3389,609.101,100|578.101,93,9.65011,7.81358,r,65.3389,578.101,93|602.044,133.976,9.65011,19.8546,r,65.3389,602.044,133.976|694.101,241,12.7259,7.81358,r,65.3389,694.101,241|489.44,343,7,11,r,29.6419,489.44,343|491.203,307.081,7,11,r,20.8928,491.203,307.081|500.923,310,7,11,r,20.8928,500.923,310|510.923,314,7,11,r,20.8928,510.923,314`;

const FACILITY_DATA={
 restaurant:[
  '649.773,507.019,12.7259,16.7835,r,88.2549,649.773,507.019',
  '446,283.942,10.3214,11.9514,r,-74.412,446,283.942',
  '600,279.205,14.287,20.6366,r,-51.8868,600,279.205'
 ],
 commerce:[
  '506,336.675,15.5124,20.6366,r,-13.8451,506,336.675',
  '562.063,234,15.5124,15.1167,r,28.3951,562.063,234'
 ],
 office:[
  '723.285,443.516,23.4949,26.2967,r,88.2549,723.285,443.516',
  '726.285,475,23.4949,26.2967,r,88.2549,726.285,475',
  '731.484,505.227,12.7259,32.499,r,88.2549,731.484,505.227'
 ],
 hospital:[
  '0,0,37.2004,19.2953,m,-0.412448,0.910981,0.910981,0.412448,335.343,122',
  '0,0,22.3932,17.4037,m,-0.412448,0.910981,0.910981,0.412448,335.236,145'
 ]
};

const facilityMeta=[
 ['restaurante-sul','restaurant','Restaurante Vila Industrial',0,80],
 ['restaurante-oeste','restaurant','Restaurante do Oeste',1,90],
 ['restaurante-central','restaurant','Restaurante Central',2,110],
 ['loja-centro','commerce','Loja do Centro',0,140],
 ['shopping-rio','commerce','Shopping Jardim do Rio',1,520],
 ['empresa-leste-1','office','Empresa Leste 1',0,260],
 ['empresa-leste-2','office','Empresa Leste 2',1,300],
 ['empresa-leste-3','office','Empresa Leste 3',2,220]
];

placeColors.restaurant='#df9044';
placeColors.commerce='#d56ba5';
const facilityTint={restaurant:'#df9044',commerce:'#d56ba5',office:'#7360a8',hospital:'#cf5360'};

function parseRect(raw){
 const p=raw.split(',');const [x,y,w,h]=p.slice(0,4).map(Number);const kind=p[4];
 return {x,y,w,h,kind,args:p.slice(5).map(Number)};
}
function localPoint(r,x,y){
 if(r.kind==='r'){
  const [deg,cx,cy]=r.args,a=deg*Math.PI/180,dx=x-cx,dy=y-cy;
  return [cx+dx*Math.cos(a)-dy*Math.sin(a),cy+dx*Math.sin(a)+dy*Math.cos(a)];
 }
 if(r.kind==='m'){
  const [a,b,c,d,e,f]=r.args;
  return [a*x+c*y+e,b*x+d*y+f];
 }
 return [x,y];
}
function cityPoint(x,y){return [CFG.sx*x+CFG.tx,CFG.sy*y+CFG.ty];}
function corners(r){
 return [[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]]
  .map(([x,y])=>localPoint(r,x,y)).map(([x,y])=>cityPoint(x,y));
}
function center(r){
 const pts=corners(r);return [pts.reduce((s,p)=>s+p[0],0)/4,pts.reduce((s,p)=>s+p[1],0)/4];
}
function pathFor(r){
 const pts=corners(r);return 'M'+pts.map(p=>p.map(v=>v.toFixed(2)).join(' ')).join('L')+'Z';
}
function addPlaceData(id,type,name,rects,capacity,description){
 if(places.some(p=>p.id===id))return;
 const centers=rects.map(center),x=centers.reduce((s,p)=>s+p[0],0)/centers.length,y=centers.reduce((s,p)=>s+p[1],0)/centers.length;
 places.push({id,type,name,...toWorld(x,y),region:region(x,y),capacity,description});
}
function addHomeNode(homes,x,y,id){
 const g=svg('g',{class:'home-node','data-home':`casa-${String(id).padStart(3,'0')}`,'data-region':region(x,y),role:'button',tabindex:0,'aria-label':`Inspecionar residência ${id}`},homes);
 svg('title',{},g).textContent=`Residência ${id}`;
 svg('circle',{cx:x,cy:y,r:1.25,fill:'#4e9270',stroke:'#fff','stroke-width':.4,opacity:.78},g);
 svg('circle',{cx:x,cy:y,r:4.5,fill:'transparent','pointer-events':'all'},g);
}
const decoded={
 homes:HOME_DATA.split('|').filter(Boolean).map(parseRect),
 restaurant:FACILITY_DATA.restaurant.map(parseRect),
 commerce:FACILITY_DATA.commerce.map(parseRect),
 office:FACILITY_DATA.office.map(parseRect),
 hospital:FACILITY_DATA.hospital.map(parseRect)
};

for(const [id,type,name,index,capacity] of facilityMeta){
 const r=decoded[type][index];
 addPlaceData(id,type,name,[r],capacity,`${name} adicionado exatamente na posição marcada no SVG do usuário.`);
}
addPlaceData('hospital-zona-norte','hospital','Hospital da Zona Norte',decoded.hospital,150,'Hospital da Zona Norte formado pelos dois blocos vermelhos marcados no SVG do usuário.');

function addCfgGeometry(){
 const frame=document.getElementById('reference-city');
 const homes=frame?.querySelector('#homes-layer');
 const placesLayer=frame?.querySelector('#places-layer');
 if(!frame||!homes||!placesLayer||frame.querySelector('#cfg-additions-layer'))return false;

 const roofs=svg('g',{id:'cfg-additions-layer','aria-label':'Edificações adicionadas a partir do SVG do usuário'},frame);
 frame.insertBefore(roofs,homes);
 let nextId=Math.max(0,...[...homes.querySelectorAll('[data-home]')].map(n=>Number(n.dataset.home.replace('casa-',''))||0));

 for(const r of decoded.homes){
  const [cx,cy]=center(r);
  svg('path',{d:pathFor(r),fill:'#c1c1c1',style:'fill:#e6e9ee','pointer-events':'none'},roofs);
  addHomeNode(homes,cx,cy,++nextId);
 }

 const defs=[
  ...facilityMeta.map(([id,type,name,index])=>({id,type,name,rects:[decoded[type][index]]})),
  {id:'hospital-zona-norte',type:'hospital',name:'Hospital da Zona Norte',rects:decoded.hospital}
 ];
 for(const f of defs){
  const g=svg('g',{class:'map-place cfg-place','data-place':f.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${f.name}`},placesLayer);
  svg('title',{},g).textContent=f.name;
  const centers=f.rects.map(center);
  for(const r of f.rects){
   const d=pathFor(r);
   svg('path',{d,fill:'#c1c1c1',style:'fill:#e6e9ee','pointer-events':'none'},g);
   svg('path',{d,fill:facilityTint[f.type]||'#607a98','fill-opacity':.53,stroke:'none','pointer-events':'none'},g);
  }
  const cx=centers.reduce((s,p)=>s+p[0],0)/centers.length,cy=centers.reduce((s,p)=>s+p[1],0)/centers.length;
  svg('circle',{cx,cy,r:4.5,fill:facilityTint[f.type]||'#607a98',stroke:'#fff','stroke-width':1.15,class:'place-bubble'},g);
 }
 return true;
}

if(!addCfgGeometry()){
 const root=document.getElementById('map-world');
 if(root){const observer=new MutationObserver(()=>{if(addCfgGeometry())observer.disconnect();});observer.observe(root,{childList:true,subtree:true});}
}
