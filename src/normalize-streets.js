// Refine the source SVG without changing the city's buildings, interactive nodes or streets.
// Inlining lets us remove six white dead-end fragments from the source itself;
// the original image remains in place if loading/parsing is unsuccessful.
const NS='http://www.w3.org/2000/svg';
const CORE_STREET_EDGE_WIDTH=1.6;
const AVENUE_COLOR='#f4ba3e';
const AVENUE_WIDTH=5.6;

// Palette based on the supplied Google Maps light-mode references. Change only
// the paint of existing map surfaces; never modify paths, nodes or interactions.
const MAP_PALETTE={
  '#e5e5e5':'#f7f8fa', // built-up land
  '#fff87b':'#f4f8f9', // riverbanks
  '#74cbec':'#a9e4f3', // water
  '#a0dd3c':'#d5f6e4', // parks
  '#f8f8f8':'#ffffff', // local streets
  '#c1c1c1':'#e6e9ee', // building footprints
  '#f4ba3e':'#a8b9cc', // main roads and avenue joins
  '#dceacb':'#d9f7e6', // surrounding green areas
  '#f9faf8':'#ffffff'  // peripheral streets
};
function recolorMapSurface(root){
  if(!root)return;
  for(const item of [root,...root.querySelectorAll('[fill],[stroke]')]){
    for(const attribute of ['fill','stroke']){
      const original=item.getAttribute(attribute)?.toLowerCase();
      if(original && MAP_PALETTE[original]){
        // Keep original attributes intact so existing CSS map selectors still work.
        item.style.setProperty(attribute,MAP_PALETTE[original]);
      }
    }
  }
}

// These six isolated subpaths are the white stubs crossing the eastern edge
// (top to bottom) marked in red on the reference screenshot. Do not touch
// any of the connected residential streets further inside the source image.
const WHITE_EDGE_STUBS=/M(?:739,(?:21|80|186|317)|675,465|647,515)[^M]*?Z/g;

// A source SVG image clips the continuation to the outside of its square,
// leaving a hairline at the boundary. These short paths bridge the original
// colored avenue and its extension at the same visual width, on top of both.
const AVENUE_SEAMS=[
  'M-18 162L1 163L14 164L22 181',     // west, northern avenue
  'M-16 381L1 380L17 379',           // west, central avenue
  'M-17 561L1 553L23 537',          // west, southwestern avenue
  'M722 253L740 252L758 251',       // east, northern avenue
  'M724 400L741 406L760 411'       // east, southeastern avenue
];

function restoreAvenueSeams(frame){
  if(frame.querySelector('#avenue-seams'))return;
  const seams=document.createElementNS(NS,'g');
  seams.setAttribute('id','avenue-seams');
  seams.setAttribute('aria-hidden','true');
  seams.setAttribute('pointer-events','none');
  for(const d of AVENUE_SEAMS){
    const road=document.createElementNS(NS,'path');
    for(const [key,value] of Object.entries({d,fill:'none',stroke:AVENUE_COLOR,
      'stroke-width':AVENUE_WIDTH,'stroke-linecap':'round','stroke-linejoin':'round'})){
      road.setAttribute(key,String(value));
    }
    seams.append(road);
  }
  // Above the base map and below the graph nodes and their hit areas.
  frame.insertBefore(seams,frame.querySelector('#homes-layer'));
}

export async function normalizeReferenceStreets(world){
  const frame=world.querySelector('#reference-city');
  const image=frame?.querySelector('image[href*="city-reference.svg"]');
  if(!image)return;
  try{
    const url=new URL('../assets/city-reference.svg',import.meta.url);
    const response=await fetch(url);
    if(!response.ok)throw new Error(`Reference SVG HTTP ${response.status}`);
    const source=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
    const original=source.documentElement;
    if(original.namespaceURI!==NS||original.localName!=='svg'||source.querySelector('parsererror'))throw new Error('Invalid reference SVG');
    const inline=document.importNode(original,true);
    inline.setAttribute('x','0');inline.setAttribute('y','0');
    inline.setAttribute('width','740');inline.setAttribute('height','740');
    inline.setAttribute('pointer-events','none');
    inline.setAttribute('aria-hidden','true');
    inline.setAttribute('data-map-base','true');
    for(const road of inline.querySelectorAll('path[fill="#f8f8f8"]')){
      // Exact source subpaths; no opaque masks over the avenues or parks.
      road.setAttribute('d',road.getAttribute('d').replace(WHITE_EDGE_STUBS,''));
      road.setAttribute('stroke','#f8f8f8');
      road.setAttribute('stroke-width',String(CORE_STREET_EDGE_WIDTH));
      road.setAttribute('stroke-linecap','round');
      road.setAttribute('stroke-linejoin','round');
      // Google Maps-like light-blue outlines keep white residential streets legible.
      road.style.setProperty('stroke','#d3dce7');
    }
    if(image.isConnected){
      image.replaceWith(inline);
      restoreAvenueSeams(frame);
      // Repaint the original artwork, its existing street extensions and the
      // surrounding terrain; leave all houses, hubs, controls and layout alone.
      recolorMapSurface(inline);
      recolorMapSurface(frame.querySelector('#map-continuations'));
      recolorMapSurface(frame.querySelector('#avenue-seams'));
      recolorMapSurface(world.firstElementChild);
      recolorMapSurface(world.querySelector(':scope > g[aria-hidden="true"]'));
    }
  }catch(error){
    console.warn('OUTBREAK: original map preserved; street-edge refinement unavailable.',error);
  }
}
