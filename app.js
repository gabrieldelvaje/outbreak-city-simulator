(() => {
  "use strict";

  const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
  const OVERTURE_BUILDINGS =
    "https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/2026-09-23.1/buildings.pmtiles";

  // Enquadramento do perímetro urbano de Piracicaba.
  const CENTRAL_BOUNDS = [
    [-47.7420, -22.8120],
    [-47.5580, -22.6220]
  ];

  const CENTRAL_VIEW = {
    center: [-47.6520, -22.7240],
    bearing2D: 0,
    bearing3D: -22,
    pitch2D: 0,
    pitch3D: 58
  };

  const BUILDING_SOURCE = "overture-buildings";
  const BUILDING_LAYER = "overture-buildings-3d";

  const status = document.getElementById("map-status");
  const viewToggle = document.getElementById("view-toggle");
  const resetView = document.getElementById("reset-view");

  let map = null;
  let is3D = false;
  let minCentralZoom = 11.5;
  let overtureReady = false;

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  function getPadding() {
    return window.matchMedia("(max-width: 720px)").matches
      ? { top: 82, right: 24, bottom: 70, left: 24 }
      : { top: 70, right: 54, bottom: 50, left: 54 };
  }

  function expandBounds(bounds, factor = 0.32) {
    const [[west, south], [east, north]] = bounds;
    const dx = (east - west) * factor;
    const dy = (north - south) * factor;

    return [
      [west - dx, south - dy],
      [east + dx, north + dy]
    ];
  }

  function fitCentralView(animate = false) {
    if (!map) return;

    const camera = map.cameraForBounds(CENTRAL_BOUNDS, {
      padding: getPadding(),
      bearing: 0,
      pitch: 0
    });

    if (!camera || !Number.isFinite(camera.zoom)) return;

    // Permite afastar aproximadamente 1 nível além do enquadramento urbano.
    minCentralZoom = Math.max(camera.zoom - 1, 10.25);
    map.setMinZoom(minCentralZoom);
    map.setMaxBounds(expandBounds(CENTRAL_BOUNDS));

    const target = {
      center: camera.center,
      zoom: camera.zoom,
      pitch: is3D ? CENTRAL_VIEW.pitch3D : CENTRAL_VIEW.pitch2D,
      bearing: is3D ? CENTRAL_VIEW.bearing3D : CENTRAL_VIEW.bearing2D,
      duration: animate ? 850 : 0,
      essential: true
    };

    if (animate) map.easeTo(target);
    else map.jumpTo(target);
  }

  function lightenRoads() {
    const layers = map.getStyle()?.layers || [];

    layers.forEach((layer) => {
      if (layer.type !== "line") return;

      const id = (layer.id || "").toLowerCase();
      const isRoad =
        /(road|street|transportation|highway|motorway|trunk|primary|secondary|tertiary|minor|service)/.test(id) &&
        !/(rail|transit|ferry|water|boundary)/.test(id);

      if (!isRoad) return;

      try {
        const isCasing = /(casing|outline|border)/.test(id);
        map.setPaintProperty(
          layer.id,
          "line-color",
          isCasing ? "#dfe1de" : "#fafaf7"
        );

        if (map.getPaintProperty(layer.id, "line-opacity") !== undefined) {
          map.setPaintProperty(
            layer.id,
            "line-opacity",
            isCasing ? 0.76 : 0.96
          );
        }
      } catch (_) {}
    });
  }

  function hideBaseStyleExtrusions() {
    const layers = map.getStyle()?.layers || [];
    layers.forEach((layer) => {
      if (layer.type !== "fill-extrusion") return;
      try {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } catch (_) {}
    });
  }

  function firstLabelLayerId() {
    const layers = map.getStyle()?.layers || [];
    return layers.find(
      (layer) =>
        layer.type === "symbol" &&
        layer.layout &&
        layer.layout["text-field"]
    )?.id;
  }

  function addOvertureBuildings() {
    if (!map || map.getSource(BUILDING_SOURCE)) {
      overtureReady = Boolean(map?.getSource(BUILDING_SOURCE));
      return;
    }

    try {
      map.addSource(BUILDING_SOURCE, {
        type: "vector",
        url: `pmtiles://${OVERTURE_BUILDINGS}`,
        attribution: "Buildings © Overture Maps Foundation"
      });

      const heightExpression = [
        "case",
        ["has", "height"],
        ["max", ["to-number", ["get", "height"]], 3],
        ["has", "num_floors"],
        ["max", ["*", ["to-number", ["get", "num_floors"]], 3], 3],
        5
      ];

      const baseExpression = [
        "case",
        ["has", "min_height"],
        ["max", ["to-number", ["get", "min_height"]], 0],
        0
      ];

      map.addLayer(
        {
          id: BUILDING_LAYER,
          type: "fill-extrusion",
          source: BUILDING_SOURCE,
          "source-layer": "building",
          minzoom: 11.5,
          filter: [
            "any",
            ["!", ["has", "is_underground"]],
            ["!=", ["get", "is_underground"], true]
          ],
          layout: {
            visibility: "none"
          },
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["zoom"],
              11.5,
              "#dcddd9",
              15,
              "#d0d2ce",
              18,
              "#c3c6c1"
            ],
            "fill-extrusion-height": heightExpression,
            "fill-extrusion-base": baseExpression,
            "fill-extrusion-opacity": 0.9,
            "fill-extrusion-vertical-gradient": true
          }
        },
        firstLabelLayerId()
      );

      overtureReady = true;
    } catch (error) {
      overtureReady = false;
      console.warn("Não foi possível adicionar os edifícios do Overture.", error);
    }
  }

  function setBuildingVisibility(active) {
    if (!overtureReady || !map?.getLayer(BUILDING_LAYER)) return;

    map.setLayoutProperty(
      BUILDING_LAYER,
      "visibility",
      active ? "visible" : "none"
    );
  }

  function set3D(active, animate = true) {
    if (!map) return;

    is3D = active;
    viewToggle?.classList.toggle("is-active", active);
    viewToggle?.setAttribute("aria-pressed", String(active));
    setBuildingVisibility(active);

    map.easeTo({
      pitch: active ? CENTRAL_VIEW.pitch3D : CENTRAL_VIEW.pitch2D,
      bearing: active ? CENTRAL_VIEW.bearing3D : CENTRAL_VIEW.bearing2D,
      duration: animate ? 950 : 0,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      essential: true
    });

    if (active) {
      setStatus(
        overtureReady
          ? "Piracicaba urbana · edifícios Overture"
          : "Piracicaba urbana · perspectiva 3D"
      );
    } else {
      setStatus("Piracicaba urbana · mapa plano");
    }
  }

  async function startMap() {
    let maplibregl;
    let Protocol;

    try {
      const modules = await Promise.all([
        import("https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs"),
        import("https://cdn.jsdelivr.net/npm/pmtiles@4.5.0/+esm")
      ]);

      maplibregl = modules[0];
      Protocol = modules[1].Protocol;

      const protocol = new Protocol();
      maplibregl.addProtocol("pmtiles", protocol.tile);
    } catch (error) {
      console.error("Falha ao carregar o motor cartográfico.", error);
      setStatus("Não foi possível carregar o mapa.");
      return;
    }

    map = new maplibregl.Map({
      container: "map",
      style: STYLE_URL,
      center: CENTRAL_VIEW.center,
      zoom: 12.3,
      pitch: 0,
      bearing: 0,
      minZoom: 10.25,
      maxZoom: 19,
      maxPitch: 64,
      antialias: true,
      attributionControl: false
    });

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
        customAttribution: "Piracicaba · Overture · V1"
      }),
      "bottom-right"
    );

    map.on("load", () => {
      lightenRoads();
      hideBaseStyleExtrusions();
      addOvertureBuildings();
      fitCentralView(false);
      setStatus("Piracicaba urbana · mapa plano");
    });

    map.on("error", (event) => {
      if (event?.error) console.warn(event.error);
    });

    viewToggle?.addEventListener("click", () => {
      set3D(!is3D, true);
    });

    resetView?.addEventListener("click", () => {
      fitCentralView(true);
      setBuildingVisibility(is3D);
      setStatus(
        is3D
          ? "Piracicaba urbana · edifícios Overture"
          : "Piracicaba urbana · mapa plano"
      );
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        map.resize();

        const camera = map.cameraForBounds(CENTRAL_BOUNDS, {
          padding: getPadding(),
          bearing: 0,
          pitch: 0
        });

        if (!camera || !Number.isFinite(camera.zoom)) return;

        minCentralZoom = Math.max(camera.zoom - 1, 10.25);
        map.setMinZoom(minCentralZoom);

        if (map.getZoom() < minCentralZoom) {
          map.jumpTo({
            center: camera.center,
            zoom: minCentralZoom,
            pitch: is3D ? CENTRAL_VIEW.pitch3D : 0,
            bearing: is3D ? CENTRAL_VIEW.bearing3D : 0
          });
        }
      }, 160);
    });
  }

  startMap();
})();
