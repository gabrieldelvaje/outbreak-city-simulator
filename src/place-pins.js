// Public places use map pins with category icons; only hospitals use the letter H.
// Residential graph dots, existing building footprints and click handlers stay intact.
import {places,placeColors} from './city-data.js';

const NS='http://www.w3.org/2000/svg';
const typeById=new Map(places.map(place=>[place.id,place.type]));
const svg=(tag,attributes,parent)=>{
  const node=document.createElementNS(NS,tag);
  for(const [name,value] of Object.entries(attributes))node.setAttribute(name,String(value));
  parent.append(node);
  return node;
};

function drawIcon(parent,type){
  if(type==='hospital'){
    const letter=svg('text',{x:0,y:-19.7,'font-size':12.5,'font-weight':800,'text-anchor':'middle',fill:'#263446','pointer-events':'none'},parent);
    letter.textContent='H';
    return;
  }
  // All other icons share a 24x24 coordinate grid, centered in the white pin disc.
  const icon=svg('g',{transform:'translate(-8.4 -32.4) scale(.7)',fill:'none',stroke:'#263446','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round','pointer-events':'none'},parent);
  const shape=d=>svg('path',{d},icon);
  if(type==='school'){
    shape('M2 9 12 4 22 9 12 14 2 9Z');
    shape('M6 11V16C9 19 15 19 18 16V11M22 9V16');
  }else if(type==='market'){
    shape('M2 3H5L7 15H19L22 7H6');
    svg('circle',{cx:9,cy:20,r:1},icon);
    svg('circle',{cx:18,cy:20,r:1},icon);
  }else if(type==='civic'){
    shape('M2 9 12 3 22 9M3 10H21M5 10V19M10 10V19M15 10V19M19 10V19M2 20H22');
  }else if(type==='office'){
    shape('M3 7H21V20H3ZM8 7V4H16V7M3 13H21M11 12V15H13V12');
  }else if(type==='park'){
    shape('M12 3 5 13H9L4 18H20L15 13H19L12 3ZM12 18V22');
  }
}

function renderPins(){
  const layer=document.getElementById('places-layer');
  if(!layer)return false;
  for(const place of layer.querySelectorAll('.map-place')){
    if(place.querySelector(':scope > .place-pin'))continue;
    const type=typeById.get(place.dataset.place);
    if(!type)continue;
    const dot=place.querySelector(':scope > .place-bubble');
    // Parks already have a transparent center hit target rather than a graph dot.
    const parkAnchor=type==='park'?place.querySelector(':scope > circle[fill="transparent"]'):null;
    const anchor=dot||parkAnchor;
    if(!anchor)continue;
    const cx=Number(anchor.getAttribute('cx'));
    const cy=Number(anchor.getAttribute('cy'));
    const color=dot?.getAttribute('fill')||placeColors[type]||'#607a98';
    const oldGlyph=Array.from(place.children).find(node=>node.localName==='text'&&!node.classList.contains('place-label'));
    const pin=svg('g',{class:'place-pin',transform:`translate(${cx} ${cy})`},place);
    const art=svg('g',{class:'place-pin-art'},pin);
    svg('path',{d:'M0 0C-5 -8 -15 -17 -15 -24A15 15 0 1 1 15 -24C15 -17 5 -8 0 0Z',fill:color,stroke:'#fff','stroke-width':1.8,class:'place-pin-shape',style:'filter:drop-shadow(0 1px 1.5px #17243555)'},art);
    svg('circle',{cx:0,cy:-24,r:10.5,fill:'#fff','pointer-events':'none'},art);
    drawIcon(art,type);
    const label=place.querySelector(':scope > .place-label');
    if(label)place.insertBefore(pin,label);
    dot?.remove();
    oldGlyph?.remove();
    // Keep the park's transparent hit target so its original interaction remains.
  }
  return true;
}

// map.js builds the city after its module runs; watch until its place layer exists.
if(!renderPins()){
  const root=document.getElementById('map-world');
  if(root){
    const observer=new MutationObserver(()=>{
      if(renderPins())observer.disconnect();
    });
    observer.observe(root,{childList:true,subtree:true});
  }
}
