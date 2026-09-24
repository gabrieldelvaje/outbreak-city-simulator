import {places,bridges,districts,placeColors,placeGlyphs} from './city-data.js';
// Vector tracing of the layout in the user's reference photo, not a replacement invented city.
// Source illustration is square; preserved proportions inside the 1600x900 site viewport.
const NS='http://www.w3.org/2000/svg',X0=346,Y0=10,S=1.245;
const svg=(tag,attrs={},parent)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent?.append(e);return e;};
const path=(d,fill,parent,attrs={})=>svg('path',{d,fill,...attrs},parent);
const rect=(x,y,w,h,fill,parent,attrs={})=>svg('rect',{x,y,width:w,height:h,fill,...attrs},parent);
const line=(d,color,width,parent,attrs={})=>path(d,'none',parent,{stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...attrs});
const text=(s,x,y,parent,cls,attrs={})=>{const t=svg('text',{x,y,class:cls,...attrs},parent);t.textContent=s;return t;};
const rand=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const road=(d,parent,kind='local')=>{const w=kind==='trunk'?6:kind==='arterial'?4.7:2.1;
  line(d,kind==='trunk'?'#e4ae49':kind==='arterial'?'#edbd63':'#d9dfde',w+2.2,parent);
  line(d,kind==='trunk'?'#ffca60':kind==='arterial'?'#ffcf79':'#fff',w,parent);
};
const waterShape=`M277 -36 C286 47 279 137 270 186 C265 223 272 250 307 259 C336 272 364 261 388 267 C438 283 482 345 544 363 C585 376 609 407 589 434 C571 463 511 467 462 479 C385 488 323 483 285 504 C258 520 260 602 230 735 L185 735 C212 646 214 537 242 494 C262 470 319 462 401 454 C486 443 530 426 531 405 C530 384 462 335 416 298 C388 280 358 278 316 277 C268 273 248 243 258 185 C268 113 265 39 247 -36 Z`;
const riverEdgeLeft='M277 -36 C286 47 279 137 270 186 C265 223 272 250 307 259 C336 272 364 261 388 267 C438 283 482 345 544 363 C585 376 609 407 589 434 C571 463 511 467 462 479 C385 488 323 483 285 504 C258 520 260 602 230 735';
const riverEdgeRight='M247 -36 C265 39 268 113 258 185 C248 243 268 273 316 277 C358 278 388 280 416 298 C462 335 530 384 531 405 C530 426 486 443 401 454 C319 462 262 470 242 494 C214 537 212 646 185 735';
const parkShapes=[
'M55 267 Q79 265 105 278 L221 302 L187 329 L145 332 L158 348 L110 379 L78 371 L62 344 Z',
'M290 323 L336 308 L329 350 L378 361 L389 381 L322 381 L285 368 Z',
'M471 192 L567 157 L590 203 L490 246 Z',
'M391 534 L428 523 L451 574 L478 584 L493 650 L382 665 L378 602 Z',
'M13 605 L74 625 L90 682 L0 680 Z'
];
const cityAreas=[
'M0 110 L54 80 L210 110 L249 210 L206 276 L84 265 L0 315 Z',
'M245 -35 L480 -35 L520 145 L427 209 L350 242 L280 204 Z',
'M425 120 L690 51 L723 300 L610 363 L465 323 L383 258 Z',
'M-15 362 L189 350 L276 440 L249 590 L192 718 L-15 718 Z',
'M180 269 L396 237 L567 388 L489 519 L280 560 L123 460 Z',
'M388 452 L721 376 L721 721 L340 721 Z'
];
// Major street axes and river meanders follow the supplied reference image.
const arterials=[
'M-30 228 L22 230 Q47 266 78 298 L253 312 Q264 278 303 252 L427 154 L476 141 L493 -30',
'M-30 379 L143 365 Q207 360 272 380 L345 393 L444 374 L542 351 L591 324 L711 254 L748 254',
'M-28 557 L135 410 L160 373 L187 375',
'M283 -30 L309 92 L305 205',
'M423 -30 L463 130 L466 226 L509 293 L590 324 L694 380 L748 405',
'M690 -30 L691 254 L625 344 L681 377 L625 505 L624 630 L644 749',
'M-30 228 L15 232 L68 296 L74 350 L170 373',
'M214 740 L244 668 L241 557 L256 498',
'M341 741 L332 625 L338 546 L317 503',
'M749 155 L692 153 L592 200 L490 230'
];
const local=[
'M-15 66 L82 104 L215 111 L250 155','M-20 140 L68 169 L205 175 L265 204',
'M20 55 L51 174 L65 264','M61 80 L80 127 L79 260','M92 106 L93 191 L111 265',
'M122 110 L132 204 L151 267','M156 112 L163 211 L189 277',
'M196 124 L197 208 L232 273','M2 266 L67 260 L163 300',
'M120 155 L216 166','M130 209 L239 219',
'M346 -22 L353 126 L385 205','M379 -25 L389 105 L425 177',
'M413 -20 L414 98 L447 152','M455 14 L483 121','M496 9 L528 117 L584 187',
'M332 63 L449 52 L550 12','M341 114 L470 105 L603 70 L720 47',
'M352 172 L438 159 L590 113 L718 100',
'M402 209 L468 191 L567 157 L719 122',
'M480 238 L559 214 L721 180','M510 286 L620 252 L724 223',
'M583 300 L720 310','M614 354 L729 349',
'M-10 406 L139 408 L204 450 L264 500',
'M-10 442 L114 442 L220 482','M-10 482 L98 477 L220 503',
'M-10 519 L105 523 L226 548','M-10 570 L96 567 L214 590',
'M-10 625 L98 615 L206 633','M-10 676 L104 657 L205 689',
'M45 376 L26 498 L52 692','M81 370 L67 465 L82 704',
'M120 397 L105 526 L127 708','M159 414 L141 549 L154 708',
'M192 440 L176 557 L180 711',
'M388 508 L491 484 L617 475 L735 447',
'M378 542 L494 521 L615 515 L737 490',
'M376 578 L515 564 L632 557 L735 534',
'M377 617 L511 607 L625 598 L731 581',
'M375 661 L519 657 L634 641 L731 623',
'M382 703 L516 696 L639 686 L738 672',
'M425 494 L420 735','M472 484 L471 737','M520 477 L520 739',
'M563 467 L559 737','M608 462 L602 735','M669 439 L670 739',
'M200 292 L257 313 L284 390 L264 439',
'M218 309 L192 361 L215 429','M253 316 L227 371 L242 440',
'M390 270 L447 320 L466 366','M411 257 L465 297 L499 351',
'M443 246 L499 290 L548 334',
'M394 412 L466 391 L513 381','M405 444 L487 413',
'M-30 91 L61 21 L153 -35','M-27 596 L45 681 L102 738',
'M96 740 L145 686 L187 648','M552 -30 L584 44 L646 97 L745 137',
'M745 44 L671 65 L622 112'
];
const clusters=[
{x:112,y:147,cols:5,rows:3,dx:31,dy:31,tilt:3},
{x:179,y:255,cols:5,rows:3,dx:15,dy:18,tilt:18},
{x:232,y:302,cols:5,rows:8,dx:18,dy:18,tilt:20},
{x:295,y:273,cols:5,rows:5,dx:18,dy:15,tilt:-5},
{x:380,y:293,cols:5,rows:4,dx:18,dy:16,tilt:-32},
{x:399,y:375,cols:7,rows:4,dx:18,dy:16,tilt:-11},
{x:125,y:411,cols:8,rows:5,dx:17,dy:15,tilt:26},
{x:322,y:528,cols:3,rows:9,dx:21,dy:17,tilt:3},
{x:465,y:90,cols:5,rows:4,dx:21,dy:19,tilt:-22},
{x:513,y:229,cols:6,rows:4,dx:20,dy:20,tilt:-22},
{x:585,y:350,cols:5,rows:5,dx:18,dy:19,tilt:16},
{x:441,y:489,cols:7,rows:5,dx:19,dy:20,tilt:3},
{x:554,y:517,cols:6,rows:5,dx:19,dy:19,tilt:3},
{x:390,y:645,cols:7,rows:4,dx:18,dy:17,tilt:2}
];
const centerline=[[270,-40],[285,80],[279,185],[280,242],[340,270],[394,272],[458,319],[521,371],[563,404],[557,433],[500,456],[410,469],[318,479],[256,498],[236,570],[205,740]];
const waterDist=(x,y)=>{let best=Infinity;for(let i=1;i<centerline.length;i++){const [ax,ay]=centerline[i-1],[bx,by]=centerline[i],dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));best=Math.min(best,Math.hypot(x-ax-dx*t,y-ay-dy*t));}return best;};
const parks=[{x:123,y:327,rx:84,ry:47},{x:339,y:350,rx:49,ry:35},{x:531,y:199,rx:63,ry:43},{x:436,y:598,rx:62,ry:66}];
const cityLot=(x,y)=>x>83&&x<600&&y>95&&y<667;
const isPark=(x,y)=>parks.some(p=>Math.abs(x-p.x)<p.rx&&Math.abs(y-p.y)<p.ry);
function tree(x,y,parent,r=3){svg('circle',{cx:x,cy:y,r:r+1.4,fill:'#a2cb91',opacity:.7},parent);svg('circle',{cx:x-1,cy:y-1,r,fill:'#73aa70'},parent);}
function facility(p,g){const x=(p.x-X0)/S,y=(p.y-Y0)/S,type=p.type;
  const tint={school:'#eaf0f6',market:'#fcf0e1',hospital:'#fceaea',civic:'#e6eff5',office:'#edecfa',park:'#a6d88c'}[type];
  if(type==='park'){path(`M${x-16} ${y-13}l32 -2 5 26 -38 2Z`,'#a6d88c',g);for(const [dx,dy] of [[-10,-5],[10,-8],[-11,8],[9,7]])tree(x+dx,y+dy,g,2.3);line(`M${x-16} ${y+12}L${x+16} ${y-12}`,'#f8faed',2,g);return;}
  rect(x-18,y-15,36,30,tint,g,{rx:1.5,stroke:'#d2d7d2','stroke-width':.65});
  if(type==='school'){rect(x-15,y-12,21,13,'#879eaf',g);rect(x-15,y+3,21,8,'#a8bbc6',g);rect(x+8,y-12,7,23,'#91c5a1',g);line(`M${x+10} ${y-8}h4 M${x+10} ${y-2}h4 M${x+10} ${y+4}h4`,'#f9faf8',.65,g);}
  else if(type==='market'){rect(x-15,y-10,30,16,'#aeb5bb',g);rect(x-15,y-10,30,4,'#d28c54',g);for(const dx of [-11,-4,3,10])rect(x+dx,y-1,5,4,'#e9edf0',g);rect(x-13,y+8,26,3,'#e2d8c6',g);}
  else if(type==='hospital'){rect(x-12,y-12,24,24,'#c1cdd4',g);rect(x-4,y-8,8,16,'#fff',g);rect(x-8,y-4,16,8,'#fff',g);line(`M${x} ${y-7}v14 M${x-7} ${y}h14`,'#d65360',2,g);}
  else if(type==='civic'){rect(x-13,y-9,26,17,'#a6b8c9',g);path(`M${x-16} ${y-10}l16 -7 16 7Z`,'#8198b1',g);for(const dx of [-8,0,8])rect(x+dx-1.5,y-6,3,11,'#edf3f4',g);line(`M${x-15} ${y+10}h30`,'#a0b1bf',2,g);}
  else{rect(x-15,y-12,11,25,'#a8b4c5',g);rect(x-1,y-15,16,28,'#98a5bc',g);for(const dx of [-12,-8,-4,2,7,12])for(const dy of [-8,-2,4])rect(x+dx,y+dy,2.2,2.2,'#e7eff2',g);}
}
export function finishLandscape(root){
  root.replaceChildren();
  rect(-360,-180,2320,1320,'#dbeacb',root);
  const rural=svg('g',{'aria-hidden':true},root),r=rand(60178);
  // Only the outer countryside is decorative; the mapped city preserves source proportions.
  for(let i=0;i<44;i++){const x=-300+(i%9)*242+(r()-.5)*45,y=-160+Math.floor(i/9)*240+(r()-.5)*36,w=132+r()*110,h=92+r()*130;rect(x,y,w,h,['#e1edcc','#d6e6ba','#e9ebcc','#cae0b9'][i%4],rural,{opacity:.52,rx:8});}
  for(let i=0;i<135;i++){const x=-330+r()*2250,y=-155+r()*1220;if(x>X0-45&&x<X0+S*765&&y>-40&&y<940)continue;tree(x,y,rural,1.6+r()*2.3);}
  const map=svg('g',{transform:`translate(${X0} ${Y0}) scale(${S})`},root);
  rect(-10,-35,740,775,'#dcebcf',map);
  for(const d of cityAreas)path(d,'#f1f2ee',map,{stroke:'#e1e6e0','stroke-width':.6});
  for(const d of parkShapes)path(d,'#acdc80',map,{stroke:'#a9d18d','stroke-width':1});
  const parkWalks=svg('g',{'aria-hidden':true},map);
  for(const d of ['M64 291L191 331','M84 349L188 294','M302 367L335 319','M307 337L370 373','M400 641L472 546','M398 559L475 622','M487 207L574 171'])line(d,'#e7f5d0',1.5,parkWalks);
  for(let i=0;i<200;i++){const x=r()*720,y=r()*700;if(isPark(x,y)&&r()<.85)tree(x,y,parkWalks,1+r()*2.2);}
  const minor=svg('g',{'aria-hidden':true},map);
  for(const d of local)road(d,minor);
  const fan=svg('g',{'aria-hidden':true},map);
  for(let i=0;i<12;i++){
    const a=(i-7)*.145,x1=297+Math.sin(a)*29,y1=321+Math.cos(a)*17,x2=300+Math.sin(a)*210;
    let y2=321+Math.cos(a)*160;if(y2>478)y2=478;
    road(`M${x1.toFixed(1)} ${y1.toFixed(1)}Q${(x1+x2)/2} ${(y1+y2)/2+13} ${x2.toFixed(1)} ${y2.toFixed(1)}`,fan);
  }
  for(const d of ['M188 349Q294 381 401 351','M167 383Q293 419 466 396','M138 415Q299 465 481 435','M165 447Q300 496 451 465'])road(d,fan);
  const footprints=svg('g',{'aria-hidden':true},map),lotR=rand(8791),occupied=[];
  for(const c of clusters)for(let row=0;row<c.rows;row++)for(let col=0;col<c.cols;col++){
    if(lotR()<.17)continue;
    const x=c.x+col*c.dx+(lotR()-.5)*4,y=c.y+row*c.dy+(lotR()-.5)*4;
    if(waterDist(x,y)<36||isPark(x,y)||!cityLot(x,y))continue;
    if(places.some(p=>Math.hypot((p.x-X0)/S-x,(p.y-Y0)/S-y)<22))continue;
    const w=7+lotR()*7,h=6+lotR()*8;
    rect(x-w/2,y-h/2,w,h,lotR()<.21?'#d6dce0':'#bbc6cc',footprints,{rx:.6,transform:`rotate(${c.tilt} ${x} ${y})`,stroke:'#b1bcc2','stroke-width':.55});
    occupied.push([x,y]);
  }
  const sites=svg('g',{'aria-hidden':true},map);
  for(const p of places)facility(p,sites);
  const highways=svg('g',{'aria-hidden':true},map);
  for(const d of arterials)road(d,highways,'arterial');
  // An opaque channel masks conventional roads; only named crossings overlay the water.
  const bank=svg('g',{'aria-hidden':true},map);
  line(riverEdgeLeft,'#9dd09b',12,bank);line(riverEdgeRight,'#9dd09b',12,bank);
  path(waterShape,'#70c3eb',bank,{stroke:'#9bd5dc','stroke-width':1});
  line(riverEdgeLeft,'#8dd19d',4,bank);line(riverEdgeRight,'#8dd19d',4,bank);
  const bridgePaths={'ponte-norte':'M268 266 L341 218','ponte-central':'M478 365 L563 337','ponte-sul':'M204 486 L260 522'};
  const crossings=svg('g',{id:'bridge-layer'},map);
  for(const b of bridges){const d=bridgePaths[b.id],g=svg('g',{class:'bridge-hit','data-bridge':b.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${b.name}`},crossings);if(!d)continue;
    line(d,'#d1b46e',10,g);line(d,'#ffd16c',7,g,{class:'bridge-deck'});
    const bx=(b.x-X0)/S,by=(b.y-Y0)/S;svg('circle',{cx:bx,cy:by,r:15,fill:'transparent'},g);
    text(b.name,bx+16,by-10,g,'bridge-label',{'font-size':8,'paint-order':'stroke','stroke':'white','stroke-width':2.5});
  }
  const homes=svg('g',{id:'homes-layer'},map);let homeCount=0;
  for(const [x,y] of occupied){if(homeCount>=230)break;if(lotR()<.3)continue;
    let nearest=1e9;for(const p of places)nearest=Math.min(nearest,Math.hypot(x-(p.x-X0)/S,y-(p.y-Y0)/S));if(nearest<24)continue;
    homeCount++;
    const region=y<310?(x<340?'norte-verde':x<520?'jardim-do-rio':'vale-do-sol'):(x<230?'vila-industrial':x<390?'centro-civico':x<540?'parque-leste':'colinas-do-sul');
    const g=svg('g',{class:'home-node','data-home':`casa-${String(homeCount).padStart(3,'0')}`,'data-region':region,role:'button',tabindex:0,'aria-label':`Inspecionar residência ${homeCount}`},homes);
    svg('circle',{cx:x,cy:y,r:3.3,fill:'#418b65',stroke:'#fff','stroke-width':1.1},g);
    svg('circle',{cx:x,cy:y,r:8,fill:'transparent'},g);
  }
  const flows=svg('g',{id:'flows-layer',class:'map-layer-hidden'},map);
  for(const b of bridges){const d=bridgePaths[b.id];if(d)line(d,'#377ed0',2.2,flows,{class:'flow','data-flow-bridge':b.id});}
  const names=svg('g',{'aria-hidden':true},map);
  for(const d of districts){const x=(d.x-X0)/S,y=(d.y-Y0)/S;text(d.name,x,y,names,'district-label',{'text-anchor':'middle','font-size':10,'stroke-width':2.5});}
  text('RIO CENTRAL',442,421,names,'river-label',{'font-size':11,'letter-spacing':3,'text-anchor':'middle',transform:'rotate(-13 442 421)'});
  const hubs=svg('g',{id:'places-layer'},map);
  for(const p of places){const x=(p.x-X0)/S,y=(p.y-Y0)/S;
    const g=svg('g',{class:'map-place','data-place':p.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${p.name}`},hubs);
    rect(x-20,y-19,40,40,'transparent',g,{rx:2});
    svg('circle',{cx:x,cy:y-4,r:9,fill:placeColors[p.type],stroke:'#fff','stroke-width':2,class:'place-bubble'},g);
    text(placeGlyphs[p.type],x,y-.7,g,'',{'text-anchor':'middle',fill:'white','font-size':9,'font-weight':800});
    text({school:'Escola',market:'Mercado',hospital:'Hospital',civic:'Prefeitura',office:'Empresa',park:'Praça'}[p.type],x,y+18,g,'place-label',{'text-anchor':'middle','font-size':8});
  }
  return {homeCount};
}