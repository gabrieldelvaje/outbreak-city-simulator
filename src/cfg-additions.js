import {MAP,places,placeColors} from './city-data.js';

const NS='http://www.w3.org/2000/svg';
const svg=(tag,attrs,parent)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent?.append(el);return el;};
const toWorld=(x,y)=>({x:MAP.x+MAP.scale*x,y:MAP.y+MAP.scale*y});
const region=(x,y)=>x<300&&y<375?'norte-verde':x<490&&y<335?'jardim-do-rio':x>=490&&y<355?'vale-do-sol':x<280?'colinas-do-sul':x>430&&y>510?'vila-industrial':'centro-civico';

// New residential footprints traced directly from the user's CFG/SVG.
const HOME_LOTS=[
 ["M228.2 468.3L237.6 473.7L229.2 488.4L219.7 483.1Z",228.7,478.4],
 ["M240.5 476L249.9 481.4L241.5 496.2L232.1 490.8Z",241,486.1],
 ["M252.9 483.8L262.3 489.1L253.9 503.9L244.5 498.5Z",253.4,493.8],
 ["M265.2 491.5L274.7 496.8L266.2 511.6L256.8 506.3Z",265.7,501.6],
 ["M262.2 463.7L271.6 469L263.2 483.8L253.7 478.4Z",262.7,473.7],
 ["M273 440.5L295.4 453.3L287 468L264.6 455.3Z",280,454.3],
 ["M546 296.7L554.2 314.6L543.2 319.6L535 301.8Z",544.6,308.2],
 ["M563 289L571.2 306.9L560.2 311.9L552 294Z",561.6,300.5],
 ["M368.3 108.1L376.5 126L365.5 131.1L357.3 113.2Z",366.9,119.6],
 ["M382.2 102L390.4 119.8L379.4 124.9L371.2 107Z",380.8,113.4],
 ["M377.5 131.3L385.8 149.2L374.8 154.3L366.6 136.4Z",376.2,142.8],
 ["M162.3 148.3L162.8 168L150.7 168.3L150.2 148.6Z",156.5,158.3],
 ["M220.5 251.6L216.7 267.4L192.6 261.5L196.5 245.7Z",206.6,256.5],
 ["M193.5 243.9L189.7 259.6L165.7 253.7L169.5 238Z",179.6,248.8],
 ["M171.8 183.9L172.4 200.1L147.6 200.9L147.1 184.7Z",159.7,192.4],
 ["M216.5 124L216.4 140.3L195.2 140.1L195.4 123.8Z",205.9,132.1],
 ["M191.6 123.8L191.5 140L170.3 139.8L170.4 123.6Z",181,131.8],
 ["M166.9 123.8L166.8 140L145.6 139.8L145.7 123.6Z",156.2,131.8],
 ["M166.9 105.3L166.8 121.5L145.6 121.3L145.7 105.1Z",156.2,113.3],
 ["M216.4 105.3L216.2 121.5L195 121.3L195.2 105.1Z",205.7,113.3],
 ["M202.5 80.6L202.3 102.9L181.1 102.7L181.3 80.4Z",191.8,91.7],
 ["M213.6 59.9L204.2 70L196.2 62.5L205.6 52.5Z",204.9,61.2],
 ["M232.4 78.5L223.1 88.5L215.1 81.1L224.5 71.1Z",223.8,79.8],
 ["M241.7 87.8L232.3 97.8L224.4 90.4L233.8 80.3Z",233.1,89.1],
 ["M224.7 47.6L215.3 57.6L207.4 50.2L216.8 40.1Z",216.1,48.9],
 ["M215.4 38.3L206.1 48.3L198.1 40.9L207.5 30.9Z",206.8,39.6],
 ["M235.5 56.8L226.1 66.9L218.2 59.4L227.6 49.4Z",226.9,58.1],
 ["M244.8 66.1L235.4 76.2L227.5 68.7L236.9 58.7Z",236.1,67.4],
 ["M226.3 27.5L216.9 37.5L208.9 30.1L218.3 20Z",217.6,28.8],
 ["M237.1 36.8L227.7 46.8L219.7 39.4L229.1 29.3Z",228.4,38.1],
 ["M246.4 46L237 56.1L229 48.6L238.4 38.6Z",237.7,47.3],
 ["M164.4 80L155.1 90.1L147.1 82.6L156.5 72.6Z",155.8,81.3],
 ["M176.8 67.7L167.4 77.7L159.5 70.3L168.9 60.2Z",168.1,69],
 ["M189.2 55.3L179.8 65.3L171.8 57.9L181.2 47.9Z",180.5,56.6],
 ["M223.2 69.2L213.8 79.2L205.8 71.8L215.2 61.8Z",214.5,70.5],
 ["M191.6 105.3L191.5 121.5L170.3 121.3L170.4 105.1Z",181,113.3],
 ["M144.1 264L140.2 279.7L116.2 273.8L120.1 258.1Z",130.1,268.9],
 ["M116.3 256.2L112.4 272L88.4 266.1L92.2 250.4Z",102.3,261.2],
 ["M186.5 181L186.9 200.7L175.4 201L174.9 181.3Z",180.9,191],
 ["M205 180.8L205.5 200.5L194 200.7L193.5 181.1Z",199.5,190.8],
 ["M224.1 180.8L224.6 200.5L211 200.8L210.5 181.1Z",217.5,190.8],
 ["M248.7 149L249.3 174.2L223.5 174.8L222.9 149.6Z",236.1,161.9],
 ["M247.1 119L247.7 144.2L221.9 144.8L221.3 119.6Z",234.5,131.9],
 ["M250.3 180.8L250.8 200.5L229.5 201L229 181.3Z",239.9,190.9],
 ["M182.4 146.8L182.6 157.8L170.6 158.1L170.3 147.1Z",176.5,152.4],
 ["M182.4 160.7L182.6 171.7L170.6 172L170.3 161Z",176.5,166.3],
 ["M199.4 148.3L199.6 159.3L187.6 159.6L187.3 148.6Z",193.5,154],
 ["M199.4 162.2L199.6 173.2L187.6 173.5L187.3 162.5Z",193.5,167.9],
 ["M213.4 149.9L213.6 160.9L204.5 161.1L204.3 150.2Z",208.9,155.5],
 ["M213.4 163.8L213.6 174.8L204.5 175.1L204.3 164.1Z",208.9,169.4],
 ["M213.4 164.2L213.6 175.2L204.5 175.5L204.3 164.5Z",208.9,169.9],
 ["M393 125.2L401.2 143L390.2 148.1L382 130.2Z",391.6,136.6],
 ["M388.4 154.5L396.6 172.4L385.6 177.4L377.4 159.6Z",387,166],
 ["M403.8 146.8L412 164.7L401.1 169.7L392.8 151.8Z",402.4,158.2],
 ["M397.6 177.7L405.8 195.6L394.9 200.6L386.7 182.7Z",396.3,189.2],
 ["M547.7 633.4L548.3 653.1L532.3 653.5L531.7 633.9Z",540,643.5],
 ["M548 670.8L548.6 690.4L532.5 690.9L531.9 671.3Z",540.3,680.9],
 ["M569.7 670.8L570.2 690.4L554.2 690.9L553.6 671.3Z",561.9,680.9],
 ["M589.7 670.8L590.3 690.4L574.3 690.9L573.7 671.3Z",582,680.9],
 ["M549.6 695.5L550.2 715.2L534.1 715.7L533.5 696Z",541.8,705.6],
 ["M493.9 726.4L494.5 746.1L478.4 746.6L477.8 726.9Z",486.2,736.5],
 ["M472.3 726.4L472.9 746.1L456.8 746.6L456.2 726.9Z",464.5,736.5],
 ["M450.6 726.4L451.2 746.1L435.2 746.6L434.6 726.9Z",442.9,736.5],
 ["M429 726.4L429.6 746.1L413.5 746.6L412.9 726.9Z",421.3,736.5],
 ["M407.4 726.4L408 746.1L397 746.4L396.4 726.8Z",402.2,736.4],
 ["M549.1 726.4L549.7 746.1L538.7 746.4L538.1 726.8Z",543.9,736.4],
 ["M566.1 726.4L566.7 746.1L555.7 746.4L555.1 726.8Z",560.9,736.4],
 ["M581.6 726.4L582.2 746.1L571.2 746.4L570.6 726.8Z",576.4,736.4],
 ["M595.5 726.4L596.1 746.1L585.1 746.4L584.5 726.8Z",590.3,736.4],
 ["M569.7 695.5L570.2 715.2L554.2 715.7L553.6 696Z",561.9,705.6],
 ["M591.3 695.5L591.9 715.2L575.8 715.7L575.2 696Z",583.6,705.6],
 ["M526.4 726.4L527 746.1L500.1 746.9L499.5 727.3Z",513.2,736.7],
 ["M568.1 633.7L568.7 653.4L552.6 653.8L552 634.2Z",560.4,643.8],
 ["M588.2 633.7L588.8 653.4L572.7 653.8L572.1 634.2Z",580.5,643.8],
 ["M413.1 168.4L419.3 182L408.3 187L402.1 173.5Z",410.7,177.7],
 ["M400.7 92.7L407 106.2L396 111.3L389.8 97.7Z",398.4,102],
 ["M410 111.2L416.2 124.8L405.3 129.8L399 116.3Z",407.6,120.5],
 ["M423.9 105.1L430.1 118.6L419.2 123.7L412.9 110.1Z",421.5,114.4],
 ["M419.3 129.8L429.6 152.2L418.6 157.2L408.3 134.8Z",418.9,143.5],
 ["M434.7 122.1L445 144.4L434 149.5L423.8 127.1Z",434.4,135.8],
 ["M434.7 77.2L445 99.6L434 104.7L423.8 82.3Z",434.4,90.9],
 ["M450.2 69.5L460.5 91.9L449.5 96.9L439.2 74.5Z",449.8,83.2],
 ["M448.6 103.5L453.6 114.4L442.7 119.4L437.7 108.6Z",445.7,111.5],
 ["M465.1 115.7L470.1 126.7L452 135L446.9 124Z",458.5,125.4],
 ["M470.6 132.9L474.8 142L460.4 148.6L456.2 139.5Z",465.5,140.7],
 ["M475.6 148.3L479.7 157.4L468.1 162.8L463.9 153.7Z",471.8,155.6],
 ["M462.5 97.3L466.1 105.1L455.1 110.1L451.6 102.4Z",458.8,103.7],
 ["M414.6 86.5L420.9 100.1L409.9 105.1L403.7 91.5Z",412.3,95.8],
 ["M451.6 149.8L457.9 163.4L430 176.2L423.8 162.7Z",440.8,163],
 ["M593.9 315.3L602.1 333.2L591.2 338.2L582.9 320.3Z",592.5,326.7],
 ["M277.6 472.9L287 478.3L278.6 493.1L269.2 487.7Z",278.1,483],
 ["M280.3 417.4L290.4 421.3L284.4 437.2L274.3 433.3Z",282.4,427.3],
 ["M295.4 421.9L305.5 425.8L299.4 441.7L289.3 437.8Z",297.4,431.8],
 ["M310.8 428.1L320.9 432L314.9 447.9L304.8 444Z",312.8,438]
];

const FACILITIES=[
 {id:"restaurante-oeste",type:"restaurant",name:"Restaurante do Oeste",paths:["M210.5 381.7L214.8 366.3L232.6 371.2L228.3 386.6Z"],anchor:[221.5,376.4],capacity:90,description:"Restaurante adicionado conforme o CFG, no setor oeste da cidade."},
 {id:"restaurante-central",type:"restaurant",name:"Restaurante Central",paths:["M448.5 374.3L462.1 357L487.2 376.6L473.6 394Z"],anchor:[467.8,375.5],capacity:110,description:"Restaurante adicionado conforme o CFG, próximo ao eixo central."},
 {id:"restaurante-sul",type:"restaurant",name:"Restaurante Vila Industrial",paths:["M525.4 726.5L526 746.1L500.1 746.9L499.5 727.3Z"],anchor:[512.7,736.7],capacity:80,description:"Restaurante adicionado conforme o CFG, no setor sul."},
 {id:"shopping-rio",type:"commerce",name:"Shopping Jardim do Rio",paths:["M389.9 304.5L410.9 315.9L399.8 336.4L378.7 325Z"],anchor:[394.8,320.4],capacity:520,description:"Shopping adicionado conforme o CFG, na região do Jardim do Rio."},
 {id:"loja-centro",type:"commerce",name:"Loja do Centro",paths:["M303.2 463.2L326.5 457.4L334.1 488.4L310.8 494.1Z"],anchor:[318.7,475.8],capacity:140,description:"Comércio adicionado conforme o CFG, no Centro Cívico."},
 {id:"empresa-leste-1",type:"office",name:"Empresa Leste 1",paths:["M639 628.3L640.1 664.6L599.5 665.8L598.4 629.5Z"],anchor:[619.3,647.1],capacity:260,description:"Empresa adicionada conforme o CFG, no setor leste."},
 {id:"empresa-leste-2",type:"office",name:"Empresa Leste 2",paths:["M643.7 677L644.8 713.3L604.1 714.5L603 678.2Z"],anchor:[623.9,695.7],capacity:300,description:"Empresa adicionada conforme o CFG, no setor leste."},
 {id:"empresa-leste-3",type:"office",name:"Empresa Leste 3",paths:["M651.7 723.7L652.3 743.4L602.1 744.9L601.5 725.2Z"],anchor:[626.9,734.3],capacity:220,description:"Empresa adicionada conforme o CFG, no extremo sul-leste."},
 {id:"hospital-zona-norte",type:"hospital",name:"Hospital da Zona Norte",paths:["M39.5 131.3L15.7 183.7L42.9 196L66.6 143.6Z","M39.3 166.9L25 198.4L49.5 209.5L63.8 178Z"],anchor:[42.8,176],capacity:150,description:"Novo hospital da Zona Norte, formado pelos dois blocos vermelhos indicados no CFG."}
];

placeColors.restaurant='#df9044';
placeColors.commerce='#d56ba5';
const facilityTint={restaurant:'#df9044',commerce:'#d56ba5',office:'#7360a8',hospital:'#cf5360'};

function addPlaceData(){
 for(const f of FACILITIES){
  if(places.some(p=>p.id===f.id))continue;
  const [x,y]=f.anchor;
  places.push({id:f.id,type:f.type,name:f.name,...toWorld(x,y),region:region(x,y),capacity:f.capacity,description:f.description});
 }
}

function addHomeNode(homes,x,y,id){
 const g=svg('g',{class:'home-node','data-home':`casa-${String(id).padStart(3,'0')}`,'data-region':region(x,y),role:'button',tabindex:0,'aria-label':`Inspecionar residência ${id}`},homes);
 svg('title',{},g).textContent=`Residência ${id}`;
 svg('circle',{cx:x,cy:y,r:1.25,fill:'#4e9270',stroke:'#fff','stroke-width':.4,opacity:.78},g);
 svg('circle',{cx:x,cy:y,r:4.5,fill:'transparent','pointer-events':'all'},g);
}

function addCfgGeometry(){
 const frame=document.getElementById('reference-city');
 const homes=frame?.querySelector('#homes-layer');
 const placesLayer=frame?.querySelector('#places-layer');
 if(!frame||!homes||!placesLayer||frame.querySelector('#cfg-additions-layer'))return false;
 const roofs=svg('g',{id:'cfg-additions-layer','aria-label':'Edificações adicionadas a partir do CFG'},frame);
 frame.insertBefore(roofs,homes);
 let nextId=Math.max(0,...[...homes.querySelectorAll('[data-home]')].map(n=>Number(n.dataset.home.replace('casa-',''))||0));
 for(const [d,cx,cy] of HOME_LOTS){
  svg('path',{d,fill:'#c1c1c1',style:'fill:#e6e9ee','pointer-events':'none'},roofs);
  addHomeNode(homes,cx,cy,++nextId);
 }
 for(const f of FACILITIES){
  const g=svg('g',{class:'map-place cfg-place','data-place':f.id,role:'button',tabindex:0,'aria-label':`Inspecionar ${f.name}`},placesLayer);
  svg('title',{},g).textContent=f.name;
  for(const d of f.paths){
   svg('path',{d,fill:'#c1c1c1',style:'fill:#e6e9ee','pointer-events':'none'},g);
   svg('path',{d,fill:facilityTint[f.type]||'#607a98','fill-opacity':.53,stroke:'none','pointer-events':'none'},g);
  }
  const [cx,cy]=f.anchor;
  svg('circle',{cx,cy,r:4.5,fill:facilityTint[f.type]||'#607a98',stroke:'#fff','stroke-width':1.15,class:'place-bubble'},g);
 }
 return true;
}

addPlaceData();
if(!addCfgGeometry()){
 const root=document.getElementById('map-world');
 if(root){const observer=new MutationObserver(()=>{if(addCfgGeometry())observer.disconnect();});observer.observe(root,{childList:true,subtree:true});}
}
