(() => {
  "use strict";

  const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
  const IBGE_GEOJSON =
    "https://servicodados.ibge.gov.br/api/v3/malhas/municipios/3538709?formato=application/vnd.geo+json&qualidade=minima";

  // Limites aproximados do município, derivados do mapa municipal do IBGE.
  // São usados como fallback caso a API de malhas esteja temporariamente indisponível.
  const FALLBACK_BOUNDS = [
    [-48.039161, -22.843797],
    [-47.479264, -22.507858]
  ];

  const status = document.getElementById("map-status");
  const resetView = document.getElementById("reset-view");

  let map = null;
  let piracicabaBounds = FALLBACK_BOUNDS;

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  function getPadding() {
    return window.matchMedia("(max-width: 720px)").matches
      ? { top: 95, right: 24, bottom: 72, left: 24 }
      : { top: 88, right: 52, bottom: 52, left: 52 };
  }

  function expandBounds(bounds, factor = 0.015) {
    const [[west, south], [east, north]] = bounds;
    const dx = (east - west) * factor;
    const dy = (north - south) * factor;

    return [
      [west - dx, south - dy],
      [east + dx, north + dy]
    ];
  }

  function boundsFromGeoJSON(geojson) {
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;

    const walk = (coords) => {
      if (!Array.isArray(coords)) return;

      if (
        coords.length >= 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
      ) {
        const [lng, lat] = coords;
        west = Math.min(west, lng);
        south = Math.min(south, lat);
        east = Math.max(east, lng);
        north = Math.max(north, lat);
        return;
      }

      coords.forEach(walk);
    };

    const geometries = [];

    if (geojson?.type === "FeatureCollection") {
      geojson.features?.forEach((feature) => {
        if (feature?.geometry) geometries.push(feature.geometry);
      });
    } else if (geojson?.type === "Feature") {
      if (geojson.geometry) geometries.push(geojson.geometry);
    } else if (geojson?.coordinates) {
      geometries.push(geojson);
    }

    geometries.forEach((geometry) => walk(geometry.coordinates));

    if (![west, south, east, north].every(Number.isFinite)) {
      return FALLBACK_BOUNDS;
    }

    return [
      [west, south],
      [east, north]
    ];
  }

  function applyLockedView(animate = false) {
    if (!map) return;

    const padding = getPadding();
    const camera = map.cameraForBounds(piracicabaBounds, {
      padding,
      bearing: 0,
      pitch: 0
    });

    if (!camera || !Number.isFinite(camera.zoom)) return;

    // Impede afastar mais do que o necessário para ver Piracicaba inteira.
    map.setMinZoom(camera.zoom);

    // Impede arrastar o mapa para fora da área do município.
    map.setMaxBounds(expandBounds(piracicabaBounds));

    const target = {
      center: camera.center,
      zoom: camera.zoom,
      bearing: 0,
      pitch: 0,
      duration: animate ? 650 : 0,
      essential: true
    };

    if (animate) {
      map.easeTo(target);
    } else {
      map.jumpTo(target);
    }
  }

  async function loadMunicipalBoundary() {
    try {
      const response = await fetch(IBGE_GEOJSON, {
        headers: { Accept: "application/geo+json, application/json" }
      });

      if (!response.ok) throw new Error(`IBGE: HTTP ${response.status}`);

      const geojson = await response.json();
      piracicabaBounds = boundsFromGeoJSON(geojson);

      if (!map.getSource("piracicaba-boundary")) {
        map.addSource("piracicaba-boundary", {
          type: "geojson",
          data: geojson
        });

        map.addLayer({
          id: "piracicaba-boundary-fill",
          type: "fill",
          source: "piracicaba-boundary",
          paint: {
            "fill-color": "#0736FE",
            "fill-opacity": 0.025
          }
        });

        map.addLayer({
          id: "piracicaba-boundary-line",
          type: "line",
          source: "piracicaba-boundary",
          paint: {
            "line-color": "#0736FE",
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9,
              1.2,
              13,
              2
            ],
            "line-opacity": 0.85
          }
        });
      }

      applyLockedView(false);
      setStatus("Piracicaba · limite municipal IBGE");
    } catch (error) {
      console.warn("Não foi possível carregar a malha oficial do IBGE.", error);
      piracicabaBounds = FALLBACK_BOUNDS;
      applyLockedView(false);
      setStatus("Piracicaba · limite municipal");
    }
  }

  async function startMap() {
    let maplibregl;

    try {
      maplibregl = await import(
        "https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs"
      );
    } catch (error) {
      console.error("Falha ao carregar MapLibre.", error);
      setStatus("Não foi possível carregar o mapa.");
      return;
    }

    map = new maplibregl.Map({
      container: "map",
      style: STYLE_URL,
      center: [-47.66, -22.73],
      zoom: 10.2,
      pitch: 0,
      bearing: 0,
      minZoom: 9,
      maxZoom: 19,
      antialias: true,
      attributionControl: false
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        showZoom: true
      }),
      "bottom-right"
    );

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "Piracicaba · V1"
      }),
      "bottom-right"
    );

    map.on("load", async () => {
      await loadMunicipalBoundary();
    });

    map.on("error", (event) => {
      if (event?.error) console.warn(event.error);
    });

    resetView?.addEventListener("click", () => {
      applyLockedView(true);
      setStatus("Piracicaba · município enquadrado");
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        map.resize();
        const oldCenter = map.getCenter();
        const oldZoom = map.getZoom();

        const camera = map.cameraForBounds(piracicabaBounds, {
          padding: getPadding(),
          bearing: 0,
          pitch: 0
        });

        if (!camera || !Number.isFinite(camera.zoom)) return;

        map.setMinZoom(camera.zoom);

        if (oldZoom < camera.zoom) {
          map.jumpTo({
            center: camera.center,
            zoom: camera.zoom,
            pitch: 0,
            bearing: 0
          });
        } else {
          map.setCenter(oldCenter);
        }
      }, 160);
    });
  }

  startMap();
})();
