import {WIDTH,HEIGHT,riverY,districts,bridges,parks,places,placeColors,placeGlyphs} from './city-data.js';
const NS='http://www.w3.org/2000/svg';
const svgEl=(tag,attrs={},parent)=>{const el=document.createElementNS(NS,tag);for(const [key,val] of Object.entries(attrs))el.setAttribute(key,String(val));if(parent)parent.append(el);return el;};
const path=(d,stroke,width,parent,extra={})=>svgEl('path',{d,fill:'none',stroke,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...extra},parent);
const text=(str,x,y,parent,klass,extra={})=>{const t=svgEl('text',{x,y,class:klass,...extra},parent);t.textContent=str;return t;};
const makeRandom=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const isPark=(x,y)=>parks.some(p=>Math.pow((x-p.x)/p.rx,2)+Math.pow((y-p.y)/p.ry,2)<1.1);
const riverPath=()=>{const north=[],south=[];for(let x=-20;x<=WIDTH+20;x+=16){north.push(`${x},${(riverY(x)-48).toFixed(1)}`);south.push(`${x},${(riverY(x)+48).toFixed(1)}`);}return `M${north.join('L')}L${south.reverse().join('L')}Z`;};
export function drawCity(root){
  root.replaceChildren();const rand=makeRandom(749137);
  svgEl('rect',{width:WIDTH,height:HEIGHT,fill:'#eff2f0'},root);
  const land=svgEl('g',{},root);
  // Large green areas and smaller urban parks, all in flat map colors.
  for(const p of parks){svgEl('ellipse',{cx:p.x,cy:p.y,rx:p.rx,ry:p.ry,fill:'#b9dba6'},land);svgEl('ellipse',{cx:p.x+13,cy:p.y-8,rx:p.rx*.58,ry:p.ry*.52,fill:'#a7d098',opacity:'.55'},land);}
  const lakes=svgEl('g',{},root);for(const [x,y,rx,ry] of [[110,552,25,13],[710,85,26,14],[1463,691,37,19]])svgEl('ellipse',{cx:x,cy:y,rx,ry,fill:'#86cee9'},lakes);
  const buildings=svgEl('g',{'aria-hidden':'true'},root);
  for(let y=18;y<HEIGHT-10;y+=17){for(let x=18;x<WIDTH-10;x+=19){const px=x+rand()*8,py=y+rand()*7;if(Math.abs(py-riverY(px))<71||isPark(px,py)||rand()<.22)continue;if(Math.abs(px-340)<16||Math.abs(px-800)<17||Math.abs(px-1270)<16)continue;const w=6+rand()*10,h=5+rand()*9;svgEl('rect',{x:px.toFixed(1),y:py.toFixed(1),width:w.toFixed(1),height:h.toFixed(1),rx:'.8',fill:rand()<.16?'#d8dbd7':'#c5ccce'},buildings);}}
  const streets=svgEl('g',{'aria-hidden':'true'},root);
  for(let x=64;x<WIDTH;x+=102){const d=`M${x} -10 C${x+22} 180 ${x-22} 450 ${x+15} 910`;path(d,'#dbe1df',10,streets);path(d,'#ffffff',7,streets);}
  for(let y=63;y<HEIGHT;y+=96){const d=`M-10 ${y} C400 ${y-32} 1000 ${y+29} 1610 ${y+3}`;path(d,'#dbe1df',10,streets);path(d,'#ffffff',7,streets);}
  const arteries=svgEl('g',{'aria-hidden':'true'},root);const major=[
    'M-20 220 C250 236 475 210 690 251 S1140 258 1620 194',
    'M-20 590 C265 550 465 607 735 625 S1220 680 1620 642',
    'M115 0 C175 230 195 438 205 900',
    'M340 -10 C346 265 337 585 360 910',
    'M800 -10 C794 220 812 480 800 910',
    'M1270 -10 C1255 230 1280 565 1260 910',
    'M-30 875 C350 765 535 803 890 812 S1305 849 1630 788'];
  for(const d of major){path(d,'#c5ac68',17,arteries);path(d,'#f7db89',12,arteries);}
  const highways=svgEl('g',{'aria-hidden':'true'},root);for(const d of ['M-20 70 C370 115 745 25 1000 67 S1370 96 1620 36','M-20 860 C340 725 590 810 900 846 S1320 859 1620 850']){path(d,'#99a4a4',20,highways);path(d,'#f9faf8',14,highways);path(d,'#b9c0bf',1.5,highways);}
  // Mask all ordinary streets at the water: only explicit bridge objects reconnect the banks.
  const water=svgEl('g',{'aria-label':'Rio central'},root);svgEl('path',{d:riverPath(),fill:'#84cde9',stroke:'#d9edf0','stroke-width':3},water);
  for(let x=0;x<WIDTH;x+=95){let y=riverY(x);path(`M${x} ${y-7}q22 -6 44 -1`,'#a9def0',1.2,water,{opacity:'.65'});}
  text('RIO CENTRAL',730,riverY(730)+5,water,'river-label',{'text-anchor':'middle'});
  const crossings=svgEl('g',{id:'bridge-layer'},root);
  for(const b of bridges){const g=svgEl('g',{class:'bridge-hit','data-bridge':b.id,tabindex:0,role:'button','aria-label':`Inspecionar ${b.name}`},crossings);const cy=b.y;path(`M${b.x} ${cy-72} L${b.x} ${cy+72}`,'#b2bdbd',18,g,{class:'bridge-deck'});path(`M${b.x} ${cy-72} L${b.x} ${cy+72}`,'#fcfaf3',12,g);path(`M${b.x} ${cy-72} L${b.x} ${cy+72}`,'#e8c771',2,g,{class:'bridge-hit-line'});text(b.name,b.x+12,cy+2,g,'bridge-label');}
  const treeLayer=svgEl('g',{'aria-hidden':'true'},root);for(const p of parks){for(let n=0;n<50;n++){let x=p.x+(rand()*2-1)*p.rx,y=p.y+(rand()*2-1)*p.ry;if(Math.pow((x-p.x)/p.rx,2)+Math.pow((y-p.y)/p.ry,2)>.9||Math.abs(y-riverY(x))<52)continue;svgEl('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:2+rand()*3,fill:rand()<.5?'#96c98a':'#a4d197',opacity:'.7'},treeLayer);}}
  const flows=svgEl('g',{id:'flows-layer',class:'map-layer-hidden'},root);for(const b of bridges)path(`M${b.x-80} ${b.y-145}Q${b.x+43} ${b.y} ${b.x+80} ${b.y+165}`,'#438ac7',2.8,flows,{class:'flow','data-flow-bridge':b.id});
  const homes=svgEl('g',{id:'homes-layer'},root);let homeCount=0;for(let n=0;n<450;n++){const x=20+rand()*1560,y=20+rand()*860;if(Math.abs(y-riverY(x))<74||isPark(x,y)||Math.abs(x-340)<22||Math.abs(x-800)<22||Math.abs(x-1270)<22)continue;if(rand()>.44)continue;homeCount++;let region=y<riverY(x)?(x<700?'norte-verde':x<1260?'jardim-do-rio':'vale-do-sol'):(x<340?'vila-industrial':x<760?'centro-civico':x<1260?'parque-leste':'colinas-do-sul');const g=svgEl('g',{class:'home-node','data-home':`casa-${String(homeCount).padStart(3,'0')}`,'data-region':region,tabindex:0,role:'button','aria-label':`Inspecionar residência ${homeCount}`},homes);svgEl('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:4.5,fill:'#45966c',stroke:'#fff','stroke-width':1.6},g);}
  const labels=svgEl('g',{},root);for(const d of districts){text(d.name,d.x,d.y,labels,'district-label',{'text-anchor':'middle'});text(d.type,d.x,d.y+16,labels,'district-caption',{'text-anchor':'middle'});}
  const hubs=svgEl('g',{id:'places-layer'},root);for(const p of places){const g=svgEl('g',{class:'map-place','data-place':p.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${p.name}`},hubs);svgEl('circle',{cx:p.x,cy:p.y,r:12,fill:placeColors[p.type],stroke:'white','stroke-width':2.5,class:'place-bubble'},g);text(placeGlyphs[p.type],p.x,p.y+4,g,'',{'text-anchor':'middle',fill:'white','font-size':p.type==='hospital'?15:10,'font-weight':800});text(p.name,p.x+17,p.y+4,g,'place-label');}
  return {homeCount};
}
