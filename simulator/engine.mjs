/** OUTBREAK v2: stochastic, synthetic respiratory outbreak engine.
 * Data-informed structure: Brazil age/contact matrices, PNAD COVID behavior,
 * POLYMOD duration categories, SIVEP-Gripe clinical timing/outcomes and CNES beds.
 * Absolute pathogen transmissibility, latent/infectious periods and causal policy
 * effects remain sensitivity assumptions where the supplied data do not identify them.
 * ES module, no runtime dependencies.
 */
export const MODEL_VERSION='2.1.0-spatial-routines';
const AGE_GROUPS=['child','adult','older'];
const AGE_INDEX={child:0,adult:1,older:2};
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
function rng(seed){let s=(seed>>>0);return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(a,rand){for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function weightedIndex(weights,rand){let sum=0;for(const x of weights)sum+=Math.max(0,Number(x)||0);if(!(sum>0))return -1;let r=rand()*sum;for(let i=0;i<weights.length;i++){r-=Math.max(0,Number(weights[i])||0);if(r<=0)return i;}return weights.length-1;}
function sampleDiscrete(values,weights,rand){const i=weightedIndex(weights,rand);return i<0?values[0]:values[i];}
function poissonUpperQuantile(lambda,p=.99){if(!(lambda>0))return 0;let k=0,term=Math.exp(-lambda),cdf=term;while(cdf<p&&k<10000){k++;term*=lambda/k;cdf+=term;}return k;}
function poissonSample(lambda,rand){if(!(lambda>0))return 0;if(lambda<30){const L=Math.exp(-lambda);let k=0,p=1;do{k++;p*=rand();}while(p>L);return k-1;}const z=Math.sqrt(-2*Math.log(Math.max(rand(),1e-12)))*Math.cos(2*Math.PI*rand());return Math.max(0,Math.round(lambda+Math.sqrt(lambda)*z));}
function requireProb(x,name){if(!Number.isFinite(x)||x<0||x>1)throw Error('invalid probability '+name);}
function requireValid(cfg){
 if(!Number.isInteger(cfg.population)||cfg.population<10||cfg.population>30000)throw Error('population must be integer 10..30000');
 if(!Number.isInteger(cfg.regions)||cfg.regions<2||cfg.regions>20)throw Error('regions must be 2..20');
 if(!Number.isInteger(cfg.days)||cfg.days<1||cfg.days>3650)throw Error('days must be integer 1..3650');
 for(const f of ['latentDays','infectiousDays','reportDelayDays'])if(!Number.isInteger(cfg[f])||cfg[f]<0||(f==='infectiousDays'&&cfg[f]===0))throw Error('invalid duration '+f);
 requireProb(cfg.symptomaticProbability,'symptomaticProbability');requireProb(cfg.detectionProbabilityIfSymptomatic,'detectionProbabilityIfSymptomatic');
 if(!Number.isFinite(cfg.beta)||cfg.beta<0||cfg.beta>5)throw Error('beta must be >=0 and <=5');
 if(!Number.isInteger(cfg.initialInfections)||cfg.initialInfections<0||cfg.initialInfections>cfg.population)throw Error('invalid initial infections');
 if(!Number.isInteger(cfg.beds)||cfg.beds<0)throw Error('invalid beds');
 for(const p of Object.values(cfg.severeProbabilityByAge))requireProb(p,'severeProbabilityByAge');
 const allowed=['school_closure','remote_work','workplace_closure','mobility_restriction','bridge_closure','retail_limit','community_closure','hospital_capacity_change','lockdown','case_isolation'];
 for(const item of cfg.interventions){if(!allowed.includes(item.type))throw Error('unknown intervention '+item.type);if(!Number.isInteger(item.startDay)||!Number.isInteger(item.endDay)||item.endDay<item.startDay)throw Error('invalid intervention window');if(item.fraction!==undefined)requireProb(item.fraction,'intervention fraction');}
 const v=cfg.vaccination;for(const k of ['uptakeProbability','infectionProtectionFraction','severeProtectionFraction'])requireProb(v[k],'vaccination '+k);
 return cfg;
}
function median(xs){const a=[...xs].filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return 0;return a[Math.floor((a.length-1)/2)];}
export function configFromProfile(doc,level='medium',overrides={}){
 if(!doc?.schema_version?.startsWith('2.')){ // v1 backward compatibility
  const defaults=structuredClone(doc.defaults),profile=doc.profiles[level];if(!profile)throw Error('unknown transmissibility level');
  const cfg={...defaults,...overrides,beta:overrides.beta??profile.beta_per_effective_contact_hour};
  cfg.alert={...defaults.alert,...overrides.alert};cfg.vaccination={...defaults.vaccination,...overrides.vaccination};cfg.interventions=overrides.interventions??defaults.interventions??[];
  return requireValid(cfg);
 }
 const pathogenId=overrides.pathogenId??'influenza';const clinical=doc.clinical[pathogenId];if(!clinical)throw Error('unknown pathogenId '+pathogenId);
 const beta=overrides.beta??doc.scenario_assumptions.transmission_sensitivity_beta_per_hour[level];if(beta===undefined)throw Error('unknown transmissibility level');
 const pnadHosp=Object.values(doc.behavior.monthly).map(x=>x.hospitalized_given_respiratory_symptoms).filter(Number.isFinite);
 const pnadCare=Object.values(doc.behavior.monthly).map(x=>x.care_seeking_given_respiratory_symptoms).filter(Number.isFinite);
 const symptomatic=overrides.symptomaticProbability??doc.scenario_assumptions.symptomatic_probability;
 const baseHospitalGivenSymptoms=median(pnadHosp);
 const severity={};for(const ag of AGE_GROUPS)severity[ag]=clamp(baseHospitalGivenSymptoms*(clinical.hospitalization_incidence_relative_by_age[ag]??1));
 const pop=overrides.population??1200;
 const bedsPer100k=doc.hospital_capacity.registered_beds_per_100k.all_existing;
 const defaults={population:pop,regions:6,days:180,initialInfections:1,initialInfectionMode:'random',seed:20260925,pathogenId,beta,
  latentDays:doc.scenario_assumptions.latent_days,infectiousDays:doc.scenario_assumptions.infectious_days,symptomaticProbability:symptomatic,
  reportDelayDays:2,detectionProbabilityIfSymptomatic:median(pnadCare),beds:Math.max(1,Math.round(pop*bedsPer100k/100000)),
  severeProbabilityByAge:severity,relativeSusceptibilityByAge:{child:1,adult:1,older:1},
  ageGroupProbabilities:doc.population.age_group_probabilities,singleYearAgeDistribution:doc.population.single_year_age_distribution,householdPatterns:doc.population.household_patterns,
  employmentProbabilityByAge:doc.population.employment_probability_by_age,schoolEnrollmentProbability:doc.population.school_enrollment_probability_age_6_17,
  healthWorkerShare:doc.population.health_worker_share_of_employed_nov2020,teacherShare:doc.population.teacher_share_of_employed_nov2020,
  contactMatrices:doc.contacts.matrix_mean_contacts_per_person_day_by_layer,contactAgeOrder:doc.contacts.age_group_order,
  durationCategories:doc.contact_duration.duration_categories,durationHours:doc.contact_duration.representative_hours_for_engine,
  durationProbabilities:doc.contact_duration.probabilities_by_layer,communityAllocation:doc.scenario_assumptions.community_allocation_proxy??{retail:.44,community:.56},hospitalContactScale:doc.scenario_assumptions.hospital_contact_scale??0,
  maxContactSamplesPerPerson:4,crossRegionWorkProbability:doc.scenario_assumptions.cross_region_work_probability??0,deniedCareMortalityMultiplier:doc.scenario_assumptions.denied_care_mortality_multiplier??1,preSymptomaticDays:doc.scenario_assumptions.pre_symptomatic_days??0,externalImportationRatePerDay:0,startEpiWeek:1,
  clinicalProfile:clinical,
  alert:{mode:'hospital_excess',windowDays:7,alpha:doc.surveillance.alert_alpha,consecutiveWindows:doc.surveillance.consecutive_windows,weeklyBaselinePer100k:doc.surveillance.weekly_registered_srag_hospitalizations_per_100k_2025},
  vaccination:{enabled:false,availableDay:180,dosesPerDay:35,uptakeProbability:.75,daysToProtection:14,infectionProtectionFraction:.55,severeProtectionFraction:.60,priority:'older_first'},
  interventions:[]};
 const cfg={...defaults,...overrides,beta,pathogenId};
 cfg.alert={...defaults.alert,...overrides.alert};cfg.vaccination={...defaults.vaccination,...overrides.vaccination};cfg.interventions=overrides.interventions??[];
 cfg.severeProbabilityByAge={...defaults.severeProbabilityByAge,...overrides.severeProbabilityByAge};cfg.relativeSusceptibilityByAge={...defaults.relativeSusceptibilityByAge,...overrides.relativeSusceptibilityByAge};
 return requireValid(cfg);
}
function ageGroupFromYears(age){return age<=17?'child':age<=64?'adult':'older';}
function sampleAgeYears(group,cfg,rand){
 if(cfg.singleYearAgeDistribution){const rows=cfg.singleYearAgeDistribution.filter(x=>ageGroupFromYears(x.age)===group);return sampleDiscrete(rows.map(x=>x.age),rows.map(x=>x.probability),rand);}
 if(group==='child')return Math.floor(rand()*18);if(group==='adult')return 18+Math.floor(rand()*47);return 65+Math.floor(rand()*25);
}
function sampleHousehold(cfg,rand){
 const pats=cfg.householdPatterns;if(Array.isArray(pats)&&pats.length){const p=sampleDiscrete(pats,pats.map(x=>x.probability),rand);const a=[];for(const ag of AGE_GROUPS)for(let i=0;i<(p[ag]||0);i++)a.push(ag);return shuffle(a,rand);}
 return [sampleDiscrete(AGE_GROUPS,AGE_GROUPS.map(x=>cfg.ageGroupProbabilities[x]||0),rand)];
}
export function makeCity(cfg){
 const random=rng(cfg.seed),agents=[],places=new Map(),homes=[],schools=[],workplaces=[],markets=[],parks=[],hospitals=[];
 const spatial=cfg.spatialModel&&Array.isArray(cfg.spatialModel.homes)&&Array.isArray(cfg.spatialModel.places)?cfg.spatialModel:null;
 const add=(kind,reg,id=null,visualId=null,meta={})=>{
  const pid=id??(kind+'-'+places.size);
  if(!places.has(pid))places.set(pid,{id:pid,type:kind,region:reg,visualId:visualId??pid,...meta});
  return pid;
 };
 const layerType=t=>{
  if(t==='school')return 'school';
  if(t==='hospital')return 'hospital';
  if(t==='office'||t==='civic'||t==='work')return 'work';
  if(t==='market'||t==='commerce'||t==='restaurant'||t==='retail')return 'retail';
  if(t==='park'||t==='community')return 'community';
  return null;
 };
 const byRegion=Array.from({length:cfg.regions},()=>({school:[],work:[],retail:[],community:[],hospital:[],homes:[]}));
 const pickWeighted=(items,rand)=>{
  if(!items?.length)return null;
  const idx=weightedIndex(items.map(x=>Math.max(1,Number(x.capacity)||1)),rand);
  return items[Math.max(0,idx)];
 };
 if(spatial){
  for(const h of spatial.homes){
   const r=Number.isInteger(h.regionIndex)?clamp(h.regionIndex,0,cfg.regions-1):0;
   byRegion[r].homes.push({id:h.id,region:r});
  }
  for(const p of spatial.places){
   const kind=layerType(p.type);
   if(!kind)continue;
   const r=Number.isInteger(p.regionIndex)?clamp(p.regionIndex,0,cfg.regions-1):0;
   const id=add(kind,r,p.id,p.id,{capacity:Number(p.capacity)||null,sourceType:p.type,name:p.name??p.id});
   byRegion[r][kind].push({id,capacity:Number(p.capacity)||1});
  }
 }
 for(let r=0;r<cfg.regions;r++){
  const ensure=(kind,arr)=>{
   if(arr.length)return;
   const id=add(kind,r,null,null,{syntheticFallback:true});
   arr.push({id,capacity:1});
  };
  ensure('school',byRegion[r].school);
  ensure('work',byRegion[r].work);
  ensure('retail',byRegion[r].retail);
  ensure('community',byRegion[r].community);
  ensure('hospital',byRegion[r].hospital);
  schools.push(...byRegion[r].school.map(x=>x.id));
  workplaces.push(...byRegion[r].work.map(x=>x.id));
  markets.push(...byRegion[r].retail.map(x=>x.id));
  parks.push(...byRegion[r].community.map(x=>x.id));
  hospitals.push(...byRegion[r].hospital.map(x=>x.id));
 }
 const regionWeights=byRegion.map((x)=>Math.max(1,x.homes.length));
 const homeOrder=byRegion.map(x=>shuffle([...x.homes],random));
 const homeCursor=Array(cfg.regions).fill(0);
 let house=0;
 while(agents.length<cfg.population){
  const region=spatial?Math.max(0,weightedIndex(regionWeights,random)):house%cfg.regions;
  const visualHomes=homeOrder[region];
  let visualHome=null;
  if(visualHomes.length){
   visualHome=visualHomes[homeCursor[region]%visualHomes.length].id;
   homeCursor[region]++;
  }else visualHome='residential-node-'+region;
  const homeId='household-'+String(house+1).padStart(6,'0');
  const home=add('household',region,homeId,visualHome,{householdIndex:house});
  homes.push(home);
  let groups=sampleHousehold(cfg,random);if(!groups.length)groups=['adult'];
  const schoolChoice=()=>pickWeighted(byRegion[region].school,random)?.id??null;
  const retailChoice=()=>pickWeighted(byRegion[region].retail,random)?.id??null;
  const communityChoice=()=>pickWeighted(byRegion[region].community,random)?.id??null;
  for(const ageGroup of groups){
   if(agents.length>=cfg.population)break;
   const ageYears=sampleAgeYears(ageGroup,cfg,random);
   const employmentP=cfg.employmentProbabilityByAge?.[ageGroup]??(ageGroup==='adult'?.62:ageGroup==='older'?.13:0);
   const working=random()<employmentP;
   const healthWorker=working&&random()<(cfg.healthWorkerShare??0);
   const teacher=working&&!healthWorker&&random()<(cfg.teacherShare??0);
   const schoolEnrolled=ageYears>=6&&ageYears<=17&&random()<(cfg.schoolEnrollmentProbability??1);
   const jobRegion=(healthWorker||teacher||random()>cfg.crossRegionWorkProbability)?region:(region+Math.ceil(cfg.regions/2))%cfg.regions;
   const jobBuckets=byRegion[jobRegion];
   const school=schoolEnrolled?schoolChoice():null;
   const work=healthWorker?(pickWeighted(jobBuckets.hospital,random)?.id??null):teacher?(pickWeighted(jobBuckets.school,random)?.id??null):(working?(pickWeighted(jobBuckets.work,random)?.id??null):null);
   const market=retailChoice();
   const community=communityChoice();
   const hospital=pickWeighted(byRegion[region].hospital,random)?.id??null;
   agents.push({
    id:agents.length,age:ageGroup,ageYears,region,home,visualHome,householdId:home,
    school,schoolEnrolled,work,workRegion:jobRegion,market,community,hospital,
    healthWorker,teacher,working,compliance:random(),vaccineWilling:random(),
    state:'S',infectedDay:null,infectiousStartDay:null,onsetDay:null,symptomatic:null,
    symptomOnsetProcessed:false,outcomeDay:null,source:null,severe:false,severityAssessed:false,
    hospitalRequestDay:null,admittedDay:null,careDenied:false,vaccinatedDay:null,detected:false
   });
  }
  house++;
 }
 return {agents,places,houses:homes,schools,workplaces,markets,parks,hospitals,spatialModel:spatial};
}
const sides=(region,regions)=>region<Math.ceil(regions/2)?0:1;
function applies(policy,day,region){return day>=policy.startDay&&day<=policy.endDay&&(!policy.regionIds||policy.regionIds.includes(region));}
function applicable(cfg,type,day,region){return cfg.interventions.filter(p=>p.type===type&&applies(p,day,region));}
function isSelected(person,pol){return person.compliance<(pol.fraction??1);}
const eligible=(a,cfg,type,day)=>applicable(cfg,type,day,a.region).some(p=>isSelected(a,p));
function pmfSample(pmf,rand){if(!Array.isArray(pmf)||!pmf.length)return null;return weightedIndex(pmf,rand);}
function clinicalPmf(cfg,key,age){return cfg.clinicalProfile?.[key]?.[age]??null;}
function durationSample(cfg,layer,rand){let key=layer==='household'?'home':(layer==='retail'||layer==='hospital'?'community':layer);const obj=cfg.durationProbabilities?.[key];if(!obj)return 1;const probs=cfg.durationCategories.map(c=>obj[c]??0);const i=weightedIndex(probs,rand);return cfg.durationHours[i<0?0:i]??1;}
function matrixForLayer(cfg,layer){let key=layer;if(layer==='household')key='home';else if(layer==='retail'||layer==='hospital')key='community';const m=cfg.contactMatrices?.[key];if(!m)return null;let scale=1;if(layer==='retail')scale=cfg.communityAllocation?.retail??.44;else if(layer==='community')scale=cfg.communityAllocation?.community??.56;else if(layer==='hospital')scale=cfg.hospitalContactScale??0;return m.map(row=>row.map(x=>x*scale));}
function alertExpected(cfg,day){const week=((cfg.startEpiWeek-1+Math.floor(day/7))%52)+1;const rate=Number(cfg.alert.weeklyBaselinePer100k?.[String(week)]??0);return {week,expected:rate*cfg.population/100000};}
export function simulate(config,options={}){
 const cfg=requireValid(structuredClone(config));
 const rand=rng((cfg.seed^0x9e3779b9)>>>0);
 const city=makeCity(cfg),P=city.agents;
 const events=[],daily=[],reports=new Map(),transmissionByLayer={},alertDays=[];
 const seedRegion=Number.isInteger(cfg.initialSeedRegion)?Math.max(0,Math.min(cfg.regions-1,cfg.initialSeedRegion)):null;
 const seedContext=cfg.initialSeedContext??(cfg.initialInfectionMode==='child_at_home'?'home':'random');
 const visualOf=place=>city.places.get(place)?.visualId??place;
 const placeForContext=(person,context)=>{
  if(context==='school')return person.school??person.home;
  if(context==='work')return person.work??person.home;
  if(context==='retail')return person.market??person.home;
  if(context==='community')return person.community??person.home;
  if(context==='hospital')return person.hospital??person.work??person.home;
  return person.home;
 };
 function infect(target,day,source,layer,place=null,hours=null,block=null,visualPlaceOverride=null){
  if(!target||target.state!=='S')return false;
  target.state='E';target.infectedDay=day;target.onsetDay=day+cfg.latentDays;
  target.infectiousStartDay=Math.max(day,target.onsetDay-(cfg.preSymptomaticDays??0));
  target.outcomeDay=target.onsetDay+cfg.infectiousDays;target.source=source;target.symptomatic=null;target.symptomOnsetProcessed=false;
  const actualPlace=place??target.home;
  events.push({day,type:'infection',person:target.id,source,layer,place:actualPlace,visualPlace:visualPlaceOverride??visualOf(actualPlace),contactHours:hours,block});
  transmissionByLayer[layer]=(transmissionByLayer[layer]||0)+1;
  return true;
 }
 let candidates=P;
 if(seedRegion!==null)candidates=candidates.filter(p=>p.region===seedRegion);
 if(seedContext==='school')candidates=candidates.filter(p=>p.school);
 else if(seedContext==='work')candidates=candidates.filter(p=>p.work&&p.working&&!p.healthWorker&&!p.teacher);
 else if(seedContext==='hospital')candidates=candidates.filter(p=>p.healthWorker||city.places.get(p.work)?.type==='hospital');
 else if(cfg.initialInfectionMode==='child_at_home')candidates=candidates.filter(p=>p.age==='child');
 if(!candidates.length)candidates=seedRegion===null?P:P.filter(p=>p.region===seedRegion);
 if(!candidates.length)candidates=P;
 let seeds=shuffle([...candidates],rand);
 if(Number.isInteger(cfg.initialSeedAgentId)&&P[cfg.initialSeedAgentId]){
  seeds=[P[cfg.initialSeedAgentId],...seeds.filter(p=>p.id!==cfg.initialSeedAgentId)];
 }
 for(let n=0;n<Math.min(cfg.initialInfections,seeds.length);n++){
  const target=seeds[n],place=placeForContext(target,seedContext);
  infect(target,0,null,'seed',place,null,'seed',cfg.initialSeedPlaceId??visualOf(place));
 }
 let alerted=false,consecutiveAlertWindows=0,totalDoses=0,deniedPeople=new Set();

 function processContactGroups(groups,day,block,scaleByLayer,vaccine){
  let created=0;
  for(const [place,people] of groups){
   if(people.length<2)continue;
   const placeInfo=city.places.get(place);
   if(!placeInfo)continue;
   const layer=placeInfo.type;
   const matrix=matrixForLayer(cfg,layer);
   const layerScale=scaleByLayer[layer]??0;
   if(!matrix||!(layerScale>0))continue;
   const buckets=AGE_GROUPS.map(ag=>people.filter(x=>x.age===ag));
   const touched=new Set(),hazard=new Map(),contrib=new Map();
   for(const a of people){
    const row=matrix[AGE_INDEX[a.age]].map(x=>x*layerScale);
    const expected=row.reduce((x,y)=>x+y,0);
    if(!(expected>0))continue;
    const n=Math.min(cfg.maxContactSamplesPerPerson??4,people.length-1,Math.max(1,Math.round(expected)));
    const expansion=expected/n;
    for(let k=0;k<n;k++){
     const weights=row.map((x,i)=>buckets[i].length?x:0);
     const gi=weightedIndex(weights,rand);if(gi<0)continue;
     const pool=buckets[gi];if(!pool.length)continue;
     let b=pool[Math.floor(rand()*pool.length)];
     if(b.id===a.id){if(pool.length<2)continue;b=pool[(pool.indexOf(b)+1)%pool.length];}
     const key=Math.min(a.id,b.id)+':'+Math.max(a.id,b.id);
     if(touched.has(key))continue;touched.add(key);
     const hours=durationSample(cfg,layer,rand);
     function expose(target,infector){
      if(target.state!=='S'||infector.state!=='I'||day>=infector.onsetDay+cfg.infectiousDays)return;
      const vp=target.vaccinatedDay!==null&&day>=target.vaccinatedDay+vaccine.daysToProtection?vaccine.infectionProtectionFraction:0;
      const h=cfg.beta*hours*expansion*(cfg.relativeSusceptibilityByAge[target.age]??1)*(1-vp);
      if(!(h>0))return;
      hazard.set(target.id,(hazard.get(target.id)||0)+h);
      if(!contrib.has(target.id))contrib.set(target.id,[]);
      contrib.get(target.id).push({person:infector.id,layer,weight:h,place,hours,block,visualPlace:placeInfo.visualId??place});
     }
     expose(a,b);expose(b,a);
    }
   }
   for(const [id,h] of hazard){
    if(rand()>=1-Math.exp(-h))continue;
    const opts=contrib.get(id);let r=rand()*h,src=opts.at(-1);
    for(const o of opts){r-=o.weight;if(r<=0){src=o;break;}}
    if(infect(P[id],day,src.person,src.layer,src.place,src.hours,block,src.visualPlace))created++;
   }
  }
  return created;
 }

 for(let day=0;day<cfg.days;day++){
  let newInfections=0,newReports=0,newAdmissions=0,newDeaths=0,dosesToday=0,requestedBeds=0,bridgeCrossings=0;
  const vaccine=cfg.vaccination;
  if(vaccine.enabled&&day>=vaccine.availableDay&&vaccine.dosesPerDay>0){
   let v=P.filter(p=>p.state==='S'&&p.vaccinatedDay===null&&p.vaccineWilling<vaccine.uptakeProbability);
   if(vaccine.priority==='older_first')v.sort((a,b)=>AGE_INDEX[b.age]-AGE_INDEX[a.age]||a.id-b.id);else shuffle(v,rand);
   for(const p of v.slice(0,Math.floor(vaccine.dosesPerDay))){p.vaccinatedDay=day;dosesToday++;events.push({day,type:'vaccination',person:p.id});}
   totalDoses+=dosesToday;
  }
  const cap=applicable(cfg,'hospital_capacity_change',day,0);
  const beds=Math.max(0,cfg.beds+cap.reduce((s,p)=>s+(p.bedsDelta??0),0));
  const activeCare=()=>P.reduce((n,p)=>n+(p.state==='H'),0);

  for(const p of P){
   if(p.state==='E'&&day>=p.infectiousStartDay){p.state='I';events.push({day,type:'infectious_onset',person:p.id});}
   if(p.state==='I'&&!p.symptomOnsetProcessed&&day>=p.onsetDay){
    p.symptomOnsetProcessed=true;p.symptomatic=rand()<cfg.symptomaticProbability;
    events.push({day,type:'symptom_onset',person:p.id,symptomatic:p.symptomatic});
    if(p.symptomatic&&rand()<cfg.detectionProbabilityIfSymptomatic){
     const rd=day+cfg.reportDelayDays;reports.set(rd,[...(reports.get(rd)||[]),p.id]);
    }
   }
   if((p.state==='I'||p.state==='H')&&p.infectedDay!==null){
    if(p.state==='I'&&!p.severityAssessed&&day>=p.onsetDay){
     p.severityAssessed=true;p.severe=Boolean(p.symptomatic)&&rand()<(cfg.severeProbabilityByAge[p.age]??0);
     if(p.severe){
      let delay=pmfSample(clinicalPmf(cfg,'symptom_to_hospital_pmf_days_0_30',p.age),rand);
      if(delay===null)delay=2;p.hospitalRequestDay=p.onsetDay+delay;
     }
    }
    if(p.state==='I'&&p.severe&&p.hospitalRequestDay!==null&&day>=p.hospitalRequestDay&&day<p.outcomeDay){
     requestedBeds++;
     if(activeCare()<beds){
      p.state='H';p.admittedDay=day;
      let stay=pmfSample(clinicalPmf(cfg,'hospital_to_outcome_pmf_days_0_30',p.age),rand);
      if(stay===null||stay<1)stay=7;p.outcomeDay=Math.max(p.outcomeDay,day+stay);
      newAdmissions++;events.push({day,type:'hospital_admission',person:p.id,visualPlace:visualOf(p.hospital)});
     }else{p.careDenied=true;deniedPeople.add(p.id);}
    }
    if(day>=p.outcomeDay){
     let died=false;
     if(p.severe){
      let risk=cfg.clinicalProfile?.death_fraction_given_hospitalized?.[p.age];if(!Number.isFinite(risk))risk=.05;
      if(p.admittedDay===null)risk=clamp(risk*(cfg.deniedCareMortalityMultiplier??1));
      died=rand()<risk;
     }
     p.state=died?'D':'R';if(died)newDeaths++;events.push({day,type:died?'death':'recovery',person:p.id});
    }
   }
  }

  const importCount=poissonSample(cfg.externalImportationRatePerDay??0,rand);
  if(importCount>0){
   const susceptible=shuffle(P.filter(p=>p.state==='S'),rand);
   for(const p of susceptible.slice(0,importCount)){
    if(infect(p,day,null,'external_importation',p.home,null,'external',p.visualHome))newInfections++;
   }
  }

  const addPresence=(groups,id,p)=>{if(!id)return;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(p);};
  const permittedCrossing=(p,dst)=>{
   if(sides(p.region,cfg.regions)===sides(dst,cfg.regions))return true;
   if(eligible(p,cfg,'bridge_closure',day))return false;
   return !eligible(p,cfg,'mobility_restriction',day);
  };
  const morning=new Map(),daytime=new Map(),evening=new Map(),night=new Map();
  const weekday=day%7<5;
  const outingProbability=weekday?(cfg.routine?.weekdayOutingProbability??.55):(cfg.routine?.weekendOutingProbability??.72);
  const retailShare=clamp(cfg.communityAllocation?.retail??.44,0,1);

  for(const p of P){
   if(p.state==='D')continue;
   if(p.state==='H'){
    addPresence(daytime,p.hospital,p);
    continue;
   }
   addPresence(morning,p.home,p);
   const isolated=p.state==='I'&&p.symptomatic===true&&eligible(p,cfg,'case_isolation',day);
   const lock=eligible(p,cfg,'lockdown',day);
   let placedDay=false;
   if(!isolated&&weekday&&p.schoolEnrolled&&!lock&&!eligible(p,cfg,'school_closure',day)&&p.school){
    addPresence(daytime,p.school,p);placedDay=true;
   }else if(!isolated&&weekday&&p.working){
    const remote=(eligible(p,cfg,'remote_work',day)||eligible(p,cfg,'workplace_closure',day)||lock)&&!p.healthWorker;
    if(!remote&&p.work&&permittedCrossing(p,p.workRegion)){
     addPresence(daytime,p.work,p);placedDay=true;
     if(sides(p.region,cfg.regions)!==sides(p.workRegion,cfg.regions))bridgeCrossings++;
    }
   }
   if(!placedDay)addPresence(daytime,p.home,p);

   const restricted=isolated||lock||eligible(p,cfg,'mobility_restriction',day);
   if(!restricted&&rand()<outingProbability){
    const chooseRetail=rand()<retailShare;
    if(chooseRetail){
     if(!eligible(p,cfg,'retail_limit',day)&&p.market)addPresence(evening,p.market,p);
    }else if(!eligible(p,cfg,'community_closure',day)&&p.community)addPresence(evening,p.community,p);
   }
   addPresence(night,p.home,p);
  }

  newInfections+=processContactGroups(morning,day,'home_morning',{household:.35},vaccine);
  newInfections+=processContactGroups(daytime,day,'daytime',{household:.25,school:1,work:1,hospital:1},vaccine);
  newInfections+=processContactGroups(evening,day,'evening_outing',{retail:1,community:1},vaccine);
  newInfections+=processContactGroups(night,day,'home_night',{household:.65},vaccine);

  for(const id of reports.get(day)||[]){newReports++;P[id].detected=true;events.push({day,type:'reported_case',person:id});}

  let alertMetric=null,alertThreshold=null,expected=null;
  if(cfg.alert.mode==='hospital_excess'){
   const a=alertExpected(cfg,day);expected=a.expected;
   const startWindow=day-(cfg.alert.windowDays??7)+1;
   const observed=daily.filter(x=>x.day>=startWindow).reduce((s,x)=>s+x.admissions,0)+newAdmissions;
   alertMetric=observed;alertThreshold=poissonUpperQuantile(expected,1-(cfg.alert.alpha??.01));
   if(observed>alertThreshold)consecutiveAlertWindows++;else consecutiveAlertWindows=0;
   if(!alerted&&consecutiveAlertWindows>=(cfg.alert.consecutiveWindows??1)){
    alerted=true;alertDays.push(day);
    events.push({day,type:'game_alert',reason:'hospital_admissions_above_data_informed_srag_baseline',observed,expected,threshold:alertThreshold});
   }
  }else{
   const startWindow=day-(cfg.alert.windowDays??7)+1;
   const observed=daily.filter(x=>x.day>=startWindow).reduce((s,x)=>s+x.newReportedCases,0)+newReports;
   alertMetric=observed;alertThreshold=cfg.alert.detectedCasesThreshold??1;
   if(!alerted&&observed>=alertThreshold){
    alerted=true;alertDays.push(day);events.push({day,type:'game_alert',reason:'configurable_detected_case_rule'});
   }
  }
  const cnt={S:0,E:0,I:0,H:0,R:0,D:0};for(const p of P)cnt[p.state]++;
  if(Object.values(cnt).reduce((x,y)=>x+y,0)!==cfg.population)throw Error('population conservation violation');
  daily.push({
   day,...cnt,alive:cfg.population-cnt.D,newInfections,newReportedCases:newReports,gameAlert:alerted,
   alertMetric,alertThreshold,expectedHospitalAdmissions7d:expected,admissions:newAdmissions,deathIncidence:newDeaths,
   bedCapacity:beds,bedsOccupied:cnt.H,bedRequests:requestedBeds,unmetBedRequests:Math.max(0,requestedBeds-newAdmissions),
   dosesDelivered:dosesToday,cumulativeDoses:totalDoses,bridgeCrossings
  });
  if(options.onDay)options.onDay(daily.at(-1));
 }
 return {
  modelVersion:MODEL_VERSION,seed:cfg.seed,parameterSetId:cfg.parameterSetId??null,config:cfg,
  city:{places:[...city.places.values()],persons:P.length},
  daily,events,
  summary:{
   population:cfg.population,finalAlive:daily.at(-1).alive,finalDeaths:daily.at(-1).D,
   everInfected:events.filter(e=>e.type==='infection').length,
   reportedCases:events.filter(e=>e.type==='reported_case').length,
   hospitalAdmissions:events.filter(e=>e.type==='hospital_admission').length,
   uniqueDeniedBed:deniedPeople.size,vaccinated:totalDoses,alertDay:alertDays[0]??null,
   transmissionsByLayer:transmissionByLayer
  }
 };
}
export function summarizeRuns(results){if(!results.length)throw Error('no runs');const pick=f=>results.map(f).sort((a,b)=>a-b),q=(a,p)=>a[Math.floor((a.length-1)*p)];const infected=pick(r=>r.summary.everInfected),deaths=pick(r=>r.summary.finalDeaths);return {runs:results.length,infected:{median:q(infected,.5),p05:q(infected,.05),p95:q(infected,.95)},deaths:{median:q(deaths,.5),p05:q(deaths,.05),p95:q(deaths,.95)}};}