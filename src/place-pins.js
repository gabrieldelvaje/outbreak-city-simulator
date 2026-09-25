// Replace only public-facility graph dots with map pins. Residence nodes and
// parks remain unchanged; each pin keeps the original place's click handler.
const NS='http://www.w3.org/2000/svg';
function svg(tag,attrs,parent){
  const el=document.createElementNS(NS,tag);
  for(const [name,value] of Object.entries(attrs))el.setAttribute(name,String(value));
  parent.append(el);
  return el;
}
function renderPins(){
  const places=document.querySelector('#places-layer');
  if(!places)return false;
  for(const place of places.querySelectorAll('.map-place')){
    const dot=place.querySelector(':scope > .place-bubble');
    if(!dot)continue; // No pin for parks or already converted facilities.
    const cx=Number(dot.getAttribute('cx'));
    const cy=Number(dot.getAttribute('cy'));
    const color=dot.getAttribute('fill')||'#607a98';
    const oldGlyph=Array.from(place.children).find(el=>el.localName==='text'&&!el.classList.contains('place-label'));
    const glyph=oldGlyph?.textContent==='+'?'H':oldGlyph?.textContent||'•';
    const pin=svg('g',{class:'place-pin',transform:`translate(${cx} ${cy})`},place);
    const art=svg('g',{class:'place-pin-art'},pin);
    svg('path',{d:'M0 0C-5 -8 -15 -17 -15 -24A15 15 0 1 1 15 -24C15 -17 5 -8 0 0Z',fill:color,stroke:'#fff','stroke-width':1.8,class:'place-pin-shape'},art);
    svg('circle',{cx:0,cy:-24,r:10.5,fill:'#fff','pointer-events':'none'},art);
    const text=svg('text',{x:0,y:-19.9,'font-size':12.5,'font-weight':800,'text-anchor':'middle',fill:color,'pointer-events':'none'},art);
    text.textContent=glyph;
    const label=place.querySelector(':scope > .place-label');
    if(label)place.insertBefore(pin,label);
    dot.remove();
    oldGlyph?.remove();
  }
  return true;
}
if(!renderPins()){
  const root=document.getElementById('map-world');
  if(root){
    const observer=new MutationObserver(()=>{
      if(renderPins())observer.disconnect();
    });
    observer.observe(root,{childList:true,subtree:true});
  }
}
