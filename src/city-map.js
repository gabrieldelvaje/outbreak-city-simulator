import {extendReferenceMap} from './map-extensions.js';
import {normalizeReferenceStreets} from './normalize-streets.js';

// Keep the original home IDs stable; these markers do not sit on residential roofs.
const UNSITED_HOME_IDS=[21,29,30,31,32,75,109,151,152,155,157,159];
const SVG_NS='http://www.w3.org/2000/svg';

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

// Bridges are crossings, not residential/graph nodes. While open, show only
// the cartographic bridge already in the city SVG: no additional white line.
// When closed, show a centered dashed red line and a no-entry badge. The
// existing invisible path remains clickable and the existing bridge controls
// continue to toggle the 'bridge-closed' class on each crossing.
function decorateBridges(root){
  for(const bridge of root.querySelectorAll('#bridge-layer .bridge-hit')){
    const deck=bridge.querySelector('.bridge-deck');
    if(!deck||bridge.querySelector('.bridge-closure-indicator'))continue;
    const route=deck.getAttribute('d');
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

// finishLandscape() creates all SVG layers synchronously after drawCity().
// Once the current JavaScript turn ends, decorate the existing bridge paths.
export function drawCity(root){
  root.replaceChildren();
  queueMicrotask(()=>{
    extendReferenceMap(root);
    removeUnsitedHomes(root);
    decorateBridges(root);
    void normalizeReferenceStreets(root);
  });
}
