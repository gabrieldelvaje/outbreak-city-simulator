import {extendReferenceMap} from './map-extensions.js';
import {normalizeReferenceStreets} from './normalize-streets.js';
import {places,placeColors} from './city-data.js';

// Keep home IDs stable. These markers do not sit on residential roofs; houses
// 20 and 63 were the green dots drawn directly on the north and central bridges.
const UNSITED_HOME_IDS=[20,21,29,30,31,32,63,75,109,151,152,155,157,159];
const SVG_NS='http://www.w3.org/2000/svg';

// Center each closure on the visible road axis. North and central follow the
// yellow avenue; south follows the white bridge with a slightly corrected angle.
// The invisible click target and red interdiction stripe use the same path.
const BRIDGE_CENTERLINES={
  'ponte-norte':'M297 239.2L341 213.8',
  'ponte-central':'M500 364L566 345.6',
  'ponte-sul':'M354 487.5L356.5 535.5'
};

function removeUnsitedHomes(root){
  const homes=root.querySelector('#homes-layer');
  if(!homes)return;
  for(const id of UNSITED_HOME_IDS){
    homes.querySelector(`[data-home="casa-${String(id).padStart(3,'0')}"]`)?.remove();
  }
}

// Match the other building footprints: one flat rectangle in its category color.
// Preserve the interactive graph bubble, label, hit area and each building's
// existing size/position. Parks remain unchanged.
function simplifyPublicBuildings(root){
  const typeById=new Map(places.map(place=>[place.id,place.type]));
  for(const facility of root.querySelectorAll('#places-layer .map-place')){
    const type=typeById.get(facility.dataset.place);
    if(!type||type==='park')continue;
    const roof=Array.from(facility.children).find(child=>child.localName==='rect');
    if(!roof)continue;
    roof.setAttribute('fill',placeColors[type]??'#607a98');
    roof.setAttribute('stroke','#f8f8f8');
    roof.setAttribute('stroke-width','0.9');
    for(const child of Array.from(facility.children)){
      if(child!==roof&&(child.localName==='rect'||child.localName==='path'))child.remove();
    }
  }
}

function svgElement(tag,attrs,parent){
  const el=document.createElementNS(SVG_NS,tag);
  for(const [name,value] of Object.entries(attrs))el.setAttribute(name,String(value));
  parent.append(el);
  return el;
}

// Bridges are independent crossings, never homes or graph nodes. The invisible
// hit target and closed-only red marking share the same corrected centerline.
// Open bridges display only the base street, without any overlay.
function decorateBridges(root){
  for(const bridge of root.querySelectorAll('#bridge-layer .bridge-hit')){
    const deck=bridge.querySelector('.bridge-deck');
    if(!deck||bridge.querySelector('.bridge-closure-indicator'))continue;
    const route=BRIDGE_CENTERLINES[bridge.dataset.bridge] ?? deck.getAttribute('d');
    const hitTarget=bridge.querySelector('path[stroke="transparent"]');
    if(hitTarget)hitTarget.setAttribute('d',route);
    deck.setAttribute('d',route);
    const midpoint=deck.getPointAtLength(deck.getTotalLength()/2);
    deck.remove();

    const indicator=svgElement('g',{
      class:'bridge-closure-indicator',
      'aria-hidden':'true',
      'pointer-events':'none'
    },bridge);
    svgElement('path',{
      d:route,
      fill:'none',
      stroke:'#d74642',
      'stroke-width':3,
      'stroke-dasharray':'5 4',
      'stroke-linecap':'butt',
      'pointer-events':'none'
    },indicator);
    svgElement('circle',{
      cx:midpoint.x,cy:midpoint.y,r:8,
      fill:'#d74642',stroke:'#fff','stroke-width':1.8,
      'pointer-events':'none'
    },indicator);
    svgElement('rect',{
      x:midpoint.x-4.6,y:midpoint.y-1.3,
      width:9.2,height:2.6,rx:1.1,
      fill:'#fff','pointer-events':'none'
    },indicator);
  }
}

// finishLandscape() creates the layers synchronously after drawCity(); the
// microtask runs once the reference, facilities and bridge hit targets exist.
export function drawCity(root){
  root.replaceChildren();
  queueMicrotask(()=>{
    extendReferenceMap(root);
    removeUnsitedHomes(root);
    simplifyPublicBuildings(root);
    decorateBridges(root);
    void normalizeReferenceStreets(root);
  });
}
