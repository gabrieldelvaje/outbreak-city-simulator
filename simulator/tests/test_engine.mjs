import fs from 'node:fs';
import assert from 'node:assert/strict';
import {MODEL_VERSION,configFromProfile,makeCity,simulate,summarizeRuns} from '../engine.mjs';
const params=JSON.parse(fs.readFileSync(new URL('../data/calibrated_parameters_v2.json',import.meta.url),'utf8'));
assert.equal(MODEL_VERSION,'2.4.0-year-waves');
const base=configFromProfile(params,'medium',{population:600,days:45,seed:1234,pathogenId:'influenza'});
const annual=configFromProfile(params,'high',{population:600,seed:1234,pathogenId:'influenza'});
assert.equal(annual.days,360,'playable annual profile must cover 360 days');
assert.equal(base.population,600); assert.ok(base.cityMixing.workExternalRegionProbability>0); assert.ok(base.cityMixing.retailExternalRegionProbability>0); assert.equal(base.hospitalContactScale,0);
assert.ok(Array.isArray(base.contactMatrices.home));
const city=makeCity(base); assert.equal(city.agents.length,600);
const counts={child:0,adult:0,older:0}; for(const p of city.agents) counts[p.age]++;
assert.ok(counts.child>0&&counts.adult>0&&counts.older>0);
const anchored=simulate(configFromProfile(params,'medium',{population:600,days:5,seed:222,pathogenId:'influenza',regions:7,initialSeedRegion:3,initialSeedContext:'school',initialInfections:1,cityMixing:{workExternalRegionProbability:0,schoolExternalRegionProbability:0,retailExternalRegionProbability:0,communityExternalRegionProbability:0,hospitalExternalRegionProbability:0}}));
const anchoredSeed=anchored.events.find(e=>e.type==='infection'&&e.layer==='seed');
const anchoredPlace=new Map(anchored.city.places.map(p=>[p.id,p])).get(anchoredSeed.place);
assert.equal(anchoredPlace.region,3,'patient zero must start in the selected map region');
assert.equal(anchoredPlace.type,'school','patient zero school focus must seed the school layer');

const spatialModel={
  homes:[
    {id:'casa-a',regionIndex:0},{id:'casa-b',regionIndex:0},
    {id:'casa-c',regionIndex:1},{id:'casa-d',regionIndex:1}
  ],
  places:[
    {id:'escola-a',type:'school',regionIndex:0,capacity:200},
    {id:'empresa-a',type:'office',regionIndex:0,capacity:200},
    {id:'mercado-a',type:'market',regionIndex:0,capacity:100},
    {id:'parque-a',type:'park',regionIndex:0,capacity:100},
    {id:'hospital-a',type:'hospital',regionIndex:0,capacity:100},
    {id:'escola-b',type:'school',regionIndex:1,capacity:200},
    {id:'empresa-b',type:'office',regionIndex:1,capacity:200},
    {id:'mercado-b',type:'market',regionIndex:1,capacity:100},
    {id:'parque-b',type:'park',regionIndex:1,capacity:100},
    {id:'hospital-b',type:'hospital',regionIndex:1,capacity:100}
  ]
};
const spatialCfg=configFromProfile(params,'high',{population:240,days:18,seed:5150,pathogenId:'influenza',regions:2,spatialModel});
const spatialCity=makeCity(spatialCfg);
assert.ok(spatialCity.agents.every(p=>['casa-a','casa-b','casa-c','casa-d'].includes(p.visualHome)),'every agent must have a persistent visual residence');
assert.ok(spatialCity.agents.every(p=>p.householdId&&p.home===p.householdId),'households must remain distinct from visual residential nodes');
assert.ok(spatialCity.agents.some(p=>p.working&&p.work&&p.workRegion!==p.region),'some workers must commute to another district');
assert.ok(spatialCity.agents.some(p=>p.market&&p.marketRegion!==p.region),'some residents must use retail in another district');
assert.ok(spatialCity.agents.some(p=>p.community&&p.communityRegion!==p.region),'some residents must use leisure/community places in another district');
const crossWorker=spatialCity.agents.find(p=>p.working&&p.work&&p.workRegion!==p.region);
const mixedSpread=simulate({...spatialCfg,beta:5,days:25,latentDays:1,infectiousDays:10,initialSeedAgentId:crossWorker.id,initialSeedRegion:crossWorker.region,initialSeedContext:'work',initialSeedPlaceId:crossWorker.work});
assert.ok(mixedSpread.summary.regionsReached>1,'an outbreak seeded in a commuter must reach more than one district');
assert.ok(mixedSpread.summary.crossRegionTransmissions>0,'the engine must record transmission between residents of different districts');
const chosen=spatialCity.agents.find(p=>p.school)||spatialCity.agents[0];
const chosenPlace=chosen.school??chosen.home;
const exactSeed=simulate({...spatialCfg,initialSeedAgentId:chosen.id,initialSeedRegion:chosen.region,initialSeedContext:chosen.school?'school':'home',initialSeedPlaceId:chosen.school??chosen.visualHome});
const exactSeedEvent=exactSeed.events.find(e=>e.type==='infection'&&e.layer==='seed');
assert.equal(exactSeedEvent.person,chosen.id,'selected resident must be the exact patient zero');
assert.equal(exactSeedEvent.visualPlace,chosen.school??chosen.visualHome,'patient zero must be rendered at the selected visual node');
for(const e of exactSeed.events.filter(e=>e.type==='infection'&&e.layer!=='seed'&&e.layer!=='external_importation')){
  assert.ok(['home_morning','daytime','evening_outing','home_night'].includes(e.block),'secondary transmission must occur inside an explicit daily routine block');
  assert.ok(e.visualPlace,'secondary transmission must resolve to a visual map location');
}

const householdSizes=new Map();
for(const p of spatialCity.agents)householdSizes.set(p.householdId,(householdSizes.get(p.householdId)||0)+1);
const householdSeed=spatialCity.agents.find(p=>(householdSizes.get(p.householdId)||0)>1);
assert.ok(householdSeed,'test city must contain a multi-person household');
const householdOnly=simulate({...spatialCfg,days:20,beta:5,initialSeedAgentId:householdSeed.id,initialSeedRegion:householdSeed.region,initialSeedContext:'home',initialSeedPlaceId:householdSeed.visualHome,interventions:[
  {type:'school_closure',startDay:0,endDay:19,fraction:1},
  {type:'workplace_closure',startDay:0,endDay:19,fraction:1},
  {type:'retail_limit',startDay:0,endDay:19,fraction:1},
  {type:'community_closure',startDay:0,endDay:19,fraction:1}
]});
assert.ok((householdOnly.summary.transmissionsByLayer.household??0)>0,'home matrix must drive family transmission when outside activities are closed');
assert.equal(householdOnly.summary.transmissionsByLayer.school??0,0);
assert.equal(householdOnly.summary.transmissionsByLayer.work??0,0);
assert.equal(householdOnly.summary.transmissionsByLayer.retail??0,0);
assert.equal(householdOnly.summary.transmissionsByLayer.community??0,0);
const r1=simulate(base),r2=simulate(base);
assert.deepEqual(r1.daily,r2.daily,'same seed must be reproducible');
for(const d of r1.daily) assert.equal(d.S+d.E+d.I+d.H+d.R+d.D,600,'population must be conserved');
const zero=simulate({...base,beta:0,initialInfections:2,days:25,externalImportationRatePerDay:0});
assert.equal(zero.summary.everInfected,2,'beta=0 must not create secondary infections');
const closed=simulate({...base,seed:88,interventions:[{type:'school_closure',startDay:0,endDay:44,fraction:1}]});
assert.equal(closed.summary.transmissionsByLayer.school??0,0,'closed schools must have no school transmission');
const lockdown=simulate({...base,seed:99,interventions:[{type:'lockdown',startDay:0,endDay:44,fraction:1}]});
assert.equal(lockdown.summary.transmissionsByLayer.school??0,0);
assert.equal(lockdown.summary.transmissionsByLayer.work??0,0);
assert.equal(lockdown.summary.transmissionsByLayer.retail??0,0);
assert.equal(lockdown.summary.transmissionsByLayer.community??0,0);
const imported=simulate({...base,beta:0,initialInfections:0,externalImportationRatePerDay:1,days:5,seed:77});
assert.ok(imported.summary.everInfected>0,'external importation can reseed the city when explicitly enabled');
const waveBase=configFromProfile(params,'low',{
  population:20,regions:2,days:15,seed:404,pathogenId:'influenza',
  initialInfections:20,beta:0,latentDays:1,infectiousDays:2,symptomaticProbability:0,
  severeProbabilityByAge:{child:0,adult:0,older:0},
  externalImportationRatePerDay:20,
  waveDynamics:{naturalImmunityDaysMin:1,naturalImmunityDaysMax:1,externalImportationAttemptsPer1000PerDay:0}
});
const recurrent=simulate(waveBase);
assert.ok(recurrent.summary.reinfections>0,'waning natural immunity plus reintroductions must allow reinfection');
assert.ok(recurrent.daily.some(d=>d.newReinfections>0),'daily output must expose reinfection episodes');
assert.ok(recurrent.daily.some(d=>d.immunityWaned>0),'recovered agents must return to susceptibility after the configured immunity window');
const vaccinatedWave=simulate({...waveBase,vaccination:{
  enabled:true,availableDay:0,dosesPerDay:20,uptakeProbability:1,daysToProtection:0,
  infectionProtectionFraction:1,severeProtectionFraction:1,priority:'older_first'
}});
assert.ok(vaccinatedWave.summary.reinfections<recurrent.summary.reinfections,'protective vaccination must reduce successful reinfections/reintroductions in the scenario');
const cases=simulate({...base,seed:7,symptomaticProbability:1,severeProbabilityByAge:{child:1,adult:1,older:1},beds:600,beta:0,initialInfections:20,days:40});
assert.ok(cases.summary.hospitalAdmissions>0,'severe symptomatic cases should reach hospital using empirical delay PMFs');
const doseScenario=simulate(configFromProfile(params,'high',{
  population:60,regions:2,days:40,seed:606,pathogenId:'influenza',initialInfections:0,externalImportationRatePerDay:0,
  vaccinationCampaigns:[
    {doseNumber:1,availableDay:0,dosesPerDay:60,uptakeProbability:1,daysToProtection:0,infectionProtectionFraction:.3,severeProtectionFraction:.5,priority:'older_first',minDaysSincePreviousDose:0},
    {doseNumber:2,availableDay:7,dosesPerDay:60,uptakeProbability:1,daysToProtection:0,infectionProtectionFraction:.6,severeProtectionFraction:.8,priority:'older_first',minDaysSincePreviousDose:7},
    {doseNumber:3,availableDay:14,dosesPerDay:60,uptakeProbability:1,daysToProtection:0,infectionProtectionFraction:.75,severeProtectionFraction:.9,priority:'older_first',minDaysSincePreviousDose:7}
  ]
}));
assert.ok(doseScenario.daily.at(-1).cumulativeDose1>0,'first-dose campaign must deliver doses');
assert.ok(doseScenario.daily.at(-1).cumulativeDose2>0,'second-dose campaign must deliver doses after the minimum interval');
assert.ok(doseScenario.daily.at(-1).cumulativeDose3>0,'third-dose campaign must deliver booster doses');
const fourWave=simulate({...annual,days:360,initialInfections:0,externalImportationRatePerDay:0,beta:0});
assert.deepEqual([...new Set(fourWave.daily.map(d=>d.waveNumber))],[1,2,3,4],'360-day campaign must expose four wave phases');
const lethalClinical={...base.clinicalProfile,death_fraction_given_hospitalized:{child:1,adult:1,older:1}};
const noBeds=simulate({...base,seed:707,days:55,beta:0,initialInfections:30,latentDays:1,infectiousDays:30,symptomaticProbability:1,severeProbabilityByAge:{child:1,adult:1,older:1},beds:0,clinicalProfile:lethalClinical,externalImportationRatePerDay:0});
assert.ok(noBeds.summary.uniqueDeniedBed>0,'zero capacity must deny care to severe cases');
assert.ok(noBeds.summary.unmetCareDeaths>0,'deaths after denied care must be tracked separately');
const maxPopulationCfg=configFromProfile(params,'low',{population:20000,days:1,seed:9090,pathogenId:'influenza',regions:2,spatialModel});
const maxPopulationCity=makeCity(maxPopulationCfg);
assert.equal(maxPopulationCity.agents.length,20000,'maximum configured population must be constructible');
assert.ok(new Set(maxPopulationCity.agents.map(p=>p.householdId)).size>1000,'maximum population must remain split into many persistent households');
const summary=summarizeRuns([r1,r2]); assert.equal(summary.runs,2);
console.log('OUTBREAK v2 tests passed', {contacts:base.contactMatrices.home.length, admissions:cases.summary.hospitalAdmissions, alert:cases.summary.alertDay});