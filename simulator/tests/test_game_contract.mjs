import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../../',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const game=fs.readFileSync(new URL('src/game.js',root),'utf8');
const worker=fs.readFileSync(new URL('src/simulation-worker.js',root),'utf8');
const engine=fs.readFileSync(new URL('simulator/engine.mjs',root),'utf8');

for(const id of [
  'game-city-name','game-population','game-population-number','game-prepare','game-disease',
  'game-transmissibility','game-focus','game-start','game-play','game-step',
  'game-reset','game-speed','game-message','game-alert','game-decisions',
  'setup-overlay','epicenter-overlay','decision-overlay','decision-title','decision-message','game-sidebar',
  'final-report-overlay','final-report-title','final-report-summary','final-report-comparison','final-report-decisions',
  'city-map','inspector','inspector-title','inspector-content'
]){
  assert.match(html,new RegExp('id=["\\\']'+id+'["\\\']'),'index.html must expose #'+id);
}

for(const token of [
  "type:'prepare'","type:'run'","initialSeedAgentId","spatialModel",
  "householdId","visualHome","evening_outing"
]) assert.ok(game.includes(token)||worker.includes(token)||engine.includes(token),'game/worker/engine contract must contain '+token);

assert.ok(worker.includes("makeCity"),'worker must prepare the population before running the outbreak');
assert.ok(html.includes('max="20000"'),'playable population control must cap the city at 20,000 people');
assert.ok(game.includes('days:360'),'playable campaign must cover 360 days');
assert.ok(game.includes("transmissibility:'high'"),'playable campaign must always use high transmissibility');
assert.ok(html.includes('Bem-vindo à sua cidade'),'configuration must start in a map overlay rather than the sidebar');
assert.ok(game.includes("setupOverlay.hidden=true"),'setup overlay must disappear after population distribution');
assert.ok(game.includes("sidebar.classList.remove('is-hidden')"),'HUD sidebar must open only when the outbreak starts');
assert.ok(html.includes('data-action="none"'),'game must expose an explicit continue-without-action choice');
assert.ok(html.includes('data-action="beds"'),'crisis windows must allow hospital capacity expansion');
assert.ok(html.includes('data-action="vaccine1"')&&html.includes('data-action="vaccine2"')&&html.includes('data-action="vaccine3"'),'game must expose staged vaccine doses');
assert.ok(game.includes('vaccinationCampaigns'),'game must preserve staged vaccine campaigns across recalculations');
assert.ok(worker.includes("message.type==='compare'"),'worker must support a no-action counterfactual comparison');
assert.ok(worker.includes('interventions:[]')&&worker.includes('vaccinationCampaigns:[]'),'counterfactual must remove interventions and vaccination');
assert.ok(game.includes('requestFinalReport')&&game.includes('renderFinalReport'),'game must request and render a final counterfactual report');
assert.ok(game.includes("comparisonRow('Pessoas infectadas ao menos uma vez'"),'final report must compare dissemination as well as severity');
assert.ok(game.includes("state.phase='awaiting-decision'"),'timeline must enter a mandatory decision state at crisis checkpoints');
assert.ok(game.includes('buildDecisionCheckpoints'),'game must build escalating crisis checkpoints from simulation output');
assert.ok(game.includes('acknowledgedCheckpoints'),'game must remember which crisis checkpoints were already answered');
assert.ok(game.includes('acknowledgeDecisionCheckpoint'),'an explicit choice must acknowledge the current checkpoint before time can continue');
assert.ok(game.includes("if(!state.result||state.phase==='awaiting-decision')return"),'play control must be blocked while a decision is pending');

console.log('OUTBREAK game contract tests passed');
