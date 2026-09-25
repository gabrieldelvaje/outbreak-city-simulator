import assert from 'node:assert/strict';
import {buildDecisionCheckpoints,nextDecisionCheckpoint} from '../../src/decision-checkpoints.js';

const daily=Array.from({length:90},(_,day)=>({
  day,S:1000,E:0,I:0,H:0,R:0,D:0,
  newInfections:day<10?1:day<20?8:day<28?18:day<45?2:day<55?0:day<70?12:3,
  bedCapacity:20,bedsOccupied:day<22?2:day<30?11:day<34?17:6,
  alertMetric:day===10?8:0,alertThreshold:day===10?5:0
}));
for(let day=0;day<daily.length;day++){
  const active=day<10?3:day<45?30:day<55?5:day<72?35:10;
  daily[day].I=active;
  daily[day].S=1000-active-daily[day].H;
}
const events=[];
for(let region=0;region<7;region++){
  events.push({type:'infection',day:10+region,targetRegion:region});
}
const result={daily,events,summary:{population:1000,alertDay:10}};
const checkpoints=buildDecisionCheckpoints(result,{districtCount:7});
const ids=new Set(checkpoints.map(x=>x.id));

assert.ok(ids.has('hospital-alert'),'initial hospital alert must be a decision checkpoint');
assert.ok(ids.has('citywide-spread'),'wide geographic spread must create a checkpoint');
assert.ok(ids.has('transmission-acceleration'),'rapid weekly growth must create a checkpoint');
assert.ok(ids.has('hospital-pressure'),'50%+ bed occupancy must create a pressure checkpoint');
assert.ok(ids.has('hospital-critical'),'80%+ bed occupancy must create a critical checkpoint');
assert.ok([...ids].some(x=>x.startsWith('resurgence-')),'a fall followed by renewed growth must create a resurgence checkpoint');

const acknowledged=new Set(['hospital-alert']);
const next=nextDecisionCheckpoint(checkpoints,acknowledged,40);
assert.ok(next&&next.id!=='hospital-alert','acknowledged checkpoint must not block the timeline again');

const first=nextDecisionCheckpoint(checkpoints,new Set(),90);
assert.equal(first.id,'hospital-alert','the earliest pending checkpoint must stop the timeline first');

console.log('OUTBREAK decision checkpoint tests passed',checkpoints.map(c=>[c.day,c.id]));
