import {WIDTH,HEIGHT,riverY,bridges,districts,places,placeColors,placeGlyphs} from './city-data.js';

// Fictional cartography. All geometry lives in one shared map coordinate system.
// Decorative suburbs and fields contain no epidemic agents.
const NS='http://www.w3.org/2000/svg';
const S=(tag,a={},parent)=>{const n=document.createElementNS(NS,tag);for(const [key,val] of Object.entries(a))n.setAttribute(key,String(val));parent?.append(n);return n;};
const P=(d,fill,parent,a={})=>S('path',{d,fill,...a},parent);
const L=(d,stroke,width,parent,a={})=>P(d,'none',parent,{stroke,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...a});
const R=(x,y,width,height,fill,parent,a={})=>S('rect',{x,y,width,height,fill,...a},parent);
const C=(cx,cy,r,fill,parent,a={})=>S('circle',{cx,cy,r,fill,...a},parent);
const T=(content,x,y,parent,klass,a={})=>{const n=S('text',{x,y,class:klass,...a},parent);n.textContent=content;return n;};
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const poly=pts=>'M'+pts.map(([x,y])=>`${x.toFixed(1)} ${y.toFixed(1)}`).join('L')+'Z';
const riverPts=(offset,a=-275,b=1875)=>{const out=[];for(let x=a;x<=b;x+=7)out.push([x,riverY(x)+offset]);out.push([b,riverY(b)+offset]);return out;};
const band=(a,b)=>poly([...riverPts(a),...riverPts(b).reverse()]);
const label=(text,x,y,parent,klass,a={})=>T(text,x,y,parent,klass,{'text-anchor':'middle',...a});

export function finishLandscape(root){
  // This is an intentional replacement of the old grid AND the old fringe.
  // Stable place/home/bridge selectors remain compatible with src/map.js.
  root.replaceChildren();
  const r=rng(524817),defs=S('defs',{},root),dry=S('clipPath',{id:'ob-dry-v2'},defs);
  P(poly([[-320,-260],[1940,-260],...riverPts(-90,-320,1940).reverse()]),'#fff',dry);
  P(poly([...riverPts(90,-320,1940),[1940,1210],[-320,1210]]),'#fff',dry);
  const townClip=S('clipPath',{id:'ob-urban-v2'},defs);
  // Soft, generously sized outer city shape; no square-cell or stepped mask.
  const north='M-170 275Q-202 147 -90 82Q-13 26 110 48Q207 -49 386 -41Q520 -2 652 -81Q841 -134 1033 -64Q1195 -94 1357 -38Q1575 -67 1694 91Q1810 158 1802 305Q1775 412 1870 472L1885 581L-230 581Z';
  const south='M-215 410L1890 435Q1882 652 1781 723Q1830 856 1671 932Q1540 1010 1395 981Q1240 1055 1080 1018Q926 1103 729 1039Q536 1121 395 1030Q223 1072 105 996Q-77 976 -149 863Q-238 758 -198 631Z';
  for(const d of [north,south])P(d,'#fff',townClip);

  const base=S('g',{'aria-hidden':'true'},root);
  R(-320,-260,2260,1470,'#dae9cb',base);
  // Broad, slanted agricultural parcels are scenery behind the whole city.
  for(let k=0;k<75;k++){
    const x=-390+(k%12)*202+(r()-.5)*78,y=-310+Math.floor(k/12)*265+(r()-.5)*62;
    const w=126+r()*120,h=100+r()*130,sl=(r()-.5)*38;
    P(poly([[x,y],[x+w,y+sl],[x+w+sl*.3,y+h+sl*.4],[x+sl*.3,y+h]]),
      ['#d1e3bb','#e6e7be','#c5dbad','#dae5bd','#e6e1b7','#bcd7ad'][Math.floor(r()*6)],base,{opacity:.81});
  }
  for(const d of [
    'M-320 145Q-200 74 -83 109Q27 175 18 258Q-95 326 -207 308L-320 310Z',
    'M1440 -260Q1555 -183 1681 -218Q1804 -170 1940 -218L1940 64Q1815 89 1750 31Q1602 73 1520 -25Z',
    'M-320 925Q-213 811 -100 863Q35 893 59 1007Q-10 1125 -184 1210L-320 1210Z',
    'M1540 980Q1650 877 1771 941Q1882 920 1940 843L1940 1210L1550 1210Z'
  ])P(d,'#b9d9ad',base,{opacity:.68});
  const land=S('g',{'clip-path':'url(#ob-urban-v2)','aria-hidden':'true'},root);
  R(-270,-180,2170,1330,'#f1f2ef',land);
  for(const [d,color] of [
    ['M-200 25Q70 -83 298 -11L366 205Q215 242 55 217L-190 222Z','#eef0eb'],
    ['M744 -119Q1021 -160 1250 -51L1323 182Q1156 250 986 190L814 193Z','#eff1ec'],
    ['M-177 709Q82 664 226 727L310 961Q88 1046 -135 920Z','#eef0e9'],
    ['M1300 780Q1600 709 1845 834L1810 1044Q1585 1091 1330 978Z','#eff1ec'],
    ['M-230 362Q-56 318 44 360L70 531Q-41 584 -230 554Z','#e8eedf'],
    ['M1540 408Q1747 333 1915 380L1925 585Q1732 630 1582 541Z','#e9efdf'],
    ['M93 944Q244 886 339 937Q397 1022 340 1120L101 1134Z','#e7eedf'],
    ['M1080 -178Q1198 -109 1314 -137Q1387 -83 1380 16L1090 36Z','#e6eddd']
  ])P(d,color,land);
  const river=S('g',{'aria-hidden':'true'},root);
  P(band(-79,79),'#b5dba9',river);
  P(band(-57,57),'#84cde8',river,{stroke:'#b0dbe6','stroke-width':1.2});
  for(const side of [-1,1])L('M'+riverPts(side*63).map(p=>p.join(' ')).join('L'),'#8ecb99',2,river);

  // Roads and buildings use the SAME line geometry. Two clip paths ensure
  // no road reaches the water or continues as a city grid into farmland.
  const roadInTown=S('g',{'clip-path':'url(#ob-urban-v2)','aria-hidden':'true'},root);
  const streets=S('g',{'clip-path':'url(#ob-dry-v2)'},roadInTown),roads=[];
  function roadway(d,kind='local'){
    const w=kind==='trunk'?13:kind==='arterial'?10:kind==='collector'?7.6:4.5;
    const edge=kind==='trunk'?'#abb9b6':kind==='arterial'?'#dbbd83':'#dce2df';
    const body=kind==='trunk'?'#f9faf7':kind==='arterial'?'#f3db9e':'#ffffff';
    L(d,edge,w+3.1,streets);L(d,body,w,streets);
    const probe=P(d,'none',streets,{stroke:'none'}),length=probe.getTotalLength(),sample=[];
    for(let t=0;t<=length;t+=9){const p=probe.getPointAtLength(t);sample.push([p.x,p.y]);}
    const last=probe.getPointAtLength(length);sample.push([last.x,last.y]);probe.remove();
    roads.push({sample,w});
  }
  // Through-routes and collectors follow broad corridors, not tile boundaries.
  roadway('M-310 -51Q82 -116 400 -87Q690 -148 975 -100Q1329 -141 1609 -72Q1841 -5 1920 140','trunk');
  roadway('M-305 1064Q27 964 291 1025Q555 1071 778 1040Q1173 1091 1517 1030Q1772 1053 1940 923','trunk');
  roadway('M-320 210Q115 190 349 185Q659 205 854 180Q1168 204 1480 181Q1750 190 1940 229','arterial');
  roadway('M-320 675Q30 682 365 660Q625 643 854 668Q1145 647 1453 677Q1696 695 1940 643','arterial');
  roadway('M-300 834Q40 810 352 835Q585 861 875 818Q1224 827 1550 852Q1783 888 1940 806','collector');
  roadway('M-280 79Q6 102 235 85Q479 72 732 97Q1015 69 1311 91Q1645 74 1900 115','collector');
  roadway('M-300 291Q54 299 333 292Q628 302 854 277Q1092 301 1420 293Q1685 312 1940 295','collector');
  roadway('M-300 588Q60 570 365 595Q596 571 868 589Q1228 566 1573 591Q1740 598 1940 577','collector');
  roadway('M-290 753Q59 742 357 762Q641 744 859 762Q1141 737 1502 767Q1760 768 1940 743','collector');
  roadway('M-260 924Q89 909 347 942Q606 924 858 944Q1138 916 1497 947Q1733 978 1940 942','collector');
  for(const [x,bend] of [[-105,-20],[50,12],[169,-17],[279,20],[350,0],[431,-14],[559,22],[668,-11],[769,25],[850,0],[954,-15],[1078,18],[1173,-12],[1250,0],[1368,20],[1491,-14],[1603,25],[1750,-18]]){
    const main=[350,850,1250].includes(x);
    roadway(`M${x+bend} -160 Q${x-bend*.6} 110 ${x} 305 Q${x+bend*.3} 455 ${x} 592 Q${x-bend*.4} 791 ${x+bend} 1110`,main?'arterial':'collector');
  }
  // Oblique and gently bending streets break the grid in outer districts.
  for(const d of [
    'M-185 400Q45 351 226 306','M230 80Q320 7 443 -26',
    'M900 88Q997 28 1120 -38','M1444 92Q1570 10 1715 -38',
    'M-173 838Q-75 911 43 972','M378 947Q489 1006 600 1055',
    'M1040 950Q1123 998 1210 1072','M1545 932Q1655 1009 1763 1057',
    'M70 345Q123 420 164 520','M1580 350Q1512 420 1493 538'
  ])roadway(d);
  // The two continuous riverside avenues connect with landward feeders.
  for(const side of [-1,1])roadway('M'+riverPts(side*89).map(p=>`${p[0]} ${p[1].toFixed(1)}`).join('L'),'collector');

  const parks=S('g',{'aria-hidden':'true'},root);
  for(const [x,y,rx,ry] of [[118,170,55,43],[730,166,70,41],[1486,165,53,43],[95,643,53,46],[748,748,49,43],[1525,813,58,43],[-75,735,80,90],[1700,332,68,84],[1550,986,86,58]]){
    P(`M${x-rx} ${y-ry*.4}Q${x-rx*.85} ${y-ry} ${x-rx*.23} ${y-ry}Q${x+rx*.74} ${y-ry*1.07} ${x+rx} ${y-ry*.25}Q${x+rx*1.1} ${y+ry*.68} ${x+rx*.26} ${y+ry}Q${x-rx*.87} ${y+ry*.93} ${x-rx} ${y-ry*.4}Z`,'#c2dfa9',parks,{stroke:'#aed29f','stroke-width':1});
    for(let i=0;i<9;i++)C(x+(r()-.5)*rx*1.5,y+(r()-.5)*ry*1.25,2+r()*3,'#a2cc97',parks);
  }
  // Dedicated public-building footprints exactly match the clickable markers.
  const sites=S('g',{'aria-hidden':'true'},root);
  const reserved=places.map(p=>({x:p.x,y:p.y,r:p.type==='park'?51:47}));
  for(const p of places){const x=p.x,y=p.y;
    if(p.type==='park'){
      P(`M${x-39} ${y-31}L${x+32} ${y-36}Q${x+44} ${y} ${x+38} ${y+28}L${x-32} ${y+34}Z`,'#b7dba5',sites,{stroke:'#97c68f','stroke-width':1});
      L(`M${x-35} ${y+22}Q${x} ${y+2} ${x+34} ${y-21}`,'#f5f7ed',3,sites);
      for(let i=0;i<12;i++)C(x-27+r()*56,y-25+r()*49,2+r()*3,'#8bbf83',sites);
      continue;
    }
    const ground={school:'#e6eddf',hospital:'#f3e4e6',civic:'#e6ebee',market:'#f6ede0',office:'#e7e9ec'}[p.type];
    R(x-38,y-31,76,62,ground,sites,{rx:5,stroke:'#d9deda','stroke-width':1});
    if(p.type==='school'){
      R(x-30,y-22,57,25,'#acbac1',sites,{rx:2});R(x-30,y+9,57,15,'#d2c9aa',sites,{rx:1});L(`M${x-27} ${y+16}h49`,'#fff',1,sites);
    }else if(p.type==='hospital'){
      R(x-30,y-21,60,42,'#aebbc2',sites,{rx:2});R(x-7,y-6,14,14,'#fff',sites,{rx:2});L(`M${x} ${y-4}v10M${x-5} ${y+1}h10`,'#c95760',2.5,sites);
    }else if(p.type==='civic'){
      R(x-29,y-19,58,37,'#adbcc6',sites,{rx:1});L(`M${x-32} ${y-21}h64`,'#8e9da7',3,sites);
      for(const dx of [-17,-5,7,19])R(x+dx,y,5,15,'#ebf0f1',sites);
    }else if(p.type==='market'){
      R(x-31,y-20,62,37,'#babebc',sites,{rx:2});R(x-31,y-20,62,8,'#db9a67',sites);
      for(const dx of [-21,-5,12])R(x+dx,y-4,9,11,'#eaf1f1',sites);
    }else{
      R(x-30,y-24,27,42,'#aebac2',sites,{rx:2});R(x+4,y-19,26,37,'#9cabb5',sites,{rx:2});
      for(const dx of [-24,-14,-4,9,19])for(const dy of [-12,-3,6])R(x+dx,y+dy,4,4,'#e8efee',sites);
    }
  }

  // An indexed spatial collision test positions residences on buildings,
  // never in roads, water, reserved civic sites or planted public parks.
  const roadBins=new Map(),bucket=36;
  for(const rd of roads)for(const [px,py] of rd.sample){
    const key=`${Math.floor(px/bucket)}:${Math.floor(py/bucket)}`;
    if(!roadBins.has(key))roadBins.set(key,[]);
    roadBins.get(key).push([px,py,rd.w]);
  }
  const nearStreet=(x,y,clearance)=>{
    const bx=Math.floor(x/bucket),by=Math.floor(y/bucket);
    for(let yy=by-1;yy<=by+1;yy++)for(let xx=bx-1;xx<=bx+1;xx++){
      for(const p of roadBins.get(`${xx}:${yy}`)||[])if(Math.hypot(x-p[0],y-p[1])<clearance+p[2]/2+2)return true;
    }
    return false;
  };
  const buildings=S('g',{'aria-hidden':'true'},root),homes=S('g',{id:'homes-layer'},root),blocks=[];
  const density=(x,y)=>{
    if(x>-5&&x<1605&&y>-5&&y<910)return .93;
    const dist=Math.hypot(Math.max(0,100-x,x-1490),Math.max(0,120-y,y-812));
    return Math.max(.05,.67-dist/340);
  };
  const greenSites=[[118,170,55,43],[730,166,70,41],[1486,165,53,43],[95,643,53,46],[748,748,49,43],[1525,813,58,43]];
  for(let y=-118;y<1060;y+=21)for(let x=-165;x<1830;x+=23){
    const cx=x+(r()-.5)*10,cy=y+(r()-.5)*9;
    if(Math.abs(cy-riverY(cx))<103||r()>density(cx,cy))continue;
    const w=8+r()*7,h=8+r()*7;
    if(reserved.some(p=>Math.abs(cx-p.x)<p.r+11&&Math.abs(cy-p.y)<p.r+10)||
       nearStreet(cx,cy,Math.max(w,h)*.44+1)||
       greenSites.some(p=>Math.abs(cx-p[0])<p[2]+9&&Math.abs(cy-p[1])<p[3]+9))continue;
    R(cx-w/2,cy-h/2,w,h,r()<.22?'#d7dddd':'#c7cfd0',buildings,{rx:1.5,stroke:'#bdc6c6','stroke-width':.6});
    blocks.push({x:cx,y:cy});
  }
  const eligible=blocks.filter(b=>b.x>32&&b.x<1565&&b.y>45&&b.y<870);
  let homeCount=0;
  for(let i=0;i<eligible.length&&homeCount<230;i+=Math.max(1,Math.floor(eligible.length/230))){
    const b=eligible[i];homeCount++;
    const region=b.y<riverY(b.x)?(b.x<800?'norte-verde':b.x<1350?'jardim-do-rio':'vale-do-sol'):
      (b.x<330?'vila-industrial':b.x<810?'centro-civico':b.x<1260?'parque-leste':'colinas-do-sul');
    const group=S('g',{class:'home-node','data-home':`casa-${String(homeCount).padStart(3,'0')}`,'data-region':region,role:'button',tabindex:0,'aria-label':`Inspecionar residência ${homeCount}`},homes);
    C(b.x,b.y,3.7,'#498d6d',group,{stroke:'#fff','stroke-width':1.2});
  }

  // Water occludes city artwork; only bridge decks cross the channel.
  const water=S('g',{'aria-label':'Rio central'},root);
  P(band(-57,57),'#83cbe7',water,{stroke:'#a2d5e0','stroke-width':1.1});
  for(const side of [-1,1])L('M'+riverPts(side*61).map(p=>`${p[0]} ${p[1].toFixed(1)}`).join('L'),'#88bc8b',1.7,water);
  const crossing=S('g',{id:'bridge-layer'},root);
  for(const b of bridges){const x=b.x,y=riverY(x);
    const group=S('g',{class:'bridge-hit','data-bridge':b.id,tabindex:0,role:'button','aria-label':`Inspecionar ${b.name}`},crossing);
    L(`M${x} ${y-102}L${x} ${y+102}`,'#d2b573',17,group,{class:'bridge-deck'});
    L(`M${x} ${y-102}L${x} ${y+102}`,'#f1d38b',13,group);
    L(`M${x-6} ${y-66}L${x-6} ${y+66}M${x+6} ${y-66}L${x+6} ${y+66}`,'#fff8e7',1.3,group);
    R(x-18,y-63,36,126,'transparent',group);
  }
  const flows=S('g',{id:'flows-layer',class:'map-layer-hidden'},root);
  for(const b of bridges)L(`M${b.x} ${b.y-108}L${b.x} ${b.y+108}`,'#327cce',2.5,flows,{class:'flow','data-flow-bridge':b.id});

  // Labels and clickable POIs render last and are never clipped by landuse.
  const labels=S('g',{'aria-hidden':'true'},root);
  label('RIO CENTRAL',760,riverY(760)+5,labels,'river-label');
  const anchors={
    'norte-verde':[480,121],'jardim-do-rio':[1050,121],'vale-do-sol':[1440,121],
    'centro-civico':[552,554],'vila-industrial':[205,864],
    'parque-leste':[1050,555],'colinas-do-sul':[1405,684]
  };
  for(const d of districts){const [x,y]=anchors[d.id]||[d.x,d.y];label(d.name,x,y,labels,'district-label');}
  for(const [text,x,y] of [['MORRO DOS PINHEIROS',20,-80],['JARDIM DAS FLORES',1007,-60],['BAIRRO DAS OLIVEIRAS',1700,135],['SÍTIO DO VALE',-145,951],['CHÁCARAS DO SUL',1550,1018]]){
    label(text,x,y,labels,'',{'font-size':10,'letter-spacing':1.1,fill:'#77917d','font-weight':600});
  }
  const hubs=S('g',{id:'places-layer'},root);
  for(const p of places){const g=S('g',{class:'map-place','data-place':p.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${p.name}`},hubs);
    R(p.x-38,p.y-32,76,65,'transparent',g,{rx:4});
    C(p.x,p.y-3,11,placeColors[p.type],g,{stroke:'#fff','stroke-width':2.4,class:'place-bubble'});
    label(placeGlyphs[p.type],p.x,p.y+1,g,'',{'font-size':p.type==='hospital'?16:10,fill:'#fff','font-weight':800});
    label({school:'Escola',market:'Mercado',hospital:'Hospital',civic:'Prefeitura',office:'Empresa',park:'Praça'}[p.type],p.x,p.y+29,g,'place-label');
  }
  return {homeCount};
}
