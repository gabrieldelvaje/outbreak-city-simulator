/** OUTBREAK v1: stochastic synthetic agent-based respiratory outbreak.
 * Runs in Node 20+ or a modern browser, with no runtime dependencies.
 * Demonstration hypotheses only: NOT a medically calibrated prediction.
 */
export const MODEL_VERSION='1.0.0-demo';
function rng(seed){let s=(seed>>>0);return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(a,rand){for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function requireValid(cfg){
 if(!Number.isInteger(cfg.population)||cfg.population<10||cfg.population>30000)throw Error('population must be integer 10..30000');
 if(!Number.isInteger(cfg.regions)||cfg.regions<2||cfg.regions>20)throw Error('regions must be 2..20');
 if(!Number.isInteger(cfg.days)||cfg.days<1||cfg.days>3650)throw Error('days must be integer 1..3650');
 for(const f of ['latentDays','infectiousDays','hospitalStayDays','reportDelayDays'])if(!Number.isInteger(cfg[f])||cfg[f]<0||(f==='infectiousDays'&&cfg[f]===0))throw Error('invalid duration '+f);
 for(const f of ['symptomaticProbability','detectionProbabilityIfSymptomatic'])if(!Number.isFinite(cfg[f])||cfg[f]<0||cfg[f]>1)throw Error('invalid probability '+f);
 if(!Number.isFinite(cfg.beta)||cfg.beta<0||cfg.beta>5)throw Error('beta must be >=0 and <=5');
 if(!Number.isInteger(cfg.initialInfections)||cfg.initialInfections<0||cfg.initialInfections>cfg.population)throw Error('invalid initial infections');
 if(!Number.isInteger(cfg.beds)||cfg.beds<0)throw Error('invalid beds');
 for(const p of Object.values(cfg.severeProbabilityByAge))if(p<0||p>1)throw Error('invalid severity probability');
 for(const [key,v] of Object.entries(cfg.contactHours))if(!Number.isFinite(v)||v<0)throw Error('invalid contact hours '+key);
 for(const [key,v] of Object.entries(cfg.contactsPerPerson))if(!Number.isInteger(v)||v<0||v>1000)throw Error('invalid contact count '+key);
 if(!Number.isInteger(cfg.alert.detectedCasesThreshold)||cfg.alert.detectedCasesThreshold<1||!Number.isInteger(cfg.alert.windowDays)||cfg.alert.windowDays<1)throw Error('invalid alert rule');
 for(const item of cfg.interventions){if(!['school_closure','remote_work','workplace_closure','mobility_restriction','bridge_closure','retail_limit','community_closure','hospital_capacity_change'].includes(item.type))throw Error('unknown intervention '+item.type);if(!Number.isInteger(item.startDay)||!Number.isInteger(item.endDay)||item.endDay<item.startDay)throw Error('invalid intervention window');if(item.fraction!==undefined&&(item.fraction<0||item.fraction>1))throw Error('fraction outside 0..1');}
 const v=cfg.vaccination;for(const k of ['uptakeProbability','infectionProtectionFraction','severeProtectionFraction'])if(!Number.isFinite(v[k])||v[k]<0||v[k]>1)throw Error('invalid vaccination '+k);
 return cfg;
}
export function configFromProfile(profileDoc,level='medium',overrides={}){
 const defaults=structuredClone(profileDoc.defaults),profile=profileDoc.profiles[level];if(!profile)throw Error('unknown transmissibility level');
 const cfg={...defaults,...overrides,beta:overrides.beta??profile.beta_per_effective_contact_hour};
 cfg.alert={...defaults.alert,...overrides.alert};cfg.vaccination={...defaults.vaccination,...overrides.vaccination};
 cfg.contactHours={...defaults.contactHours,...overrides.contactHours};cfg.contactsPerPerson={...defaults.contactsPerPerson,...overrides.contactsPerPerson};
 return requireValid(cfg);
}
export function makeCity(cfg){
 const random=rng(cfg.seed);const agents=[],places=new Map(),homes=[],schools=[],workplaces=[],markets=[],parks=[],hospitals=[];
 const add=(kind,reg)=>{const id=kind+'-'+places.size;places.set(id,{id,type:kind,region:reg});return id;};
 for(let r=0;r<cfg.regions;r++){schools.push(add('school',r));workplaces.push(add('work',r));markets.push(add('retail',r));parks.push(add('community',r));hospitals.push(add('hospital',r));}
 let house=0;
 while(agents.length<cfg.population){
  const left=cfg.population-agents.length,size=Math.min(left,1+Math.floor(random()*4)),region=house%cfg.regions,home=add('household',region);homes.push(home);
  const ages=size===1?[random()<.27?'older':'adult']:size===2?['adult',random()<.30?'older':'adult']:['adult','adult',...Array(size-2).fill('child')];
  for(let t=0;t<size;t++){
   const age=ages[t],id=agents.length,working=age==='adult'&&random()<.84,healthWorker=working&&random()<.07;
   const jobRegion=healthWorker?region:(random()<.25?(region+cfg.regions/2|0)%cfg.regions:region),work=healthWorker?hospitals[jobRegion]:workplaces[jobRegion];
   agents.push({id,age,region,home,school:schools[region],work,workRegion:jobRegion,healthWorker,working,canRemote:working&&!healthWorker&&random()<.72,compliance:random(),vaccineWilling:random(),state:'S',infectedDay:null,onsetDay:null,outcomeDay:null,source:null,protectedAtInfection:false,severe:false,severityAssessed:false,careDenied:false,admittedDay:null,vaccinatedDay:null,detected:false});
  }
  house++;
 }
 return {agents,places,houses:homes,schools,workplaces,markets,parks,hospitals};
}
const sides=(region,regions)=>region<Math.ceil(regions/2)?0:1;
function applies(policy,day,region){return day>=policy.startDay&&day<=policy.endDay&&(!policy.regionIds||policy.regionIds.includes(region));}
function applicable(cfg,type,day,region){return cfg.interventions.filter(p=>p.type===type&&applies(p,day,region));}
function isSelected(person,pol){return person.compliance<(pol.fraction??1);}
const eligible=(a,cfg,policy,day)=>applicable(cfg,policy,day,a.region).some(p=>isSelected(a,p));
export function simulate(config,options={}){
 const cfg=requireValid(structuredClone(config)),rand=rng((cfg.seed^0x9e3779b9)>>>0),city=makeCity(cfg),P=city.agents;
 const events=[],daily=[],reports=new Map(),transmissionByLayer={},alertDays=[];
 const seedCandidates=cfg.initialInfectionMode==='child_at_home'?P.filter(p=>p.age==='child'):[];
 const shuffled=shuffle([...seedCandidates,...P.filter(p=>!seedCandidates.includes(p))],rand);
 function infect(target,day,source,layer){if(target.state!=='S')return false;target.state='E';target.infectedDay=day;target.onsetDay=day+cfg.latentDays;target.outcomeDay=target.onsetDay+cfg.infectiousDays;target.source=source;target.protectedAtInfection=target.vaccinatedDay!==null&&day>=target.vaccinatedDay+cfg.vaccination.daysToProtection;events.push({day,type:'infection',person:target.id,source,layer,place:target.home});transmissionByLayer[layer]=(transmissionByLayer[layer]||0)+1;return true;}
 for(let n=0;n<cfg.initialInfections;n++)infect(shuffled[n],0,null,'seed');
 let alerted=false,totalDoses=0,deniedPeople=new Set();
 for(let day=0;day<cfg.days;day++){
  let newInfections=0,newReports=0,newAdmissions=0,newDeaths=0,dosesToday=0,requestedBeds=0;
  const vaccine=cfg.vaccination;
  if(vaccine.enabled&&day>=vaccine.availableDay&&vaccine.dosesPerDay>0){
   const candidates=P.filter(p=>p.state==='S'&&p.vaccinatedDay===null&&p.vaccineWilling<vaccine.uptakeProbability);
   if(vaccine.priority==='older_first')candidates.sort((a,b)=>({older:0,adult:1,child:2}[a.age]-{older:0,adult:1,child:2}[b.age])||(a.id-b.id));else shuffle(candidates,rand);
   for(const p of candidates.slice(0,Math.floor(vaccine.dosesPerDay))){p.vaccinatedDay=day;dosesToday++;events.push({day,type:'vaccination',person:p.id});}
   totalDoses+=dosesToday;
  }
  const activeCare=()=>P.filter(p=>p.state==='H').length;
  const capacityChanges=applicable(cfg,'hospital_capacity_change',day,0);
  const beds=Math.max(0,cfg.beds+capacityChanges.reduce((s,p)=>s+(p.bedsDelta??0),0));
  for(const p of P){
   if(p.state==='E'&&day>=p.onsetDay){p.state='I';events.push({day,type:'infectious_onset',person:p.id});
    if(rand()<cfg.symptomaticProbability&&rand()<cfg.detectionProbabilityIfSymptomatic){const reportDay=day+cfg.reportDelayDays;reports.set(reportDay,[...(reports.get(reportDay)||[]),p.id]);}}
   if((p.state==='I'||p.state==='H')&&p.infectedDay!==null){
    if(p.state==='I'&&!p.severityAssessed&&day>=p.onsetDay+cfg.clinicalAssessmentDays){
     p.severityAssessed=true; // One severity draw per infection; a negative draw must not repeat daily.
     let severity=cfg.severeProbabilityByAge[p.age];if(p.protectedAtInfection)severity*=1-vaccine.severeProtectionFraction;
     p.severe=rand()<severity;
    }
    if(p.state==='I'&&p.severe&&day>=p.onsetDay+cfg.clinicalAssessmentDays&&day<p.outcomeDay){
     requestedBeds++;
     if(activeCare()<beds){p.state='H';p.admittedDay=day;p.outcomeDay=Math.max(p.outcomeDay,day+cfg.hospitalStayDays);newAdmissions++;events.push({day,type:'hospital_admission',person:p.id});}
     else{p.careDenied=true;deniedPeople.add(p.id);}
    }
    if(day>=p.outcomeDay){
     let died=false;
     if(p.severe){const risk=(p.admittedDay!==null?cfg.deathProbabilityIfSevereWithCareByAge:cfg.deathProbabilityIfSevereWithoutCareByAge)[p.age];died=rand()<risk;}
     p.state=died?'D':'R';if(died)newDeaths++;events.push({day,type:died?'death':'recovery',person:p.id});
    }
   }
  }
  // Each location is a bounded stochastic contact group. Closure changes destinations,
  // not household links. Bridge closure blocks cross-river work trips in this v1.
  const groups=new Map();let crossings=0;
  const add=(id,p)=>{if(!groups.has(id))groups.set(id,[]);groups.get(id).push(p);};
  function permittedCrossing(p,destinationRegion){
   if(sides(p.region,cfg.regions)===sides(destinationRegion,cfg.regions))return true;
   if(eligible(p,cfg,'bridge_closure',day))return false;
   const restrictions=applicable(cfg,'mobility_restriction',day,p.region);
   return !restrictions.some(x=>isSelected(p,x));
  }
  for(const p of P)if(p.state!=='D'&&p.state!=='H')add(p.home,p);
  for(const p of P){
   if(p.state==='D')continue;
   if(p.state==='H'){add(city.hospitals[p.region],p);continue;}
   const symptomaticIsolation=p.state==='I'&&rand()<.60;
   if(symptomaticIsolation)continue;
   if(p.age==='child'){
    if(!eligible(p,cfg,'school_closure',day))add(p.school,p);
   }else if(p.working){
    const remote=eligible(p,cfg,'remote_work',day)&&p.canRemote||eligible(p,cfg,'workplace_closure',day)&&!p.healthWorker;
    if(!remote&&permittedCrossing(p,p.workRegion)){add(p.work,p);if(sides(p.region,cfg.regions)!==sides(p.workRegion,cfg.regions))crossings++;}
   }
   const restrict=eligible(p,cfg,'mobility_restriction',day);
   if(!restrict&&rand()<.24&&!eligible(p,cfg,'retail_limit',day))add(city.markets[p.region],p);
   if(!restrict&&rand()<.17&&!eligible(p,cfg,'community_closure',day))add(city.parks[p.region],p);
  }
  const hazard=new Map(),contributions=new Map();
  for(const [place,people] of groups){
   const layer=city.places.get(place).type,hours=cfg.contactHours[layer]??0,limit=cfg.contactsPerPerson[layer]??0;
   if(!hours||!limit||people.length<2)continue;
   const touched=new Set();
   for(let i=0;i<people.length;i++)for(let k=0;k<Math.min(limit,people.length-1);k++){
    let j=Math.floor(rand()*(people.length-1));if(j>=i)j++;const a=people[i],b=people[j];
    const key=Math.min(a.id,b.id)+':'+Math.max(a.id,b.id);if(touched.has(key))continue;touched.add(key);
    function exposure(target,infector){
     if(target.state!=='S'||!(infector.state==='I'||infector.state==='H')||day>=infector.onsetDay+cfg.infectiousDays)return;
     const protection=target.vaccinatedDay!==null&&day>=target.vaccinatedDay+vaccine.daysToProtection?vaccine.infectionProtectionFraction:0;
     const h=cfg.beta*hours*(cfg.relativeSusceptibilityByAge[target.age]??1)*(1-protection);
     if(!h)return;hazard.set(target.id,(hazard.get(target.id)||0)+h);if(!contributions.has(target.id))contributions.set(target.id,[]);contributions.get(target.id).push({person:infector.id,layer,weight:h,place});
    }
    exposure(a,b);exposure(b,a);
   }
  }
  // A susceptible receives one infection draw per day using the accumulated risk.
  for(const [id,h] of hazard){if(rand()<1-Math.exp(-h)){
   const options=contributions.get(id);let r=rand()*h,src=options.at(-1);for(const opt of options){r-=opt.weight;if(r<=0){src=opt;break;}}
   if(infect(P[id],day,src.person,src.layer)){newInfections++;events.at(-1).place=src.place;}
  }}
  for(const id of reports.get(day)||[]){if(P[id].state!=='D'){newReports++;P[id].detected=true;events.push({day,type:'reported_case',person:id});}}
  const lastReports=daily.filter(d=>d.day>=day-cfg.alert.windowDays+1).reduce((x,d)=>x+d.newReportedCases,0)+newReports;
  if(!alerted&&lastReports>=cfg.alert.detectedCasesThreshold){alerted=true;alertDays.push(day);events.push({day,type:'game_alert',reason:'configurable_local_detection_rule_not_pandemic_declaration'});}
  const cnt={S:0,E:0,I:0,H:0,R:0,D:0};for(const p of P)cnt[p.state]++;
  if(Object.values(cnt).reduce((x,y)=>x+y,0)!==cfg.population)throw Error('population conservation violation');
  daily.push({day,...cnt,alive:cfg.population-cnt.D,newInfections,newReportedCases:newReports,reportsLastWindow:lastReports,gameAlert:alerted,admissions:newAdmissions,deathIncidence:newDeaths,bedCapacity:beds,bedsOccupied:cnt.H,bedRequests:requestedBeds,unmetBedRequests:Math.max(0,requestedBeds-newAdmissions),dosesDelivered:dosesToday,cumulativeDoses:totalDoses,bridgeCrossings:crossings});
  if(options.onDay)options.onDay(daily.at(-1));
 }
 return {modelVersion:MODEL_VERSION,seed:cfg.seed,config:cfg,city:{places:[...city.places.values()],persons:P.length},daily,events,summary:{population:cfg.population,finalAlive:daily.at(-1).alive,finalDeaths:daily.at(-1).D,everInfected:events.filter(e=>e.type==='infection').length,reportedCases:events.filter(e=>e.type==='reported_case').length,hospitalAdmissions:events.filter(e=>e.type==='hospital_admission').length,uniqueDeniedBed:deniedPeople.size,vaccinated:totalDoses,alertDay:alertDays[0]??null,transmissionsByLayer:transmissionByLayer}};
}
export function summarizeRuns(results){if(!results.length)throw Error('no runs');const pick=f=>results.map(f).sort((a,b)=>a-b);const q=(xs,p)=>xs[Math.floor((xs.length-1)*p)];const infected=pick(r=>r.summary.everInfected),deaths=pick(r=>r.summary.finalDeaths);return {runs:results.length,infected:{median:q(infected,.5),p05:q(infected,.05),p95:q(infected,.95)},deaths:{median:q(deaths,.5),p05:q(deaths,.05),p95:q(deaths,.95)}};}