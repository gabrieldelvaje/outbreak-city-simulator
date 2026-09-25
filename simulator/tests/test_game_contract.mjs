import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../../',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const game=fs.readFileSync(new URL('src/game.js',root),'utf8');
const worker=fs.readFileSync(new URL('src/simulation-worker.js',root),'utf8');
const engine=fs.readFileSync(new URL('simulator/engine.mjs',root),'utf8');

for(const id of [
  'game-population','game-population-number','game-prepare','game-disease',
  'game-transmissibility','game-focus','game-start','game-play','game-step',
  'game-reset','game-speed','game-message','game-alert','game-decisions',
  'city-map','inspector','inspector-title','inspector-content'
]){
  assert.match(html,new RegExp('id=["\\\']'+id+'["\\\']'),'index.html must expose #'+id);
}

for(const token of [
  "type:'prepare'","type:'run'","initialSeedAgentId","spatialModel",
  "householdId","visualHome","evening_outing"
]) assert.ok(game.includes(token)||worker.includes(token)||engine.includes(token),'game/worker/engine contract must contain '+token);

assert.ok(worker.includes("makeCity"),'worker must prepare the population before running the outbreak');
assert.ok(game.includes("Distribua a população"),'game must require population generation before patient-zero selection');
assert.ok(html.includes('data-action="none"'),'game must expose an explicit continue-without-action choice');
assert.ok(game.includes("state.phase='awaiting-decision'"),'timeline must enter a mandatory decision state at crisis checkpoints');
assert.ok(game.includes('buildDecisionCheckpoints'),'game must build escalating crisis checkpoints from simulation output');
assert.ok(game.includes('acknowledgedCheckpoints'),'game must remember which crisis checkpoints were already answered');
assert.ok(game.includes('acknowledgeDecisionCheckpoint'),'an explicit choice must acknowledge the current checkpoint before time can continue');
assert.ok(game.includes("if(!state.result||state.phase==='awaiting-decision')return"),'play control must be blocked while a decision is pending');

console.log('OUTBREAK game contract tests passed');
