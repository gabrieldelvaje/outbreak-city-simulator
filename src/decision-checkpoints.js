const sumWindow=(daily,end,key,days=7)=>{
  let total=0;
  for(let i=Math.max(0,end-days+1);i<=end;i++)total+=Number(daily[i]?.[key]||0);
  return total;
};

const activeAt=d=>Number(d?.E||0)+Number(d?.I||0)+Number(d?.H||0);

const DEFAULT_ACTIONS=['school','remote','retail','leisure','lockdown','none'];

export function buildDecisionCheckpoints(result,{districtCount=7}={}){
  const daily=result?.daily||[];
  const events=result?.events||[];
  const population=Number(result?.summary?.population||0);
  const firstAlert=result?.summary?.alertDay;
  if(!daily.length)return [];

  const raw=[];
  const add=c=>{
    if(!Number.isInteger(c.day)||c.day<0||c.day>=daily.length)return;
    raw.push({...c,actions:c.actions??DEFAULT_ACTIONS});
  };

  if(Number.isInteger(firstAlert)){
    const d=daily[firstAlert];
    add({
      id:'hospital-alert',day:firstAlert,severity:1,anchor:true,
      title:'Epidemia detectada pelo hospital',
      message:`O sinal hospitalar ultrapassou o esperado. Admissões recentes: ${Math.round(d?.alertMetric||0)}; limite do cenário: ${Math.round(d?.alertThreshold||0)}.`,
      actions:['school','remote','retail','leisure','lockdown','none']
    });
  }

  // Four game-wave phases across the 360-day campaign.
  add({id:'wave-2',day:90,severity:2,anchor:true,title:'A 2ª onda está começando',message:'A pressão de transmissão voltou a subir no segundo ciclo anual. A primeira dose da vacina já pode ser iniciada neste cenário.',actions:['vaccine1','school','remote','retail','lockdown','none']});
  add({id:'dose-2-window',day:135,severity:2,anchor:true,title:'Janela para a 2ª dose',message:'A campanha pode avançar para a segunda dose entre pessoas que receberam a primeira e cumpriram o intervalo mínimo.',actions:['vaccine2','beds','remote','retail','none']});
  add({id:'wave-3',day:180,severity:2,anchor:true,title:'A 3ª onda está começando',message:'Uma nova fase de circulação começou. Reavalie restrições, capacidade hospitalar e cobertura vacinal.',actions:['vaccine1','vaccine2','beds','school','remote','retail','lockdown','none']});
  add({id:'dose-3-window',day:225,severity:2,anchor:true,title:'Dose de reforço para novas cepas',message:'O cenário libera uma terceira dose/booster com proteção ampliada contra formas graves e novas variantes simuladas.',actions:['vaccine2','vaccine3','beds','retail','none']});
  add({id:'wave-4',day:270,severity:3,anchor:true,title:'A 4ª onda está começando',message:'O último ciclo anual começou. A cidade entra na fase final com imunidade, reinfecções, vacinação e políticas acumuladas.',actions:['vaccine1','vaccine2','vaccine3','beds','school','remote','retail','lockdown','none']});

  if(Number.isInteger(firstAlert)){
    const minActive=Math.max(5,Math.round(population*.003));
    const minWeekly=Math.max(8,Math.round(population*.005));

    const regionFirstDay=Array(Math.max(1,districtCount)).fill(Infinity);
    for(const e of events){
      if(e?.type!=='infection'||!Number.isInteger(e.targetRegion))continue;
      if(e.targetRegion>=0&&e.targetRegion<regionFirstDay.length)regionFirstDay[e.targetRegion]=Math.min(regionFirstDay[e.targetRegion],e.day);
    }
    const wideTarget=Math.max(2,Math.ceil(districtCount*.75));
    for(let day=firstAlert+1;day<daily.length;day++){
      const reached=regionFirstDay.filter(x=>x<=day).length;
      if(reached>=wideTarget&&activeAt(daily[day])>=minActive){
        add({id:'citywide-spread',day,severity:2,title:'Disseminação ampla pela cidade',message:`A transmissão já alcançou ${reached} de ${districtCount} bairros e há ${activeAt(daily[day])} casos ativos.`,actions:['school','remote','retail','lockdown','none']});
        break;
      }
    }

    for(let day=Math.max(firstAlert+7,13);day<daily.length;day++){
      const current=sumWindow(daily,day,'newInfections',7);
      const previous=sumWindow(daily,day-7,'newInfections',7);
      if(previous>=3&&current>=minWeekly&&current>=previous*1.6){
        add({id:'transmission-acceleration',day,severity:2,title:'Transmissão acelerando',message:`Os novos episódios dos últimos 7 dias subiram de ${previous} para ${current}.`,actions:['remote','retail','school','lockdown','none']});
        break;
      }
    }

    let pressure=false;
    for(let day=firstAlert+1;day<daily.length;day++){
      const d=daily[day],capacity=Number(d?.bedCapacity||0);
      if(!(capacity>0))continue;
      const occupancy=Number(d?.bedsOccupied||0)/capacity;
      if(!pressure&&occupancy>=.50){
        add({id:'hospital-pressure',day,severity:3,title:'Hospital sob pressão',message:`A ocupação chegou a ${Math.round(occupancy*100)}% e já há ${Math.round(d?.unmetBedRequests||0)} solicitações sem atendimento neste dia.`,actions:['beds','lockdown','remote','none']});
        pressure=true;
      }
      if(occupancy>=.80||Number(d?.unmetBedRequests||0)>0){
        add({id:'hospital-critical',day,severity:4,critical:true,title:'Capacidade hospitalar crítica',message:`A ocupação chegou a ${Math.round(occupancy*100)}%. Casos graves sem leito passam a acumular risco adicional de morte no modelo.`,actions:['beds','lockdown','none']});
        break;
      }
    }
  }

  raw.sort((a,b)=>a.day-b.day||b.severity-a.severity);

  // Avoid alert fatigue: dynamic checkpoints need at least 21 days of spacing.
  const kept=[];
  for(const c of raw){
    const previous=kept.at(-1);
    if(!previous){kept.push(c);continue;}
    const gap=c.day-previous.day;
    if(gap<21&&!c.anchor&&!c.critical)continue;
    if(gap<21&&c.anchor&&!c.critical){
      kept.push({...c,day:Math.min(daily.length-1,previous.day+21)});
      continue;
    }
    kept.push(c);
  }
  return kept;
}

export function nextDecisionCheckpoint(checkpoints,acknowledged,targetDay){
  const ack=acknowledged instanceof Set?acknowledged:new Set(acknowledged||[]);
  return (checkpoints||[]).find(c=>!ack.has(c.id)&&c.day<=targetDay)||null;
}
