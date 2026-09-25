const sumWindow=(daily,end,key,days=7)=>{
  let total=0;
  for(let i=Math.max(0,end-days+1);i<=end;i++)total+=Number(daily[i]?.[key]||0);
  return total;
};

const activeAt=d=>Number(d?.E||0)+Number(d?.I||0)+Number(d?.H||0);

export function buildDecisionCheckpoints(result,{districtCount=7}={}){
  const daily=result?.daily||[];
  const events=result?.events||[];
  const population=Number(result?.summary?.population||0);
  const firstAlert=result?.summary?.alertDay;
  if(!daily.length||!Number.isInteger(firstAlert))return [];

  const raw=[];
  const add=(checkpoint)=>{
    if(!Number.isInteger(checkpoint.day)||checkpoint.day<0||checkpoint.day>=daily.length)return;
    raw.push(checkpoint);
  };

  const alertDay=daily[firstAlert];
  add({
    id:'hospital-alert',
    day:firstAlert,
    severity:1,
    title:'Hospital detectou a epidemia',
    message:`O sinal hospitalar ultrapassou o esperado. Admissões recentes: ${Math.round(alertDay?.alertMetric||0)}; limite do cenário: ${Math.round(alertDay?.alertThreshold||0)}.`
  });

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
      add({
        id:'citywide-spread',
        day,
        severity:2,
        title:'Disseminação ampla pela cidade',
        message:`A transmissão já alcançou ${reached} de ${districtCount} bairros e há ${activeAt(daily[day])} casos ativos no cenário.`
      });
      break;
    }
  }

  for(let day=Math.max(firstAlert+4,13);day<daily.length;day++){
    const current=sumWindow(daily,day,'newInfections',7);
    const previous=sumWindow(daily,day-7,'newInfections',7);
    if(previous>=3&&current>=minWeekly&&current>=previous*1.6){
      add({
        id:'transmission-acceleration',
        day,
        severity:2,
        title:'Transmissão acelerando',
        message:`Os novos episódios dos últimos 7 dias subiram de ${previous} para ${current} em relação à semana anterior.`
      });
      break;
    }
  }

  let pressureAdded=false;
  for(let day=firstAlert+1;day<daily.length;day++){
    const d=daily[day],capacity=Number(d?.bedCapacity||0);
    if(!(capacity>0))continue;
    const occupancy=Number(d?.bedsOccupied||0)/capacity;
    if(!pressureAdded&&occupancy>=.50){
      add({
        id:'hospital-pressure',
        day,
        severity:3,
        title:'Hospital sob pressão',
        message:`A ocupação chegou a ${Math.round(occupancy*100)}% da capacidade hospitalar disponível no cenário.`
      });
      pressureAdded=true;
    }
    if(occupancy>=.80){
      add({
        id:'hospital-critical',
        day,
        severity:4,
        title:'Capacidade hospitalar crítica',
        message:`A ocupação chegou a ${Math.round(occupancy*100)}%. O sistema está próximo do limite configurado.`
      });
      break;
    }
  }

  let peak=0,peakDay=firstAlert,dropped=false,wave=2,lastResurgence=-999;
  for(let day=Math.max(firstAlert,6);day<daily.length;day++){
    const weekly=sumWindow(daily,day,'newInfections',7);
    if(!dropped&&weekly>peak){peak=weekly;peakDay=day;}
    if(peak>=minWeekly&&day>=peakDay+7&&weekly<=peak*.35)dropped=true;
    if(!dropped||day<peakDay+14||day-lastResurgence<14)continue;
    const previous=sumWindow(daily,day-7,'newInfections',7);
    if(previous>=2&&weekly>=minWeekly&&weekly>=previous*1.5){
      add({
        id:`resurgence-${wave}`,
        day,
        severity:3,
        title:`Nova onda em formação`,
        message:`Depois de uma queda importante, os episódios voltaram a crescer: ${previous} na semana anterior e ${weekly} nos últimos 7 dias.`
      });
      wave++;
      lastResurgence=day;
      peak=weekly;peakDay=day;dropped=false;
      if(wave>4)break;
    }
  }

  raw.sort((a,b)=>a.day-b.day||b.severity-a.severity);
  const seen=new Set();
  return raw.filter(c=>{
    if(seen.has(c.id))return false;
    seen.add(c.id);
    return true;
  });
}

export function nextDecisionCheckpoint(checkpoints,acknowledged,targetDay){
  const ack=acknowledged instanceof Set?acknowledged:new Set(acknowledged||[]);
  return (checkpoints||[]).find(c=>!ack.has(c.id)&&c.day<=targetDay)||null;
}
