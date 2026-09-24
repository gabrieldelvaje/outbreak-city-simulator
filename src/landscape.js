import {WIDTH,HEIGHT,riverY} from './city-data.js';

const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},parent)=>{
  const node=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));
  parent?.append(node);return node;
};
const path=(d,fill,parent,extra={})=>el('path',{d,fill,...extra},parent);
const line=(d,color,width,parent,extra={})=>path(d,'none',parent,{stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...extra});
const road=(d,width,parent,major=false)=>{
  line(d,major?'#cdb574':'#e0e5e1',width+3,parent);
  line(d,major?'#f0d58b':'#fff',width,parent);
};
const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const riverline=(offset,from=-270,to=1870)=>{
  const pts=[];for(let x=from;x<=to;x+=8)pts.push(`${x},${(riverY(x)+offset).toFixed(1)}`);
  return 'M'+pts.join('L');
};
const ribbon=(a,b)=>{
  const first=[],last=[];
  for(let x=-270;x<=1870;x+=8){first.push(`${x},${(riverY(x)+a).toFixed(1)}`);last.push(`${x},${(riverY(x)+b).toFixed(1)}`);}
  return `M${first.join('L')}L${last.reverse().join('L')}Z`;
};

// Irregular perimeters are strictly visual. The original central grid retains
// the same coordinate system, building footprints and interactive node IDs.
const CORE='M25 83 Q120 51 246 79 Q351 42 496 69 Q650 100 807 61 Q941 38 1096 79 Q1248 41 1370 76 Q1531 40 1573 156 Q1590 292 1567 413 Q1604 537 1574 654 Q1595 764 1550 865 Q1458 905 1346 870 Q1190 917 1070 881 Q892 909 759 876 Q598 924 462 873 Q318 913 192 873 Q58 889 31 762 Q-3 630 28 509 Q0 375 29 258Z';
const TOWN='M-157 269 Q-181 160 -67 111 Q12 23 143 36 Q255 -73 421 -27 Q577 -87 736 -33 Q884 -95 1049 -17 Q1209 -91 1361 -25 Q1557 -25 1631 107 Q1744 110 1768 278 Q1817 419 1715 556 Q1787 704 1688 852 Q1623 987 1459 960 Q1258 1041 1098 950 Q933 1033 762 977 Q568 1030 407 944 Q233 1026 95 904 Q-97 921 -133 775 Q-214 627 -143 470 Q-198 363 -157 269Z';

export function finishLandscape(root){
  const original=[...root.childNodes];root.replaceChildren();
  const defs=el('defs',{},root);
  path(TOWN,'#fff',el('clipPath',{id:'outbreak-town-clip'},defs));
  path(CORE,'#fff',el('clipPath',{id:'outbreak-core-clip'},defs));
  const dry=el('clipPath',{id:'outbreak-fringe-dry'},defs);
  const north=[],south=[];
  for(let x=-280;x<=1880;x+=8){north.push(`${x},${(riverY(x)-81).toFixed(1)}`);south.push(`${x},${(riverY(x)+81).toFixed(1)}`);}
  path(`M-280,-200L1880,-200L${north.reverse().join('L')}Z`,'#fff',dry);
  path(`M${south.join('L')}L1880,1100L-280,1100Z`,'#fff',dry);

  // Farm parcels are behind the built-up city, never on top of the road network.
  const land=el('g',{'aria-hidden':'true'},root),r=random(771944);
  el('rect',{x:-280,y:-200,width:2160,height:1300,fill:'#d5e7c3'},land);
  const colors=['#c2dda8','#e6e6b7','#d3e3a9','#dbe9bf','#b9d6a2','#e5dfb1'];
  for(let y=-225;y<1130;y+=105)for(let x=-325;x<1930;x+=148){
    const dx=(r()-.5)*30,dy=(r()-.5)*20,w=105+r()*47,h=67+r()*39;
    path(`M${x+dx},${y+dy}l${w},${-8+r()*16}l${-10+r()*18},${h}l${-w+9},${5-r()*10}Z`,colors[Math.floor(r()*colors.length)],land,{opacity:.82});
    if(r()<.48)for(let k=0;k<5;k++)line(`M${x+dx+13+k*14} ${y+dy+12}l${-5+k*.8} ${h-22}`,'#f0edcb',1,land,{opacity:.55});
  }
  for(let i=0;i<270;i++){
    const x=-265+r()*2130,y=-185+r()*1250;
    el('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:(2+r()*5).toFixed(1),fill:r()<.5?'#a3cc8f':'#8fbe80',opacity:.53},land);
  }

  path(TOWN,'#eef2eb',root,{stroke:'#d1ddcc','stroke-width':3});
  const suburb=el('g',{'clip-path':'url(#outbreak-town-clip)','aria-hidden':'true'},root);
  const streets=el('g',{'clip-path':'url(#outbreak-fringe-dry)'},suburb);
  const routes=[];
  const addRoad=(d,w=6,major=false)=>{
    road(d,w,streets,major);
    const probe=el('path',{d,fill:'none',stroke:'none'},streets),length=probe.getTotalLength(),pts=[];
    for(let t=0;t<=length;t+=8){const p=probe.getPointAtLength(t);pts.push([p.x,p.y]);}
    probe.remove();routes.push(pts);
  };
  // Roads reach the old grid only at its existing street centers.
  for(const d of [
    'M-240 224C-141 205 -54 222 50 230','M-240 584C-123 549 -39 592 50 590',
    'M1550 230C1634 216 1706 260 1840 239','M1550 590C1651 554 1768 601 1855 579',
    'M350 50C323 -14 289 -67 262 -146','M850 50C827 -26 879 -78 910 -167',
    'M1250 50C1289 -4 1317 -82 1380 -164','M350 850C300 901 267 973 207 1097',
    'M850 850C886 912 847 997 876 1090','M1250 850C1278 929 1370 976 1380 1100'
  ])addRoad(d,11,true);
  for(const d of [
    'M-240 775C-121 798 -33 747 50 770','M1550 770C1654 741 1768 799 1850 754',
    'M-176 143C-102 91 -8 65 90 85','M1500 93C1593 70 1689 144 1764 194',
    'M-164 850C-75 916 26 948 150 878','M1440 878C1545 955 1651 911 1717 835',
    'M-105 155C-62 290 -56 393 -125 479','M1676 197C1641 338 1704 410 1701 556',
    'M-136 316Q-28 275 46 305','M-143 709Q-19 686 35 722',
    'M1571 311Q1660 291 1744 350','M1565 693Q1681 643 1732 706',
    'M120 84Q210 -15 330 47','M1043 73Q1132 -25 1250 50',
    'M450 885Q540 971 655 888','M989 896Q1086 1000 1220 872'
  ])addRoad(d,5);

  // Peripheral buildings are not graph nodes. No building covers a street.
  const houses=el('g',{},suburb);
  const distance=(x,y,pts)=>{
    let nearest=Infinity;
    for(let k=1;k<pts.length;k++){
      const [ax,ay]=pts[k-1],[bx,by]=pts[k],dx=bx-ax,dy=by-ay;
      const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));
      nearest=Math.min(nearest,Math.hypot(x-ax-t*dx,y-ay-t*dy));
    }return nearest;
  };
  for(let i=0;i<690;i++){
    const x=-145+r()*1880,y=-55+r()*1020;
    if(x<=-150||x>=1740||y<=-60||y>=980||x>65&&x<1545&&y>100&&y<856)continue;
    if(Math.abs(y-riverY(x))<127||routes.some(route=>distance(x,y,route)<17))continue;
    const w=8+r()*11,h=7+r()*10;
    el('rect',{x:x-w/2,y:y-h/2,width:w,height:h,rx:1,
      transform:`rotate(${(-18+r()*36).toFixed(1)} ${x} ${y})`,
      fill:r()<.26?'#d6dad6':'#c4cdcb',stroke:'#bac5c3','stroke-width':.5},houses);
  }

  // Same channel equation inside and outside the interactive core.
  path(ribbon(-80,80),'#9dcf99',root);
  path(ribbon(-54,54),'#84cde9',root,{stroke:'#a8d4d7','stroke-width':1.5});
  const core=el('g',{'clip-path':'url(#outbreak-core-clip)','data-layer':'urban-core'},root);
  for(const child of original)core.append(child);
  // Bankside boulevards go BELOW the parcel layer, NOT over homes or parks.
  // Existing north/south grid streets connect directly at the avenue intersections.
  const grid=core.querySelector('g[clip-path="url(#city-dry-land)"]');
  if(grid){
    const quay=el('g',{'clip-path':'url(#city-dry-land)','aria-hidden':'true'},null);
    grid.after(quay);
    for(const bank of [-1,1]){
      road(riverline(bank*89,-30,1630),7,quay);
      line(riverline(bank*79,-30,1630),'#7ab780',1.6,quay);
    }
  }
}
