import {extendReferenceMap} from './map-extensions.js';
import {normalizeReferenceStreets} from './normalize-streets.js';

// These numbered markers have no residential footprint at their current position
// (or were flagged as incorrectly sited beside the bridge approaches). Do not
// move them onto the river, a street, an existing home or a public facility.
// Keep all remaining home IDs stable so their inspector labels do not change.
const UNSITED_HOME_IDS=[21,29,30,31,32,75,109,151,152,155,157,159];
function removeUnsitedHomes(root){
  const homes=root.querySelector('#homes-layer');
  if(!homes)return;
  for(const id of UNSITED_HOME_IDS){
    homes.querySelector(`[data-home="casa-${String(id).padStart(3,'0')}"]`)?.remove();
  }
}

// finishLandscape() draws the reference city synchronously after drawCity().
// The microtask runs once those layers exist. Bridges are separate interactive
// crossings, not homes or graph nodes; their three open/close controls remain.
export function drawCity(root){
  root.replaceChildren();
  queueMicrotask(()=>{
    extendReferenceMap(root);
    removeUnsitedHomes(root);
    void normalizeReferenceStreets(root);
  });
}
