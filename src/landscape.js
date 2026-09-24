import {places, bridges, districts, placeColors, placeGlyphs} from './city-data.js';
// OUTBREAK: tracing of the user-supplied flat city map, using original artwork as geometric reference.
// All drawn primitives are SVG. The supplied photo is NOT embedded as a raster background.
const NS='http://www.w3.org/2000/svg', OX=346, OY=10, K=1.75078125;
const E=(tag,a={},parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(a))n.setAttribute(k,String(v));parent?.append(n);return n;};
const P=(d,fill,parent,attr={})=>E('path',{d,fill,...attr},parent);
const R=(x,y,w,h,fill,parent,attr={})=>E('rect',{x,y,width:w,height:h,fill,...attr},parent);
const L=(d,c,w,parent,attr={})=>P(d,'none',parent,{stroke:c,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round',...attr});
const T=(value,x,y,parent,klass,attr={})=>{const t=E('text',{x,y,class:klass,...attr},parent);t.textContent=value;return t;};
const RNG=(seed)=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const COORD=p=>[(p.x-OX)/K,(p.y-OY)/K];
const W='M192 -14 L219 -14 C231 43 227 106 226 139 C224 167 236 176 265 171 C293 167 315 176 341 201 C380 236 424 266 426 302 C431 329 412 343 380 349 C335 361 270 368 213 383 C185 390 174 407 166 440 L139 528 L104 528 L136 427 C147 389 159 369 197 358 C246 340 303 333 340 317 C360 307 362 296 346 281 C324 254 309 228 281 213 C260 200 245 199 225 200 C188 201 185 180 191 139 C197 96 202 44 187 -14 Z';
const PARKS=[
 'M32 185 Q45 177 64 181 L155 214 L164 228 L123 227 L144 238 L82 253 L40 248 L27 218 Z',
 'M18 264 L102 253 L114 272 L92 291 L43 292 Z',
 'M208 223 L256 213 L254 247 L281 255 L284 266 L222 277 L204 264 Z',
 'M339 129 L399 100 L415 156 L340 179 Z',
 'M269 380 L297 374 L321 412 L325 424 L360 422 L365 484 L262 484 L265 432 L280 415 Z'
];
const ARTERIAL=[
 'M-20 102 L15 153 Q37 181 45 186 Q74 179 105 187 L175 201 L189 153 L305 99 L315 -20',
 'M-20 264 L85 263 L163 255 Q191 262 224 276 L238 282 L351 259 L423 239 L513 178',
 'M-20 373 L102 272 L126 252',
 'M304 -22 L322 55 L328 104 L330 168 L370 222 L425 255 L515 282',
 'M477 -20 L482 177 L423 239 L495 278',
 'M516 172 L458 207 L423 239',
 'M515 282 L480 352 L462 381 L463 428 L470 532',
 'M-20 264 L87 263 L111 257 L132 250 L176 254',
 'M-20 106 L11 151',
 'M-20 370 L100 278 L126 251'
];
const LOCAL=[
 'M19 20 L71 54 L120 68 L171 75', 'M40 -10 L73 60 L92 108 L104 169',
 'M58 49 L57 105 L77 126 L74 165', 'M86 73 L87 115 L103 129 L101 170',
 'M115 75 L115 115 L136 138 L134 182','M145 78 L144 106 L169 134',
 'M29 108 L63 109 L111 132 L177 139','M55 153 L111 151 L172 160',
 'M244 25 L303 6 L349 -16','M245 64 L286 43 L335 18 L432 8',
 'M254 94 L307 75 L360 51 L443 42','M265 131 L318 106 L376 82 L449 65',
 'M273 169 L316 149 L346 125 L425 96','M345 148 L406 116 L512 85',
 'M339 178 L416 153 L478 134 L515 124','M352 195 L421 172 L515 160',
 'M371 217 L424 198 L515 183','M429 255 L472 239 L515 216',
 'M358 20 L365 75 L375 115','M400 6 L414 62 L434 114','M441 11 L445 69 L456 136',
 'M284 49 L300 94 L319 135','M304 9 L332 62 L350 110',
 'M180 193 L178 224 L157 254','M191 195 L197 231 L179 266','M203 195 L216 236 L204 271',
 'M214 191 L234 225 L239 278','M225 189 L258 222 L264 277','M237 190 L281 226 L288 278',
 'M251 194 L307 226 L311 272','M264 197 L328 232 L335 262',
 'M177 220 L232 235 L292 244','M165 243 L217 258 L308 268',
 'M144 275 L208 294 L321 301','M131 297 L211 314 L345 314',
 'M115 321 L210 335 L326 339','M103 342 L189 355 L278 361',
 'M86 298 L123 353 L174 383','M100 286 L152 337 L189 378',
 'M124 268 L177 326 L213 373','M148 260 L191 315 L239 366',
 'M172 254 L218 314 L263 362','M208 258 L249 306 L290 351',
 'M243 280 L280 319 L314 346','M272 283 L304 310 L339 337',
 'M296 187 L339 198 L384 224','M308 212 L359 223 L406 247',
 'M330 239 L380 253','M304 257 L353 266','M294 285 L355 294',
 'M327 178 L316 239 L301 267','M348 195 L344 248 L325 280',
 'M365 205 L363 244 L346 277','M381 218 L391 251 L368 281',
 'M432 270 L472 284 L507 303','M425 288 L468 303 L497 318',
 'M427 310 L463 326 L495 338','M425 332 L457 350 L482 357',
 'M451 256 L438 290 L429 331','M474 275 L457 302 L448 339',
 'M-12 319 L40 327 L89 345','M-12 345 L44 357 L87 374',
 'M-9 385 L62 404 L119 410','M-8 411 L61 431 L106 432',
 'M4 441 L59 458 L90 451','M11 474 L52 483 L76 471',
 'M25 312 L18 362 L37 408','M50 326 L44 370 L63 417',
 'M78 335 L71 385 L82 427','M107 354 L95 393 L101 437',
 'M136 375 L116 412 L125 447','M155 386 L140 421 L153 450',
 'M239 367 L256 424 L251 513','M262 373 L280 432 L279 515',
 'M288 370 L309 410 L311 516','M316 366 L327 410 L341 515',
 'M210 409 L300 393 L394 374','M203 429 L309 410 L420 388',
 'M201 456 L302 436 L438 416',
 'M258 500 L335 484 L433 471 L490 449','M272 531 L353 515 L456 496',
 'M261 567 L361 551 L467 533','M260 612 L359 590 L468 571',
 'M272 650 L361 632 L479 609','M275 691 L375 676 L495 657',
 'M333 499 L335 696','M377 493 L378 697','M414 477 L416 699',
 'M434 401 L463 430','M483 410 L490 507','M425 481 L428 533',
 'M-20 500 L65 452 L109 421','M-20 447 L54 428 L84 406',
 'M516 70 L482 92 L453 110','M516 336 L470 349 L433 367'
];
function pointLineDistance(x,y,points){let best=1e6;for(let i=1;i<points.length;i++){let [ax,ay]=points[i-1],[bx,by]=points[i],dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));best=Math.min(best,Math.hypot(x-ax-dx*t,y-ay-dy*t));}return best;}
const riverAxis=[[205,-10],[212,80],[205,148],[221,183],[260,190],[290,202],[333,240],[376,280],[400,310],[380,329],[301,349],[219,372],[167,395],[154,439],[118,519]];
const insidePark=(x,y)=>[[94,219,65,28],[66,276,48,18],[242,245,43,29],[377,142,45,42],[309,436,58,60]].some(([a,b,w,h])=>Math.abs(x-a)<w&&Math.abs(y-b)<h);
const noBuilding=(x,y)=>pointLineDistance(x,y,riverAxis)<29||insidePark(x,y)||places.some(p=>{const[a,b]=COORD(p);return Math.hypot(a-x,b-y)<16;});
function facility(p,g){const[x,y]=COORD(p),c={school:'#e4edf2',market:'#f9eee1',hospital:'#f9e9ea',civic:'#e9eef3',office:'#e9e7f0',park:'#a7d66d'}[p.type];if(p.type==='park')return;
 R(x-13,y-12,26,24,c,g,{rx:.5,stroke:'#c8cbcf','stroke-width':.7});
 if(p.type==='school'){R(x-11,y-10,15,14,'#95a7b2',g);R(x+6,y-10,5,20,'#92bf8d',g);R(x-11,y+6,15,4,'#c4d4d9',g);}
 else if(p.type==='market'){R(x-11,y-8,22,13,'#bfc4c8',g);R(x-11,y-8,22,3,'#d59d54',g);for(let k=0;k<3;k++)R(x-8+k*7,y,5,3,'#e5eff2',g);}
 else if(p.type==='hospital'){R(x-10,y-10,20,20,'#b9c4cc',g);R(x-2,y-7,4,14,'#fff',g);R(x-7,y-2,14,4,'#fff',g);L(`M${x-4} ${y}h8 M${x} ${y-4}v8`,'#cd5760',1.6,g);}
 else if(p.type==='civic'){R(x-11,y-6,22,15,'#9caec0',g);P(`M${x-13} ${y-7}l13 -6 13 6Z`,'#889cae',g);for(let k=-1;k<=1;k++)R(x+k*6-1,y-4,2,11,'#f4f7f8',g);}
 else{R(x-10,y-9,9,19,'#a1aab8',g);R(x+1,y-12,9,22,'#9ba6bb',g);}
}
function major(d,g){L(d,'#e9a43d',4.6,g);L(d,'#ffd06b',3.15,g);}
function shortStreet(d,g){L(d,'#ffffff',1.65,g);}
export function finishLandscape(root){
 root.replaceChildren();R(-340,-180,2300,1300,'#dce8d3',root);
 const fields=E('g',{'aria-hidden':'true'},root),outer=RNG(91);
 for(let i=0;i<27;i++){let x=-300+(i%7)*320+(outer()-.5)*24,y=-170+Math.floor(i/7)*295+(outer()-.5)*22;R(x,y,150+outer()*120,125+outer()*90,['#dae7c6','#d7e6ba','#e4ebcf'][i%3],fields,{opacity:.55});}
 const map=E('g',{transform:`translate(${OX} ${OY}) scale(${K})`},root);
 R(-8,-8,528,528,'#edeef0',map);
 for(const shape of PARKS)P(shape,'#93c623',map);
 const streets=E('g',{'aria-hidden':'true'},map);for(const d of LOCAL)shortStreet(d,streets);
 const roofs=E('g',{'aria-hidden':'true'},map),rr=RNG(190211),occupied=[];
 const groups=[
 [80,80,4,3,23,17,0],[134,135,3,2,18,16,0],
 [275,55,5,3,14,15,-20],[310,100,4,3,17,15,-21],
 [352,172,3,2,17,17,-21],[385,196,4,3,16,15,-20],
 [144,210,6,5,11,12,12],[179,205,5,6,12,12,0],
 [201,260,7,5,11,11,0],[130,281,7,5,11,11,30],
 [83,316,6,5,11,12,32],[197,305,9,4,11,11,0],
 [235,189,5,4,11,10,-3],[274,199,5,5,11,11,-28],
 [312,219,4,5,11,11,-30],[337,248,4,4,11,11,-25],
 [367,262,5,5,11,11,-20],[396,283,4,5,11,11,16],
 [240,401,4,7,13,14,0],[281,404,3,6,17,18,0],
 [289,483,4,2,17,16,0],[334,389,3,4,16,17,0],
 [391,392,4,3,19,16,0],[383,449,4,3,17,17,0],
 [444,255,4,4,14,14,15]
 ];
 for(const [ox,oy,nx,ny,dx,dy,rot] of groups)for(let row=0;row<ny;row++)for(let col=0;col<nx;col++){
  if(rr()<.12)continue;const x=ox+col*dx+(rr()-.5)*2,y=oy+row*dy+(rr()-.5)*2;
  if(x<5||x>501||y<6||y>499||noBuilding(x,y))continue;
  let w=(dx*.55)+(rr()-.5)*2,h=(dy*.52)+(rr()-.5)*2;
  R(x-w/2,y-h/2,w,h,rr()<.15?'#d2d5d9':'#bfc2c6',roofs,{transform:`rotate(${rot} ${x} ${y})`,stroke:'#bfc2c6','stroke-width':.35});
  occupied.push([x,y]);
 }
 for(const [x,y,w,h] of [[296,379,15,31],[319,382,17,44],[344,380,16,37],[361,382,21,47],[279,470,18,24],[302,470,19,23],[327,471,19,23],[421,400,17,28],[441,402,18,31]]){
  if(noBuilding(x+w/2,y+h/2))continue;R(x,y,w,h,'#bcbfc3',roofs);
 }
 const facilities=E('g',{'aria-hidden':'true'},map);for(const p of places)facility(p,facilities);
 const arterials=E('g',{'aria-hidden':'true'},map);for(const d of ARTERIAL)major(d,arterials);
 P('M179 -10L190 -10C207 52 194 104 187 154C183 184 188 201 207 208L201 213C170 194 178 162 185 124C192 78 191 39 179 -10Z','#f4ec65',map);
 P('M124 413C132 383 143 366 162 359L174 359C149 380 140 394 132 436L109 518L94 518Z','#f4ed6b',map);
 const hydro=E('g',{'aria-hidden':'true'},map);P(W,'#6bc5e7',hydro);
 const crossing=E('g',{id:'bridge-layer'},map);
 const bridgeLines={'ponte-norte':'M177 188 L271 122','ponte-central':'M349 267 L429 239','ponte-sul':'M130 345 L211 384'};
 for(const b of bridges){const d=bridgeLines[b.id],g=E('g',{class:'bridge-hit','data-bridge':b.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${b.name}`},crossing);
  L(d,'#dea648',7.4,g);L(d,'#ffd06b',5,g,{class:'bridge-deck'});
  const [x,y]=COORD(b);E('circle',{cx:x,cy:y,r:12,fill:'transparent'},g);T(b.name,x+12,y-8,g,'bridge-label',{'font-size':7,'paint-order':'stroke',stroke:'#fff','stroke-width':2});
 }
 const homes=E('g',{id:'homes-layer'},map);let count=0;
 for(const [x,y] of occupied){if(count>=230)break;if(rr()<.36)continue;count++;const region=y<210?(x<250?'norte-verde':x<370?'jardim-do-rio':'vale-do-sol'):(x<175?'colinas-do-sul':x<300?'centro-civico':x<390?'vila-industrial':'parque-leste');
  const g=E('g',{'data-home':`casa-${String(count).padStart(3,'0')}`,'data-region':region,class:'home-node',role:'button',tabindex:0,'aria-label':`Inspecionar residência ${count}`},homes);
  E('circle',{cx:x,cy:y,r:1.6,fill:'#438968',stroke:'#fff','stroke-width':.65},g);E('circle',{cx:x,cy:y,r:5,fill:'transparent'},g);
 }
 const flows=E('g',{id:'flows-layer',class:'map-layer-hidden'},map);for(const b of bridges){L(bridgeLines[b.id],'#377ec7',1.7,flows,{class:'flow','data-flow-bridge':b.id});}
 const names=E('g',{'aria-hidden':'true'},map);for(const d of districts){const[x,y]=COORD(d);T(d.name,x,y,names,'district-label',{'text-anchor':'middle','font-size':7,'stroke-width':1.5,opacity:.83});}
 const poi=E('g',{id:'places-layer'},map);
 for(const p of places){const[x,y]=COORD(p),g=E('g',{'data-place':p.id,class:'map-place',role:'button',tabindex:0,'aria-label':`Inspecionar ${p.name}`},poi);
  R(x-12,y-12,24,24,'transparent',g);E('circle',{cx:x,cy:y-2,r:6.5,fill:placeColors[p.type],stroke:'#fff','stroke-width':1.3,class:'place-bubble'},g);T(placeGlyphs[p.type],x,y+.6,g,'',{'text-anchor':'middle','font-size':6,fill:'#fff','font-weight':800});
  T({school:'Escola',market:'Mercado',hospital:'Hospital',civic:'Prefeitura',office:'Empresa',park:'Parque'}[p.type],x,y+12,g,'place-label',{'text-anchor':'middle','font-size':6,'stroke-width':1.5});
 }
 return {homeCount:count};
}
