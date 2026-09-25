import {districts,places} from './city-data.js';

const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const districtIndex=new Map(districts.map((d,i)=>[d.id,i]));
const placeById=()=>new Map(places.map(p=>[p.id,p]));

const state={
  phase:'setup',
  selected:null,
  result:null,
  currentDay:0,
  timer:null,
  speed:700,
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

function announce(text,tone=''){
  message.textContent=text;
  message.dataset.tone=tone;
}

function syncPopulation(source){
  const n=clamp(Math.round(Number(source.value)||10),10,30000);
  populationRange.value=n;
  populationNumber.value=n;
}
populationRange.addEventListener('input',()=>syncPopulation(populationRange));
populationNumber.addEventListener('change',()=>syncPopulation(populationNumber));
populationNumber.addEventListener('input',()=>syncPopulation(populationNumber));

function seedContextForPlace(type){
  if(type==='school')return 'school';
  if(type==='office'||type==='civic')return 'work';
  if(type==='market'||type==='commerce'||type==='restaurant')return 'retail';
  if(type==='park')return 'community';
  if(type==='hospital')return 'hospital';
  return 'home';
}

function clearSeedSelection(){
  document.querySelectorAll('.game-seed-target').forEach(el=>el.classList.remove('game-seed-target'));
}

function selectNode(el){
  if(state.phase!=='setup')return;
  clearSeedSelection();
  el.classList.add('game-seed-target');
  if(el.dataset.home){
    const regionId=el.dataset.region;
    const region=districts.find(d=>d.id===regionId);
    state.selected={kind:'home',id:el.dataset.home,regionId,regionIndex:districtIndex.get(regionId)??0,seedContext:'home',label:el.dataset.home.replace('casa-','Casa ')};
    focusText.textContent=`${state.selected.label} · ${region?.name??'Região'}`;
  }else if(el.dataset.place){
    const p=placeById().get(el.dataset.place);
    if(!p)return;
    state.selected={kind:'place',id:p.id,regionId:p.region,regionIndex:districtIndex.get(p.region)??0,seedContext:seedContextForPlace(p.type),label:p.name};
    focusText.textContent=`${p.name} · ${districts.find(d=>d.id===p.region)?.name??p.region}`;
  }
  announce('Foco inicial selecionado. Configure a população e inicie a simulação.','ok');
}

svg.addEventListener('click',event=>{
  const el=event.target.closest('[data-home],[data-place]');
  if(el)selectNode(el);
});

function getSetup(){
  return {
    population:Number(populationNumber.value),
    regions:districts.length,
    days:180,
    seed:20260925,
    pathogenId:disease.value,
    transmissibility:transmissibility.value,
    initialSeedRegion:state.selected.regionIndex,
    initialSeedContext:state.selected.seedContext,
    interventions:state.interventions,
    vaccination:state.vaccination
  };
}

function setBusy(busy){
  document.documentElement.classList.toggle('game-busy',busy);
  startButton.disabled=busy;
  playButton.disabled=busy||!state.result;
  stepButton.disabled=busy||!state.result;
  if(busy)announce('Calculando a cidade e toda a trajetória epidemiológica…','busy');
}

function runSimulation({resumeDay=0,autoplay=true}={}){
  if(!state.selected){
    announce('Escolha primeiro uma casa ou um local público no mapa.','error');
    return;
  }
  pause();
  state.resumeDay=resumeDay;
  state.autoplay=autoplay;
  const token=++state.runToken;
  setBusy(true);
  worker.postMessage({type:'run',token,setup:getSetup()});
}

worker.onmessage=event=>{
  const data=event.data||{};
  if(data.token!==state.runToken)return;
  if(data.type==='error'){
    setBusy(false);
    announce('Erro no motor: '+data.message,'error');
    return;
  }
  if(data.type!=='result')return;
  state.result=data.result;
  buildNodeEvents();
  state.currentDay=clamp(state.resumeDay,0,state.result.daily.length-1);
  state.phase='paused';
  lockSetup(true);
  setBusy(false);
  renderDay(state.currentDay);
  announce(`Motor ${data.result.modelVersion} · ${Number(populationNumber.value).toLocaleString('pt-BR')} agentes.`,'ok');
  if(state.autoplay)play();
};

function lockSetup(locked){
  populationRange.disabled=locked;
  populationNumber.disabled=locked;
  disease.disabled=locked;
  transmissibility.disabled=locked;
  startButton.textContent=locked?'Recalcular cenário':'Iniciar surto';
}

function actualNodes(){
  const homeByRegion=new Map();
  for(const node of document.querySelectorAll('#homes-layer [data-home]')){
    const r=node.dataset.region;
    if(!homeByRegion.has(r))homeByRegion.set(r,[]);
    homeByRegion.get(r).push(node);
  }
  const facilities=new Map();
  const pmap=placeById();
  for(const node of document.querySelectorAll('#places-layer [data-place]')){
    const p=pmap.get(node.dataset.place);
    if(!p)continue;
    const key=p.region+':'+p.type;
    if(!facilities.has(key))facilities.set(key,[]);
    facilities.get(key).push(node);
  }
  return {homeByRegion,facilities,pmap};
}

function facilityTypesForEngine(type){
  if(type==='school')return ['school'];
  if(type==='work')return ['office','civic'];
  if(type==='retail')return ['market','commerce','restaurant'];
  if(type==='community')return ['park'];
  if(type==='hospital')return ['hospital'];
  return [];
}

function nodeKey(node){
  return node.dataset.home?'home:'+node.dataset.home:'place:'+node.dataset.place;
}

function targetNodeForEvent(event,abstractPlaces,nodes){
  if(event.layer==='seed'){
    return state.selected.kind==='home'
      ? document.querySelector(`[data-home="${CSS.escape(state.selected.id)}"]`)
      : document.querySelector(`[data-place="${CSS.escape(state.selected.id)}"]`);
  }
  const ap=abstractPlaces.get(event.place);
  if(!ap)return null;
  const region=districts[ap.region]?.id;
  if(!region)return null;
  let candidates=[];
  if(ap.type==='household')candidates=nodes.homeByRegion.get(region)||[];
  else{
    for(const type of facilityTypesForEngine(ap.type)){
      candidates.push(...(nodes.facilities.get(region+':'+type)||[]));
    }
  }
  if(!candidates.length)candidates=nodes.homeByRegion.get(region)||[];
  if(!candidates.length)return null;
  const h=Math.abs((event.person??0)*31+(event.source??0)*17+(event.day??0)*13);
  return candidates[h%candidates.length];
}

function buildNodeEvents(){
  const days=state.result.daily.length;
  state.nodeEvents=Array.from({length:days},()=>new Map());
  const abstractPlaces=new Map(state.result.city.places.map(p=>[p.id,p]));
  const nodes=actualNodes();
  for(const event of state.result.events){
    if(event.type!=='infection')continue;
    const target=targetNodeForEvent(event,abstractPlaces,nodes);
    if(!target)continue;
    const key=nodeKey(target);
    const map=state.nodeEvents[event.day]??state.nodeEvents[0];
    map.set(key,(map.get(key)||0)+1);
  }
}

function clearHeat(){
  document.querySelectorAll('[data-game-level]').forEach(el=>el.removeAttribute('data-game-level'));
}

function nodeFromKey(key){
  const [kind,...rest]=key.split(':');
  const id=rest.join(':');
  return kind==='home'
    ? document.querySelector(`[data-home="${CSS.escape(id)}"]`)
    : document.querySelector(`[data-place="${CSS.escape(id)}"]`);
}

function renderHeat(day){
  clearHeat();
  const rolling=new Map();
  for(let d=Math.max(0,day-9);d<=day;d++){
    for(const [key,count] of state.nodeEvents[d]||[])rolling.set(key,(rolling.get(key)||0)+count);
  }
  for(const [key,count] of rolling){
    const node=nodeFromKey(key);
    if(!node)continue;
    const level=count>=8?3:count>=3?2:1;
    node.dataset.gameLevel=String(level);
  }
  const seed=state.selected.kind==='home'
    ? document.querySelector(`[data-home="${CSS.escape(state.selected.id)}"]`)
    : document.querySelector(`[data-place="${CSS.escape(state.selected.id)}"]`);
  seed?.classList.add('game-seed-target');
}

function nfmt(n){return Number(n||0).toLocaleString('pt-BR');}
function pct(a,b){return b?Math.round(a/b*100):0;}

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
    alertBox.hidden=false;
    alertBox.classList.add('active');
    const first=state.result.summary.alertDay;
    alertText.textContent=`Alerta de epidemia simulada · detectado no dia ${first}. Admissões recentes: ${nfmt(d.alertMetric)} · limite esperado: ${nfmt(d.alertThreshold)}.`;
    unlockDecisions(true);
  }else{
    alertBox.hidden=false;
    alertBox.classList.remove('active');
    alertText.textContent='Vigilância hospitalar ainda abaixo do limiar de alerta.';
    unlockDecisions(false);
  }
  $('game-status').textContent=state.phase==='running'?'Simulação em curso':state.currentDay>=state.result.daily.length-1?'Fim do horizonte':'Simulação pausada';
  playButton.textContent=state.phase==='running'?'Pausar':'Continuar';
}

function play(){
  if(!state.result)return;
  pause();
  state.phase='running';
  renderDay(state.currentDay);
  state.timer=setInterval(()=>{
    if(state.currentDay>=state.result.daily.length-1){pause();state.phase='ended';renderDay(state.currentDay);return;}
    renderDay(state.currentDay+1);
  },state.speed);
}

function pause(){
  if(state.timer){clearInterval(state.timer);state.timer=null;}
  if(state.result&&state.phase!=='ended')state.phase='paused';
  if(state.result)renderDay(state.currentDay);
}

playButton.addEventListener('click',()=>state.phase==='running'?pause():play());
stepButton.addEventListener('click',()=>{pause();if(state.result)renderDay(state.currentDay+1);});
speedSelect.addEventListener('change',()=>{
  state.speed=Number(speedSelect.value);
  if(state.phase==='running')play();
});

function resetGame(){
  pause();
  state.phase='setup';
  state.result=null;
  state.currentDay=0;
  state.interventions=[];
  state.vaccination=null;
  state.decisions=[];
  state.nodeEvents=[];
  clearHeat();
  clearSeedSelection();
  state.selected=null;
  focusText.textContent='Clique em uma casa ou local público';
  lockSetup(false);
  startButton.textContent='Iniciar surto';
  playButton.disabled=true;
  stepButton.disabled=true;
  alertBox.classList.remove('active');
  alertText.textContent='O hospital ainda não detectou excesso de casos.';
  $('game-day').textContent='Dia —';
  for(const id of ['game-active','game-hospitalized','game-deaths','game-new'])$(id).textContent='—';
  $('game-beds').textContent='—';
  $('game-attack').textContent='—';
  $('game-progress').style.width='0%';
  decisionLog.replaceChildren();
  unlockDecisions(false);
  announce('Escolha o foco inicial no mapa.','');
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
  for(const button of decisionsRoot.querySelectorAll('button[data-action]')){
    button.disabled=!unlocked||button.dataset.applied==='true';
  }
}

function addDecisionLog(label,day){
  const item=document.createElement('li');
  item.textContent=`Dia ${day}: ${label}`;
  decisionLog.prepend(item);
}

decisionsRoot.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action]');
  if(!button||button.disabled||!state.result)return;
  const action=button.dataset.action;
  const startDay=Math.min(state.currentDay+1,state.result.daily.length-1);
  if(action==='vaccine'){
    state.vaccination={
      enabled:true,
      availableDay:startDay,
      dosesPerDay:Math.max(5,Math.round(Number(populationNumber.value)*.01)),
      uptakeProbability:.75,
      daysToProtection:14,
      infectionProtectionFraction:.55,
      severeProtectionFraction:.60,
      priority:'older_first'
    };
    button.dataset.applied='true';
    state.decisions.push({day:startDay,label:'Iniciar vacinação (cenário)'});
    addDecisionLog('Iniciar vacinação (cenário)',startDay);
  }else{
    const spec=ACTIONS[action];
    if(!spec)return;
    state.interventions.push({...spec.intervention,startDay,endDay:179});
    button.dataset.applied='true';
    state.decisions.push({day:startDay,label:spec.label});
    addDecisionLog(spec.label,startDay);
  }
  announce('Decisão aplicada a partir do próximo dia. Recalculando o mesmo cenário…','busy');
  runSimulation({resumeDay:state.currentDay,autoplay:false});
});

function resetAppliedButtons(){
  for(const button of decisionsRoot.querySelectorAll('button[data-action]'))delete button.dataset.applied;
}
resetButton.addEventListener('click',resetAppliedButtons);

unlockDecisions(false);
syncPopulation(populationNumber);
