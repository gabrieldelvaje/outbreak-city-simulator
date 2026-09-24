import {WIDTH, HEIGHT, riverY} from './city-data.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  parent?.append(node);
  return node;
};
const path = (d, fill, parent, attrs = {}) => el('path', {d, fill, ...attrs}, parent);
const line = (d, color, width, parent, attrs = {}) => path(d, 'none', parent, {
  stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs
});
const road = (d, width, parent, major = false) => {
  line(d, major ? '#bfc0b5' : '#d9dfdc', width + 3, parent);
  line(d, major ? '#f0d586' : '#ffffff', width, parent);
};
const random = seed => () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
const polygon = points => 'M' + points.map(([x,y]) => `${x},${y}`).join('L') + 'Z';
const inside = (x, y, polygonPoints) => {
  let hit = false;
  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const a = polygonPoints[i], b = polygonPoints[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0]-a[0]) * (y-a[1]) / (b[1]-a[1]) + a[0]) hit = !hit;
  }
  return hit;
};
const riverLine = (offset, from = -280, to = 1880) => {
  const coords = [];
  for (let x = from; x <= to; x += 8) coords.push(`${x},${(riverY(x) + offset).toFixed(1)}`);
  return 'M' + coords.join('L');
};
const riverBand = (a, b) => {
  const first = [], second = [];
  for (let x = -280; x <= 1880; x += 8) {
    first.push([x, riverY(x)+a]); second.push([x, riverY(x)+b]);
  }
  return polygon([...first, ...second.reverse()]);
};

// The existing 1600 x 900 interactive map is kept intact in this central rectangle.
// Only the NON-interactive surroundings are drawn by this module.
const core = [[40,62],[1560,62],[1560,858],[40,858]];

// Separate neighborhoods, NOT a single scalloped/cloud outline. Each polygon follows
// street ends and contains small straight-sided urban lots; green farm gaps remain between them.
const neighborhoods = [
  [[40,80],[40,62],[90,62],[90,-18],[134,-18],[134,-58],[239,-58],[239,-100],[320,-100],[320,-67],[395,-67],[395,-12],[468,-12],[468,62],[538,62],[538,107],[398,119],[290,101],[190,125],[90,118]],
  [[550,62],[550,-12],[610,-12],[610,-72],[676,-72],[676,-150],[802,-150],[802,-112],[872,-112],[872,-163],[961,-163],[961,-98],[1016,-98],[1016,-28],[1092,-28],[1092,62]],
  [[1120,62],[1120,-17],[1191,-17],[1191,-67],[1259,-67],[1259,-46],[1344,-46],[1344,-89],[1469,-89],[1469,-42],[1560,-42],[1560,16],[1640,16],[1640,62]],
  [[40,172],[40,419],[-11,419],[-11,382],[-75,382],[-75,336],[-127,336],[-127,264],[-211,264],[-211,189],[-142,189],[-142,140],[-67,140],[-67,172]],
  [[40,487],[40,831],[-15,831],[-15,787],[-90,787],[-90,725],[-164,725],[-164,674],[-207,674],[-207,546],[-137,546],[-137,490],[-52,490],[-52,450],[12,450],[12,487]],
  [[1560,132],[1640,132],[1640,168],[1733,168],[1733,237],[1814,237],[1814,355],[1751,355],[1751,431],[1684,431],[1684,467],[1560,467]],
  [[1560,512],[1635,512],[1635,561],[1690,561],[1690,600],[1812,600],[1812,693],[1737,693],[1737,781],[1657,781],[1657,827],[1560,827]],
  [[110,858],[405,858],[405,911],[470,911],[470,950],[429,950],[429,1009],[340,1009],[340,1072],[218,1072],[218,1032],[144,1032],[144,984],[64,984],[64,923],[110,923]],
  [[596,858],[984,858],[984,924],[945,924],[945,998],[880,998],[880,1070],[760,1070],[760,1031],[687,1031],[687,967],[615,967]],
  [[1107,858],[1560,858],[1560,902],[1669,902],[1669,977],[1583,977],[1583,1044],[1478,1044],[1478,1090],[1343,1090],[1343,1028],[1268,1028],[1268,975],[1177,975],[1177,922],[1107,922]]
];
const atCore = (x,y) => x>=40 && x<=1560 && y>=62 && y<=858;
const atSuburb = (x,y) => !atCore(x,y) && neighborhoods.some(points => inside(x,y,points));
const onDryLand = (x,y) => Math.abs(y-riverY(x)) > 94;

export function finishLandscape(root) {
  const oldChildren = [...root.childNodes];
  root.replaceChildren();
  const defs = el('defs', {}, root);
  path(polygon(core), '#fff', el('clipPath', {id:'outbreak-core-clip'}, defs));
  const urbanClip = el('clipPath', {id:'outbreak-urban-clip'}, defs);
  path(polygon(core), '#fff', urbanClip);
  for (const points of neighborhoods) path(polygon(points), '#fff', urbanClip);
  const dryClip = el('clipPath', {id:'outbreak-fringe-dry'}, defs);
  const north = [], south = [];
  for (let x=-280; x<=1880; x+=8) {
    north.push([x,riverY(x)-81]); south.push([x,riverY(x)+81]);
  }
  path(polygon([[-280,-200],[1880,-200],...north.reverse()]),'#fff',dryClip);
  path(polygon([...south,[1880,1100],[-280,1100]]),'#fff',dryClip);

  const farm = el('g', {'aria-hidden':'true'}, root), rng = random(771944);
  el('rect',{x:-280,y:-200,width:2160,height:1300,fill:'#d7e8c6'},farm);
  // Modest, differently sized agricultural parcels, rendered BEHIND every urban area.
  const cropColors=['#e1e8bb','#cce0b4','#e7e2bb','#d3e6ba','#bed8a9','#dce5b9'];
  for (let row=0; row<15; row++) for (let column=0; column<18; column++) {
    const x=-310+column*131+(row%2)*31, y=-210+row*95;
    const w=93+rng()*40, h=58+rng()*36;
    const corners=[[x+2,y+3],[x+w,y-4+rng()*12],[x+w+3,y+h],[x-4,y+h-3]];
    path(polygon(corners),cropColors[Math.floor(rng()*cropColors.length)],farm,{opacity:'.77'});
    if(rng()<.65)for(let k=1;k<5;k++)line(`M${x+12+k*14} ${y+11}L${x+9+k*14} ${y+h-10}`,'#f1efce',.8,farm,{opacity:'.55'});
  }
  // Distinct built-up patches, with agricultural openings between projecting suburbs.
  const city = el('g', {'aria-hidden':'true'}, root);
  path(polygon(core),'#eff2ee',city);
  for (const points of neighborhoods) path(polygon(points),'#eff2ee',city);

  // Rural through-roads continue beyond suburb limits, but no rectangular grid is
  // extended into the fields. Their urban sections are drawn again with urban road styling.
  const ruralRoads = el('g', {'aria-hidden':'true'}, root);
  for(const x of [350,850,1250]) {
    road(`M${x} -195L${x} 65`,5,ruralRoads);
    road(`M${x} 856L${x} 1098`,5,ruralRoads);
  }
  for(const y of [230,590,770]) {
    road(`M-278 ${y}L45 ${y}`,5,ruralRoads);
    road(`M1555 ${y}L1878 ${y}`,5,ruralRoads);
  }

  const fringe = el('g', {'clip-path':'url(#outbreak-urban-clip)','aria-hidden':'true'}, root);
  const streets = el('g', {'clip-path':'url(#outbreak-fringe-dry)'}, fringe);
  const paths = [];
  const addRoad = (d,width=5,major=false) => {
    road(d,width,streets,major);
    const probe=el('path',{d,fill:'none',stroke:'none'},streets);
    const length=probe.getTotalLength(),samples=[];
    for(let t=0;t<=length;t+=8){const p=probe.getPointAtLength(t);samples.push([p.x,p.y]);}
    probe.remove();paths.push(samples);
  };
  // The ten main approaches join REAL existing streets at the edge of the interactive core.
  for (const d of [
    'M-275 230C-166 231 -85 220 50 230','M-275 590C-158 575 -70 596 50 590',
    'M-275 770C-154 758 -63 786 50 770',
    'M1550 230C1644 217 1741 251 1880 230','M1550 590C1660 576 1764 619 1880 590',
    'M1550 770C1661 748 1776 790 1880 770',
    'M350 65C344 -7 321 -83 350 -200','M850 65C858 -21 823 -98 850 -200',
    'M1250 65C1260 -23 1218 -83 1250 -200',
    'M350 855C343 927 377 1016 350 1100','M850 855C863 919 830 1014 850 1100',
    'M1250 855C1262 917 1230 1000 1250 1100'
  ]) addRoad(d,9,true);
  // Small neighborhood streets are locally connected and vary in angle and curvature.
  // They are decorative outside the central graph, unlike the retained city streets.
  for(const d of [
    'M40 140L-88 140Q-126 140 -144 190L-145 230',
    'M40 320L-81 320Q-126 309 -144 265L-144 230',
    'M40 500Q-90 498 -130 556L-134 590',
    'M40 680L-102 680Q-142 665 -164 630L-164 590',
    'M40 810L-60 810Q-109 805 -132 772L-132 770',
    'M150 62L149 -22Q149 -51 194 -52L350 -52',
    'M250 62L249 -20L350 -20',
    'M450 62L452 -16Q482 -47 544 -47L850 -47',
    'M650 62L650 -89L850 -89',
    'M950 62L952 -62L850 -62',
    'M1050 62L1050 -10L1250 -10',
    'M1150 62L1150 -47L1250 -47',
    'M1350 62Q1357 -50 1450 -51L1450 2L1550 2',
    'M1450 62L1450 -25L1550 -25',
    'M1560 140L1685 140Q1738 163 1738 230',
    'M1560 320Q1700 309 1744 355L1744 390',
    'M1560 500L1690 500Q1742 512 1750 590',
    'M1560 680Q1689 685 1740 729L1740 770',
    'M1560 810L1660 810Q1706 814 1740 770',
    'M150 858L151 949Q180 976 238 976L350 976',
    'M250 858L250 925L350 925',
    'M450 858Q480 903 480 934L350 934',
    'M650 858L650 929Q695 961 759 961L850 961',
    'M750 858L750 923L850 923',
    'M950 858L950 998L850 998',
    'M1050 858L1050 916L1250 916',
    'M1150 858L1150 952L1250 952',
    'M1350 858L1350 994L1250 994',
    'M1450 858Q1450 916 1510 932L1590 932L1590 970L1350 970'
  ])addRoad(d);

  // Houses align along suburban streets, instead of a regular rectangular background.
  // A full 12x12 footprint must remain inside a neighborhood and away from any road.
  const homes=el('g',{},fringe);
  const distanceToRoute=(x,y,points)=>{
    let closest=Infinity;
    for(let i=1;i<points.length;i++){
      const [ax,ay]=points[i-1],[bx,by]=points[i],dx=bx-ax,dy=by-ay;
      const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));
      closest=Math.min(closest,Math.hypot(x-(ax+t*dx),y-(ay+t*dy)));
    }
    return closest;
  };
  for(const points of paths)for(let i=2;i<points.length-2;i+=3){
    const [x,y]=points[i],a=points[i-2],b=points[i+2];
    const dx=b[0]-a[0],dy=b[1]-a[1],size=Math.hypot(dx,dy)||1;
    for(const side of [-1,1]){
      if(rng()<.17)continue;
      const cx=x+side*(-dy/size)*(17+rng()*4),cy=y+side*(dx/size)*(17+rng()*4);
      if(!onDryLand(cx,cy)||!atSuburb(cx,cy))continue;
      const whollyInside=neighborhoods.some(area=>[[cx-7,cy-7],[cx+7,cy-7],[cx+7,cy+7],[cx-7,cy+7]].every(([px,py])=>inside(px,py,area)));
      if(!whollyInside||paths.some(route=>distanceToRoute(cx,cy,route)<13))continue;
      el('rect',{x:cx-5.2,y:cy-4.2,width:10.4,height:8.4,rx:1,
        fill:rng()<.23?'#d1d8d5':'#c2cbc9',stroke:'#b7c3c0','stroke-width':.5},homes);
    }
  }

  // The same river continues past the city; roads and buildings never cross water.
  path(riverBand(-80,80),'#a5d39e',root);
  path(riverBand(-54,54),'#84cde9',root,{stroke:'#acd7db','stroke-width':1.2});
  line(riverLine(-62),'#8cbe8e',1.5,root);
  line(riverLine(62),'#8cbe8e',1.5,root);

  // Reuse ALL original SVG objects, unchanged: central streets, lots, nodes,
  // schools, hospital, river, crossings, labels and their interactive selectors.
  const center=el('g',{'clip-path':'url(#outbreak-core-clip)','data-layer':'urban-core'},root);
  for(const child of oldChildren)center.append(child);
  const centralStreets=center.querySelector('g[clip-path="url(#city-dry-land)"]');
  if(centralStreets){
    const avenue=el('g',{'clip-path':'url(#city-dry-land)','aria-hidden':'true'},null);
    centralStreets.after(avenue); // BEFORE buildings and nodes: no street overlay on homes.
    for(const bank of [-1,1]){
      road(riverLine(bank*89,-15,1615),7,avenue);
      line(riverLine(bank*79,-15,1615),'#79b881',1.4,avenue);
    }
  }
}
