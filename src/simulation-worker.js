import {configFromProfile,simulate} from '../simulator/engine.mjs';

const paramsPromise=fetch('../simulator/data/calibrated_parameters_v2.json').then(r=>{
  if(!r.ok)throw new Error('Não foi possível carregar os parâmetros epidemiológicos.');
  return r.json();
});

self.onmessage=async event=>{
  const message=event.data||{};
  if(message.type!=='run')return;
  const {token,setup}=message;
  try{
    const params=await paramsPromise;
    const overrides={
      population:setup.population,
      regions:setup.regions,
      days:setup.days,
      seed:setup.seed,
      pathogenId:setup.pathogenId,
      initialInfections:1,
      initialSeedRegion:setup.initialSeedRegion,
      initialSeedContext:setup.initialSeedContext,
      interventions:setup.interventions||[],
      parameterSetId:'calibrated_parameters_v2'
    };
    if(setup.vaccination)overrides.vaccination=setup.vaccination;
    const config=configFromProfile(params,setup.transmissibility,overrides);
    const full=simulate(config);
    const events=full.events.filter(e=>e.type==='infection'||e.type==='game_alert');
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
