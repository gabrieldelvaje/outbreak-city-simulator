// Normalize the thin white street geometry in the original 740x740 vector map.
// The outer streets already use a shared width in map-extensions.js. The core
// image must be inlined first because CSS cannot reach paths inside <image>.
// Keep the original image visible if fetch/parsing fails so the map never blanks.
const NS='http://www.w3.org/2000/svg';
const CORE_STREET_EDGE_WIDTH=1.6;

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
    inline.setAttribute('pointer-events','none');inline.setAttribute('aria-hidden','true');
    inline.setAttribute('data-map-base','true');
    // The old source uses a single multi-segment pale-white path for the roads.
    // A small uniform edge stroke restores otherwise disappearing thin streets.
    // Do not recolor the base or alter its road topology, parks or buildings.
    for(const road of inline.querySelectorAll('path[fill="#f8f8f8"]')){
      road.setAttribute('stroke','#f8f8f8');
      road.setAttribute('stroke-width',String(CORE_STREET_EDGE_WIDTH));
      road.setAttribute('stroke-linecap','round');
      road.setAttribute('stroke-linejoin','round');
    }
    if(image.isConnected)image.replaceWith(inline);
  }catch(error){
    console.warn('OUTBREAK: original map preserved; street normalization unavailable.',error);
  }
}
