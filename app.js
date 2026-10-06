(() => {
  "use strict";

  const PIRACICABA_VIEW = {
    center: [-47.6483, -22.7255],
    zoom: 15.05,
    pitch: 58,
    bearing: -22
  };

  const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
  const BUILDINGS_LAYER_ID = "piracicaba-buildings-3d";

  const status = document.getElementById("map-status");
  const viewToggle = document.getElementById("view-toggle");
  const resetView = document.getElementById("reset-view");

  let is3D = true;
  let buildingsReady = false;

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  if (!window.maplibregl) {
    setStatus("Não foi possível carregar o motor do mapa.");
    return;
  }

  const map = new maplibregl.Map({
    container: "map",
    style: STYLE_URL,
    center: PIRACICABA_VIEW.center,
    zoom: PIRACICABA_VIEW.zoom,
    pitch: PIRACICABA_VIEW.pitch,
    bearing: PIRACICABA_VIEW.bearing,
    maxPitch: 75,
    minZoom: 10.5,
    maxZoom: 20,
    antialias: true,
    hash: true,
    attributionControl: false
  });

  map.addControl(
    new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true
    }),
    "bottom-right"
  );

  map.addControl(
    new maplibregl.AttributionControl({
      compact: true,
      customAttribution: "Piracicaba 3D · V1"
    }),
    "bottom-right"
  );

  const buildingHeight = [
    "interpolate",
    ["linear"],
    ["zoom"],
    13,
    0,
    13.8,
    ["coalesce", ["get", "render_height"], 6]
  ];

  const buildingBase = ["coalesce", ["get", "render_min_height"], 0];

  function findVectorSourceId() {
    const sources = map.getStyle()?.sources || {};
    const candidate = Object.entries(sources).find(([, source]) => source && source.type === "vector");
    return candidate ? candidate[0] : null;
  }

  function findFirstLabelLayerId() {
    const layers = map.getStyle()?.layers || [];
    return layers.find(
      (layer) =>
        layer.type === "symbol" &&
        layer.layout &&
        layer.layout["text-field"]
    )?.id;
  }

  function addBuildings() {
    if (map.getLayer(BUILDINGS_LAYER_ID)) {
      buildingsReady = true;
      return true;
    }

    const sourceId = findVectorSourceId();
    if (!sourceId) return false;

    try {
      map.addLayer(
        {
          id: BUILDINGS_LAYER_ID,
          source: sourceId,
          "source-layer": "building",
          type: "fill-extrusion",
          minzoom: 13,
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13,
              "#dedfdb",
              15.5,
              "#ced0cc",
              18,
              "#bfc2bd"
            ],
            "fill-extrusion-height": buildingHeight,
            "fill-extrusion-base": buildingBase,
            "fill-extrusion-opacity": 0.92,
            "fill-extrusion-vertical-gradient": true
          }
        },
        findFirstLabelLayerId()
      );
      buildingsReady = true;
      return true;
    } catch (error) {
      console.warn("Camada 3D não pôde ser criada.", error);
      return false;
    }
  }

  function set3D(active, animate = true) {
    is3D = active;
    viewToggle?.classList.toggle("is-active", active);
    viewToggle?.setAttribute("aria-pressed", String(active));

    if (buildingsReady && map.getLayer(BUILDINGS_LAYER_ID)) {
      map.setLayoutProperty(
        BUILDINGS_LAYER_ID,
        "visibility",
        active ? "visible" : "none"
      );
    }

    const motion = {
      pitch: active ? PIRACICABA_VIEW.pitch : 0,
      bearing: active ? PIRACICABA_VIEW.bearing : 0,
      duration: animate ? 650 : 0
    };

    if (animate) {
      map.easeTo(motion);
    } else {
      map.jumpTo(motion);
    }

    setStatus(active ? "Piracicaba · visualização 3D" : "Piracicaba · visualização 2D");
  }

  map.on("load", () => {
    const ok = addBuildings();
    setStatus(ok ? "Piracicaba · visualização 3D" : "Mapa carregado · edifícios 3D indisponíveis");
    set3D(true, false);
  });

  map.on("error", (event) => {
    if (event?.error) console.warn(event.error);
    setStatus("Mapa carregado com limitações de dados.");
  });

  viewToggle?.addEventListener("click", () => {
    set3D(!is3D, true);
  });

  resetView?.addEventListener("click", () => {
    map.easeTo({
      ...PIRACICABA_VIEW,
      duration: 900,
      essential: true
    });

    if (!is3D) {
      is3D = true;
      viewToggle.classList.add("is-active");
      viewToggle.setAttribute("aria-pressed", "true");
      if (buildingsReady && map.getLayer(BUILDINGS_LAYER_ID)) {
        map.setLayoutProperty(BUILDINGS_LAYER_ID, "visibility", "visible");
      }
    }
    setStatus("Piracicaba · centro");
  });

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (reducedMotion?.matches) {
    map.setMaxPitch(70);
  }
})();
