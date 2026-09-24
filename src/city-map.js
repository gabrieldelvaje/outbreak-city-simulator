// Compatibility shim while the page migrates from the old procedural renderer.
// The full reference-based SVG map and interactive layers are rendered by
// finishLandscape() in landscape.js. Do not import outdated city-data exports.
export function drawCity(root) {
  root.replaceChildren();
}
