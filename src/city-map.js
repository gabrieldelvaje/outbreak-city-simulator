import {extendReferenceMap} from './map-extensions.js';
import {normalizeReferenceStreets} from './normalize-streets.js';

// finishLandscape() draws the reference city synchronously after drawCity().
// Insert the non-interactive extensions below it, then normalize the original
// thin streets without replacing their geometry or changing interactive nodes.
export function drawCity(root) {
  root.replaceChildren();
  queueMicrotask(() => {
    extendReferenceMap(root);
    void normalizeReferenceStreets(root);
  });
}
