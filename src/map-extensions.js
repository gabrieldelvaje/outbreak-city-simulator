// Extends the supplied 740 x 740 reference map WITHOUT redrawing its interactive core.
// All coordinates below are in the original illustration's SVG coordinate system.
// This underlay must precede the opaque source image in #reference-city.
const NS = 'http://www.w3.org/2000/svg';
const C = { ground:'#e5e5e5', road:'#f4ba3e', minor:'#f8f8f8', water:'#74cbec', bank:'#fff87b', field:'#dceacb' };
const node = (name, attrs, parent) => {
  const el=document.createElementNS(NS,name);
  for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,String(value));
  parent.append(el);
  return el;
};
const shape = (parent,d,fill) => node('path',{d,fill},parent);
const street = (parent,d,width=2) => node('path',{d,fill:'none',stroke:C.minor,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'},parent);
const avenue = (parent,d,width=5.8) => node('path',{d,fill:'none',stroke:C.road,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'},parent);

export function extendReferenceMap(world){
  const frame=world.querySelector('#reference-city');
  if(!frame || frame.querySelector('#map-continuations')) return;
  const underlay=document.createElementNS(NS,'g');
  underlay.setAttribute('id','map-continuations');
  underlay.setAttribute('aria-hidden','true');
  underlay.setAttribute('pointer-events','none');
  frame.prepend(underlay);
  node('rect',{x:-500,y:-180,width:1800,height:1120,fill:C.ground},underlay);
  // Irregular rural edge: roads may continue into the countryside, but no graph nodes do.
  for(const d of [
    'M-500 -180H-120L-90 -132 -42 -135 4 -84 -28 -23 -94 32 -160 72 -242 76 -500 142Z',
    'M770 -180H1300V50L1224 77 1150 41 1105 -12 1036 -15 977 -66 862 -66Z',
    'M-500 770L-305 734 -210 763 -100 745 -30 802 50 825 100 940H-500Z',
    'M1300 675V940H800L850 884 920 837 985 856 1053 795 1122 797 1200 733Z'
  ]) shape(underlay,d,C.field);
  // The reference river enters at x285..312 along the TOP and leaves at x196..225 at the BOTTOM.
  // Extend its two banks and water in a continuous contour beyond both source edges.
  shape(underlay,'M250 -180C253 -124 263 -57 270 0L341 0C328 -61 325 -126 324 -180Z',C.bank);
  shape(underlay,'M270 -180C272 -117 277 -53 285 1L312 1C303 -57 300 -123 301 -180Z',C.water);
  shape(underlay,'M185 738L276 738C268 777 258 832 251 893L106 893C128 835 160 785 185 738Z',C.bank);
  shape(underlay,'M196 737L225 737C215 792 195 847 177 893L145 893C162 843 184 786 196 737Z',C.water);
  // The six arterial links coincide with the GOLDEN roads at the edges of the reference.
  // Their original sections remain untouched because city-reference.svg is drawn above this group.
  for(const [d,w] of [
    ['M-500 135Q-245 144 0 163',5.5],
    ['M-500 389Q-245 392 0 380',5.5],
    ['M-500 835Q-210 652 0 553',5.7],
    ['M432 -180Q426 -86 432 0',5.7],
    ['M685 -180Q692 -96 700 0',5.8],
    ['M740 252Q990 240 1300 208',5.7],
    ['M740 405Q1000 482 1300 535',5.7],
    ['M664 739Q677 817 694 940',5.7]
  ]) avenue(underlay,d,w);
  // Minor roads continue at existing endpoints rather than cutting across the source blocks.
  for(const d of [
    'M-500 -100L-335 -68 -162 -31 0 8',
    'M-500 -35L-285 8 -132 41 0 95',
    'M-500 85L-283 127 -125 181 0 217',
    'M-500 225L-250 247 -100 260 0 274',
    'M-500 470L-260 456 -110 470 0 503',
    'M-500 603L-250 600 -118 592 0 584',
    'M-500 717L-278 707 -105 716 0 724',
    'M740 22L930 11 1115 -8 1300 -33',
    'M740 80L943 73 1111 60 1300 36',
    'M740 186L936 165 1125 141 1300 114',
    'M740 317L910 327 1090 338 1300 365',
    'M740 471L920 488 1124 495 1300 513',
    'M740 532L918 549 1090 580 1300 615',
    'M42 0L-30 -70 -100 -180',
    'M179 0L139 -55 92 -125 60 -180',
    'M246 0L239 -58 220 -124 199 -180',
    'M527 0L558 -63 583 -123 612 -180',
    'M50 739L19 805 -13 860 -45 940',
    'M320 739L320 808 311 876 303 940',
    'M391 739L407 797 419 861 434 940',
    'M532 739L553 806 575 878 589 940'
  ]) street(underlay,d);
}
