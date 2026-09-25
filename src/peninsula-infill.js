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

// Controlled infill zones in the original 740 x 740 map-reference space.
// We clear only graph nodes inside these two empty-block areas, then rebuild them
// in an orderly pattern so no residence or commercial building sits on a road.
const residentialZone=[
  [198,405],[284,428],[279,472],[246,482],[205,466],[190,435]
];
const shoppingZone=[
  [304,426],[344,430],[349,463],[336,474],[306,470],[298,442]
];

// Residential lots form a consistent diagonal grid parallel to the surrounding
// local streets. Every roof uses the same base-map roof color (#c1c1c1).
const residentialLots=[
  {cx:218,cy:418,width:12,height:8,angle:18},
  {cx:239,cy:425,width:12,height:8,angle:18},
  {cx:260,cy:432,width:12,height:8,angle:18},

  {cx:213,cy:437,width:12,height:8,angle:18},
  {cx:234,cy:444,width:12,height:8,angle:18},
  {cx:255,cy:451,width:12,height:8,angle:18},

  {cx:208,cy:456,width:12,height:8,angle:18},
  {cx:229,cy:463,width:12,height:8,angle:18},
  {cx:250,cy:470,width:12,height:8,angle:18}
];

// Shopping is intentionally compact and inset from all four sides of the eastern
// block, including the diagonal street on the left and the riverside street below.
const shoppingLot={cx:325,cy:449,width:22,height:16,angle:-7};

function insidePolygon(x,y,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
    const crosses=(yi>y)!==(yj>y);
    if(crosses && x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}

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

function homeCenter(node){
  const dot=node.querySelector('circle');
  if(!dot)return null;
  const x=Number(dot.getAttribute('cx'));
  const y=Number(dot.getAttribute('cy'));
  return Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null;
}

function clearControlledBlocks(homes){
  for(const home of [...homes.querySelectorAll('.home-node')]){
    const point=homeCenter(home);
    if(!point)continue;
    if(
      insidePolygon(point.x,point.y,residentialZone) ||
      insidePolygon(point.x,point.y,shoppingZone)
    ){
      home.remove();
    }
  }
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

  // The former shopping used a genuine old roof. Remove only the added business
  // tint so the original gray roof remains visible underneath.
  const oldBox=oldRoof.getBBox();
  const previous={x:oldBox.x+oldBox.width/2,y:oldBox.y+oldBox.height/2};
  oldRoof.remove();

  // peninsula-center.js may have scattered extra homes through these empty blocks.
  // Remove those first, then recreate a deliberate block-aligned street grid.
  clearControlledBlocks(homes);

  const roofs=make('g',{
    id:'peninsula-infill-roofs',
    'aria-label':'Novos lotes residenciais e comerciais do Centro'
  },frame);
  frame.insertBefore(roofs,homes);

  let serial=Math.max(0,...[...homes.querySelectorAll('[data-home]')]
    .map(node=>Number(node.dataset.home.replace('casa-',''))||0));

  const occupied=[...homes.querySelectorAll('.home-node')]
    .map(homeCenter)
    .filter(Boolean);

  // The old shopping building returns to residential use only when it is outside
  // the two controlled infill blocks and no home already occupies that roof.
  if(
    !insidePolygon(previous.x,previous.y,residentialZone) &&
    !insidePolygon(previous.x,previous.y,shoppingZone) &&
    !occupied.some(p=>Math.hypot(p.x-previous.x,p.y-previous.y)<7)
  ){
    serial++;
    homeAt(homes,previous.x,previous.y,serial);
    occupied.push(previous);
  }

  // Rebuild the western block as a clean 3 x 3 residential grid.
  for(const lot of residentialLots){
    const {cx,cy}=lot;
    lotRect(roofs,lot,{
      fill:'#c1c1c1',
      stroke:'none',
      'pointer-events':'none'
    });
    serial++;
    homeAt(homes,cx,cy,serial);
    occupied.push({x:cx,y:cy});
  }

  // Build the shopping fully inside the eastern block, clear of every road.
  const {cx,cy}=shoppingLot;
  const roof=lotRect(shopping,shoppingLot,{
    fill:'#c1c1c1',
    stroke:'none',
    'pointer-events':'none'
  });
  shopping.insertBefore(roof,pin);

  const tint=lotRect(shopping,{
    ...shoppingLot,
    width:shoppingLot.width-2,
    height:shoppingLot.height-2
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
      description:'Shopping inteiramente contido no quarteirão comercial da península central, sem sobreposição com as vias.'
    });
  }
  return true;
}

// peninsula-center.js creates the downtown asynchronously. Apply this correction
// only after its shopping marker exists, so this file becomes the final layout pass.
if(!run()){
  const world=document.getElementById('map-world');
  if(world){
    const observer=new MutationObserver(()=>{
      if(run())observer.disconnect();
    });
    observer.observe(world,{subtree:true,childList:true});
  }
}
