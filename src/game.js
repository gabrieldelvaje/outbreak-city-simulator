import {districts,places} from './city-data.js';
import {buildDecisionCheckpoints,nextDecisionCheckpoint} from './decision-checkpoints.js';

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
  speed:90,
  runToken:0,
  resumeDay:0,
  autoplay:true,
  interventions:[],
  vaccination:null,
  nodeEvents:[],
  decisions:[],
  cityName:'Nova Aurora',
  vaccinationCampaigns:[],
  decisionCheckpoints:[],
  acknowledgedCheckpoints:new Set(),
  currentDecisionCheckpoint:null,
  finalReportRequested:false,
  finalComparison:null
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
const cityNameInput=$('game-city-name');
const setupOverlay=$('setup-overlay');
const epicenterOverlay=$('epicenter-overlay');
const decisionOverlay=$('decision-overlay');
const decisionTitle=$('decision-title');
const decisionMessage=$('decision-message');
const sidebar=$('game-sidebar');
const finalReportOverlay=$('final-report-overlay');
const finalReportTitle=$('final-report-title');
const finalReportSummary=$('final-report-summary');
const finalReportComparison=$('final-report-comparison');
const finalReportDecisions=$('final-report-decisions');
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
  const n=clamp(Math.round(Number(source.value)||10),10,20000);
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
    days:360,
    seed:20260925,
    pathogenId:disease.value,
    transmissibility:'high',
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
  state.vaccinationCampaigns=[];
  state.decisions=[];
  state.decisionCheckpoints=[];
  state.acknowledgedCheckpoints=new Set();
  state.currentDecisionCheckpoint=null;
  state.finalReportRequested=false;state.finalComparison=null;
  state.phase='setup';
  clearSeedSelection();
  clearHeat();
  clearPopulationDecorations();
  populationRange.disabled=false;
  populationNumber.disabled=false;
  prepareButton.textContent='Distribuir população';
  setupOverlay.hidden=false;setupOverlay.classList.add('is-open');
  epicenterOverlay.hidden=true;decisionOverlay.hidden=true;finalReportOverlay.hidden=true;sidebar.classList.add('is-hidden');
  startButton.disabled=true;
  focusText.textContent='Clique em uma residência ou local público e escolha uma pessoa no grafo.';
  inspector.hidden=true;
  $('game-status').textContent='Configuração da cidade';
  announce('Configure sua cidade para começar.','');
}

function preparePopulation(){
  state.cityName=(cityNameInput.value||'Nova Aurora').trim().slice(0,28)||'Nova Aurora';
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

function drawHouseholdGraph(people,selectable,onSelect){
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
    g.dataset.agent=String(point.p.id);
    if(selectable){
      g.setAttribute('tabindex','0');g.setAttribute('role','button');
      g.setAttribute('aria-label',`${personLabel(point.p)}, ${point.p.ageYears} anos`);
      g.addEventListener('click',()=>onSelect?.(point.p));
      g.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect?.(point.p);}
      });
    }
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
  epicenterOverlay.classList.add('is-ready');
  announce('Paciente zero definido. Clique em “Iniciar surto” para começar os 360 dias.','ok');
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
  root.append(drawHouseholdGraph(people,!state.result,p=>{
    choosePatient(p,homeId,'home');
    openResidenceInspector(homeId,householdId);
  }));
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
    vaccination:state.vaccination,
    vaccinationCampaigns:state.vaccinationCampaigns
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
  if(data.type==='comparison'){
    state.finalComparison=data.comparison;
    state.finalReportRequested=false;
    renderFinalReport(data.comparison);
    return;
  }
  if(data.type==='prepared'){
    state.population=data.population;
    state.populationIndexes=indexPopulation(data.population);
    state.phase='population';
    populationRange.disabled=true;populationNumber.disabled=true;
    prepareButton.textContent='Alterar população';
    state.selected=null;clearSeedSelection();decoratePopulation();
    focusText.textContent='Clique em uma residência ou local público e escolha uma pessoa no grafo.';
    startButton.disabled=true;setBusy(false);
    setupOverlay.hidden=true;setupOverlay.classList.remove('is-open');
    epicenterOverlay.hidden=false;epicenterOverlay.classList.remove('is-ready');
    sidebar.classList.add('is-hidden');
    const homes=state.populationIndexes.byVisualHome.size;
    const households=state.populationIndexes.byHousehold.size;
    $('game-status').textContent='Escolha o epicentro';
    const crossDistrict=state.population.persons.filter(p=>(p.work&&p.workRegion!==p.region)||(p.school&&p.schoolRegion!==p.region)||(p.market&&p.marketRegion!==p.region)||(p.community&&p.communityRegion!==p.region)).length;
    announce(`${nfmt(state.population.persons.length)} agentes distribuídos em ${nfmt(households)} domicílios. ${nfmt(crossDistrict)} têm ao menos um destino habitual em outro bairro. Clique em uma casa.`,'ok');
    return;
  }
  if(data.type!=='result')return;
  state.result=data.result;
  buildNodeEvents();
  state.decisionCheckpoints=buildDecisionCheckpoints(state.result,{districtCount:districts.length});
  for(const checkpoint of state.decisionCheckpoints){
    if(checkpoint.day<state.resumeDay)state.acknowledgedCheckpoints.add(checkpoint.id);
  }
  state.currentDecisionCheckpoint=null;
  state.currentDay=clamp(state.resumeDay,0,state.result.daily.length-1);
  state.phase='paused';
  setBusy(false);playButton.disabled=false;stepButton.disabled=false;
  renderDay(state.currentDay);
  if(state.phase!=='awaiting-decision'){
    announce(`Motor ${data.result.modelVersion} · paciente zero: ${state.selected.label}.`,'ok');
    if(state.autoplay)play();
  }
};

function scenarioMetricsFromResult(result){
  const daily=result.daily||[];
  const final=daily.at(-1)||{};
  return {
    uniqueInfected:result.summary.uniqueEverInfected??final.cumulativeUniqueInfected??0,
    episodes:result.summary.everInfected??final.cumulativeInfectionEpisodes??0,
    reinfections:result.summary.reinfections??final.cumulativeReinfections??0,
    admissions:result.summary.hospitalAdmissions??0,
    deaths:result.summary.finalDeaths??final.D??0,
    unmetDeaths:result.summary.unmetCareDeaths??final.cumulativeUnmetCareDeaths??0,
    denied:result.summary.uniqueDeniedBed??0,
    peakHospital:Math.max(0,...daily.map(d=>Number(d.H||0))),
    overloadDays:daily.filter(d=>(d.unmetBedRequests??0)>0||(d.bedCapacity>0&&d.bedsOccupied>=d.bedCapacity)).length
  };
}

function comparisonRow(label,actual,noAction,{lowerIsBetter=true}={}){
  const row=document.createElement('div');row.className='report-row';
  const head=document.createElement('div');head.className='report-row-head';
  const name=document.createElement('strong');name.textContent=label;
  const values=document.createElement('span');values.textContent=`Sua cidade: ${nfmt(actual)} · Sem ação: ${nfmt(noAction)}`;
  head.append(name,values);
  const delta=document.createElement('small');
  const diff=noAction-actual;
  if(diff===0)delta.textContent='Sem diferença neste indicador.';
  else if(lowerIsBetter){
    delta.textContent=diff>0?`${nfmt(diff)} a menos no cenário com suas decisões.`:`${nfmt(Math.abs(diff))} a mais no cenário com suas decisões.`;
    delta.dataset.good=diff>0?'true':'false';
  }else{
    delta.textContent=diff<0?`${nfmt(Math.abs(diff))} a mais no cenário com suas decisões.`:`${nfmt(diff)} a menos no cenário com suas decisões.`;
  }
  row.append(head,delta);
  return row;
}

function renderFinalReport(comparison){
  const actual=scenarioMetricsFromResult(state.result);
  const baseline={
    uniqueInfected:comparison.summary.uniqueEverInfected??comparison.final.cumulativeUniqueInfected??0,
    episodes:comparison.summary.everInfected??comparison.final.cumulativeInfectionEpisodes??0,
    reinfections:comparison.summary.reinfections??comparison.final.cumulativeReinfections??0,
    admissions:comparison.summary.hospitalAdmissions??0,
    deaths:comparison.summary.finalDeaths??comparison.final.D??0,
    unmetDeaths:comparison.summary.unmetCareDeaths??comparison.final.cumulativeUnmetCareDeaths??0,
    denied:comparison.summary.uniqueDeniedBed??0,
    peakHospital:comparison.peakHospital??0,
    overloadDays:comparison.overloadDays??0
  };
  const avoidedDeaths=baseline.deaths-actual.deaths;
  const avoidedAdmissions=baseline.admissions-actual.admissions;
  const avoidedEpisodes=baseline.episodes-actual.episodes;
  const substantive=state.decisions.filter(d=>!d.label.startsWith('Continuar sem ação'));
  finalReportTitle.textContent=`${state.cityName}: balanço dos 360 dias`;
  if(!substantive.length){
    finalReportSummary.textContent=`Você terminou o ano sem adotar medidas. O resultado abaixo coincide com o cenário de referência “sem ação”: ${nfmt(actual.deaths)} óbitos, ${nfmt(actual.admissions)} internações e ${nfmt(actual.unmetDeaths)} óbitos após falta de leito no modelo.`;
  }else if(avoidedDeaths>0||avoidedAdmissions>0||avoidedEpisodes>0){
    const parts=[];
    if(avoidedEpisodes>0)parts.push(`${nfmt(avoidedEpisodes)} episódios de infecção`);
    if(avoidedAdmissions>0)parts.push(`${nfmt(avoidedAdmissions)} internações`);
    if(avoidedDeaths>0)parts.push(`${nfmt(avoidedDeaths)} óbitos`);
    finalReportSummary.textContent=`Na comparação contrafactual do jogo, suas decisões reduziram ${parts.join(', ')} em relação a não tomar nenhuma medida.`;
  }else{
    finalReportSummary.textContent='Na comparação contrafactual desta seed, as decisões adotadas não reduziram os principais desfechos finais em relação ao cenário sem ação. Veja os indicadores abaixo.';
  }
  finalReportComparison.replaceChildren(
    comparisonRow('Episódios de infecção',actual.episodes,baseline.episodes),
    comparisonRow('Reinfecções',actual.reinfections,baseline.reinfections),
    comparisonRow('Internações',actual.admissions,baseline.admissions),
    comparisonRow('Pico de internados',actual.peakHospital,baseline.peakHospital),
    comparisonRow('Dias de sobrecarga hospitalar',actual.overloadDays,baseline.overloadDays),
    comparisonRow('Pessoas sem leito',actual.denied,baseline.denied),
    comparisonRow('Óbitos após falta de leito',actual.unmetDeaths,baseline.unmetDeaths),
    comparisonRow('Óbitos totais',actual.deaths,baseline.deaths)
  );
  finalReportDecisions.replaceChildren();
  if(!state.decisions.length){
    const li=document.createElement('li');li.textContent='Nenhuma decisão registrada.';finalReportDecisions.append(li);
  }else{
    for(const decision of state.decisions){
      const li=document.createElement('li');li.textContent=`Dia ${decision.day+1}: ${decision.label}`;finalReportDecisions.append(li);
    }
  }
  finalReportOverlay.hidden=false;finalReportOverlay.classList.add('is-open');
  $('game-status').textContent='Relatório final';
}

function requestFinalReport(){
  if(state.finalReportRequested||state.finalComparison||!state.result)return;
  state.finalReportRequested=true;
  finalReportSummary.textContent='Calculando o cenário contrafactual sem nenhuma ação pública…';
  const token=++state.runToken;
  worker.postMessage({type:'compare',token,setup:getRunSetup()});
}

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

function acknowledgeDecisionCheckpoint(){
  const current=state.currentDecisionCheckpoint;
  if(!current)return null;
  for(const checkpoint of state.decisionCheckpoints){
    if(checkpoint.day<=state.currentDay)state.acknowledgedCheckpoints.add(checkpoint.id);
  }
  state.currentDecisionCheckpoint=null;
  return current;
}

function enterDecisionCheckpoint(checkpoint,d){
  if(state.timer){clearInterval(state.timer);state.timer=null;}
  state.currentDecisionCheckpoint=checkpoint;
  state.phase='awaiting-decision';
  playButton.disabled=true;
  stepButton.disabled=true;
  alertBox.classList.add('active');
  alertBox.dataset.severity=String(checkpoint.severity??1);
  alertText.textContent=`${checkpoint.title} · ${checkpoint.message}`;
  decisionTitle.textContent=checkpoint.title;
  decisionMessage.textContent=checkpoint.message;
  decisionOverlay.hidden=false;decisionOverlay.classList.add('is-open');
  unlockDecisions(true,true);
  announce(`${checkpoint.title}. A linha do tempo foi pausada para uma nova decisão.`,'error');
}

function renderDay(day){
  if(!state.result)return;
  let targetDay=clamp(day,0,state.result.daily.length-1);
  const pending=nextDecisionCheckpoint(state.decisionCheckpoints,state.acknowledgedCheckpoints,targetDay);
  if(pending)targetDay=pending.day;
  state.currentDay=targetDay;
  const d=state.result.daily[state.currentDay];
  $('game-day').textContent=`Dia ${String(d.day+1).padStart(3,'0')} / 360`;
  $('game-wave').textContent=`${d.waveNumber||Math.min(4,Math.floor(d.day/90)+1)}ª onda`;
  $('game-active').textContent=nfmt(d.E+d.I+d.H);
  $('game-hospitalized').textContent=nfmt(d.H);
  $('game-deaths').textContent=nfmt(d.D);
  $('game-beds').textContent=`${nfmt(d.bedsOccupied)} / ${nfmt(d.bedCapacity)}`;
  $('game-attack').textContent=pct(d.cumulativeUniqueInfected,Number(populationNumber.value))+'%';
  $('game-new').textContent=nfmt(d.newInfections);
  $('game-reinfections').textContent=nfmt(d.cumulativeReinfections);
  $('game-unmet-deaths').textContent=nfmt(d.cumulativeUnmetCareDeaths);
  $('game-dose1').textContent=nfmt(d.cumulativeDose1);
  $('game-dose2').textContent=nfmt(d.cumulativeDose2);
  $('game-dose3').textContent=nfmt(d.cumulativeDose3);
  const reached=new Set(state.result.events.filter(e=>e.type==='infection'&&e.day<=state.currentDay&&Number.isInteger(e.targetRegion)).map(e=>e.targetRegion)).size;
  $('game-regions').textContent=`${reached} / ${districts.length}`;
  $('game-progress').style.width=(state.currentDay/359*100)+'%';
  $('game-progress').parentElement.setAttribute('aria-valuenow',String(state.currentDay));
  renderHeat(state.currentDay);

  const due=nextDecisionCheckpoint(state.decisionCheckpoints,state.acknowledgedCheckpoints,state.currentDay);
  if(due&&due.day===state.currentDay){
    enterDecisionCheckpoint(due,d);
  }else if(d.gameAlert){
    state.currentDecisionCheckpoint=null;
    alertBox.classList.add('active');
    delete alertBox.dataset.severity;
    const occupancy=d.bedCapacity>0?Math.round(d.bedsOccupied/d.bedCapacity*100):0;
    alertText.textContent=`Epidemia em acompanhamento · ${nfmt(d.E+d.I+d.H)} casos ativos · ocupação hospitalar ${occupancy}% · ${reached} de ${districts.length} bairros atingidos.`;
    unlockDecisions(false,false);
  }else{
    state.currentDecisionCheckpoint=null;
    alertBox.classList.remove('active');
    delete alertBox.dataset.severity;
    alertText.textContent='Vigilância hospitalar ainda abaixo do limiar de alerta.';
    unlockDecisions(false,false);
  }

  $('game-status').textContent=state.phase==='awaiting-decision'?'Decisão necessária':state.phase==='running'?'Simulação em curso':state.currentDay>=state.result.daily.length-1?'Fim do horizonte':'Simulação pausada';
  playButton.textContent=state.phase==='running'?'Pausar':'Continuar';
  if(state.currentDay>=state.result.daily.length-1&&state.phase!=='awaiting-decision')requestFinalReport();
}
function play(){
  if(!state.result||state.phase==='awaiting-decision')return;
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
stepButton.addEventListener('click',()=>{if(state.phase==='awaiting-decision')return;pause();if(state.result)renderDay(state.currentDay+1);});
speedSelect.addEventListener('change',()=>{state.speed=Number(speedSelect.value)||90;if(state.phase==='running')play();});

function resetGame(){
  pause();
  state.phase='setup';state.population=null;state.populationIndexes=null;state.spatialModel=null;
  state.selected=null;state.result=null;state.currentDay=0;state.interventions=[];state.vaccination=null;state.vaccinationCampaigns=[];
  state.decisions=[];state.nodeEvents=[];state.decisionCheckpoints=[];state.acknowledgedCheckpoints=new Set();state.currentDecisionCheckpoint=null;state.finalReportRequested=false;state.finalComparison=null;state.runToken++;
  clearHeat();clearSeedSelection();clearPopulationDecorations();
  populationRange.disabled=false;populationNumber.disabled=false;prepareButton.disabled=false;
  prepareButton.textContent='Distribuir população';
  startButton.disabled=true;playButton.disabled=true;stepButton.disabled=true;
  focusText.textContent='Clique em uma residência ou local público e escolha uma pessoa no grafo.';
  alertBox.classList.remove('active');alertText.textContent='O hospital ainda não detectou excesso de casos.';
  $('game-day').textContent='Dia —';
  for(const id of ['game-active','game-hospitalized','game-deaths','game-new','game-regions','game-reinfections','game-unmet-deaths'])$(id).textContent='—';
  for(const id of ['game-dose1','game-dose2','game-dose3'])$(id).textContent='0';
  $('game-wave').textContent='Onda —';
  $('game-beds').textContent='—';$('game-attack').textContent='—';$('game-progress').style.width='0%';
  decisionLog.replaceChildren();inspector.hidden=true;resetAppliedButtons();unlockDecisions(false);
  setupOverlay.hidden=false;setupOverlay.classList.add('is-open');epicenterOverlay.hidden=true;decisionOverlay.hidden=true;finalReportOverlay.hidden=true;sidebar.classList.add('is-hidden');
  $('game-status').textContent='Aguardando configuração';
  announce('Defina o tamanho da população e distribua os agentes pela cidade.','');
}
resetButton.addEventListener('click',resetGame);
startButton.addEventListener('click',()=>{
  epicenterOverlay.hidden=true;
  sidebar.classList.remove('is-hidden');
  $('city-name-display').textContent=state.cityName;
  runSimulation({resumeDay:state.result?state.currentDay:0,autoplay:true});
});

const ACTIONS={
  school:{label:'Fechar escolas',intervention:{type:'school_closure',fraction:1}},
  remote:{label:'Home office',intervention:{type:'remote_work',fraction:.6}},
  leisure:{label:'Fechar lazer',intervention:{type:'community_closure',fraction:1}},
  retail:{label:'Restringir comércio',intervention:{type:'retail_limit',fraction:1}},
  lockdown:{label:'Lockdown',intervention:{type:'lockdown',fraction:1}}
};
function hasDose(n){return state.vaccinationCampaigns.some(c=>c.doseNumber===n);}
function actionAllowed(action){
  if(action==='vaccine1')return !hasDose(1);
  if(action==='vaccine2')return hasDose(1)&&!hasDose(2);
  if(action==='vaccine3')return hasDose(2)&&!hasDose(3);
  return true;
}
function unlockDecisions(unlocked,allowNoAction=false){
  const permitted=new Set(state.currentDecisionCheckpoint?.actions??[]);
  for(const button of decisionsRoot.querySelectorAll('button[data-action]')){
    const action=button.dataset.action;
    const inWindow=permitted.size===0||permitted.has(action);
    const prerequisite=actionAllowed(action);
    button.hidden=!inWindow||!prerequisite;
    if(action==='none')button.disabled=!allowNoAction;
    else button.disabled=!unlocked||!inWindow||!prerequisite||button.dataset.applied==='true';
  }
}
function addDecisionLog(label,day){
  const item=document.createElement('li');item.textContent=`Dia ${day}: ${label}`;decisionLog.prepend(item);
}
decisionsRoot.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action]');
  if(!button||button.disabled||!state.result)return;
  const action=button.dataset.action,startDay=Math.min(state.currentDay+1,state.result.daily.length-1);
  const checkpoint=acknowledgeDecisionCheckpoint();
  decisionOverlay.hidden=true;decisionOverlay.classList.remove('is-open');
  if(action==='none'){
    const context=checkpoint?.title?` — ${checkpoint.title}`:'';
    state.decisions.push({day:state.currentDay,label:'Continuar sem ação'+context});
    addDecisionLog('Continuar sem ação'+context,state.currentDay);
    state.phase='paused';
    playButton.disabled=false;stepButton.disabled=false;
    unlockDecisions(Boolean(state.result.daily[state.currentDay]?.gameAlert),false);
    announce('Nenhuma nova medida adotada. A linha do tempo foi liberada.','ok');
    play();
    return;
  }
  if(action==='beds'){
    const currentBeds=state.result.daily[state.currentDay]?.bedCapacity||1;
    const bedsDelta=Math.max(1,Math.ceil(currentBeds*.25));
    state.interventions.push({type:'hospital_capacity_change',startDay,endDay:359,bedsDelta});
    state.decisions.push({day:startDay,label:`Ampliar leitos (+${bedsDelta})`});addDecisionLog(`Ampliar leitos (+${bedsDelta})`,startDay);
  }else if(action==='vaccine1'||action==='vaccine2'||action==='vaccine3'){
    const doseNumber=Number(action.slice(-1));
    const specs={
      1:{daysToProtection:14,infectionProtectionFraction:.35,severeProtectionFraction:.50,minDaysSincePreviousDose:0},
      2:{daysToProtection:10,infectionProtectionFraction:.62,severeProtectionFraction:.80,minDaysSincePreviousDose:28},
      3:{daysToProtection:7,infectionProtectionFraction:.72,severeProtectionFraction:.90,minDaysSincePreviousDose:90}
    };
    const campaign={enabled:true,doseNumber,availableDay:startDay,dosesPerDay:Math.max(5,Math.round(Number(populationNumber.value)*.015)),uptakeProbability:.82,priority:'older_first',...specs[doseNumber]};
    state.vaccinationCampaigns.push(campaign);
    button.dataset.applied='true';
    const label=doseNumber===3?'Iniciar 3ª dose / reforço':`Iniciar ${doseNumber}ª dose`;
    state.decisions.push({day:startDay,label});addDecisionLog(label,startDay);
  }else{
    const spec=ACTIONS[action];if(!spec)return;
    state.interventions.push({...spec.intervention,startDay,endDay:359});
    button.dataset.applied='true';state.decisions.push({day:startDay,label:spec.label});addDecisionLog(spec.label,startDay);
  }
  announce('Decisão aplicada a partir do próximo dia. Recalculando com a mesma população e paciente zero…','busy');
  runSimulation({resumeDay:state.currentDay,autoplay:true});
});
function resetAppliedButtons(){for(const button of decisionsRoot.querySelectorAll('button[data-action]')){delete button.dataset.applied;button.hidden=false;}}

$('inspector-close').addEventListener('click',()=>{inspector.hidden=true;});
$('final-report-close').addEventListener('click',()=>{finalReportOverlay.hidden=true;finalReportOverlay.classList.remove('is-open');});
$('final-report-restart').addEventListener('click',resetGame);

unlockDecisions(false);
syncPopulation(populationNumber);
startButton.disabled=true;
focusText.textContent='Distribua a população primeiro';
