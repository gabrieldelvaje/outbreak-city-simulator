import fs from 'node:fs';
import assert from 'node:assert/strict';
import {MODEL_VERSION,configFromProfile,makeCity,simulate,summarizeRuns} from '../engine.mjs';
const params=JSON.parse(fs.readFileSync(new URL('../data/calibrated_parameters_v2.json',import.meta.url),'utf8'));
assert.equal(MODEL_VERSION,'2.1.0-spatial-routines');
const base=configFromProfile(params,'medium',{population:600,days:45,seed:1234,pathogenId:'influenza'});
assert.equal(base.population,600); assert.equal(base.crossRegionWorkProbability,0); assert.equal(base.hospitalContactScale,0);
assert.ok(Array.isArray(base.contactMatrices.home));
const city=makeCity(base); assert.equal(city.agents.length,600);
const counts={child:0,adult:0,older:0}; for(const p of city.agents) counts[p.age]++;
assert.ok(counts.child>0&&counts.adult>0&&counts.older>0);
const anchored=simulate(configFromProfile(params,'medium',{population:600,days:5,seed:222,pathogenId:'influenza',regions:7,initialSeedRegion:3,initialSeedContext:'school',initialInfections:1}));
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
const householdOnly=simulate({...spatialCfg,days:20,seed:8181,beta:5,initialSeedAgentId:householdSeed.id,initialSeedRegion:householdSeed.region,initialSeedContext:'home',initialSeedPlaceId:householdSeed.visualHome,interventions:[
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
const zero=simulate({...base,beta:0,initialInfections:2,days:25});
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
const cases=simulate({...base,seed:7,symptomaticProbability:1,severeProbabilityByAge:{child:1,adult:1,older:1},beds:600,beta:0,initialInfections:20,days:40});
assert.ok(cases.summary.hospitalAdmissions>0,'severe symptomatic cases should reach hospital using empirical delay PMFs');
const summary=summarizeRuns([r1,r2]); assert.equal(summary.runs,2);
console.log('OUTBREAK v2 tests passed', {contacts:base.contactMatrices.home.length, admissions:cases.summary.hospitalAdmissions, alert:cases.summary.alertDay});