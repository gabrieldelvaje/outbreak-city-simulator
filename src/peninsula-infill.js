// Add NEW synthetic buildings to the empty central-peninsula block marked in the
// reference screenshot. Keep the original map, streets, river and existing home IDs.
import {MAP,places} from './city-data.js';

const NS='http://www.w3.org/2000/svg';
const make=(tag,attributes,parent)=>{
  const node=document.createElementNS(NS,tag);
  for(const [name,value] of Object.entries(attributes))node.setAttribute(name,String(value));
  parent?.append(node);
  return node;
};
const toWorld=(x,y)=>({x:MAP.x+MAP.scale*x,y:MAP.y+MAP.scale*y});

// All coordinates are in the original 740 x 740 map reference space. The block
// lies below the central park, west of the river, between the existing streets.
// Give the shopping its own NEW rectangular footprint instead of occupying an
// existing residential building.
const shoppingLot={x:291,y:439,width:40,height:27};
const residentialLots=[
  [239,427,13,9],[257,429,13,9],[275,429,12,9],
  [240,445,13,9],[258,447,13,9],[275,449,11,9],
  [238,464,13,9],[256,466,13,9],[274,469,12,9],
  [291,477,13,9],[310,477,13,9]
];

function homeAt(homes,x,y,serial){
  const node=make('g',{
    class:'home-node',
    'data-home':`casa-${String(serial).padStart(3,'0')}`,
    'data-region':'centro-civico',
    role:'button',tabindex:0,
    'aria-label':`Inspecionar residência ${serial}`
  },homes);
  make('title',{},node).textContent=`Residência ${serial}`;
  make('circle',{cx:x,cy:y,r:1.25,fill:'#4e9270',stroke:'#fff','stroke-width':.4,opacity:.78},node);
  make('circle',{cx:x,cy:y,r:4.5,fill:'transparent','pointer-events':'all'},node);
}

function run(){
  const frame=document.getElementById('reference-city');
  const homes=frame?.querySelector('#homes-layer');
  const shops=frame?.querySelector('#places-layer');
  const shopping=shops?.querySelector('[data-place="shopping-peninsula"]');
  const oldRoof=shopping?.querySelector(':scope > path');
  const pin=shopping?.querySelector(':scope > .place-pin');
  if(!frame||!homes||!shops||!shopping||!oldRoof||!pin)return false;
  if(frame.querySelector('#peninsula-infill-roofs'))return true;

  // The previous shopping occupied a genuine old roof. Remove ONLY the added
  // commercial tint; the original gray reference roof remains underneath it.
  // Its former commercial node becomes a residential node at the same center.
  const oldBox=oldRoof.getBBox();
  const previous={x:oldBox.x+oldBox.width/2,y:oldBox.y+oldBox.height/2};
  oldRoof.remove();

  // Add the new roof layer behind both homes and public-place pins.
  const roofs=make('g',{id:'peninsula-infill-roofs','aria-label':'Novos lotes residenciais e comerciais do Centro'},frame);
  frame.insertBefore(roofs,homes);
  let serial=Math.max(0,...[...homes.querySelectorAll('[data-home]')]
    .map(node=>Number(node.dataset.home.replace('casa-',''))||0));
  const occupied=[...homes.querySelectorAll('.home-node')].map(node=>{
    const dot=node.querySelector('circle');
    return dot?{x:Number(dot.getAttribute('cx')),y:Number(dot.getAttribute('cy'))}:null;
  }).filter(Boolean);

  // Restore a home in the shopping's OLD building, without duplicating a dot.
  if(!occupied.some(p=>Math.hypot(p.x-previous.x,p.y-previous.y)<7)){
    serial++;
    homeAt(homes,previous.x,previous.y,serial);
    occupied.push(previous);
  }

  // Separate, modest rectangular roofs make the previously empty peninsula
  // look urbanized. Don't remove or relocate existing houses, streets or parks.
  for(const [x,y,width,height] of residentialLots){
    const cx=x+width/2,cy=y+height/2;
    if(occupied.some(p=>Math.hypot(p.x-cx,p.y-cy)<9))continue;
    make('rect',{
      x,y,width,height,rx:.5,fill:'#c1c1c1',stroke:'#f8f8f8',
      'stroke-width':.8,'pointer-events':'none'
    },roofs);
    serial++;
    homeAt(homes,cx,cy,serial);
    occupied.push({x:cx,y:cy});
  }

  // New dedicated shopping building: real rectangle, not a marker hovering
  // over an existing home. Its place ID and click-to-inspect behavior persist.
  const {x,y,width,height}=shoppingLot;
  const cx=x+width/2,cy=y+height/2;
  const roof=make('rect',{
    x,y,width,height,rx:.7,fill:'#c1c1c1',stroke:'#f8f8f8',
    'stroke-width':1.1,'pointer-events':'none'
  },shopping);
  shopping.insertBefore(roof,pin);
  const tint=make('rect',{
    x:x+1.2,y:y+1.2,width:width-2.4,height:height-2.4,rx:.5,
    fill:'#8a76c8','fill-opacity':.52,'pointer-events':'none'
  },shopping);
  shopping.insertBefore(tint,pin);
  pin.setAttribute('transform',`translate(${cx} ${cy})`);
  const label=shopping.querySelector(':scope > .place-label');
  if(label){label.setAttribute('x',cx);label.setAttribute('y',y+height+11);}
  const record=places.find(place=>place.id==='shopping-peninsula');
  if(record){
    Object.assign(record,toWorld(cx,cy),{
      region:'centro-civico',
      description:'Shopping instalado em um novo edifício retangular na área adensada da península central.'
    });
  }
  return true;
}

// peninsula-center.js fetches the source map asynchronously. Run once its
// shopping marker and original roof exist, regardless of network timing.
if(!run()){
  const world=document.getElementById('map-world');
  if(world){
    const observer=new MutationObserver(()=>{
      if(run())observer.disconnect();
    });
    observer.observe(world,{subtree:true,childList:true});
  }
}
