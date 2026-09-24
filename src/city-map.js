import {extendReferenceMap} from './map-extensions.js';
import {normalizeReferenceStreets} from './normalize-streets.js';

// Keep home IDs stable. These markers do not sit on residential roofs; houses
// 20 and 63 were the green dots drawn directly on the north and central bridges.
const UNSITED_HOME_IDS=[20,21,29,30,31,32,63,75,109,151,152,155,157,159];
const SVG_NS='http://www.w3.org/2000/svg';

// Each centerline follows the actual street axis of the supplied vector map.
// The north road runs from (264,260) to (389,186); the central avenue runs
// through (448,378), (535,354) and (593,338). The south bridge follows the
// narrow north/south white road. Keep the closure within each crossing.
const BRIDGE_CENTERLINES={
  'ponte-norte':'M295 241.6L338 216.2',
  'ponte-central':'M501 363.4L563 346.2',
  'ponte-sul':'M352 489L359 532'
};

function removeUnsitedHomes(root){
  const homes=root.querySelector('#homes-layer');
  if(!homes)return;
  for(const id of UNSITED_HOME_IDS){
    homes.querySelector(`[data-home="casa-${String(id).padStart(3,'0')}"]`)?.remove();
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
    decorateBridges(root);
    void normalizeReferenceStreets(root);
  });
}
