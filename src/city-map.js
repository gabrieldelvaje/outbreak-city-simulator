import {extendReferenceMap} from './map-extensions.js';
import {normalizeReferenceStreets} from './normalize-streets.js';
import {places,placeColors} from './city-data.js';

// Keep home IDs stable. These markers do not sit on residential roofs; houses
// 20 and 63 were the green dots drawn directly on the north and central bridges.
const UNSITED_HOME_IDS=[20,21,29,30,31,32,63,75,109,151,152,155,157,159];
const SVG_NS='http://www.w3.org/2000/svg';

// Coordinates follow the visible axes of the existing avenues in the original
// 740x740 SVG. The south route follows its narrower white bridge instead.
// The invisible hit target and red marking always use the same centerline.
const BRIDGE_CENTERLINES={
  'ponte-norte':'M297 249L341 223',
  'ponte-central':'M500 367.5L566 348.7',
  'ponte-sul':'M354 487.5L356.5 535.5'
};

// Exact contours of the ten EXISTING gray roofs in assets/city-reference.svg.
// Unlike the former siteBox rectangles, these silhouettes do not extend into
// neighboring roads, other buildings or river banks. Never scale these paths.
const ORIGINAL_ROOF_PATHS={
  'escola-norte':'M187,188 186,207 215,208 215,189Z',
  'mercado-norte':'M150,242 145,260 173,267 177,249Z',
  'escola-rio':'M552,240 541,245 550,265 561,260Z',
  'mercado-rio':'M612,286 600,291 608,310 620,305Z',
  'hospital-central':'M543,515 542,517 548,581 549,583 576,583 570,516Z',
  'prefeitura':'M476,532 475,535 480,584 508,584 503,533Z',
  'fabrica-oeste':'M338,568 353,607 375,607 357,563 354,562Z',
  'escola-industrial':'M327,650 327,665 367,664 366,650Z',
  'centro-empresarial':'M593,556 593,568 599,573 609,573 613,571 617,563 629,564 629,560 616,561 614,554 606,550 599,551Z',
  'escola-colinas':'M542,113 539,113 530,118 539,137 549,132Z'
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

// Recolor ONLY each building's original roof footprint. The base gray remains
// visible through a semi-transparent tint; all interior decorative rectangles
// are removed. Keep the existing graph bubble, text label and click behavior.
function simplifyPublicBuildings(root){
  const typeById=new Map(places.map(place=>[place.id,place.type]));
  for(const facility of root.querySelectorAll('#places-layer .map-place')){
    const type=typeById.get(facility.dataset.place);
    const contour=ORIGINAL_ROOF_PATHS[facility.dataset.place];
    if(!type||type==='park'||!contour)continue;
    const oldRoof=Array.from(facility.children).find(child=>child.localName==='rect');
    if(!oldRoof)continue;
    const roof=svgElement('path',{
      d:contour,
      fill:placeColors[type]??'#607a98',
      'fill-opacity':'.53',
      stroke:'none',
      'pointer-events':'none'
    },facility);
    oldRoof.replaceWith(roof);
    for(const child of Array.from(facility.children)){
      if(child!==roof&&(child.localName==='rect'||child.localName==='path'))child.remove();
    }
  }
}

// Bridges are independent crossings, never homes or graph nodes. The invisible
// hit target and closed-only red marking share the same corrected centerline.
// Open bridges display only the base street, without any overlay.
function decorateBridges(root){
  for(const bridge of root.querySelectorAll('#bridge-layer .bridge-hit')){
    const deck=bridge.querySelector('.bridge-deck');
    if(!deck||bridge.querySelector('.bridge-closure-indicator'))continue;
    const route=BRIDGE_CENTERLINES[bridge.dataset.bridge]??deck.getAttribute('d');
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
