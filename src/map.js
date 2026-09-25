import {WIDTH,HEIGHT,districts,bridges,places} from './city-data.js';
import {drawCity} from './city-map.js';
import {finishLandscape} from './landscape.js';
const $=id=>document.getElementById(id);
const svg=$('city-map'),viewport=$('map-viewport');
const world=$('map-world');
drawCity(world);
finishLandscape(world);
const bridgeState=Object.fromEntries(bridges.map(b=>[b.id,true]));
// The desktop keeps its original framing. On narrow screens the reference city
// fills the available width, and the SVG viewBox follows the portrait viewport
// instead of letterboxing a fixed 16:9 view into a tall mobile map area.
const bounds={left:-30,top:-2,right:1630,bottom:932};
const DESKTOP_MAX_WIDTH=1660;
const MOBILE_MAX_WIDTH=960;
const mobileLayout=window.matchMedia('(max-width: 780px)');
const maxWidth=()=>mobileLayout.matches?MOBILE_MAX_WIDTH:DESKTOP_MAX_WIDTH;
const viewHeight=w=>{
 if(!mobileLayout.matches)return w*HEIGHT/WIDTH;
 const rect=svg.getBoundingClientRect();
 return rect.width>0&&rect.height>0?w*rect.height/rect.width:w*HEIGHT/WIDTH;
};
const fullView=()=>{
 const w=maxWidth(),h=viewHeight(w);
 return {x:(bounds.left+bounds.right-w)/2,y:(bounds.top+bounds.bottom-h)/2,w,h};
};
let view=fullView(),drag=null;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function updateView(){svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);}
function constrain(){
 const centerX=(bounds.left+bounds.right)/2,centerY=(bounds.top+bounds.bottom)/2;
 view.x=view.w>=bounds.right-bounds.left?centerX-view.w/2:clamp(view.x,bounds.left,bounds.right-view.w);
 view.y=view.h>=bounds.bottom-bounds.top?centerY-view.h/2:clamp(view.y,bounds.top,bounds.bottom-view.h);
}
function zoom(factor,centerX=view.x+view.w/2,centerY=view.y+view.h/2){
 const w=clamp(view.w*factor,240,maxWidth()),h=viewHeight(w);
 const fx=(centerX-view.x)/view.w,fy=(centerY-view.y)/view.h;
 view={x:centerX-fx*w,y:centerY-fy*h,w,h};constrain();updateView();
}
const reset=()=>{view=fullView();constrain();updateView();};
$('reset-view').onclick=reset;$('zoom-reset').onclick=reset;
$('zoom-in').onclick=()=>zoom(.78);$('zoom-out').onclick=()=>zoom(1.28);
reset();
// Restore the intended scale when switching between desktop and mobile.
mobileLayout.addEventListener('change',reset);
// Browser chrome can resize the portrait map without crossing a breakpoint.
// Keep its current zoom and center while adapting the viewBox aspect ratio.
window.addEventListener('resize',()=>{
 if(!mobileLayout.matches)return;
 const h=viewHeight(view.w);
 if(Math.abs(h-view.h)<.5)return;
 const cy=view.y+view.h/2;
 view.y=cy-h/2;view.h=h;constrain();updateView();
});
// Use the actual viewBox ratio for pointer/wheel geometry; the mobile SVG now
// fills its container, while the desktop may still have letterboxing.
function screenRect(){
 const r=svg.getBoundingClientRect(),ratio=view.w/view.h;
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

// Mobile: track two simultaneous touch pointers for a real, midpoint-anchored
// pinch gesture. A single finger pans the map; an unmoved tap still opens nodes.
const touchPoints=new Map();
let touchPan=null,pinch=null,suppressMapClickUntil=0;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function startPinch(){
 const [a,b]=Array.from(touchPoints.values());
 const midpoint={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
 const r=screenRect();
 pinch={distance:Math.max(distance(a,b),1),width:view.w,
  worldX:view.x+clamp((midpoint.x-r.left)/r.width,0,1)*view.w,
  worldY:view.y+clamp((midpoint.y-r.top)/r.height,0,1)*view.h};
 touchPan=null;
}
viewport.addEventListener('pointerdown',e=>{
 if(e.pointerType==='touch'&&mobileLayout.matches){
  touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(touchPoints.size===2)startPinch();
  else if(touchPoints.size===1)touchPan={pointer:e.pointerId,x:e.clientX,y:e.clientY,originX:view.x,originY:view.y,moved:false};
  // Capturing an untouched node would retarget its click and break drill-down.
  if(!e.target.closest('[data-place],[data-home],[data-bridge]'))viewport.setPointerCapture(e.pointerId);
  return;
 }
 if(e.target.closest('[data-place],[data-home],[data-bridge]'))return;
 drag={x:e.clientX,y:e.clientY,originX:view.x,originY:view.y,pointer:e.pointerId};
 viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');
});
viewport.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'&&touchPoints.has(e.pointerId)&&mobileLayout.matches){
  touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(touchPoints.size>=2&&pinch){
   const [a,b]=Array.from(touchPoints.values());
   const midpoint={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
   const w=clamp(pinch.width*pinch.distance/Math.max(distance(a,b),1),240,maxWidth());
   const h=viewHeight(w),r=screenRect();
   view={x:pinch.worldX-clamp((midpoint.x-r.left)/r.width,0,1)*w,
    y:pinch.worldY-clamp((midpoint.y-r.top)/r.height,0,1)*h,w,h};
   constrain();updateView();
   suppressMapClickUntil=Date.now()+400;
  }else if(touchPan?.pointer===e.pointerId){
   const dx=e.clientX-touchPan.x,dy=e.clientY-touchPan.y;
   if(!touchPan.moved&&Math.hypot(dx,dy)<5)return;
   touchPan.moved=true;
   const r=screenRect();
   view.x=touchPan.originX-dx*view.w/r.width;
   view.y=touchPan.originY-dy*view.h/r.height;
   constrain();updateView();
   viewport.classList.add('dragging');
   suppressMapClickUntil=Date.now()+400;
  }
  return;
 }
 if(!drag||e.pointerId!==drag.pointer)return;
 const r=screenRect();view.x=drag.originX-(e.clientX-drag.x)*view.w/r.width;
 view.y=drag.originY-(e.clientY-drag.y)*view.h/r.height;
 constrain();updateView();
});
const stopDrag=()=>{drag=null;viewport.classList.remove('dragging');};
function endPointer(e){
 if(touchPoints.has(e.pointerId)){
  const wasPinching=!!pinch;
  const wasDragging=!!touchPan?.moved;
  touchPoints.delete(e.pointerId);
  if(wasPinching||wasDragging)suppressMapClickUntil=Date.now()+400;
  pinch=null;touchPan=null;
  if(touchPoints.size>=2)startPinch();
  else if(touchPoints.size===1){
   const [pointer,p]=Array.from(touchPoints.entries())[0];
   touchPan={pointer,x:p.x,y:p.y,originX:view.x,originY:view.y,moved:false};
  }else stopDrag();
  return;
 }
 stopDrag();
}
viewport.addEventListener('pointerup',endPointer);
viewport.addEventListener('pointercancel',endPointer);
// Avoid opening a residence or bridge when the user was actually panning/zooming.
svg.addEventListener('click',e=>{
 if(mobileLayout.matches&&Date.now()<suppressMapClickUntil){e.preventDefault();e.stopImmediatePropagation();}
},true);
// Public-place visibility controls only the floating pins. Building footprints/tints stay on the map.
$('toggle-places').onchange=e=>$('places-layer').classList.toggle('place-pins-hidden',!e.target.checked);
$('toggle-homes').onchange=e=>$('homes-layer').classList.toggle('map-layer-hidden',!e.target.checked);
$('toggle-flows').onchange=e=>$('flows-layer').classList.toggle('map-layer-hidden',!e.target.checked);
const inspector=$('inspector');$('inspector-close').onclick=()=>inspector.hidden=true;
function openInspector(type,title,description,content){$('inspector-type').textContent=type;$('inspector-title').textContent=title;$('inspector-desc').textContent=description;const body=$('inspector-content');body.replaceChildren();if(content)body.append(content);inspector.hidden=false;}
function infoPill(message){const span=document.createElement('span');span.className='pill';span.textContent=message;return span;}
function networkPreview(count){const NS='http://www.w3.org/2000/svg',network=document.createElementNS(NS,'svg');network.setAttribute('viewBox','0 0 250 150');network.setAttribute('class','person-graph');network.setAttribute('role','img');network.setAttribute('aria-label','Representação conceitual de pessoas conectadas no local');const centers=Array.from({length:count},(_,i)=>({x:125+72*Math.cos(i*2.39996),y:75+49*Math.sin(i*2.39996)}));for(let i=0;i<count;i++){for(let j=i+1;j<count;j++){if((i*11+j*7)%5>1)continue;const line=document.createElementNS(NS,'line');for(const [k,v] of Object.entries({x1:centers[i].x,y1:centers[i].y,x2:centers[j].x,y2:centers[j].y,stroke:'#b8c9c6','stroke-width':'.8'}))line.setAttribute(k,v);network.append(line);}}centers.forEach((p,i)=>{const circle=document.createElementNS(NS,'circle');for(const [k,v] of Object.entries({cx:p.x,cy:p.y,r:3.4,fill:i%4===0?'#e9b56c':'#5b9d89',stroke:'white','stroke-width':1}))circle.setAttribute(k,v);network.append(circle);});return network;}
function openPlace(p){const box=document.createElement('div');box.append(infoPill(`Capacidade planejada: ${p.capacity} pessoas`),networkPreview(18));const note=document.createElement('p');note.textContent='Este local participa da rede sintética da partida quando agentes estiverem presentes nele. O mapa mostra atividade epidemiológica agregada, não indivíduos reais.';box.append(note);openInspector(p.type.toUpperCase(),p.name,p.description,box);}
function openHome(el){const box=document.createElement('div');box.append(infoPill('Residência sintética'),networkPreview(4));const note=document.createElement('p');note.textContent='Este nó representa domicílios sintéticos agregados. Contatos familiares permanecem possíveis mesmo quando outras atividades são fechadas.';box.append(note);const region=districts.find(d=>d.id===el.dataset.region);openInspector('RESIDÊNCIA',el.dataset.home.replace('casa-','Casa '),`Bairro: ${region?.name??'Não atribuído'}. Cada casa agregará indivíduos, contatos domésticos e deslocamentos.`,box);}
function openBridge(b){const box=document.createElement('div');box.append(infoPill(bridgeState[b.id]?'Travessia aberta':'Travessia bloqueada'));const note=document.createElement('p');note.textContent='Nesta primeira versão jogável, a ponte ainda é um controle visual. O bloqueio individual será conectado ao recálculo de rotas numa etapa posterior.';box.append(note);openInspector('PONTE',b.name,'Gargalo de mobilidade entre as duas margens do rio fictício.',box);}
function drawBridgeControls(){const root=$('bridge-controls');root.replaceChildren();for(const b of bridges){const row=document.createElement('div');row.className='bridge-control';const label=document.createElement('span'),name=document.createElement('b'),desc=document.createElement('small');name.textContent=b.name;desc.textContent=bridgeState[b.id]?'Travessia aberta':'Travessia bloqueada';label.append(name,desc);const button=document.createElement('button');button.type='button';button.textContent=bridgeState[b.id]?'Aberta':'Fechada';button.className=bridgeState[b.id]?'':'closed';button.setAttribute('aria-label',`${bridgeState[b.id]?'Bloquear':'Abrir'} ${b.name}`);button.onclick=()=>{bridgeState[b.id]=!bridgeState[b.id];syncBridge(b);drawBridgeControls();if(!inspector.hidden&&$('inspector-title').textContent===b.name)openBridge(b);};row.append(label,button);root.append(row);}}
function syncBridge(b){const g=document.querySelector(`[data-bridge="${b.id}"]`),flow=document.querySelector(`[data-flow-bridge="${b.id}"]`);g?.classList.toggle('bridge-closed',!bridgeState[b.id]);if(flow)flow.style.display=bridgeState[b.id]?'':'none';}drawBridgeControls();
function handleNode(el){if(el.dataset.place){const p=places.find(p=>p.id===el.dataset.place);if(p)openPlace(p);}else if(el.dataset.home)openHome(el);else if(el.dataset.bridge){const b=bridges.find(b=>b.id===el.dataset.bridge);if(b)openBridge(b);}}
svg.addEventListener('click',e=>{const el=e.target.closest('[data-place],[data-home],[data-bridge]');if(el)handleNode(el);});svg.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('[data-place],[data-home],[data-bridge]');if(el){e.preventDefault();handleNode(el);}});
