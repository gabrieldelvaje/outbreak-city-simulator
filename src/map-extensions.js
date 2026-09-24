// Non-interactive continuations outside the exact 740 × 740 SVG reference.
// Coordinates are in the original map coordinate system, never in screen pixels.
const NS='http://www.w3.org/2000/svg';
const C={ground:'#e5e5e5',road:'#f4ba3e',minor:'#f8f8f8',water:'#74cbec',bank:'#fff87b',field:'#dceacb'};
const LOCAL_STREET_WIDTH=2.8; // One consistent width for every white peripheral street.
const node=(name,attrs,parent)=>{const el=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));parent.append(el);return el;};
const shape=(parent,d,fill)=>node('path',{d,fill},parent);
const street=(parent,d)=>node('path',{d,fill:'none',stroke:C.minor,'stroke-width':LOCAL_STREET_WIDTH,'stroke-linecap':'round','stroke-linejoin':'round'},parent);
const avenue=(parent,d,width=5.8)=>node('path',{d,fill:'none',stroke:C.road,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'},parent);

export function extendReferenceMap(world){
 const frame=world.querySelector('#reference-city');
 if(!frame || frame.querySelector('#map-continuations'))return;
 // The unbuilt surroundings are countryside, not a limitless gray rectangle.
 const backdrop=world.firstElementChild;
 if(backdrop?.localName==='rect')backdrop.setAttribute('fill',C.field);
 const underlay=node('g',{id:'map-continuations','aria-hidden':'true','pointer-events':'none'},frame);
 frame.prepend(underlay);
 node('rect',{x:-500,y:-180,width:1800,height:1120,fill:C.field},underlay);
 // Built-up territory follows the outer street network. A single contiguous,
 // asymmetric footprint avoids the original square of gray in the zoomed-out view.
 shape(underlay,'M-85 112L-54 52 8 22 74 -18 180 -25 246 -46 335 -39 421 -53 518 -20 617 -15 699 -33 787 19 808 111 826 180 831 276 864 353 836 446 806 508 797 604 817 707 765 785 664 798 596 825 503 802 434 820 341 793 269 826 182 790 98 807 8 757 -60 725 -84 642 -105 554 -79 469 -109 407 -91 313 -121 238 -108 163Z',C.ground);
 // The user-supplied reference remains the foreground. Only beyond its edges
 // are river, highways and peripheral streets continued.
 shape(underlay,'M250 -180C253 -124 263 -57 270 0L341 0C328 -61 325 -126 324 -180Z',C.bank);
 shape(underlay,'M270 -180C272 -117 277 -53 285 1L312 1C303 -57 300 -123 301 -180Z',C.water);
 shape(underlay,'M185 738L276 738C268 777 258 832 251 893L106 893C128 835 160 785 185 738Z',C.bank);
 shape(underlay,'M196 737L225 737C215 792 195 847 177 893L145 893C162 843 184 786 196 737Z',C.water);
 for(const [d,w] of [
  ['M-500 135Q-245 144 0 163',5.5],
  ['M-500 389Q-245 392 0 380',5.5],
  ['M-500 835Q-210 652 0 553',5.7],
  ['M432 -180Q426 -86 432 0',5.7],
  ['M685 -180Q692 -96 700 0',5.8],
  ['M740 252Q990 240 1300 208',5.7],
  ['M740 405Q1000 482 1300 535',5.7],
  ['M664 739Q677 817 694 940',5.7]
 ])avenue(underlay,d,w);
 // Every white continuation uses LOCAL_STREET_WIDTH. The yellow arterials retain their hierarchy.
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
 ])street(underlay,d);
}
