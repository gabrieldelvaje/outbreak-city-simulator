import {configFromProfile,makeCity,simulate} from '../simulator/engine.mjs';

const paramsPromise=fetch('../simulator/data/calibrated_parameters_v2.json').then(r=>{
  if(!r.ok)throw new Error('Não foi possível carregar os parâmetros epidemiológicos.');
  return r.json();
});

function overridesFrom(setup){
  const overrides={
    population:setup.population,
    regions:setup.regions,
    days:setup.days??180,
    seed:setup.seed,
    pathogenId:setup.pathogenId,
    spatialModel:setup.spatialModel,
    initialInfections:setup.initialInfections??1,
    initialSeedRegion:setup.initialSeedRegion,
    initialSeedContext:setup.initialSeedContext,
    initialSeedAgentId:setup.initialSeedAgentId,
    initialSeedPlaceId:setup.initialSeedPlaceId,
    interventions:setup.interventions||[],
    parameterSetId:'calibrated_parameters_v2'
  };
  if(setup.vaccination)overrides.vaccination=setup.vaccination;
  return overrides;
}

function compactPopulation(city){
  return {
    persons:city.agents.map(p=>({
      id:p.id,age:p.age,ageYears:p.ageYears,region:p.region,
      visualHome:p.visualHome,householdId:p.householdId,
      school:p.school,schoolEnrolled:p.schoolEnrolled,
      work:p.work,workRegion:p.workRegion,working:p.working,
      market:p.market,community:p.community,hospital:p.hospital,
      healthWorker:p.healthWorker,teacher:p.teacher
    })),
    places:[...city.places.values()]
  };
}

self.onmessage=async event=>{
  const message=event.data||{};
  if(message.type!=='prepare'&&message.type!=='run')return;
  const {token,setup}=message;
  try{
    const params=await paramsPromise;
    const config=configFromProfile(params,setup.transmissibility,overridesFrom(setup));
    if(message.type==='prepare'){
      const city=makeCity(config);
      self.postMessage({
        type:'prepared',
        token,
        population:compactPopulation(city),
        modelVersion:'2.0.0-data-informed'
      });
      return;
    }
    const full=simulate(config);
    const events=full.events.filter(e=>
      e.type==='infection'||e.type==='game_alert'||e.type==='hospital_admission'||
      e.type==='reported_case'||e.type==='recovery'||e.type==='death'
    );
    self.postMessage({
      type:'result',
      token,
      result:{
        modelVersion:full.modelVersion,
        seed:full.seed,
        parameterSetId:full.parameterSetId,
        city:full.city,
        daily:full.daily,
        events,
        summary:full.summary
      }
    });
  }catch(error){
    self.postMessage({type:'error',token,message:error?.message||String(error)});
  }
};
