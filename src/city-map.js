import {WIDTH,HEIGHT,riverY,districts,bridges,parks,places,placeColors,placeGlyphs} from './city-data.js';
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));parent?.append(n);return n;};
const rect=(x,y,w,h,fill,parent,extra={})=>el('rect',{x,y,width:w,height:h,fill,...extra},parent);
const line=(d,stroke,width,parent,extra={})=>el('path',{d,fill:'none',stroke,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...extra},parent);
const label=(value,x,y,parent,klass,extra={})=>{const n=el('text',{x,y,class:klass,...extra},parent);n.textContent=value;return n;};
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const points=offset=>{const p=[];for(let x=-24;x<=WIDTH+24;x+=8)p.push([x,riverY(x)+offset]);return p;};
const poly=pts=>'M'+pts.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join('L')+'Z';
const band=(a,b)=>poly([...points(a),...points(b).reverse()]);
const dryNorth=()=>poly([[-30,-30],[WIDTH+30,-30],...points(-80).reverse()]);
const drySouth=()=>poly([...points(80),[WIDTH+30,HEIGHT+30],[-30,HEIGHT+30]]);
const key=(x,y)=>`${x}:${y}`;
const facilities=new Map(places.map(p=>[key(p.x,p.y),p]));
const green=new Set(parks.map(p=>key(p.x,p.y)));
// An 80px buffer defines the green banks; 50px more accommodates complete street blocks.
const fullDryParcel=(x,y)=>Math.abs(y-riverY(x))>130;
const regionAt=(x,y)=>y<riverY(x)?(x<800?'norte-verde':x<1350?'jardim-do-rio':'vale-do-sol'):(x<330?'vila-industrial':x<810?'centro-civico':x<1260?'parque-leste':'colinas-do-sul');
const road=(d,w,g,kind='minor')=>{line(d,kind==='major'?'#d1b873':kind==='highway'?'#aeb8b5':'#e2e6e3',w+4,g);line(d,kind==='major'?'#efcf7e':kind==='highway'?'#f8f9f7':'#fff',w,g);};
function parkBlock(x,y,g,r){rect(x-43,y-36,86,72,'#a8d39d',g,{rx:3,stroke:'#94c78e','stroke-width':1});for(let i=0;i<15;i++)el('circle',{cx:x-36+r()*72,cy:y-29+r()*58,r:2.5+r()*3,fill:r()<.5?'#82b77c':'#93c989'},g);line(`M${x-41} ${y+25}Q${x} ${y-11} ${x+41} ${y-23}`,'#f6f7eb',2.2,g);}
function buildingBlock(p,g){
  const {x,y}=p;if(p.type==='park'){parkBlock(x,y,g,rng(x*7+y));return;}
  const ground={school:'#e5eddf',hospital:'#f5e6e7',civic:'#ebedf0',market:'#f5eee1',office:'#e6e8ee'}[p.type];
  rect(x-43,y-36,86,72,ground,g,{rx:2,stroke:'#d3d8d2','stroke-width':1});
  const b=(bx,by,bw,bh,color)=>rect(bx,by,bw,bh,color,g,{rx:2,stroke:'#bbc4c7','stroke-width':1});
  if(p.type==='school'){
    b(x-31,y-21,62,30,'#9daeb5');b(x-21,y-16,42,8,'#bbc9cc');rect(x-26,y+16,52,11,'#d4c9a5',g,{rx:2});line(`M${x-26} ${y+21}H${x+26}`,'#fff8e1',1,g);
  }else if(p.type==='hospital'){
    b(x-29,y-24,58,46,'#abbac0');b(x-40,y-11,80,21,'#bcc9cc');rect(x-8,y-10,16,16,'#fff',g,{rx:3});line(`M${x} ${y-7}v10 M${x-5} ${y-2}h10`,'#d35b64',2.8,g);rect(x-31,y+24,62,5,'#e9e0d7',g);
  }else if(p.type==='civic'){
    b(x-31,y-21,62,39,'#acb9c3');rect(x-36,y+19,72,9,'#e2e6e7',g);for(const dx of [-19,-7,5,17])rect(x+dx,y+2,5,15,'#e8eff2',g);line(`M${x-35} ${y-22}H${x+35}`,'#8c9ca8',3,g);
  }else if(p.type==='market'){
    b(x-34,y-19,68,35,'#b6b9b7');rect(x-34,y-19,68,8,'#dc955a',g);for(const dx of [-20,-5,10])rect(x+dx,y-5,9,11,'#e3edf0',g);for(const dx of [-22,-8,6,20])line(`M${x+dx} ${y+22}v8`,'#fff',1,g);
  }else{
    b(x-34,y-23,31,43,'#aeb9c8');b(x+3,y-27,31,47,'#9daebd');for(const dx of [-29,-18,-7,8,19,30])for(const dy of [-15,-4,7])rect(x+dx,y+dy,5,5,'#e6ecee',g);rect(x-28,y+24,56,5,'#d2d7db',g);
  }
}
function bridge(b,parent){
  const {x,y}=b,g=el('g',{class:'bridge-hit','data-bridge':b.id,tabindex:0,role:'button','aria-label':`Inspecionar ${b.name}`},parent);
  // Bridge approaches use the SAME grid-aligned x as the existing roads.
  road(`M${x} ${y-115}L${x} ${y+115}`,12,g,'major');
  line(`M${x-6} ${y-55}L${x-6} ${y+55}`,'#f7f8f4',1.5,g,{class:'bridge-deck'});
  line(`M${x+6} ${y-55}L${x+6} ${y+55}`,'#f7f8f4',1.5,g);
  rect(x-14,y-17,28,34,'transparent',g,{class:'bridge-hit-target'});
  label(b.name,x+18,y+4,g,'bridge-label');
}
export function drawCity(root){
  root.replaceChildren();const random=rng(749137);rect(0,0,WIDTH,HEIGHT,'#f0f2ef',root);
  const defs=el('defs',{},root),dry=el('clipPath',{id:'city-dry-land'},defs);
  el('path',{d:dryNorth(),fill:'#fff'},dry);el('path',{d:drySouth(),fill:'#fff'},dry);
  // Riparian vegetation is a continuous corridor with no road grid in the river.
  el('path',{d:band(-80,80),fill:'#9ed09a'},root);
  const streets=el('g',{'clip-path':'url(#city-dry-land)','aria-hidden':'true'},root);
  for(let x=50;x<WIDTH;x+=100){if(bridges.some(b=>Math.abs(b.x-x)<26))continue;road(`M${x} -20L${x} ${HEIGHT+20}`,7,streets);}
  for(let y=50;y<HEIGHT;y+=90)road(`M-20 ${y}L${WIDTH+20} ${y}`,7,streets);
  for(const b of bridges)road(`M${b.x} -20L${b.x} ${HEIGHT+20}`,12,streets,'major');
  for(const y of [230,590,770])road(`M-20 ${y}L${WIDTH+20} ${y}`,12,streets,'major');
  road(`M-20 15L${WIDTH+20} 15`,15,streets,'highway');
  const lots=el('g',{'clip-path':'url(#city-dry-land)','aria-hidden':'true'},root),homes=el('g',{id:'homes-layer'},root);
  let homeCount=0;
  // Street centers: x=50+100n / y=50+90n. Parcel centers: x=100+100n / y=95+90n.
  for(let y=95;y<=815;y+=90)for(let x=100;x<=1500;x+=100){
    if(!fullDryParcel(x,y))continue;
    const p=facilities.get(key(x,y));if(p){buildingBlock(p,lots);continue;}
    if(green.has(key(x,y))){parkBlock(x,y,lots,random);continue;}
    const industrial=y>680&&x<390;
    rect(x-42,y-35,84,70,industrial?'#e8eae8':'#f8f9f6',lots,{rx:2,stroke:'#e1e6e2','stroke-width':1});
    if(industrial){rect(x-34,y-24,57,34,'#c6cdd0',lots,{rx:1,stroke:'#b5bfc4','stroke-width':1});rect(x-30,y-22,46,3,'#aeb8be',lots);rect(x+8,y+17,25,13,'#d7dfe0',lots);continue;}
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      if(random()<.12)continue;
      const bx=x-32+col*24+random()*3,by=y-26+row*29+random()*3,w=13+random()*5,h=13+random()*7;
      rect(bx,by,w,h,random()<.18?'#d6dbd9':'#c5cccd',lots,{rx:1,stroke:'#bfc7c8','stroke-width':.5});
      if(homeCount>=230||random()>.43)continue;
      const cx=bx+w/2,cy=by+h/2;homeCount++;
      const node=el('g',{class:'home-node','data-home':`casa-${String(homeCount).padStart(3,'0')}`,'data-region':regionAt(cx,cy),role:'button',tabindex:0,'aria-label':`Inspecionar residência ${homeCount}`},homes);
      el('circle',{cx,cy,r:4,fill:'#408c65',stroke:'#fff','stroke-width':1.2},node);
    }
  }
  // Channel is drawn above dry-city layers; streets cannot appear under its water.
  const water=el('g',{'aria-label':'Rio central'},root);
  el('path',{d:band(-54,54),fill:'#84cde9',stroke:'#a8d4d7','stroke-width':1.5},water);
  for(const off of [-61,61])line('M'+points(off).map(([x,y])=>`${x},${y.toFixed(1)}`).join('L'),'#76b37d',2,water,{opacity:'.7'});
  label('RIO CENTRAL',735,riverY(735)+5,water,'river-label',{'text-anchor':'middle'});
  const crossings=el('g',{id:'bridge-layer'},root);for(const b of bridges)bridge(b,crossings);
  const flows=el('g',{id:'flows-layer',class:'map-layer-hidden'},root);
  for(const b of bridges)line(`M${b.x} ${b.y-105}L${b.x} ${b.y+105}`,'#367dc6',2.5,flows,{class:'flow','data-flow-bridge':b.id});
  const names=el('g',{'aria-hidden':'true'},root);for(const d of districts)label(d.name,d.x,d.y,names,'district-label',{'text-anchor':'middle'});
  const hubs=el('g',{id:'places-layer'},root);
  for(const p of places){
    const g=el('g',{class:'map-place','data-place':p.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${p.name}`},hubs);
    rect(p.x-42,p.y-34,84,68,'transparent',g,{rx:3});
    el('circle',{cx:p.x,cy:p.y-5,r:12,fill:placeColors[p.type],stroke:'#fff','stroke-width':2.5,class:'place-bubble'},g);
    label(placeGlyphs[p.type],p.x,p.y-1,g,'',{'text-anchor':'middle',fill:'#fff','font-size':p.type==='hospital'?15:10,'font-weight':800});
    label({school:'Escola',market:'Mercado',hospital:'Hospital',civic:'Prefeitura',office:'Empresa',park:'Praça'}[p.type],p.x,p.y+27,g,'place-label',{'text-anchor':'middle','font-size':10});
  }
  return {homeCount};
}
