import {districts,places} from './city-data.js';

const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const districtIndex=new Map(districts.map((d,i)=>[d.id,i]));
const placeById=()=>new Map(places.map(p=>[p.id,p]));
const AGE_LABEL={child:'criança/adolescente',adult:'adulto',older:'idoso'};
const AGE_COLOR={child:'#4f8fc7',adult:'#5e9c79',older:'#a66f9e'};

const state={
  phase:'setup',
  population:null,
  populationIndexes:null,
  spatialModel:null,
  selected:null,
  result:null,
  currentDay:0,
  timer:null,
  speed:500,
  runToken:0,
  resumeDay:0,
  autoplay:true,
  interventions:[],
  vaccination:null,
  nodeEvents:[],
  decisions:[]
};

const worker=new Worker(new URL('./simulation-worker.js',import.meta.url),{type:'module'});
const svg=$('city-map');
const populationRange=$('game-population');
const populationNumber=$('game-population-number');
const prepareButton=$('game-prepare');
const disease=$('game-disease');
const transmissibility=$('game-transmissibility');
const startButton=$('game-start');
const playButton=$('game-play');
const stepButton=$('game-step');
const resetButton=$('game-reset');
const speedSelect=$('game-speed');
const focusText=$('game-focus');
const message=$('game-message');
const alertBox=$('game-alert');
const alertText=$('game-alert-text');
const decisionsRoot=$('game-decisions');
const decisionLog=$('game-decision-log');
const inspector=$('inspector');

function announce(text,tone=''){
  message.textContent=text;
  message.dataset.tone=tone;
}

function nfmt(n){return Number(n||0).toLocaleString('pt-BR');}
function pct(a,b){return b?Math.round(a/b*100):0;}
function homeLabel(id){return id?.startsWith('casa-')?'Casa '+id.slice(5):id||'Residência';}
function personLabel(p){return `Pessoa ${String(p.id+1).padStart(5,'0')}`; }
function roleLabel(p){
  if(p.healthWorker)return 'Profissional de saúde';
  if(p.teacher)return 'Professor(a)';
  if(p.schoolEnrolled)return 'Estudante';
  if(p.working)return 'Trabalhador(a)';
  return p.age==='older'?'Aposentado(a) / morador(a)':'Morador(a)';
}

function syncPopulation(source){
  const n=clamp(Math.round(Number(source.value)||10),10,30000);
  populationRange.value=n;
  populationNumber.value=n;
}
populationRange.addEventListener('input',()=>syncPopulation(populationRange));
populationNumber.addEventListener('change',()=>syncPopulation(populationNumber));
populationNumber.addEventListener('input',()=>syncPopulation(populationNumber));

function buildSpatialModel(){
  const homes=[...document.querySelectorAll('#homes-layer [data-home]')].map(node=>({
    id:node.dataset.home,
    regionId:node.dataset.region,
    regionIndex:districtIndex.get(node.dataset.region)??0
  }));
  const pmap=placeById();
  const publicPlaces=[...document.querySelectorAll('#places-layer [data-place]')].map(node=>{
    const p=pmap.get(node.dataset.place);
    if(!p)return null;
    return {
      id:p.id,type:p.type,name:p.name,capacity:p.capacity,
      regionId:p.region,regionIndex:districtIndex.get(p.region)??0
    };
  }).filter(Boolean);
  return {homes,places:publicPlaces,regions:districts.map((d,i)=>({id:d.id,index:i,name:d.name}))};
}

function getBaseSetup(){
  return {
    population:Number(populationNumber.value),
    regions:districts.length,
    days:180,
    seed:20260925,
    pathogenId:disease.value,
    transmissibility:transmissibility.value,
    spatialModel:state.spatialModel
  };
}

function setBusy(busy,kind='run'){
  document.documentElement.classList.toggle('game-busy',busy);
  prepareButton.disabled=busy;
  startButton.disabled=busy||!state.selected;
  playButton.disabled=busy||!state.result;
  stepButton.disabled=busy||!state.result;
  if(busy)announce(kind==='prepare'?'Distribuindo os agentes entre famílias, escolas e trabalhos…':'Calculando a trajetória epidemiológica…','busy');
}

function clearSeedSelection(){
  document.querySelectorAll('.game-seed-target').forEach(el=>el.classList.remove('game-seed-target'));
}

function clearPopulationDecorations(){
  document.querySelectorAll('#homes-layer [data-home]').forEach(node=>{
    delete node.dataset.residents;
    node.removeAttribute('aria-description');
  });
}

function indexPopulation(population){
  const byVisualHome=new Map(),byHousehold=new Map(),byPlace=new Map(),byId=new Map();
  for(const p of population.persons){
    byId.set(p.id,p);
    if(!byVisualHome.has(p.visualHome))byVisualHome.set(p.visualHome,[]);
    byVisualHome.get(p.visualHome).push(p);
    if(!byHousehold.has(p.householdId))byHousehold.set(p.householdId,[]);
    byHousehold.get(p.householdId).push(p);
    for(const place of [p.school,p.work,p.market,p.community,p.hospital]){
      if(!place)continue;
      if(!byPlace.has(place))byPlace.set(place,[]);
      byPlace.get(place).push(p);
    }
  }
  return {byVisualHome,byHousehold,byPlace,byId};
}

function decoratePopulation(){
  clearPopulationDecorations();
  if(!state.populationIndexes)return;
  for(const [homeId,people] of state.populationIndexes.byVisualHome){
    const node=document.querySelector(`#homes-layer [data-home="${CSS.escape(homeId)}"]`);
    if(!node)continue;
    node.dataset.residents=String(people.length);
    const households=new Set(people.map(p=>p.householdId)).size;
    node.setAttribute('aria-description',`${people.length} residentes sintéticos em ${households} domicílios`);
  }
}

function clearPreparedPopulation(){
  pause();
  state.population=null;
  state.populationIndexes=null;
  state.spatialModel=null;
  state.selected=null;
  state.result=null;
  state.nodeEvents=[];
  state.interventions=[];
  state.vaccination=null;
  state.decisions=[];
  state.phase='setup';
  clearSeedSelection();
  clearHeat();
  clearPopulationDecorations();
  populationRange.disabled=false;
  populationNumber.disabled=false;
  prepareButton.textContent='Distribuir população';
  startButton.disabled=true;
  focusText.textContent='Distribua a população primeiro';
  inspector.hidden=true;
  $('game-status').textContent='Configuração da cidade';
  announce('Defina o tamanho da população e distribua os agentes pela cidade.','');
}

function preparePopulation(){
  state.spatialModel=buildSpatialModel();
  if(!state.spatialModel.homes.length){
    announce('Os nós residenciais ainda não foram carregados. Tente novamente.','error');
    return;
  }
  state.runToken++;
  setBusy(true,'prepare');
  worker.postMessage({type:'prepare',token:state.runToken,setup:getBaseSetup()});
}

prepareButton.addEventListener('click',()=>{
  if(state.population){clearPreparedPopulation();return;}
  preparePopulation();
});

function openInspector(type,title,description,content){
  $('inspector-type').textContent=type;
  $('inspector-title').textContent=title;
  $('inspector-desc').textContent=description;
  $('inspector-content').replaceChildren(content);
  inspector.hidden=false;
}

function locationName(id){
  if(!id)return null;
  if(id.startsWith('household-'))return 'Domicílio';
  if(id.startsWith('casa-'))return homeLabel(id);
  return placeById().get(id)?.name??state.population?.places.find(p=>p.id===id)?.name??id;
}

function routeForPerson(p){
  const middle=p.school||p.work;
  const day=middle?locationName(middle):homeLabel(p.visualHome);
  const evening=[p.market,p.community].filter(Boolean).map(locationName).filter(Boolean);
  const eveningText=evening.length?evening.join(' ou '):'casa';
  return `${homeLabel(p.visualHome)} → ${day} → ${eveningText} → ${homeLabel(p.visualHome)}`;
}

function infectionInfoForPerson(personId){
  if(!state.result)return null;
  const infection=state.result.events.find(e=>e.type==='infection'&&e.person===personId&&e.day<=state.currentDay);
  if(!infection)return 'Sem infecção registrada até o dia atual.';
  const place=infection.visualPlace?locationName(infection.visualPlace):locationName(infection.place);
  const source=infection.source===null?'introdução inicial':personLabel({id:infection.source});
  return `Infecção no dia ${infection.day} · ${place||'local não exibido'} · fonte: ${source}.`;
}

function personCard(p,selectable=true){
  const button=document.createElement('button');
  button.type='button';
  button.className='resident-card';
  button.dataset.agent=String(p.id);
  button.disabled=!selectable;
  const dot=document.createElement('i');dot.className='resident-dot';dot.style.background=AGE_COLOR[p.age]||'#819197';
  const text=document.createElement('span');
  const strong=document.createElement('strong');strong.textContent=`${personLabel(p)} · ${p.ageYears} anos`;
  const small=document.createElement('small');small.textContent=`${roleLabel(p)} · ${AGE_LABEL[p.age]}`;
  text.append(strong,small);
  button.append(dot,text);
  return button;
}

function drawHouseholdGraph(people,selectable){
  const wrap=document.createElement('div');wrap.className='household-graph-wrap';
  const NS='http://www.w3.org/2000/svg';
  const graph=document.createElementNS(NS,'svg');
  graph.setAttribute('viewBox','0 0 280 190');graph.setAttribute('class','household-graph');
  graph.setAttribute('role','img');graph.setAttribute('aria-label','Relações de convivência do domicílio');
  const cx=140,cy=91,r=people.length<=2?52:65;
  const pts=people.map((p,i)=>{
    const angle=-Math.PI/2+i*2*Math.PI/Math.max(people.length,1);
    return {p,x:cx+r*Math.cos(angle),y:cy+r*.72*Math.sin(angle)};
  });
  for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
    const line=document.createElementNS(NS,'line');
    line.setAttribute('x1',pts[i].x);line.setAttribute('y1',pts[i].y);
    line.setAttribute('x2',pts[j].x);line.setAttribute('y2',pts[j].y);
    line.setAttribute('class','household-link');graph.append(line);
  }
  for(const point of pts){
    const g=document.createElementNS(NS,'g');g.setAttribute('class','household-person-node');
    g.dataset.agent=String(point.p.id);if(selectable)g.setAttribute('tabindex','0');
    const circle=document.createElementNS(NS,'circle');
    circle.setAttribute('cx',point.x);circle.setAttribute('cy',point.y);circle.setAttribute('r','14');
    circle.setAttribute('fill',AGE_COLOR[point.p.age]||'#819197');
    const label=document.createElementNS(NS,'text');
    label.setAttribute('x',point.x);label.setAttribute('y',point.y+3.5);
    label.setAttribute('text-anchor','middle');label.textContent=String(point.p.ageYears);
    g.append(circle,label);graph.append(g);
  }
  wrap.append(graph);
  const caption=document.createElement('p');caption.className='graph-caption';
  caption.textContent='As linhas representam convivência no mesmo domicílio. A idade aparece dentro de cada nó.';
  wrap.append(caption);
  return wrap;
}

function choosePatient(person,visualPlace,seedContext='home'){
  if(state.result)return;
  clearSeedSelection();
  const homeNode=document.querySelector(`#homes-layer [data-home="${CSS.escape(person.visualHome)}"]`);
  const placeNode=document.querySelector(`#places-layer [data-place="${CSS.escape(visualPlace)}"]`);
  (placeNode||homeNode)?.classList.add('game-seed-target');
  state.selected={
    kind:'person',agentId:person.id,id:visualPlace,visualHome:person.visualHome,
    regionIndex:person.region,seedContext,seedPlaceId:visualPlace,label:personLabel(person)
  };
  focusText.textContent=`${personLabel(person)} · ${person.ageYears} anos · ${locationName(visualPlace)}`;
  startButton.disabled=false;
  announce('Paciente zero definido. Agora escolha a doença/transmissibilidade e inicie o surto.','ok');
}

function renderHouseholdPanel(homeId,householdId){
  const people=state.populationIndexes.byHousehold.get(householdId)||[];
  const root=document.createElement('div');root.className='residence-detail';
  const householdHeader=document.createElement('div');householdHeader.className='household-header';
  const title=document.createElement('strong');title.textContent=`Domicílio ${householdId.replace('household-','')}`;
  const summary=document.createElement('small');
  const counts={child:0,adult:0,older:0};people.forEach(p=>counts[p.age]++);
  summary.textContent=`${people.length} moradores · ${counts.adult} adultos · ${counts.child} crianças/adolescentes · ${counts.older} idosos`;
  householdHeader.append(title,summary);root.append(householdHeader);
  root.append(drawHouseholdGraph(people,!state.result));
  const list=document.createElement('div');list.className='resident-list';
  for(const p of people){
    const card=personCard(p,!state.result);
    card.addEventListener('click',()=>{
      choosePatient(p,homeId,'home');
      openResidenceInspector(homeId,householdId);
    });
    list.append(card);
  }
  root.append(list);
  const selected=state.selected?.agentId;
  if(selected!==undefined&&people.some(p=>p.id===selected)){
    const p=people.find(p=>p.id===selected);
    const detail=document.createElement('div');detail.className='person-route';
    detail.innerHTML=`<b>Paciente zero selecionado</b><span>${routeForPerson(p)}</span><small>Manhã e noite em casa; escola/trabalho durante o dia; saída comunitária possível no fim do dia.</small>`;
    root.append(detail);
  }else if(state.result){
    const infected=people.map(p=>({p,info:infectionInfoForPerson(p.id)})).filter(x=>!x.info.startsWith('Sem infecção'));
    if(infected.length){
      const info=document.createElement('div');info.className='person-route';
      info.innerHTML=`<b>Situação até o dia ${state.currentDay}</b>`;
      infected.slice(0,5).forEach(x=>{const s=document.createElement('small');s.textContent=`${personLabel(x.p)}: ${x.info}`;info.append(s);});
      root.append(info);
    }
  }
  return root;
}

function openResidenceInspector(homeId,preferredHousehold=null){
  if(!state.population){
    announce('Distribua a população antes de abrir as residências.','error');
    return;
  }
  const people=state.populationIndexes.byVisualHome.get(homeId)||[];
  const households=[...new Set(people.map(p=>p.householdId))];
  const ages={child:0,adult:0,older:0};people.forEach(p=>ages[p.age]++);
  const root=document.createElement('div');
  if(!people.length){
    const p=document.createElement('p');p.textContent='Nenhum agente foi associado a este nó na população atual.';root.append(p);
  }else{
    const stats=document.createElement('div');stats.className='residence-stats';
    stats.innerHTML=`<span><b>${nfmt(people.length)}</b> residentes</span><span><b>${nfmt(households.length)}</b> domicílios</span><span><b>${ages.child}</b> jovens</span><span><b>${ages.older}</b> idosos</span>`;
    root.append(stats);
    let active=preferredHousehold&&households.includes(preferredHousehold)?preferredHousehold:households[0];
    if(households.length>1){
      const label=document.createElement('label');label.className='household-select';
      const span=document.createElement('span');span.textContent='Domicílio dentro deste nó residencial';
      const select=document.createElement('select');
      households.forEach((id,i)=>{const o=document.createElement('option');o.value=id;o.textContent=`Domicílio ${i+1} · ${state.populationIndexes.byHousehold.get(id).length} moradores`;select.append(o);});
      select.value=active;
      label.append(span,select);root.append(label);
      const detail=document.createElement('div');detail.className='household-detail-slot';detail.append(renderHouseholdPanel(homeId,active));root.append(detail);
      select.addEventListener('change',()=>{active=select.value;detail.replaceChildren(renderHouseholdPanel(homeId,active));});
    }else root.append(renderHouseholdPanel(homeId,active));
  }
  const districtId=document.querySelector(`#homes-layer [data-home="${CSS.escape(homeId)}"]`)?.dataset.region;
  const district=districts.find(d=>d.id===districtId);
  openInspector('RESIDÊNCIA',homeLabel(homeId),`${district?.name??'Distrito'} · população sintética persistente da partida.`,root);
}

function seedContextForPlace(type){
  if(type==='school')return 'school';
  if(type==='office'||type==='civic')return 'work';
  if(type==='market'||type==='commerce'||type==='restaurant')return 'retail';
  if(type==='park')return 'community';
  if(type==='hospital')return 'hospital';
  return 'home';
}

function openPublicInspector(placeId){
  if(!state.population){announce('Distribua a população antes de abrir os locais públicos.','error');return;}
  const p=placeById().get(placeId);
  if(!p)return;
  const people=state.populationIndexes.byPlace.get(placeId)||[];
  const root=document.createElement('div');
  const stats=document.createElement('div');stats.className='residence-stats';
  stats.innerHTML=`<span><b>${nfmt(people.length)}</b> agentes vinculados</span><span><b>${nfmt(p.capacity)}</b> capacidade visual</span>`;
  root.append(stats);
  const note=document.createElement('p');note.className='graph-caption';
  note.textContent='Os vínculos indicam escola, trabalho ou destino habitual. Presença efetiva depende do dia, horário e medidas em vigor.';
  root.append(note);
  if(!state.result&&people.length){
    const list=document.createElement('div');list.className='resident-list';
    for(const person of people.slice(0,12)){
      const card=personCard(person,true);
      card.addEventListener('click',()=>{
        choosePatient(person,placeId,seedContextForPlace(p.type));
        openPublicInspector(placeId);
      });
      list.append(card);
    }
    root.append(list);
    if(people.length>12){
      const more=document.createElement('p');more.className='graph-caption';more.textContent=`Mostrando 12 de ${nfmt(people.length)} agentes vinculados.`;root.append(more);
    }
  }
  if(state.selected?.id===placeId){
    const chosen=state.populationIndexes.byId.get(state.selected.agentId);
    if(chosen){
      const route=document.createElement('div');route.className='person-route';
      route.innerHTML=`<b>${personLabel(chosen)} selecionado</b><span>${routeForPerson(chosen)}</span>`;
      root.append(route);
    }
  }
  openInspector(p.type.toUpperCase(),p.name,p.description,root);
}

svg.addEventListener('click',event=>{
  const el=event.target.closest('[data-home],[data-place]');
  if(!el)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!state.population){
    announce('Primeiro clique em “Distribuir população”.','error');
    return;
  }
  if(el.dataset.home)openResidenceInspector(el.dataset.home);
  else openPublicInspector(el.dataset.place);
},true);

function getRunSetup(){
  return {
    ...getBaseSetup(),
    initialInfections:1,
    initialSeedRegion:state.selected.regionIndex,
    initialSeedContext:state.selected.seedContext,
    initialSeedAgentId:state.selected.agentId,
    initialSeedPlaceId:state.selected.seedPlaceId,
    interventions:state.interventions,
    vaccination:state.vaccination
  };
}

function runSimulation({resumeDay=0,autoplay=true}={}){
  if(!state.population){announce('Distribua a população primeiro.','error');return;}
  if(!state.selected){announce('Abra uma residência ou local e escolha uma pessoa como paciente zero.','error');return;}
  pause();
  state.resumeDay=resumeDay;state.autoplay=autoplay;
  const token=++state.runToken;
  setBusy(true,'run');
  worker.postMessage({type:'run',token,setup:getRunSetup()});
}

worker.onmessage=event=>{
  const data=event.data||{};
  if(data.token!==state.runToken)return;
  if(data.type==='error'){
    setBusy(false);announce('Erro no motor: '+data.message,'error');return;
  }
  if(data.type==='prepared'){
    state.population=data.population;
    state.populationIndexes=indexPopulation(data.population);
    state.phase='population';
    populationRange.disabled=true;populationNumber.disabled=true;
    prepareButton.textContent='Alterar população';
    state.selected=null;clearSeedSelection();decoratePopulation();
    focusText.textContent='Abra uma residência e escolha uma pessoa';
    startButton.disabled=true;setBusy(false);
    const homes=state.populationIndexes.byVisualHome.size;
    const households=state.populationIndexes.byHousehold.size;
    $('game-status').textContent='População distribuída';
    announce(`${nfmt(state.population.persons.length)} agentes distribuídos em ${nfmt(households)} domicílios e ${nfmt(homes)} nós residenciais. Clique em uma casa.`,'ok');
    return;
  }
  if(data.type!=='result')return;
  state.result=data.result;
  buildNodeEvents();
  state.currentDay=clamp(state.resumeDay,0,state.result.daily.length-1);
  state.phase='paused';
  setBusy(false);playButton.disabled=false;stepButton.disabled=false;
  renderDay(state.currentDay);
  announce(`Motor ${data.result.modelVersion} · paciente zero: ${state.selected.label}.`,'ok');
  if(state.autoplay)play();
};

function nodeFromVisualId(id){
  return document.querySelector(`#homes-layer [data-home="${CSS.escape(id)}"]`)||
         document.querySelector(`#places-layer [data-place="${CSS.escape(id)}"]`);
}

function buildNodeEvents(){
  const days=state.result.daily.length;
  state.nodeEvents=Array.from({length:days},()=>new Map());
  for(const event of state.result.events){
    if(event.type!=='infection')continue;
    const visual=event.visualPlace||event.place;
    if(!visual||!nodeFromVisualId(visual))continue;
    const map=state.nodeEvents[event.day]??state.nodeEvents[0];
    map.set(visual,(map.get(visual)||0)+1);
  }
}

function clearHeat(){
  document.querySelectorAll('[data-game-level]').forEach(el=>el.removeAttribute('data-game-level'));
}

function renderHeat(day){
  clearHeat();
  const rolling=new Map();
  for(let d=Math.max(0,day-9);d<=day;d++){
    for(const [id,count] of state.nodeEvents[d]||[])rolling.set(id,(rolling.get(id)||0)+count);
  }
  for(const [id,count] of rolling){
    const node=nodeFromVisualId(id);if(!node)continue;
    node.dataset.gameLevel=String(count>=8?3:count>=3?2:1);
  }
  const seedNode=nodeFromVisualId(state.selected?.seedPlaceId||state.selected?.visualHome);
  seedNode?.classList.add('game-seed-target');
}

function renderDay(day){
  if(!state.result)return;
  state.currentDay=clamp(day,0,state.result.daily.length-1);
  const d=state.result.daily[state.currentDay];
  $('game-day').textContent='Dia '+d.day;
  $('game-active').textContent=nfmt(d.E+d.I+d.H);
  $('game-hospitalized').textContent=nfmt(d.H);
  $('game-deaths').textContent=nfmt(d.D);
  $('game-beds').textContent=`${nfmt(d.bedsOccupied)} / ${nfmt(d.bedCapacity)}`;
  $('game-attack').textContent=pct(d.R+d.D+d.E+d.I+d.H,Number(populationNumber.value))+'%';
  $('game-new').textContent=nfmt(d.newInfections);
  $('game-progress').style.width=(state.currentDay/(state.result.daily.length-1)*100)+'%';
  $('game-progress').parentElement.setAttribute('aria-valuenow',String(state.currentDay));
  renderHeat(state.currentDay);
  if(d.gameAlert){
    alertBox.classList.add('active');
    const first=state.result.summary.alertDay;
    alertText.textContent=`Alerta de epidemia simulada · detectado no dia ${first}. Admissões recentes: ${nfmt(d.alertMetric)} · limite esperado: ${nfmt(d.alertThreshold)}.`;
    unlockDecisions(true);
  }else{
    alertBox.classList.remove('active');
    alertText.textContent='Vigilância hospitalar ainda abaixo do limiar de alerta.';
    unlockDecisions(false);
  }
  $('game-status').textContent=state.phase==='running'?'Simulação em curso':state.currentDay>=state.result.daily.length-1?'Fim do horizonte':'Simulação pausada';
  playButton.textContent=state.phase==='running'?'Pausar':'Continuar';
}

function play(){
  if(!state.result)return;
  pause();state.phase='running';renderDay(state.currentDay);
  state.timer=setInterval(()=>{
    if(state.currentDay>=state.result.daily.length-1){pause();state.phase='ended';renderDay(state.currentDay);return;}
    renderDay(state.currentDay+1);
  },state.speed);
}
function pause(){
  if(state.timer){clearInterval(state.timer);state.timer=null;}
  if(state.result&&state.phase!=='ended')state.phase='paused';
}
playButton.addEventListener('click',()=>state.phase==='running'?pause():play());
stepButton.addEventListener('click',()=>{pause();if(state.result)renderDay(state.currentDay+1);});
speedSelect.addEventListener('change',()=>{state.speed=Number(speedSelect.value);if(state.phase==='running')play();});

function resetGame(){
  pause();
  state.phase='setup';state.population=null;state.populationIndexes=null;state.spatialModel=null;
  state.selected=null;state.result=null;state.currentDay=0;state.interventions=[];state.vaccination=null;
  state.decisions=[];state.nodeEvents=[];
  clearHeat();clearSeedSelection();clearPopulationDecorations();
  populationRange.disabled=false;populationNumber.disabled=false;prepareButton.disabled=false;
  prepareButton.textContent='Distribuir população';
  startButton.disabled=true;playButton.disabled=true;stepButton.disabled=true;
  focusText.textContent='Distribua a população primeiro';
  alertBox.classList.remove('active');alertText.textContent='O hospital ainda não detectou excesso de casos.';
  $('game-day').textContent='Dia —';
  for(const id of ['game-active','game-hospitalized','game-deaths','game-new'])$(id).textContent='—';
  $('game-beds').textContent='—';$('game-attack').textContent='—';$('game-progress').style.width='0%';
  decisionLog.replaceChildren();inspector.hidden=true;resetAppliedButtons();unlockDecisions(false);
  $('game-status').textContent='Configuração da cidade';
  announce('Defina o tamanho da população e distribua os agentes pela cidade.','');
}
resetButton.addEventListener('click',resetGame);
startButton.addEventListener('click',()=>runSimulation({resumeDay:state.result?state.currentDay:0,autoplay:true}));

const ACTIONS={
  school:{label:'Fechar escolas',intervention:{type:'school_closure',fraction:1}},
  remote:{label:'Home office',intervention:{type:'remote_work',fraction:.6}},
  leisure:{label:'Fechar lazer',intervention:{type:'community_closure',fraction:1}},
  retail:{label:'Restringir comércio',intervention:{type:'retail_limit',fraction:1}},
  lockdown:{label:'Lockdown',intervention:{type:'lockdown',fraction:1}}
};
function unlockDecisions(unlocked){
  for(const button of decisionsRoot.querySelectorAll('button[data-action]'))button.disabled=!unlocked||button.dataset.applied==='true';
}
function addDecisionLog(label,day){
  const item=document.createElement('li');item.textContent=`Dia ${day}: ${label}`;decisionLog.prepend(item);
}
decisionsRoot.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action]');
  if(!button||button.disabled||!state.result)return;
  const action=button.dataset.action,startDay=Math.min(state.currentDay+1,state.result.daily.length-1);
  if(action==='vaccine'){
    state.vaccination={
      enabled:true,availableDay:startDay,dosesPerDay:Math.max(5,Math.round(Number(populationNumber.value)*.01)),
      uptakeProbability:.75,daysToProtection:14,infectionProtectionFraction:.55,severeProtectionFraction:.60,priority:'older_first'
    };
    button.dataset.applied='true';state.decisions.push({day:startDay,label:'Iniciar vacinação (cenário)'});addDecisionLog('Iniciar vacinação (cenário)',startDay);
  }else{
    const spec=ACTIONS[action];if(!spec)return;
    state.interventions.push({...spec.intervention,startDay,endDay:179});
    button.dataset.applied='true';state.decisions.push({day:startDay,label:spec.label});addDecisionLog(spec.label,startDay);
  }
  announce('Decisão aplicada a partir do próximo dia. Recalculando com a mesma população e paciente zero…','busy');
  runSimulation({resumeDay:state.currentDay,autoplay:false});
});
function resetAppliedButtons(){for(const button of decisionsRoot.querySelectorAll('button[data-action]'))delete button.dataset.applied;}

$('inspector-close').addEventListener('click',()=>{inspector.hidden=true;});

unlockDecisions(false);
syncPopulation(populationNumber);
startButton.disabled=true;
focusText.textContent='Distribua a população primeiro';
