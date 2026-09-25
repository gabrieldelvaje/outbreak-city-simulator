// Build the downtown on EXISTING roof footprints of the river peninsula.
// Do not alter the source SVG, roads, bridges, river, parks or original home IDs.
import {MAP,places,placeColors} from './city-data.js';

const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},parent)=>{
  const node=document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  parent?.append(node);
  return node;
};
const toWorld=(x,y)=>({x:MAP.x+MAP.scale*x,y:MAP.y+MAP.scale*y});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const civicPark=[[305,330],[340,322],[329,355],[374,369],[399,362],[406,378],[351,392],[296,379]];
function inPolygon(x,y,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
    if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}
function originalRoofs(source){
  const building=source.querySelector('path[fill="#c1c1c1"]');
  if(!building)return [];
  const roofs=[];
  for(const d of building.getAttribute('d').match(/M[^M]*?Z/gi)||[]){
    // Each source subpath outlines ONE genuine building; never invent a roof.
    const points=[...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)]
      .map(match=>[Number(match[1]),Number(match[2])]);
    if(points.length<3)continue;
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    const left=Math.min(...xs),right=Math.max(...xs);
    const top=Math.min(...ys),bottom=Math.max(...ys);
    const x=(left+right)/2,y=(top+bottom)/2;
    const width=right-left,height=bottom-top;
    if(x<255||x>440||y<268||y>445||width<5||height<4||width>48||height>48)continue;
    if(inPolygon(x,y,civicPark))continue;
    roofs.push({x,y,width,height,d,area:width*height});
  }
  return roofs;
}
function moveMarker(place,roof){
  const {x,y}=roof;
  const pin=place.querySelector(':scope > .place-pin');
  const label=place.querySelector(':scope > .place-label');
  for(const child of [...place.children]){
    if(child!==pin&&child!==label&&child.localName!=='title')child.remove();
  }
  const shape=el('path',{d:roof.d,fill:placeColors.civic,'fill-opacity':'.53',stroke:'none','pointer-events':'none'},place);
  if(pin){place.insertBefore(shape,pin);pin.setAttribute('transform',`translate(${x} ${y})`);}
  if(label){label.setAttribute('x',x);label.setAttribute('y',y+13);label.textContent='Prefeitura';}
  const record=places.find(p=>p.id==='prefeitura');
  if(record){Object.assign(record,toWorld(x,y),{region:'centro-civico',description:'Sede do governo municipal situada na península central do rio, o centro da cidade.'});}
  place.querySelector('title')?.replaceChildren(document.createTextNode('Prefeitura'));
}
function icon(art,type){
  const wrap=el('g',{class:'place-pin-icon',color:'#fff','pointer-events':'none'},art);
  const ink=el('g',{transform:'translate(-8.4 -32.4) scale(.7)',fill:'none',stroke:'currentColor','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'},wrap);
  if(type==='restaurant'){
    el('path',{d:'M4 3V10M7 3V10M10 3V10M7 10V21M17 3V21M17 3C13 7 13 12 17 13'},ink);
  }else{
    el('path',{d:'M4 9H20L21 21H3L4 9ZM8 9V7A4 4 0 0 1 16 7V9M8 14H16'},ink);
  }
}
function createBusiness(layer,roof,config){
  const [id,type,name,short,capacity]=config;
  const {x,y}=roof;
  const color=type==='shopping'?'#8a76c8':'#d98a52';
  const p={id,type,name,...toWorld(x,y),region:'centro-civico',capacity,
    description:type==='shopping'?'Centro comercial e ponto de encontro da península central.':'Restaurante na península central, com circulação de moradores e visitantes.'};
  places.push(p);
  const group=el('g',{class:'map-place','data-place':id,role:'button',tabindex:0,'aria-label':`Inspecionar ${name}`},layer);
  el('title',{},group).textContent=name;
  el('path',{d:roof.d,fill:color,'fill-opacity':'.48',stroke:'none','pointer-events':'none'},group);
  const pin=el('g',{class:'place-pin','data-type':type==='shopping'?'office':'market','data-light-color':color,transform:`translate(${x} ${y})`},group);
  const art=el('g',{class:'place-pin-art'},pin);
  el('path',{d:'M0 0C-5 -8 -15 -17 -15 -24A15 15 0 1 1 15 -24C15 -17 5 -8 0 0Z',fill:'#fff',stroke:'#e6eaf0','stroke-width':1.8,class:'place-pin-shape',style:'filter:drop-shadow(0 1px 1.5px #17243555)'},art);
  el('circle',{cx:0,cy:-24,r:10.5,fill:color,class:'place-pin-disc','pointer-events':'none'},art);
  icon(art,type);
  el('text',{x,y:y+13,class:'place-label','text-anchor':'middle',style:'font-size:6px;font-weight:600;fill:#46535a;paint-order:stroke;stroke:#f8f8f8;stroke-width:1px;pointer-events:none'},group).textContent=short;
  // The existing theme observer also paints these category-colored pins.
  if(document.documentElement.dataset.theme==='dark'){
    pin.querySelector('.place-pin-shape')?.setAttribute('fill','#8290a7');
    pin.querySelector('.place-pin-shape')?.setAttribute('stroke','#94a0b5');
    pin.querySelector('.place-pin-disc')?.setAttribute('fill',type==='shopping'?'#bcafe3':'#f0bc88');
    pin.querySelector('.place-pin-icon').style.color='#182631';
  }
}
function addDowntownHomes(roofs,homes,used){
  const existing=[...homes.querySelectorAll('.home-node')].map(node=>({
    x:Number(node.querySelector('circle')?.getAttribute('cx')),
    y:Number(node.querySelector('circle')?.getAttribute('cy'))
  })).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  const usedBuildings=new Set(used);
  let serial=Math.max(0,...[...homes.querySelectorAll('[data-home]')].map(node=>Number(node.dataset.home.replace('casa-',''))||0));
  const candidates=roofs.filter(roof=>roof.width<=25&&roof.height<=24&&!usedBuildings.has(roof))
    .sort((a,b)=>distance(a,{x:320,y:345})-distance(b,{x:320,y:345}));
  let added=0;
  for(const roof of candidates){
    if(added>=18)break;
    if(existing.some(home=>distance(home,roof)<12))continue;
    if(used.some(site=>distance(site,roof)<17))continue;
    const x=roof.x,y=roof.y;
    serial++;
    const group=el('g',{class:'home-node','data-home':`casa-${String(serial).padStart(3,'0')}`,'data-region':'centro-civico',role:'button',tabindex:0,'aria-label':`Inspecionar residência ${serial}`},homes);
    el('title',{},group).textContent=`Residência ${serial}`;
    el('circle',{cx:x,cy:y,r:1.25,fill:'#4e9270',stroke:'#fff','stroke-width':.4,opacity:.78},group);
    el('circle',{cx:x,cy:y,r:4.5,fill:'transparent','pointer-events':'all'},group);
    existing.push({x,y});
    added++;
  }
}
async function populatePeninsula(){
  const layer=document.getElementById('places-layer');
  const homes=document.getElementById('homes-layer');
  const cityHall=layer?.querySelector('[data-place="prefeitura"]');
  if(!layer||!homes||!cityHall||layer.querySelector('[data-place="shopping-peninsula"]'))return;
  // Source-space roof contours ensure all new nodes sit on actual lots, not water/roads.
  try{
    const response=await fetch(new URL('../assets/city-reference.svg',import.meta.url));
    if(!response.ok)throw new Error(`Map source: ${response.status}`);
    const source=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
    if(source.querySelector('parsererror'))throw new Error('Invalid map SVG');
    const roofs=originalRoofs(source);
    if(roofs.length<8)throw new Error('Not enough source roof footprints in the peninsula');
    const used=[];
    function take(x,y,minArea=0){
      const candidate=roofs.filter(roof=>roof.area>=minArea&&!used.includes(roof))
        .sort((a,b)=>distance(a,{x,y})-distance(b,{x,y}))[0];
      if(candidate&&distance(candidate,{x,y})<=65){used.push(candidate);return candidate;}
      return null;
    }
    const cityHallRoof=take(290,290,30);
    if(cityHallRoof)moveMarker(cityHall,cityHallRoof);
    const commerce=[
      [282,315,100,['shopping-peninsula','shopping','Shopping da Península','Shopping',520]],
      [335,308,25,['restaurante-cais','restaurant','Restaurante do Cais','Restaurante',90]],
      [274,405,25,['restaurante-praca','restaurant','Bistrô da Praça','Restaurante',75]]
    ];
    for(const [x,y,area,config] of commerce){
      const roof=take(x,y,area);
      if(roof)createBusiness(layer,roof,config);
    }
    // Remove a residential marker only when its roof has become public/commercial.
    for(const roof of used){
      for(const home of homes.querySelectorAll('.home-node')){
        const dot=home.querySelector('circle');
        if(dot&&distance(roof,{x:Number(dot.getAttribute('cx')),y:Number(dot.getAttribute('cy'))})<7)home.remove();
      }
    }
    addDowntownHomes(roofs,homes,used);
  }catch(error){console.warn('OUTBREAK: downtown roof-based expansion unavailable.',error);}
}
void populatePeninsula();
