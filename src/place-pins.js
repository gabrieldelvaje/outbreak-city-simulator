// Map pins use the same silhouette in both themes, with a filled category disc.
// Only hospitals use H. House graph nodes, map geometry and place interactions stay intact.
import {places,placeColors} from './city-data.js';

const NS='http://www.w3.org/2000/svg';
const typeById=new Map(places.map(place=>[place.id,place.type]));
const placeById=new Map(places.map(place=>[place.id,place]));
const darkDiscColors={school:'#9bc8f0',market:'#f0bc88',hospital:'#eea0aa',civic:'#b3c7dd',office:'#bcafe3',park:'#acd9b7'};
const svg=(tag,attributes,parent)=>{
  const node=document.createElementNS(NS,tag);
  for(const [name,value] of Object.entries(attributes))node.setAttribute(name,String(value));
  parent.append(node);
  return node;
};

function drawIcon(parent,type){
  if(type==='hospital'){
    const letter=svg('text',{x:0,y:-19.7,'font-size':12.5,'font-weight':800,'text-anchor':'middle',fill:'currentColor','pointer-events':'none'},parent);
    letter.textContent='H';
    return;
  }
  const icon=svg('g',{transform:'translate(-8.4 -32.4) scale(.7)',fill:'none',stroke:'currentColor','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round','pointer-events':'none'},parent);
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

function paintPins(){
  const dark=document.documentElement.dataset.theme==='dark';
  for(const pin of document.querySelectorAll('#places-layer .place-pin')){
    const color=dark?(darkDiscColors[pin.dataset.type]||'#b3c7dd'):pin.dataset.lightColor;
    const shell=pin.querySelector('.place-pin-shape');
    const disc=pin.querySelector('.place-pin-disc');
    const icon=pin.querySelector('.place-pin-icon');
    if(shell){
      shell.setAttribute('fill',dark?'#8290a7':'#fff');
      shell.setAttribute('stroke',dark?'#94a0b5':'#e6eaf0');
    }
    if(disc)disc.setAttribute('fill',color);
    if(icon)icon.style.color=dark?'#182631':'#fff';
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
    const parkAnchor=type==='park'?place.querySelector(':scope > circle[fill="transparent"]'):null;
    const anchor=dot||parkAnchor;
    if(!anchor)continue;
    const cx=Number(anchor.getAttribute('cx'));
    const cy=Number(anchor.getAttribute('cy'));
    const color=dot?.getAttribute('fill')||placeColors[type]||'#607a98';
    const oldGlyph=Array.from(place.children).find(node=>node.localName==='text'&&!node.classList.contains('place-label'));
    const pin=svg('g',{class:'place-pin','data-type':type,'data-light-color':color,transform:`translate(${cx} ${cy})`},place);
    const art=svg('g',{class:'place-pin-art'},pin);
    svg('path',{d:'M0 0C-5 -8 -15 -17 -15 -24A15 15 0 1 1 15 -24C15 -17 5 -8 0 0Z',fill:'#fff',stroke:'#e6eaf0','stroke-width':1.8,class:'place-pin-shape',style:'filter:drop-shadow(0 1px 1.5px #17243555)'},art);
    svg('circle',{cx:0,cy:-24,r:10.5,fill:color,class:'place-pin-disc','pointer-events':'none'},art);
    const icon=svg('g',{class:'place-pin-icon',color:'#fff','pointer-events':'none'},art);
    drawIcon(icon,type);

    // Tooltip replaces the permanent text label. It appears only on hover/focus,
    // while the pin itself lifts slightly from the map.
    const placeData=placeById.get(place.dataset.place);
    const tooltipName=placeData?.name || place.querySelector('title')?.textContent || 'Local';
    const tooltipWidth=Math.max(38,Math.min(118,tooltipName.length*3.35+14));
    const tooltip=svg('g',{
      class:'place-pin-tooltip',
      transform:'translate(0 -48)',
      'pointer-events':'none',
      'aria-hidden':'true'
    },pin);
    svg('rect',{
      x:-tooltipWidth/2,y:-8,width:tooltipWidth,height:15,rx:5,
      class:'place-pin-tooltip-bg'
    },tooltip);
    const tooltipText=svg('text',{
      x:0,y:2.1,
      class:'place-pin-tooltip-text',
      'text-anchor':'middle',
      'font-size':6.2,
      'font-weight':650
    },tooltip);
    tooltipText.textContent=tooltipName;

    const label=place.querySelector(':scope > .place-label');
    if(label)place.insertBefore(pin,label);
    dot?.remove();
    oldGlyph?.remove();
    // Parks retain their transparent hit targets, including their original clicks.
  }
  paintPins();
  return true;
}

// The theme button changes data-theme without rebuilding the city.
new MutationObserver(paintPins).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
// map.js creates the city synchronously after module imports finish.
if(!renderPins()){
  const root=document.getElementById('map-world');
  if(root){
    const observer=new MutationObserver(()=>{
      if(renderPins())observer.disconnect();
    });
    observer.observe(root,{childList:true,subtree:true});
  }
}
