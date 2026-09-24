import {readFileSync} from 'node:fs';
import {configFromProfile,simulate,summarizeRuns} from '../engine.mjs';
const profiles=JSON.parse(readFileSync(new URL('../data/hypothetical_profiles.json',import.meta.url),'utf8'));
const cfg=configFromProfile(profiles,'medium',{
  days:100,seed:456,beds:18,
  interventions:[
    {type:'school_closure',startDay:15,endDay:50,fraction:1},
    {type:'remote_work',startDay:20,endDay:60,fraction:.6},
    {type:'bridge_closure',startDay:25,endDay:40,fraction:1}
  ],
  vaccination:{enabled:true,availableDay:45,dosesPerDay:20,uptakeProbability:.7}
});
const result=simulate(cfg);
console.log('EXEMPLO SINTÉTICO — não é previsão:',JSON.stringify(result.summary,null,2));
console.log('Primeiros 10 dias:',JSON.stringify(result.daily.slice(0,10),null,2));
const draws=Array.from({length:10},(_,i)=>simulate({...cfg,seed:100+i}));
console.log('Comparação entre 10 sementes (percentis empíricos):',summarizeRuns(draws));
