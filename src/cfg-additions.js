import {MAP,places,placeColors} from './city-data.js';

const NS='http://www.w3.org/2000/svg';
const svg=(tag,attrs,parent)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent?.append(el);return el;};
const toWorld=(x,y)=>({x:MAP.x+MAP.scale*x,y:MAP.y+MAP.scale*y});
const region=(x,y)=>x<300&&y<375?'norte-verde':x<490&&y<335?'jardim-do-rio':x>=490&&y<355?'vale-do-sol':x<280?'colinas-do-sul':x>430&&y>510?'vila-industrial':'centro-civico';

// Exact footprints traced from the user's corrected SVG. Coordinates were mapped from the SVG background image back into the 740×740 city coordinate system; no block is repositioned.
const HOME_LOTS=[
["M228.29 468.44L237.68 473.81L229.28 488.63L219.90 483.27Z",228.79,478.54],
["M240.63 476.20L250.02 481.56L241.62 496.39L232.24 491.02Z",241.13,486.29],
["M252.97 483.95L262.36 489.32L253.96 504.14L244.58 498.77Z",253.47,494.04],
["M265.31 491.70L274.70 497.07L266.30 511.89L256.92 506.52Z",265.81,501.79],
["M262.23 463.79L271.61 469.16L263.22 483.98L253.83 478.62Z",262.72,473.89],
["M273.02 440.54L295.43 453.35L287.04 468.18L264.63 455.36Z",280.03,454.36],
["M545.52 296.35L553.71 314.28L542.76 319.34L534.57 301.41Z",544.14,307.84],
["M562.49 288.60L570.68 306.53L559.72 311.58L551.53 293.65Z",561.11,300.09],
["M368.13 107.20L376.33 125.14L365.37 130.19L357.18 112.26Z",366.75,118.70],
["M382.02 101.00L390.21 118.93L379.25 123.99L371.06 106.06Z",380.64,112.50],
["M377.39 130.46L385.58 148.39L374.63 153.45L366.44 135.51Z",376.01,141.95],
["M162.54 147.51L163.02 167.24L150.97 167.53L150.49 147.81Z",156.75,157.52],
["M220.66 251.09L216.82 266.89L192.83 261.00L196.68 245.19Z",206.75,256.04],
["M193.75 243.34L189.90 259.14L165.91 253.24L169.76 237.44Z",179.83,248.29],
["M172.08 183.17L172.60 199.44L147.92 200.23L147.40 183.96Z",160.00,191.70],
["M216.71 123.14L216.55 139.42L195.40 139.21L195.55 122.94Z",206.05,131.18],
["M191.85 122.91L191.70 139.18L170.54 138.98L170.69 122.71Z",181.20,130.95],
["M167.17 122.91L167.02 139.18L145.86 138.98L146.02 122.71Z",156.52,130.95],
["M167.17 104.31L167.02 120.58L145.86 120.38L146.02 104.10Z",156.52,112.34],
["M216.53 104.31L216.38 120.58L195.22 120.38L195.37 104.10Z",205.87,112.34],
["M202.71 79.57L202.49 101.97L181.34 101.77L181.55 79.37Z",192.02,90.67],
["M213.73 58.85L204.36 68.91L196.43 61.46L205.81 51.39Z",205.08,60.15],
["M232.57 77.45L223.20 87.52L215.27 80.06L224.65 70.00Z",223.92,78.76],
["M241.83 86.76L232.45 96.82L224.53 89.36L233.90 79.30Z",233.18,88.06],
["M224.86 46.45L215.49 56.51L207.56 49.05L216.94 38.99Z",216.21,47.75],
["M215.61 37.14L206.23 47.21L198.31 39.75L207.68 29.69Z",206.96,38.45],
["M235.66 55.75L226.28 65.81L218.36 58.35L227.73 48.29Z",227.01,57.05],
["M244.91 65.05L235.54 75.12L227.61 67.66L236.99 57.59Z",236.26,66.35],
["M226.40 26.29L217.03 36.36L209.10 28.90L218.48 18.83Z",217.75,27.59],
["M237.20 35.59L227.83 45.66L219.90 38.20L229.28 28.14Z",228.55,36.90],
["M246.46 44.90L237.08 54.96L229.16 47.50L238.53 37.44Z",237.81,46.20],
["M164.70 79.00L155.33 89.07L147.40 81.61L156.78 71.55Z",156.05,80.31],
["M177.04 66.60L167.67 76.67L159.74 69.21L169.12 59.14Z",168.39,67.90],
["M189.38 54.20L180.01 64.26L172.08 56.80L181.46 46.74Z",180.73,55.50],
["M223.32 68.15L213.94 78.22L206.02 70.76L215.39 60.69Z",214.67,69.45],
["M191.85 104.31L191.70 120.58L170.54 120.38L170.69 104.10Z",181.20,112.34],
["M144.39 263.49L140.54 279.30L116.55 273.40L120.40 257.59Z",130.47,268.44],
["M116.62 255.74L112.77 271.55L88.79 265.65L92.64 249.84Z",102.71,260.69],
["M186.69 180.31L187.16 200.04L175.65 200.32L175.17 180.59Z",181.17,190.31],
["M205.19 180.07L205.67 199.80L194.16 200.08L193.68 180.35Z",199.68,190.08],
["M224.22 180.07L224.70 199.80L211.16 200.13L210.68 180.40Z",217.69,190.10],
["M248.77 148.14L249.38 173.44L223.63 174.07L223.02 148.77Z",236.20,161.11],
["M247.19 118.06L247.80 143.36L222.06 143.99L221.44 118.69Z",234.62,131.02],
["M250.44 180.07L250.92 199.80L229.63 200.32L229.16 180.59Z",240.04,190.20],
["M182.59 145.96L182.86 156.97L170.81 157.26L170.54 146.26Z",176.70,151.61],
["M182.59 159.92L182.86 170.92L170.81 171.21L170.54 160.21Z",176.70,165.57],
["M199.56 147.51L199.82 158.52L187.77 158.81L187.51 147.81Z",193.67,153.16],
["M199.56 161.47L199.82 172.47L187.77 172.76L187.51 161.76Z",193.67,167.12],
["M213.53 149.06L213.73 160.07L204.68 160.36L204.48 149.36Z",209.10,154.71],
["M213.53 163.02L213.73 174.02L204.68 174.31L204.48 163.31Z",209.10,168.67],
["M213.53 163.46L213.73 174.46L204.68 174.76L204.48 163.76Z",209.10,169.11],
["M392.81 124.26L401.00 142.19L390.05 147.24L381.86 129.31Z",391.43,135.75],
["M388.19 153.72L396.38 171.65L385.42 176.70L377.23 158.77Z",386.81,165.21],
["M403.61 145.96L411.80 163.89L400.85 168.95L392.66 151.02Z",402.23,157.46],
["M397.44 176.97L405.63 194.90L394.68 199.96L386.49 182.03Z",396.06,188.46],
["M547.23 634.04L547.83 653.76L531.79 654.25L531.19 634.53Z",539.51,644.14],
["M547.52 671.54L548.12 691.27L532.08 691.76L531.48 672.04Z",539.80,681.65],
["M569.12 671.54L569.71 691.27L553.67 691.76L553.08 672.04Z",561.40,681.65],
["M589.17 671.54L589.77 691.27L573.73 691.76L573.13 672.04Z",581.45,681.65],
["M549.06 696.35L549.66 716.07L533.62 716.56L533.02 696.84Z",541.34,706.46],
["M493.54 727.36L494.13 747.08L478.09 747.57L477.50 727.85Z",485.81,737.46],
["M471.94 727.36L472.54 747.08L456.50 747.57L455.90 727.85Z",464.22,737.46],
["M450.35 727.36L450.94 747.08L434.90 747.57L434.31 727.85Z",442.62,737.46],
["M428.75 727.36L429.35 747.08L413.31 747.57L412.71 727.85Z",421.03,737.46],
["M407.16 727.36L407.75 747.08L396.79 747.41L396.19 727.69Z",401.97,737.39],
["M548.61 727.36L549.21 747.08L538.25 747.41L537.65 727.69Z",543.43,737.39],
["M565.58 727.36L566.18 747.08L555.22 747.41L554.62 727.69Z",560.40,737.39],
["M581.01 727.36L581.60 747.08L570.64 747.41L570.04 727.69Z",575.82,737.39],
["M594.89 727.36L595.49 747.08L584.52 747.41L583.93 727.69Z",589.71,737.39],
["M569.12 696.35L569.71 716.07L553.67 716.56L553.08 696.84Z",561.40,706.46],
["M590.71 696.35L591.31 716.07L575.27 716.56L574.67 696.84Z",582.99,706.46],
["M567.57 634.34L568.17 654.06L552.13 654.55L551.53 634.83Z",559.85,644.44],
["M587.63 634.34L588.22 654.06L572.18 654.55L571.59 634.83Z",579.91,644.44],
["M412.87 167.67L419.08 181.27L408.12 186.32L401.91 172.72Z",410.50,177.00],
["M400.53 91.70L406.74 105.30L395.78 110.35L389.57 96.76Z",398.16,101.03],
["M409.78 110.31L415.99 123.90L405.04 128.96L398.83 115.36Z",407.41,119.63],
["M423.66 104.10L429.87 117.70L418.92 122.76L412.71 109.16Z",421.29,113.43],
["M419.04 128.91L429.29 151.36L418.34 156.42L408.08 133.96Z",418.69,142.66],
["M434.46 121.16L444.72 143.61L433.76 148.66L423.51 126.21Z",434.11,134.91],
["M434.46 76.20L444.72 98.65L433.76 103.70L423.51 81.25Z",434.11,89.95],
["M449.89 68.45L460.14 90.90L449.19 95.95L438.93 73.50Z",449.54,82.20],
["M448.34 102.55L453.33 113.48L442.38 118.53L437.39 107.61Z",445.36,110.54],
["M464.74 114.76L469.78 125.81L451.69 134.16L446.65 123.11Z",458.21,124.46],
["M470.24 132.01L474.41 141.13L460.07 147.75L455.90 138.63Z",465.15,139.88],
["M475.21 147.51L479.38 156.64L467.78 161.99L463.61 152.87Z",471.49,154.75],
["M462.23 96.35L465.78 104.13L454.83 109.18L451.27 101.41Z",458.53,102.77],
["M414.41 85.50L420.62 99.10L409.67 104.15L403.46 90.55Z",412.04,94.82],
["M451.34 149.03L457.55 162.62L429.72 175.47L423.51 161.87Z",440.53,162.25],
["M593.34 314.96L601.53 332.89L590.57 337.94L582.38 320.01Z",591.96,326.45],
["M277.65 473.10L287.04 478.46L278.64 493.29L269.26 487.92Z",278.15,483.19],
["M280.37 417.41L290.46 421.28L284.41 437.21L274.32 433.34Z",282.39,427.31],
["M295.36 421.93L305.45 425.80L299.40 441.74L289.31 437.87Z",297.38,431.83],
["M310.79 428.13L320.88 432.00L314.83 447.94L304.74 444.07Z",312.81,438.04]
];

const FACILITIES=[
{id:"restaurante-oeste",type:"restaurant",name:"Restaurante do Oeste",paths:["M210.65 381.53L214.92 366.12L232.68 371.10L228.40 386.51Z"],anchor:[221.66,376.32],capacity:90,description:"Restaurante adicionado conforme o SVG, no setor oeste."},
{id:"restaurante-central",type:"restaurant",name:"Restaurante Central",paths:["M448.19 374.19L461.79 356.76L486.83 376.51L473.23 393.94Z"],anchor:[467.51,375.35],capacity:110,description:"Restaurante adicionado conforme o SVG, junto ao eixo central."},
{id:"restaurante-sul",type:"restaurant",name:"Restaurante Vila Industrial",paths:["M524.96 727.39L525.56 747.11L499.68 747.90L499.09 728.18Z"],anchor:[512.32,737.64],capacity:80,description:"Restaurante adicionado conforme o SVG, no setor sul."},
{id:"shopping-rio",type:"commerce",name:"Shopping Jardim do Rio",paths:["M389.67 304.10L410.72 315.54L399.63 336.16L378.58 324.72Z"],anchor:[394.65,320.13],capacity:520,description:"Shopping adicionado conforme o SVG."},
{id:"loja-centro",type:"commerce",name:"Loja do Centro",paths:["M303.19 463.29L326.43 457.53L334.04 488.60L310.81 494.35Z"],anchor:[318.62,475.94],capacity:140,description:"Comércio adicionado conforme o SVG."},
{id:"empresa-leste-1",type:"office",name:"Empresa Leste 1",paths:["M638.35 628.93L639.46 665.34L598.91 666.58L597.81 630.18Z"],anchor:[618.63,647.76],capacity:260,description:"Empresa adicionada conforme o SVG."},
{id:"empresa-leste-2",type:"office",name:"Empresa Leste 2",paths:["M642.98 677.75L644.08 714.16L603.54 715.40L602.44 678.99Z"],anchor:[623.26,696.57],capacity:300,description:"Empresa adicionada conforme o SVG."},
{id:"empresa-leste-3",type:"office",name:"Empresa Leste 3",paths:["M651.00 724.61L651.60 744.33L601.49 745.86L600.89 726.14Z"],anchor:[626.25,735.24],capacity:220,description:"Empresa adicionada conforme o SVG."},
{id:"hospital-zona-norte",type:"hospital",name:"Hospital da Zona Norte",paths:["M39.96 130.46L16.29 183.00L43.41 195.34L67.07 142.80Z","M39.79 166.12L25.55 197.75L50.00 208.88L64.25 177.25Z"],anchor:[42.81,171.56],capacity:150,description:"Hospital da Zona Norte, formado pelos dois blocos indicados no SVG."}
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
