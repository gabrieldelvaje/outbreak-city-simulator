import {WIDTH,HEIGHT,riverY,bridges} from './city-data.js';

const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},parent)=>{const node=document.createElementNS(NS,tag);for(const [name,value] of Object.entries(attrs))node.setAttribute(name,String(value));parent?.append(node);return node;};
const trace=(d,color,width,parent,extra={})=>el('path',{d,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...extra},parent);
const road=(d,width,parent,major=false)=>{trace(d,major?'#d1b873':'#e0e6e2',width+3,parent);trace(d,major?'#efd383':'#fff',width,parent);};
const rand=(seed)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const riverLine=(offset,from,to)=>{const parts=[];for(let x=from;x<=to;x+=5)parts.push([x,riverY(x)+offset]);parts.push([to,riverY(to)+offset]);return parts;};
const shape=points=>'M'+points.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join('L')+'Z';
const riverBand=(upper,lower,from,to)=>shape([...riverLine(upper,from,to),...riverLine(lower,from,to).reverse()]);
const riverRoad=(offset,from,to)=>'M'+riverLine(offset,from,to).map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join('L');

/** Extend the fictional town into countryside; never use photographic tiles or real GIS coordinates. */
export function finishLandscape(root){
  const r=rand(72561);
  // The original 1600x900 city stays in place. A second backdrop continues outside its bounds.
  const countryside=el('g',{'aria-hidden':'true'},null);
  root.insertBefore(countryside,root.firstChild);
  el('rect',{x:-270,y:-180,width:2140,height:1260,fill:'#d6e8c3'},countryside);
  // Farm parcels: soft, unmapped agricultural fields beyond the urban footprint.
  const fields=['#e9e4b7','#d7e8b2','#c3dda8','#e2eabb','#d0e1bc','#e7ddb5'];
  for(let y=-180;y<1080;y+=48){for(let x=-270;x<1870;x+=68){
    if(x>=-5&&x<=WIDTH+5&&y>=-5&&y<=HEIGHT+5)continue;
    el('rect',{x:x+3,y:y+3,width:61,height:41,rx:3,fill:fields[Math.floor(r()*fields.length)],opacity:.70},countryside);
    if(r()<.34)trace(`M${x+11} ${y+8}L${x+11} ${y+40}`,'#f7f0cc',.9,countryside,{opacity:.68});
  }}
  // Wooded slopes and scattered trees outside the city, not random objects over town roads.
  for(let i=0;i<460;i++){
    const x=-255+r()*2110,y=-170+r()*1240;
    if(x>25&&x<1575&&y>25&&y<875)continue;
    el('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:(2+r()*5).toFixed(1),fill:r()<.5?'#99c88d':'#b3d69d',opacity:.55},countryside);
  }
  // The built-up footprint ends inside the old canvas. The irregular, unbuilt fringe
  // covers cut-off street-grid tips without hiding any planned public facility/parcel.
  const edge=el('g',{'aria-hidden':'true'},root);
  const top=[],bottom=[],left=[],right=[];
  for(let x=-25;x<=1625;x+=25){top.push([x,23+6*Math.sin(x/87)+4*Math.sin(x/29)]);bottom.push([x,876+6*Math.sin(x/103)+3*Math.cos(x/37)]);}
  for(let y=-25;y<=925;y+=25){left.push([35+6*Math.sin(y/91)+3*Math.sin(y/29),y]);right.push([1565+6*Math.sin(y/78)+3*Math.cos(y/34),y]);}
  el('path',{d:shape([[-260,-180],[1860,-180],...top.slice().reverse()]),fill:'#d4e7bd'},edge);
  el('path',{d:shape([[1860,1080],[-260,1080],...bottom]),fill:'#cfe4b8'},edge);
  el('path',{d:shape([[-260,-180],...left,[-260,1080]]),fill:'#c8e2b6',opacity:.8},edge);
  el('path',{d:shape([[1860,-180],...right,[1860,1080]]),fill:'#d2e7c0',opacity:.83},edge);
  // Quiet rural roads connect the outskirts to the existing city arteries; no abrupt ends.
  const outskirts=el('g',{'aria-hidden':'true'},root);
  for(const x of [350,850,1250]){
    road(`M${x} -180L${x} 54`,11,outskirts,true);
    road(`M${x} 862L${x} 1080`,11,outskirts,true);
  }
  for(const y of [230,590,770]){
    road(`M-270 ${y}L60 ${y}`,9,outskirts,y===590);
    road(`M1540 ${y}L1870 ${y}`,9,outskirts,y===590);
  }
  // An existing ring road continues into the farms along the northern boundary.
  road('M-270 15L1870 15',14,outskirts,true);
  // Continuous river through countryside, aligned exactly to the town's existing riverY.
  const outsideRiver=el('g',{'aria-hidden':'true'},root);
  for(const [a,b] of [[-270,58],[1542,1870]]){
    el('path',{d:riverBand(-80,80,a,b),fill:'#a8d5a0'},outsideRiver);
    el('path',{d:riverBand(-54,54,a,b),fill:'#84cde9'},outsideRiver);
    trace(riverRoad(-55,a,b),'#b8dcba',2,outsideRiver);
    trace(riverRoad(55,a,b),'#b8dcba',2,outsideRiver);
  }
  // Insert real riverside access BEFORE the water/crossings and public labels.
  // The avenue runs on dry ground (bank ends at ±80; roadway centers at ±91).
  const water=root.querySelector('g[aria-label="Rio central"]');
  const quay=el('g',{'aria-hidden':'true'},null);
  root.insertBefore(quay,water||null);
  for(const bank of [-1,1]){
    // Small riparian footpath beside continuous planted banks.
    trace(riverRoad(bank*68,-40,1640),'#ecf2e4',2,quay,{opacity:.95});
    for(let x=0;x<WIDTH;x+=26){
      const y=riverY(x)+bank*(64+((x*7)%8));
      el('circle',{cx:x,cy:y,r:2.4+(x%3),fill:'#78b781',opacity:.86},quay);
    }
    road(riverRoad(bank*91,-65,1665),8,quay);
    // Every perpendicular local street reaches a riverside junction, not a dead-end in vegetation.
    for(let x=50;x<WIDTH;x+=100){
      if(bridges.some(b=>Math.abs(b.x-x)<4))continue;
      const y=riverY(x);
      road(`M${x} ${y+bank*76}L${x} ${y+bank*96}`,7,quay);
    }
  }
  // Some horizontal streets meet the banks too: extend short tips to the same boulevard.
  const levels=[...Array.from({length:10},(_,i)=>50+i*90),230,590,770];
  for(const y of new Set(levels))for(const side of [-1,1]){
    let previous=null;
    for(let x=0;x<=WIDTH;x+=2){
      const val=y-riverY(x)-side*85;
      if(previous&&val*previous.value<=0){
        const hit=x-2+2*Math.abs(previous.value)/(Math.abs(previous.value)+Math.abs(val)||1);
        const slope=(riverY(hit+2)-riverY(hit-2))/4;
        if(Math.abs(slope)<.18)break; // avoid artificial long feeder lines on almost parallel streets
        const target=hit-side*7/slope;
        if(target>=0&&target<=WIDTH&&Math.abs(target-hit)<35)road(`M${hit.toFixed(1)} ${y}L${target.toFixed(1)} ${y}`,7,quay);
      }
      previous={value:val};
    }
  }
  // The original bridge layer remains above the water and the avenues.
}
