import {WIDTH, HEIGHT, riverY} from './city-data.js';

// Scenic suburbs only: all interactive buildings and road nodes stay in city-map.js.
const NS='http://www.w3.org/2000/svg';
const svg=(name,attrs={},parent)=>{const node=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));parent?.append(node);return node;};
const shape=(d,fill,parent,attrs={})=>svg('path',{d,fill,...attrs},parent);
const stroke=(d,color,width,parent,attrs={})=>shape(d,'none',parent,{stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...attrs});
const street=(d,width,parent,major=false)=>{stroke(d,major?'#c9bb94':'#dbe0dd',width+2,parent);stroke(d,major?'#f2d893':'#fff',width,parent);};
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const polygon=p=>'M'+p.map(([x,y])=>`${x},${y}`).join('L')+'Z';
const contains=(p,x,y)=>{let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside;return inside;};
const riverCoords=offset=>{const p=[];for(let x=-300;x<=1900;x+=10)p.push([x,riverY(x)+offset]);return p;};
const riverBand=(a,b)=>polygon([...riverCoords(a),...riverCoords(b).reverse()]);
const isDry=(x,y)=>Math.abs(y-riverY(x))>96;
const insideCore=(x,y)=>x>=0&&x<=WIDTH&&y>=0&&y<=HEIGHT;

// District-level street orientations rather than one citywide grid or a cloud perimeter.
const quarters=[
 {name:'Jardim das Palmeiras',c:[240,-80],a:-11,dx:81,dy:69,p:[[-65,65],[-44,-1],[24,-34],[63,-122],[163,-178],[293,-159],[390,-122],[474,-145],[562,-66],[560,78],[412,94],[296,101],[148,90],[30,127]]},
 {name:'Alto do Mirante',c:[800,-104],a:7,dx:77,dy:66,p:[[500,72],[505,-58],[581,-113],[642,-197],[793,-199],[874,-155],[1014,-181],[1095,-96],[1151,25],[1133,103],[959,77],[789,100],[636,85]]},
 {name:'Bosque Norte',c:[1410,-76],a:-15,dx:83,dy:69,p:[[1118,87],[1130,-21],[1187,-79],[1303,-103],[1391,-178],[1525,-155],[1646,-87],[1720,6],[1708,157],[1568,152],[1480,95],[1310,107]]},
 {name:'Vila do Oeste',c:[-120,166],a:15,dx:72,dy:61,p:[[40,61],[-37,51],[-106,93],[-170,77],[-238,148],[-256,254],[-179,329],[-102,351],[32,311],[89,248]]},
 {name:'Jardim do Lago',c:[-142,695],a:-10,dx:76,dy:64,p:[[21,466],[-88,484],[-176,514],[-247,608],[-233,748],[-188,847],[-68,905],[60,905],[122,829],[81,710]]},
 {name:'Vale das Flores',c:[1715,230],a:13,dx:74,dy:67,p:[[1521,69],[1633,81],[1747,137],[1851,148],[1880,263],[1836,354],[1740,402],[1619,364],[1548,301]]},
 {name:'Parque das Águas',c:[1703,764],a:-13,dx:78,dy:63,p:[[1550,590],[1687,615],[1770,683],[1880,676],[1880,836],[1801,916],[1695,918],[1620,878],[1525,800]]},
 {name:'Santa Clara',c:[274,1010],a:13,dx:75,dy:64,p:[[32,826],[157,836],[252,870],[352,862],[452,923],[473,1042],[387,1092],[240,1095],[138,1043],[31,1009],[-38,907]]},
 {name:'Jardim Primavera',c:[832,1027],a:-8,dx:79,dy:67,p:[[558,831],[680,844],[811,869],[966,853],[1086,908],[1072,998],[1005,1100],[792,1100],[690,1068],[570,1027]]},
 {name:'Colinas',c:[1433,1005],a:17,dx:83,dy:65,p:[[1119,844],[1261,842],[1374,861],[1489,836],[1594,902],[1730,943],[1722,1053],[1602,1100],[1379,1100],[1268,1029],[1141,986]]}
];

function drawFields(parent){
  svg('rect',{x:-310,y:-220,width:2220,height:1350,fill:'#dcebcf'},parent);
  const random=rng(31542),colors=['#d6e7bb','#e8e9c7','#cde0b6','#dce5b6','#d3e3c9'];
  // Large irregular farm parcels sit under the built-up area, not over its streets.
  for(let j=0;j<5;j++)for(let i=0;i<8;i++){
    const x=-360+i*305+j*12,y=-260+j*300+i*7,w=220+random()*80,h=170+random()*93;
    shape(polygon([[x,y+14],[x+w-13,y-7],[x+w+8,y+h-22],[x+22,y+h+8]]),colors[(i+2*j)%colors.length],parent,{opacity:.63});
    if(random()<.55)for(let k=1;k<=5;k++)stroke(`M${x+20+k*26} ${y+24}L${x+37+k*26} ${y+h-22}`,'#edf0d3',.85,parent,{opacity:.4});
  }
  for(const d of ['M-280 13Q-221 -47 -147 -35L-90 9L-141 71L-277 112Z','M1769 38Q1844 7 1900 73L1900 182L1803 142Z','M-298 952L-210 900Q-124 929 -100 1060L-226 1124L-298 1084Z','M1778 990Q1863 965 1900 1024L1900 1120L1779 1110Z'])shape(d,'#b5d5a9',parent,{opacity:.65});
}

function drawQuarter(q,index,underlay,roadsLayer,buildingLayer,defs){
  const id=`outbreak-quarter-${index}`;
  shape(polygon(q.p),'white',svg('clipPath',{id},defs));
  shape(polygon(q.p),'#eff2ee',underlay);
  const roadGroup=svg('g',{'clip-path':`url(#${id})`},roadsLayer);
  const buildingGroup=svg('g',{'clip-path':`url(#${id})`},buildingLayer);
  const transform=`translate(${q.c[0]} ${q.c[1]}) rotate(${q.a})`;
  const rg=svg('g',{transform},roadGroup),hg=svg('g',{transform},buildingGroup);
  // Rotated local street grids, with intersections sharing identical coordinates.
  for(let x=-510;x<=510;x+=q.dx)street(`M${x} -360L${x} 360`,4.4,rg);
  for(let y=-360;y<=360;y+=q.dy)street(`M-520 ${y}L520 ${y}`,4.4,rg);
  const r=rng(5107+index*761),angle=q.a*Math.PI/180,ca=Math.cos(angle),sa=Math.sin(angle);
  for(let gx=-510;gx<510;gx+=q.dx)for(let gy=-360;gy<360;gy+=q.dy){
    for(const [ox,oy] of [[.22,.26],[.54,.26],[.22,.61],[.54,.61]]){
      const lx=gx+q.dx*ox,ly=gy+q.dy*oy;
      const x=q.c[0]+lx*ca-ly*sa,y=q.c[1]+lx*sa+ly*ca;
      if(insideCore(x,y)||!isDry(x,y)||!contains(q.p,x,y)||r()<.21)continue;
      if((Math.min(...[350,850,1250].map(t=>Math.abs(x-t)))<14&&(y<70||y>840))||
        (Math.min(...[230,590,770].map(t=>Math.abs(y-t)))<14&&(x<24||x>1576)))continue;
      svg('rect',{x:lx,y:ly,width:8+r()*5,height:7+r()*5,rx:1,fill:r()<.22?'#d4dad8':'#c9d0ce'},hg);
    }
  }
}

function drawRuralRoads(parent){
  // Approaches meet the existing major axes, and are clipped at the riverbanks.
  for(const x of [350,850,1250]){street(`M${x} -220L${x} 20`,7,parent,true);street(`M${x} 879L${x} 1130`,7,parent,true);}
  for(const y of [230,590,770]){
    street(`M-310 ${y}L22 ${y}`,7,parent,y===230);
    if(y!==590)street(`M1578 ${y}L1910 ${y}`,7,parent,y===230);
  }
}

export function finishLandscape(root){
  const original=[...root.childNodes];root.replaceChildren();
  const defs=svg('defs',{},root);
  const coreClip=svg('clipPath',{id:'outbreak-core-visible'},defs);
  svg('rect',{x:0,y:0,width:WIDTH,height:HEIGHT},coreClip);
  const dry=svg('clipPath',{id:'outbreak-dry-fringe'},defs);
  shape(polygon([[-310,-220],[1910,-220],...riverCoords(-84).reverse()]),'white',dry);
  shape(polygon([...riverCoords(84),[1910,1130],[-310,1130]]),'white',dry);

  const land=svg('g',{'aria-hidden':'true'},root);drawFields(land);
  // The core and every surrounding quarter use the same land tint: no rectangular seam.
  svg('rect',{x:0,y:0,width:WIDTH,height:HEIGHT,fill:'#eff2ee'},root);
  const quarterLand=svg('g',{'aria-hidden':'true'},root);
  const ruralRoads=svg('g',{'clip-path':'url(#outbreak-dry-fringe)','aria-hidden':'true'},root);drawRuralRoads(ruralRoads);
  const quarterRoads=svg('g',{'clip-path':'url(#outbreak-dry-fringe)','aria-hidden':'true'},root);
  const quarterBuildings=svg('g',{'clip-path':'url(#outbreak-dry-fringe)','aria-hidden':'true'},root);
  quarters.forEach((q,i)=>drawQuarter(q,i,quarterLand,quarterRoads,quarterBuildings,defs));

  shape(riverBand(-82,82),'#a8d39f',root);
  shape(riverBand(-54,54),'#84cde9',root,{stroke:'#a8d4d7','stroke-width':1.1});

  // Keep all original interactive map layers except its rectangular opaque base.
  // The full original view rect, rather than the old inset clip, preserves district labels.
  const center=svg('g',{'clip-path':'url(#outbreak-core-visible)','data-layer':'urban-core'},root);
  for(const child of original){
    if(child.tagName?.toLowerCase()==='rect'&&child.getAttribute('width')===String(WIDTH)&&child.getAttribute('height')===String(HEIGHT))continue;
    center.append(child);
  }
  const names=svg('g',{'aria-hidden':'true'},root);
  for(const q of quarters){
    const [x,y]=q.c;if(insideCore(x,y)||Math.abs(y-riverY(x))<150)continue;
    const t=svg('text',{x,y,'text-anchor':'middle',class:'outskirts-label'},names);t.textContent=q.name;
  }
}
