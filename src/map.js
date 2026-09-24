import {WIDTH,HEIGHT,districts,bridges,places} from './city-data.js';
import {drawCity} from './city-map.js';
import {finishLandscape} from './landscape.js';
const $=id=>document.getElementById(id);
const svg=$('city-map'),viewport=$('map-viewport');
const world=$('map-world');
drawCity(world);
finishLandscape(world);
const bridgeState=Object.fromEntries(bridges.map(b=>[b.id,true]));
// Keep the desktop view unchanged. On mobile, use a closer maximum zoom-out
// in both themes so the city fills more of the available map area.
const bounds={left:-30,top:-2,right:1630,bottom:932};
const DESKTOP_MAX_WIDTH=1660;
const MOBILE_MAX_WIDTH=1280;
const mobileLayout=window.matchMedia('(max-width: 780px)');
const maxWidth=()=>mobileLayout.matches?MOBILE_MAX_WIDTH:DESKTOP_MAX_WIDTH;
const fullView=()=>{
 const w=maxWidth(),h=w*HEIGHT/WIDTH;
 return {x:bounds.left+(DESKTOP_MAX_WIDTH-w)/2,y:bounds.top+(bounds.bottom-bounds.top-h)/2,w,h};
};
let view=fullView(),drag=null;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function updateView(){svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);}
function constrain(){view.x=clamp(view.x,bounds.left,bounds.right-view.w);view.y=clamp(view.y,bounds.top,bounds.bottom-view.h);}
function zoom(factor,centerX=view.x+view.w/2,centerY=view.y+view.h/2){
 const w=clamp(view.w*factor,240,maxWidth()),h=w*HEIGHT/WIDTH;
 const fx=(centerX-view.x)/view.w,fy=(centerY-view.y)/view.h;
 view={x:centerX-fx*w,y:centerY-fy*h,w,h};constrain();updateView();
}
const reset=()=>{view=fullView();updateView();};
$('reset-view').onclick=reset;$('zoom-reset').onclick=reset;
$('zoom-in').onclick=()=>zoom(.78);$('zoom-out').onclick=()=>zoom(1.28);
updateView();
// Reframe only when crossing the mobile/desktop breakpoint, not on every
// browser-chrome resize or device rotation that stays in the same layout.
mobileLayout.addEventListener('change',reset);
// The rendered SVG may letterbox on narrow screens. Convert gestures using
// the displayed SVG region rather than the surrounding map container.
function screenRect(){
 const r=svg.getBoundingClientRect(),ratio=WIDTH/HEIGHT;
 let left=r.left,top=r.top,width=r.width,height=r.height;
 if(width/height>ratio){width=height*ratio;left+=(r.width-width)/2;}
 else{height=width/ratio;top+=(r.height-height)/2;}
 return {left,top,width,height};
}
viewport.addEventListener('wheel',e=>{
 e.preventDefault();const r=screenRect();
 const fx=clamp((e.clientX-r.left)/r.width,0,1),fy=clamp((e.clientY-r.top)/r.height,0,1);
 zoom(e.deltaY<0?.82:1.22,view.x+view.w*fx,view.y+view.h*fy);
},{passive:false});
viewport.addEventListener('pointerdown',e=>{
 if(e.target.closest('[data-place],[data-home],[data-bridge]'))return;
 drag={x:e.clientX,y:e.clientY,originX:view.x,originY:view.y,pointer:e.pointerId};
 viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');
});
viewport.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.pointer)return;
 const r=screenRect();view.x=drag.originX-(e.clientX-drag.x)*view.w/r.width;
 view.y=drag.originY-(e.clientY-drag.y)*view.h/r.height;
 constrain();updateView();
});
const stopDrag=()=>{drag=null;viewport.classList.remove('dragging');};
viewport.addEventListener('pointerup',stopDrag);viewport.addEventListener('pointercancel',stopDrag);
$('toggle-places').onchange=e=>$('places-layer').classList.toggle('map-layer-hidden',!e.target.checked);
$('toggle-homes').onchange=e=>$('homes-layer').classList.toggle('map-layer-hidden',!e.target.checked);
$('toggle-flows').onchange=e=>$('flows-layer').classList.toggle('map-layer-hidden',!e.target.checked);
const inspector=$('inspector');$('inspector-close').onclick=()=>inspector.hidden=true;
function openInspector(type,title,description,content){$('inspector-type').textContent=type;$('inspector-title').textContent=title;$('inspector-desc').textContent=description;const body=$('inspector-content');body.replaceChildren();if(content)body.append(content);inspector.hidden=false;}
function infoPill(message){const span=document.createElement('span');span.className='pill';span.textContent=message;return span;}
function networkPreview(count){const NS='http://www.w3.org/2000/svg',network=document.createElementNS(NS,'svg');network.setAttribute('viewBox','0 0 250 150');network.setAttribute('class','person-graph');network.setAttribute('role','img');network.setAttribute('aria-label','Representação conceitual de pessoas conectadas no local');const centers=Array.from({length:count},(_,i)=>({x:125+72*Math.cos(i*2.39996),y:75+49*Math.sin(i*2.39996)}));for(let i=0;i<count;i++){for(let j=i+1;j<count;j++){if((i*11+j*7)%5>1)continue;const line=document.createElementNS(NS,'line');for(const [k,v] of Object.entries({x1:centers[i].x,y1:centers[i].y,x2:centers[j].x,y2:centers[j].y,stroke:'#b8c9c6','stroke-width':'.8'}))line.setAttribute(k,v);network.append(line);}}centers.forEach((p,i)=>{const circle=document.createElementNS(NS,'circle');for(const [k,v] of Object.entries({cx:p.x,cy:p.y,r:3.4,fill:i%4===0?'#e9b56c':'#5b9d89',stroke:'white','stroke-width':1}))circle.setAttribute(k,v);network.append(circle);});return network;}
function openPlace(p){const box=document.createElement('div');box.append(infoPill(`Capacidade planejada: ${p.capacity} pessoas`),networkPreview(18));const note=document.createElement('p');note.textContent='Rede interna ilustrativa. Pessoas e transmissões serão geradas pelo motor sintético em uma próxima etapa.';box.append(note);openInspector(p.type.toUpperCase(),p.name,p.description,box);}
function openHome(el){const box=document.createElement('div');box.append(infoPill('Residência sintética'),networkPreview(4));const note=document.createElement('p');note.textContent='Expansão demonstrativa do nó domiciliar. A composição real da família será definida pela geração de agentes.';box.append(note);const region=districts.find(d=>d.id===el.dataset.region);openInspector('RESIDÊNCIA',el.dataset.home.replace('casa-','Casa '),`Bairro: ${region?.name??'Não atribuído'}. Cada casa agregará indivíduos, contatos domésticos e deslocamentos.`,box);}
function openBridge(b){const box=document.createElement('div');box.append(infoPill(bridgeState[b.id]?'Travessia aberta':'Travessia bloqueada'));const note=document.createElement('p');note.textContent='A conexão visual é alternada neste protótipo; o recálculo de deslocamentos será implementado com o motor e o grafo.';box.append(note);openInspector('PONTE',b.name,'Gargalo de mobilidade entre as duas margens do rio fictício.',box);}
function drawBridgeControls(){const root=$('bridge-controls');root.replaceChildren();for(const b of bridges){const row=document.createElement('div');row.className='bridge-control';const label=document.createElement('span'),name=document.createElement('b'),desc=document.createElement('small');name.textContent=b.name;desc.textContent=bridgeState[b.id]?'Travessia aberta':'Travessia bloqueada';label.append(name,desc);const button=document.createElement('button');button.type='button';button.textContent=bridgeState[b.id]?'Aberta':'Fechada';button.className=bridgeState[b.id]?'':'closed';button.setAttribute('aria-label',`${bridgeState[b.id]?'Bloquear':'Abrir'} ${b.name}`);button.onclick=()=>{bridgeState[b.id]=!bridgeState[b.id];syncBridge(b);drawBridgeControls();if(!inspector.hidden&&$('inspector-title').textContent===b.name)openBridge(b);};row.append(label,button);root.append(row);}}
function syncBridge(b){const g=document.querySelector(`[data-bridge="${b.id}"]`),flow=document.querySelector(`[data-flow-bridge="${b.id}"]`);g?.classList.toggle('bridge-closed',!bridgeState[b.id]);if(flow)flow.style.display=bridgeState[b.id]?'':'none';}drawBridgeControls();
function handleNode(el){if(el.dataset.place){const p=places.find(p=>p.id===el.dataset.place);if(p)openPlace(p);}else if(el.dataset.home)openHome(el);else if(el.dataset.bridge){const b=bridges.find(b=>b.id===el.dataset.bridge);if(b)openBridge(b);}}
svg.addEventListener('click',e=>{const el=e.target.closest('[data-place],[data-home],[data-bridge]');if(el)handleNode(el);});svg.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('[data-place],[data-home],[data-bridge]');if(el){e.preventDefault();handleNode(el);}});
