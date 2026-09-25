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
]) assert.ok(game.includes(token)||worker.includes(token),'game/worker contract must contain '+token);

assert.ok(worker.includes("makeCity"),'worker must prepare the population before running the outbreak');
assert.ok(game.includes("Distribua a população"),'game must require population generation before patient-zero selection');

console.log('OUTBREAK game contract tests passed');
