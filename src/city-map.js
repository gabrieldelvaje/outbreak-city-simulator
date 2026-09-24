import {WIDTH,HEIGHT,riverY,districts,bridges,parks,places,placeColors,placeGlyphs} from './city-data.js';

// Every visual object shares the same parcel coordinates. Nothing is randomly placed on top of a road or river.
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));parent?.append(n);return n;};
const rect=(x,y,w,h,fill,parent,extra={})=>el('rect',{x,y,width:w,height:h,fill,...extra},parent);
const line=(d,stroke,width,parent,extra={})=>el('path',{d,fill:'none',stroke,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...extra},parent);
const label=(value,x,y,parent,klass,extra={})=>{const n=el('text',{x,y,class:klass,...extra},parent);n.textContent=value;return n;};
const rng=(seed)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const riverPoints=(offset)=>{const pts=[];for(let x=-24;x<=WIDTH+24;x+=8)pts.push([x,riverY(x)+offset]);return pts;};
const poly=(points)=>'M'+points.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join('L')+'Z';
const band=(low,high)=>poly([...riverPoints(low),...riverPoints(high).reverse()]);
const northLand=()=>poly([[-30,-30],[WIDTH+30,-30],...riverPoints(-80).reverse()]);
const southLand=()=>poly([...riverPoints(80),[WIDTH+30,HEIGHT+30],[-30,HEIGHT+30]]);
const parcelKey=(x,y)=>`${x}:${y}`;
const reserved=new Map(places.map(p=>[parcelKey(p.x,p.y),p]));
const greenBlocks=new Set(parks.map(p=>parcelKey(p.x,p.y)));
const onLand=(x,y,margin=0)=>Math.abs(y-riverY(x))>80+margin;
const regionAt=(x,y)=>y<riverY(x)?(x<800?'norte-verde':x<1350?'jardim-do-rio':'vale-do-sol'):(x<330?'vila-industrial':x<810?'centro-civico':x<1260?'parque-leste':'colinas-do-sul');
const drawRoad=(d,w,group,kind='minor')=>{line(d,kind==='highway'?'#aeb8b5':kind==='major'?'#d1b873':'#e2e6e3',w+4,group);line(d,kind==='highway'?'#f8f9f7':kind==='major'?'#efcf7e':'#ffffff',w,group);};
function parkParcel(x,y,g,random){rect(x-43,y-36,86,72,'#a8d39d',g,{rx:3,stroke:'#94c78e','stroke-width':1});for(let i=0;i<15;i++){const tx=x-36+random()*72,ty=y-29+random()*58;el('circle',{cx:tx,cy:ty,r:2.5+random()*3,fill:random()<.5?'#82b77c':'#93c989'},g);}line(`M${x-41} ${y+25} Q${x} ${y-11} ${x+41} ${y-23}`,'#f6f7eb',2.2,g);}
function footprint(p,layer){
  const g=el('g',{class:'facility-footprint','aria-hidden':'true'},layer),x=p.x,y=p.y;
  if(p.type==='park'){parkParcel(x,y,g,rng(x*7+y));return;}
  const ground=p.type==='school'?'#e5eddf':p.type==='hospital'?'#f5e6e7':p.type==='civic'?'#ebedf0':p.type==='market'?'#f5eee1':'#e6e8ee';
  rect(x-43,y-36,86,72,ground,g,{rx:2,stroke:'#d3d8d2','stroke-width':1});
  const building=(bx,by,bw,bh,color)=>rect(bx,by,bw,bh,color,g,{rx:2,stroke:'#bbc4c7','stroke-width':1});
  if(p.type==='school'){
    building(x-31,y-21,62,30,'#9daeb5');building(x-21,y-16,42,8,'#bbc9cc');
    rect(x-26,y+16,52,11,'#d4c9a5',g,{rx:2});line(`M${x-26} ${y+21}H${x+26}`,'#fff8e1',1,g);
  }else if(p.type==='hospital'){
    building(x-29,y-24,58,46,'#abbac0');building(x-40,y-11,80,21,'#bcc9cc');
    rect(x-8,y-10,16,16,'#fff',g,{rx:3});line(`M${x} ${y-7}v10 M${x-5} ${y-2}h10`,'#d35b64',2.8,g);
    rect(x-31,y+24,62,5,'#e9e0d7',g);
  }else if(p.type==='civic'){
    building(x-31,y-21,62,39,'#acb9c3');rect(x-36,y+19,72,9,'#e2e6e7',g);
    for(const dx of [-19,-7,5,17])rect(x+dx,y+2,5,15,'#e8eff2',g);
    line(`M${x-35} ${y-22}H${x+35}`,'#8c9ca8',3,g);
  }else if(p.type==='market'){
    building(x-34,y-19,68,35,'#b6b9b7');rect(x-34,y-19,68,8,'#dc955a',g);
    for(const dx of [-20,-5,10])rect(x+dx,y-5,9,11,'#e3edf0',g);
    for(const dx of [-22,-8,6,20])line(`M${x+dx} ${y+22}v8`,'#fff',1,g);
  }else{
    building(x-34,y-23,31,43,'#aeb9c8');building(x+3,y-27,31,47,'#9daebd');
    for(const dx of [-29,-18,-7,8,19,30])for(const dy of [-15,-4,7])rect(x+dx,y+dy,5,5,'#e6ecee',g);
    rect(x-28,y+24,56,5,'#d2d7db',g);
  }
  // The building and the clickable hub use exactly the same parcel center.
}
function drawBridge(b,root){
  const {x,y}=b,g=el('g',{class:'bridge-hit','data-bridge':b.id,tabindex:0,role:'button','aria-label':`Inspecionar ${b.name}`},root);
  // Approaches line up with the road at this same x; only these decks cross the water.
  drawRoad(`M${x} ${y-115} L${x} ${y+115}`,12,g,'major');
  line(`M${x-6} ${y-55}L${x-6} ${y+55}`,'#f7f8f4',1.5,g,{class:'bridge-deck'});
  line(`M${x+6} ${y-55}L${x+6} ${y+55}`,'#f7f8f4',1.5,g);
  rect(x-14,y-17,28,34,'transparent',g,{class:'bridge-hit-target'});
  label(b.name,x+18,y+4,g,'bridge-label');
}
export function drawCity(root){
  root.replaceChildren();const random=rng(749137);
  rect(0,0,WIDTH,HEIGHT,'#f0f2ef',root);
  const defs=el('defs',{},root),clip=el('clipPath',{id:'city-dry-land'},defs);
  el('path',{d:northLand(),fill:'#fff'},clip);el('path',{d:southLand(),fill:'#fff'},clip);

  // Riparian vegetation is a continuous corridor: no ordinary street/building can cross it.
  el('path',{d:band(-80,80),fill:'#9ed09a'},root);
  const streets=el('g',{'clip-path':'url(#city-dry-land)','aria-hidden':'true'},root);
  // A shared block grid: parcels sit BETWEEN roads, never underneath them.
  for(let x=50;x<WIDTH;x+=100){if(bridges.some(b=>Math.abs(b.x-x)<26))continue;drawRoad(`M${x} -20 L${x} ${HEIGHT+20}`,7,streets);}
  for(let y=50;y<HEIGHT;y+=90)drawRoad(`M-20 ${y}L${WIDTH+20} ${y}`,7,streets);
  for(const x of bridges.map(b=>b.x))drawRoad(`M${x} -20L${x} ${HEIGHT+20}`,12,streets,'major');
  for(const y of [230,590,770])drawRoad(`M-20 ${y}L${WIDTH+20} ${y}`,12,streets,'major');
  drawRoad(`M-20 15 L${WIDTH+20} 15`,15,streets,'highway');

  const lots=el('g',{'clip-path':'url(#city-dry-land)','aria-hidden':'true'},root),homes=el('g',{id:'homes-layer'},root);
  let homeCount=0;
  for(let y=95;y<=815;y+=90)for(let x=100;x<=1500;x+=100){
    if(!onLand(x,y,100))continue; // Entire block remains clear of the green river corridor.
    const key=parcelKey(x,y),p=reserved.get(key),isGreen=greenBlocks.has(key);
    if(p){footprint(p,lots);continue;}
    if(isGreen){parkParcel(x,y,lots,random);continue;}
    const industrial=y>680&&x<390;
    rect(x-42,y-35,84,70,industrial?'#e8eae8':'#f8f9f6',lots,{rx:2,stroke:'#e1e6e2','stroke-width':1});
    if(industrial){
      rect(x-34,y-24,57,34,'#c6cdd0',lots,{rx:1,stroke:'#b5bfc4','stroke-width':1});
      rect(x-30,y-22,46,3,'#aeb8be',lots);rect(x+8,y+17,25,13,'#d7dfe0',lots);
      continue;
    }
    // Buildings are generated inside their own parcel and homes attach to real building centers.
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      if(random()<.12)continue;
      const bx=x-32+col*24+random()*3,by=y-26+row*29+random()*3;
      const w=13+random()*5,h=13+random()*7;
      rect(bx,by,w,h,random()<.18?'#d6dbd9':'#c5cccd',lots,{rx:1,stroke:'#bfc7c8','stroke-width':.5});
      if(homeCount>=230||random()>.43)continue;
      homeCount++;
      const cx=bx+w/2,cy=by+h/2;
      const node=el('g',{class:'home-node','data-home':`casa-${String(homeCount).padStart(3,'0')}`,'data-region':regionAt(cx,cy),role:'button',tabindex:0,'aria-label':`Inspecionar residência ${homeCount}`},homes);
      el('circle',{cx,cy,r:4,fill:'#408c65',stroke:'#fff','stroke-width':1.2},node);
    }
  }
  // Repaint both banks and the channel AFTER the parcels: their boundaries remain uninterrupted.
  const river=el('g',{'aria-label':'Rio central'},root);
  el('path',{d:band(-54,54),fill:'#84cde9',stroke:'#a8d4d7','stroke-width':1.5},river);
  for(const offset of [-61,61])line('M'+riverPoints(offset).map(([x,y])=>`${x},${y.toFixed(1)}`).join('L'),'#76b37d',2,river,{opacity:'.7'});
  label('RIO CENTRAL',735,riverY(735)+5,river,'river-label',{'text-anchor':'middle'});

  const crossings=el('g',{id:'bridge-layer'},root);for(const b of bridges)drawBridge(b,crossings);
  const flow=el('g',{id:'flows-layer',class:'map-layer-hidden'},root);
  for(const b of bridges)line(`M${b.x} ${b.y-105} L${b.x} ${b.y+105}`,'#367dc6',2.5,flow,{class:'flow','data-flow-bridge':b.id});

  // Human-readable district names do not establish geometry; clickable places are linked to footprints above.
  const districtLayer=el('g',{'aria-hidden':'true'},root);
  for(const d of districts){label(d.name,d.x,d.y,districtLayer,'district-label',{'text-anchor':'middle'});}
  const hubs=el('g',{id:'places-layer'},root);
  for(const p of places){
    const g=el('g',{class:'map-place','data-place':p.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${p.name}`},hubs);
    // Transparent square enlarges the hit target to the entire facility/park block.
    rect(p.x-42,p.y-34,84,68,'transparent',g,{rx:3});
    el('circle',{cx:p.x,cy:p.y-5,r:12,fill:placeColors[p.type],stroke:'#fff','stroke-width':2.5,class:'place-bubble'},g);
    label(placeGlyphs[p.type],p.x,p.y-1,g,'',{'text-anchor':'middle',fill:'#fff','font-size':p.type==='hospital'?15:10,'font-weight':800});
    label(p.type==='school'?'Escola':p.type==='market'?'Mercado':p.type==='hospital'?'Hospital':p.type==='civic'?'Prefeitura':p.type==='office'?'Empresa':'Praça',p.x,p.y+27,g,'place-label',{'text-anchor':'middle','font-size':10});
  }
  return {homeCount};
}
