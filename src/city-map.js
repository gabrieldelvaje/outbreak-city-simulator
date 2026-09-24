import {extendReferenceMap} from './map-extensions.js';

// The actual city and its interactive nodes are rendered in landscape.js.
// Wait until finishLandscape() has created #reference-city, then insert the
// non-interactive continuations BELOW the traced reference image.
export function drawCity(root) {
  root.replaceChildren();
  queueMicrotask(() => extendReferenceMap(root));
}
