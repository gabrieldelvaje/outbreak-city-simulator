import {readFileSync} from 'node:fs';
import {configFromProfile,simulate,summarizeRuns} from '../engine.mjs';

const parameters=JSON.parse(
  readFileSync(new URL('../data/calibrated_parameters_v2.json',import.meta.url),'utf8')
);

const cfg=configFromProfile(parameters,'medium',{
  population:1200,
  pathogenId:'influenza',
  days:120,
  seed:456,
  interventions:[
    {type:'school_closure',startDay:20,endDay:55,fraction:1},
    {type:'remote_work',startDay:25,endDay:65,fraction:.6},
    {type:'retail_limit',startDay:30,endDay:50,fraction:.5}
  ],
  vaccination:{
    enabled:true,
    availableDay:60,
    dosesPerDay:40,
    uptakeProbability:.7
  }
});

const result=simulate(cfg);
console.log('EXEMPLO SINTÉTICO V2 — não é previsão:',JSON.stringify(result.summary,null,2));
console.log('Primeiros 10 dias:',JSON.stringify(result.daily.slice(0,10),null,2));

const draws=Array.from({length:5},(_,i)=>simulate({...cfg,seed:100+i}));
console.log('Comparação entre 5 sementes:',summarizeRuns(draws));
