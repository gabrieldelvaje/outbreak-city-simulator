(() => {
  "use strict";

  const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

  // Núcleo urbano central de Piracicaba.
  // O enquadramento é intencionalmente urbano: não representa o limite municipal.
  const CENTRAL_BOUNDS = [
    [-47.6805, -22.7515],
    [-47.6160, -22.6965]
  ];

  const CENTRAL_VIEW = {
    center: [-47.6483, -22.7240],
    bearing2D: 0,
    bearing3D: -22,
    pitch2D: 0,
    pitch3D: 58
  };

  const status = document.getElementById("map-status");
  const viewToggle = document.getElementById("view-toggle");
  const resetView = document.getElementById("reset-view");

  let map = null;
  let is3D = false;
  let minCentralZoom = 13;

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  function getPadding() {
    return window.matchMedia("(max-width: 720px)").matches
      ? { top: 82, right: 24, bottom: 70, left: 24 }
      : { top: 70, right: 54, bottom: 50, left: 54 };
  }

  function expandBounds(bounds, factor = 0.10) {
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

    minCentralZoom = camera.zoom;
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

    if (animate) {
      map.easeTo(target);
    } else {
      map.jumpTo(target);
    }
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
          map.setPaintProperty(layer.id, "line-opacity", isCasing ? 0.78 : 0.96);
        }
      } catch (error) {
        console.debug("Camada viária mantida no estilo original:", layer.id);
      }
    });
  }

  function set3D(active, animate = true) {
    if (!map) return;

    is3D = active;
    viewToggle?.classList.toggle("is-active", active);
    viewToggle?.setAttribute("aria-pressed", String(active));

    map.easeTo({
      pitch: active ? CENTRAL_VIEW.pitch3D : CENTRAL_VIEW.pitch2D,
      bearing: active ? CENTRAL_VIEW.bearing3D : CENTRAL_VIEW.bearing2D,
      duration: animate ? 950 : 0,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      essential: true
    });

    setStatus(active ? "Centro de Piracicaba · perspectiva 3D" : "Centro de Piracicaba · mapa plano");
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
      center: CENTRAL_VIEW.center,
      zoom: 13.8,
      pitch: 0,
      bearing: 0,
      minZoom: 13,
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
        customAttribution: "Piracicaba · V1"
      }),
      "bottom-right"
    );

    map.on("load", () => {
      lightenRoads();
      fitCentralView(false);
      setStatus("Centro de Piracicaba · mapa plano");
    });

    map.on("error", (event) => {
      if (event?.error) console.warn(event.error);
    });

    viewToggle?.addEventListener("click", () => {
      set3D(!is3D, true);
    });

    resetView?.addEventListener("click", () => {
      fitCentralView(true);
      setStatus(
        is3D
          ? "Centro de Piracicaba · perspectiva 3D"
          : "Centro de Piracicaba · mapa plano"
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

        minCentralZoom = camera.zoom;
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
