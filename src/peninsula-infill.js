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

// All coordinates are in the original 740 x 740 reference space.
//
// The peninsula is split by a diagonal local street. New homes stay inside the
// western block and follow the same diagonal direction as the surrounding roads.
// The shopping occupies the separate eastern block, completely clear of the
// diagonal street and the riverside road.
const shoppingLot={cx:332,cy:443,width:30,height:21,angle:-8};

// A compact 3 x 3 residential pattern. These are deliberately inset from every
// street edge so neither roofs nor graph nodes sit on top of a roadway.
const residentialLots=[
  {cx:240,cy:423,width:12,height:8,angle:18},
  {cx:258,cy:429,width:12,height:8,angle:18},
  {cx:276,cy:435,width:12,height:8,angle:18},

  {cx:235,cy:441,width:12,height:8,angle:18},
  {cx:253,cy:447,width:12,height:8,angle:18},
  {cx:271,cy:453,width:12,height:8,angle:18},

  {cx:230,cy:459,width:12,height:8,angle:18},
  {cx:248,cy:465,width:12,height:8,angle:18},
  {cx:266,cy:471,width:12,height:8,angle:18}
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

function lotRect(parent,{cx,cy,width,height,angle},attrs={}){
  return make('rect',{
    x:-width/2,y:-height/2,width,height,rx:.5,
    transform:`translate(${cx} ${cy}) rotate(${angle})`,
    ...attrs
  },parent);
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
  // Its former commercial node becomes residential again.
  const oldBox=oldRoof.getBBox();
  const previous={x:oldBox.x+oldBox.width/2,y:oldBox.y+oldBox.height/2};
  oldRoof.remove();

  // Put the synthetic roof layer behind graph nodes and place pins.
  const roofs=make('g',{
    id:'peninsula-infill-roofs',
    'aria-label':'Novos lotes residenciais e comerciais do Centro'
  },frame);
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

  // Residential roofs now match the exact base-map building color and have no
  // artificial white outline. Their common rotation follows the block/street grid.
  for(const lot of residentialLots){
    const {cx,cy}=lot;
    if(occupied.some(p=>Math.hypot(p.x-cx,p.y-cy)<8))continue;

    lotRect(roofs,lot,{
      fill:'#c1c1c1',
      stroke:'none',
      'pointer-events':'none'
    });

    serial++;
    homeAt(homes,cx,cy,serial);
    occupied.push({x:cx,y:cy});
  }

  // Dedicated shopping building, fully inside the eastern block. The footprint
  // is smaller and rotated with the street instead of crossing either roadway.
  const {cx,cy}=shoppingLot;
  const roof=lotRect(shopping,shoppingLot,{
    fill:'#c1c1c1',
    stroke:'none',
    'pointer-events':'none'
  });
  shopping.insertBefore(roof,pin);

  const tint=lotRect(shopping,{
    ...shoppingLot,
    width:shoppingLot.width-2.2,
    height:shoppingLot.height-2.2
  },{
    fill:'#8a76c8',
    'fill-opacity':.52,
    stroke:'none',
    'pointer-events':'none'
  });
  shopping.insertBefore(tint,pin);

  pin.setAttribute('transform',`translate(${cx} ${cy})`);
  const label=shopping.querySelector(':scope > .place-label');
  if(label){
    label.setAttribute('x',cx);
    label.setAttribute('y',cy+shoppingLot.height/2+10);
  }

  const record=places.find(place=>place.id==='shopping-peninsula');
  if(record){
    Object.assign(record,toWorld(cx,cy),{
      region:'centro-civico',
      description:'Shopping instalado inteiramente no quarteirão comercial da península central, sem sobrepor as vias.'
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
