import assert from 'node:assert/strict';
import {buildDecisionCheckpoints,nextDecisionCheckpoint} from '../../src/decision-checkpoints.js';

const daily=Array.from({length:360},(_,day)=>({
  day,S:1000,E:0,I:0,H:0,R:0,D:0,
  newInfections:day<20?2:day<45?15:day<75?4:day<120?12:day<165?4:day<210?10:day<255?3:day<315?9:3,
  bedCapacity:20,
  bedsOccupied:day<50?2:day<70?11:day<76?17:6,
  unmetBedRequests:day>=72&&day<76?2:0,
  alertMetric:day===20?8:0,
  alertThreshold:day===20?5:0
}));
for(let day=0;day<daily.length;day++){
  const active=day<20?4:day<80?35:day<120?10:day<165?30:day<210?12:day<255?25:day<315?20:8;
  daily[day].I=active;
  daily[day].S=1000-active-daily[day].H;
}
const events=[];
for(let region=0;region<7;region++)events.push({type:'infection',day:25+region*4,targetRegion:region});

const result={daily,events,summary:{population:1000,alertDay:20}};
const checkpoints=buildDecisionCheckpoints(result,{districtCount:7});
const ids=new Set(checkpoints.map(x=>x.id));

assert.ok(ids.has('hospital-alert'),'initial hospital detection must be a decision checkpoint');
assert.ok(ids.has('wave-2'),'second-wave start must be a decision checkpoint');
assert.ok(ids.has('dose-2-window'),'second-dose window must be scheduled');
assert.ok(ids.has('wave-3'),'third-wave start must be a decision checkpoint');
assert.ok(ids.has('dose-3-window'),'third-dose/booster window must be scheduled');
assert.ok(ids.has('wave-4'),'fourth-wave start must be a decision checkpoint');
assert.ok(ids.has('hospital-critical'),'critical capacity must interrupt the timeline');
assert.ok(checkpoints.every((c,i,a)=>i===0||c.day>=a[i-1].day),'checkpoints must be chronological');

const first=nextDecisionCheckpoint(checkpoints,new Set(),359);
assert.equal(first.id,'hospital-alert','the earliest unanswered checkpoint must block first');

const acknowledged=new Set(['hospital-alert']);
const afterAlert=nextDecisionCheckpoint(checkpoints,acknowledged,359);
assert.ok(afterAlert&&afterAlert.id!=='hospital-alert','acknowledged checkpoints must not block again');

const wave2=checkpoints.find(c=>c.id==='wave-2');
assert.ok(wave2.actions.includes('vaccine1'),'first dose must become a policy option in wave 2');
const dose2=checkpoints.find(c=>c.id==='dose-2-window');
assert.ok(dose2.actions.includes('vaccine2'),'second dose must have a later decision window');
const dose3=checkpoints.find(c=>c.id==='dose-3-window');
assert.ok(dose3.actions.includes('vaccine3'),'third dose must have a later booster window');

console.log('OUTBREAK decision checkpoint tests passed',checkpoints.map(c=>[c.day,c.id]));
