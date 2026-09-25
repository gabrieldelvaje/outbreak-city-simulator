import {MAP, places, placeColors, bridges} from './city-data.js';
// Geometry is NOT a newly generated city: assets/city-reference.svg is the actual
// vector trace of the user's 740 × 740 reference. Only selected original roofs
// become public facilities; homes sit on original buildings and countryside has no nodes.
const NS='http://www.w3.org/2000/svg';
const E=(tag,a={},parent)=>{const n=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(a))n.setAttribute(key,String(value));parent?.append(n);return n;};
const R=(x,y,w,h,fill,g,a={})=>E('rect',{x,y,width:w,height:h,fill,...a},g);
const L=(d,stroke,w,g,a={})=>E('path',{d,fill:'none',stroke,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round',...a},g);
const P=(d,fill,g,a={})=>E('path',{d,fill,...a},g);
const T=(value,x,y,g,a={})=>{const t=E('text',{x,y,...a},g);t.textContent=value;return t;};
const siteBox={
 'escola-norte':[186,188,30,21], 'mercado-norte':[145,242,33,26],
 'escola-rio':[541,240,21,26], 'mercado-rio':[600,286,21,25],
 'hospital-central':[543,515,34,68], 'prefeitura':[475,532,33,52],
 'fabrica-oeste':[338,562,38,46], 'escola-industrial':[326,650,42,16],
 'centro-empresarial':[593,550,37,24], 'escola-colinas':[530,118,20,20]
};
const parkShape={
 'praca-civica':'M305 330L340 322 329 355 374 369 399 362 406 378 351 392 296 379Z',
 'praca-prefeitura':'M384 557L410 598 410 603 387 662 385 680 386 694 436 689 520 685 510 615 470 612 434 542 429 542Z',
 'praca-torres':'M52 365L47 319 64 288 70 282 90 276 160 292 236 308 229 319 199 319 203 334 174 339 170 353Z',
 'parque-colinas':'M578 145L591 174 595 187 503 237 493 214 494 183Z'
};
// Building centroids extracted from the gray roof footprints in the reference.
// 2 base-36 digits per axis, rather than an unrelated random grid of homes.
const homeCenters='f11xdl2ne12eej25323qe23zei3qf03hfh39364lcp4t395e4k5i6m5ib85qbt5ncd5mcy5k6m6q8v6a906fch6ed06cfr6sg96jgr6b5l7e6m7o7p7n7s7g877v8a7l957r9n7ra77ret7ag47ogm7fh3777d8r7u847u8y8j8e8o81948i95849o849p8ha88gbm8shg82in8t719y759j79967l9q7q9cao91bg9mbr9ubx90c898ef9ygr9zi59c5kak65ar6tar78az7fa4cbaycwardiamdmayeoa2h8a7hoafi4anikav49bn4mbx5bbi5fb15sbq5yb96kbq6nbe6qb371bj76b99ubpatbeawbpblb7bobhbrbrceb9chbickbtczb3d3bfdpbahobnhwb4i4bvicbdisblj0b42cc13nch40cr41c04eca4rck4zc757cu5fch9zc0a3cba8cnb0c0b4ccbvc2hacmhhc4hxccieclikc42ydc35d03bdm3ida3odw3wdk4bdu4dd04tda5udf67dp6kdzgzd944e65ae75neh60ergseugxe5hbeqczf9hbf76rgc7qge93gi9php6yiq9kix5qjy9kjj6gk39pk7';
function makeFacility(p,parent){
 const g=E('g',{class:'map-place','data-place':p.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${p.name}`},parent);
 E('title',{},g).textContent=p.name;
 const color=placeColors[p.type];
 if(p.type==='park'){
   P(parkShape[p.id],'#91c92c',g,{opacity:'.08',stroke:'none'});
   E('circle',{cx:(p.x-MAP.x)/MAP.scale,cy:(p.y-MAP.y)/MAP.scale,r:6,fill:'transparent'},g);
   return;
 }
 const [x,y,w,h]=siteBox[p.id];
 // Replace one existing roof, without inventing oversized blocks or extra streets.
 R(x,y,w,h,p.type==='school'?'#b6cbd7':p.type==='market'?'#dec8ac':p.type==='hospital'?'#c2d0d6':p.type==='civic'?'#adbbc8':'#b9b0d1',g,{rx:.5,stroke:'#f8f8f8','stroke-width':.9});
 if(p.type==='school'){
   R(x+2,y+2,Math.max(7,w*.55),Math.max(4,h-4),'#8da7bb',g);
   L(`M${x+w*.72} ${y+3}v${h-6} M${x+w*.85} ${y+3}v${h-6}`,'#f5f7ef',.8,g);
 } else if(p.type==='market'){
   R(x+1,y+1,w-2,Math.min(5,h*.35),'#cb8f52',g);
   for(let i=0;i<4;i++)R(x+2+i*(w-4)/4,y+1,(w-4)/8,Math.min(5,h*.35),'#f6eee6',g);
   R(x+w*.23,y+h*.52,w*.54,h*.25,'#e8edf0',g);
 } else if(p.type==='hospital'){
   R(x+2,y+2,w-4,h-4,'#a8bbc7',g);
   R(x+w/2-2,y+h/2-9,4,18,'#fff',g);R(x+w/2-9,y+h/2-2,18,4,'#fff',g);
   R(x+w/2-1,y+h/2-7,2,14,'#d95362',g);R(x+w/2-7,y+h/2-1,14,2,'#d95362',g);
 } else if(p.type==='civic'){
   R(x+2,y+3,w-4,h-6,'#a2b5c3',g);
   L(`M${x+4} ${y+8}h${w-8} M${x+4} ${y+h-8}h${w-8}`,'#e9f0f4',1,g);
   for(const off of [.3,.5,.7])R(x+w*off-1,y+h*.3,2,h*.4,'#e7edf1',g);
 } else {
   R(x+2,y+2,w*.43-2,h-4,'#9e97bf',g);
   R(x+w*.48,y+2,w*.48,h-4,'#afa6cd',g);
   for(let r=0;r<3;r++)for(let c=0;c<2;c++)R(x+w*.6+c*4,y+4+r*5,2,2,'#e9e5f5',g);
 }
 const cx=x+w/2,cy=y+h/2;
 E('circle',{cx,cy,r:4.5,fill:color,stroke:'#fff','stroke-width':1.15,class:'place-bubble'},g);
 const glyph={school:'E',market:'M',hospital:'+',civic:'C',office:'T'}[p.type];
 T(glyph,cx,cy+1.5,g,{'font-size':5,'font-weight':750,'text-anchor':'middle',fill:'#fff','pointer-events':'none'});
 const short={school:'Escola',market:'Mercado',hospital:'Hospital',civic:'Prefeitura',office:'Empresas'}[p.type];
 T(short,cx,cy+h/2+7,g,{class:'place-label','text-anchor':'middle',style:'font-size:6px;font-weight:600;fill:#46535a;paint-order:stroke;stroke:#f8f8f8;stroke-width:1px;pointer-events:none;'});
}
const region=(x,y)=>x<300&&y<375?'norte-verde':x<490&&y<335?'jardim-do-rio':x>=490&&y<355?'vale-do-sol':x<280?'colinas-do-sul':x>430&&y>510?'vila-industrial':'centro-civico';
function addHomes(parent){let count=0;
 for(let i=0;i+3<homeCenters.length;i+=4){const x=parseInt(homeCenters.slice(i,i+2),36),y=parseInt(homeCenters.slice(i+2,i+4),36);count++;
  const g=E('g',{class:'home-node','data-home':`casa-${String(count).padStart(3,'0')}`,'data-region':region(x,y),role:'button',tabindex:0,'aria-label':`Inspecionar residência ${count}`},parent);
  E('title',{},g).textContent=`Residência ${count}`;
  E('circle',{cx:x,cy:y,r:1.25,fill:'#4e9270',stroke:'#fff','stroke-width':.4,opacity:.78},g);
  E('circle',{cx:x,cy:y,r:4.5,fill:'transparent','pointer-events':'all'},g);
 }
 return count;
}
function countryside(root){
 // The city is a long river corridor: keep rural green mainly on the far lateral
 // edges, while the neutral urban band continues farther north and south.
 R(-240,-210,2080,1350,'#e5e5e5',root);
 const g=E('g',{'aria-hidden':'true','pointer-events':'none'},root);
 const f='#dceacb';

 // Narrower rural fringe on the west/east makes the settlement feel like it
 // developed continuously along both river banks instead of sitting in a square.
 for(const d of [
  'M-240 -210H1840V-150L1510 -132 1320 -118 1110 -126 910 -112 690 -132 470 -116 240 -138 -240 -112Z',
  'M-240 -210L105 -210 82 -78 58 65 35 205 18 360 28 520 52 690 92 835 45 980 -240 1010Z',
  'M1840 -210V1140H1262L1258 980 1265 820 1260 650 1267 500 1261 335 1268 165 1265 -35Z',
  'M-240 1140V1055L70 1028 310 1046 565 1032 810 1050 1055 1034 1295 1050 1540 1025 1840 1060V1140Z'
 ])P(d,f,g);

 // Sparse peripheral roads still hint that the urban fabric keeps going beyond
 // the current detailed map, especially at the north/south ends of both banks.
 for(const d of [
  'M-150 285Q95 300 355 360',
  'M1265 145Q1450 165 1705 135',
  'M-105 735Q155 710 405 835',
  'M1180 995Q1435 930 1745 965'
 ])L(d,'#f9faf8',5,g);
}
export function finishLandscape(root){
 root.replaceChildren();countryside(root);
 const frame=E('g',{id:'reference-city',transform:`translate(${MAP.x} ${MAP.y}) scale(${MAP.scale})`},root);
 E('image',{href:'./assets/city-reference.svg',x:0,y:0,width:MAP.size,height:MAP.size,'pointer-events':'none','aria-hidden':'true'},frame);
 const homes=E('g',{id:'homes-layer'},frame);const homeCount=addHomes(homes);
 const hubs=E('g',{id:'places-layer'},frame);
 for(const p of places)makeFacility(p,hubs);
 const bridgeLayer=E('g',{id:'bridge-layer'},frame);
 const routes={'ponte-norte':'M284 255L333 219','ponte-central':'M504 365L567 347','ponte-sul':'M348 473L361 535'};
 for(const b of bridges){const d=routes[b.id];const g=E('g',{class:'bridge-hit','data-bridge':b.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${b.name}`},bridgeLayer);
  L(d,'#fff',1.2,g,{class:'bridge-deck',opacity:.85,'pointer-events':'none'});
  L(d,'transparent',13,g,{'pointer-events':'stroke'});E('title',{},g).textContent=b.name;
 }
 const flows=E('g',{id:'flows-layer',class:'map-layer-hidden'},frame);
 for(const b of bridges)L(routes[b.id],'#397fc6',2,flows,{class:'flow','data-flow-bridge':b.id,'pointer-events':'none'});
 return {homeCount};
}