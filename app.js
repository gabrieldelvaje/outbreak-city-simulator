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

  const BRIDGE_LAYER = "ponte-pensil-3d";
  const BRIDGE_MODEL_URL = "./models/ponte_pensil_mapa.glb";
  const BRIDGE_ORIGIN = [-47.6546194, -22.7182833];
  const BRIDGE_ALTITUDE = 2;
  const BRIDGE_ROTATION_Y = -18 * Math.PI / 180;
  const BRIDGE_MASK_SOURCE = "ponte-pensil-mask-source";
  const BRIDGE_MASK_LAYER = "ponte-pensil-native-mask";
  const BRIDGE_LAND_MASK_SOURCE = "ponte-pensil-land-mask-source";
  const BRIDGE_LAND_MASK_LAYER = "ponte-pensil-land-mask";
  const BRIDGE_LABEL_SOURCE = "ponte-pensil-label-source";
  const BRIDGE_LABEL_LAYER = "ponte-pensil-label-3d";

  const PREFEITURA_LAYER = "prefeitura-piracicaba-3d";
  const PREFEITURA_MODEL_URL = "./models/prefeitura-piracicaba.glb";
  const PREFEITURA_ORIGIN = [-47.66572, -22.72868];
  const PREFEITURA_ALTITUDE = 0.8;
  const PREFEITURA_ROTATION_Y = -8 * Math.PI / 180;
  const PREFEITURA_LABEL_SOURCE = "prefeitura-label-source";
  const PREFEITURA_LABEL_LAYER = "prefeitura-label-3d";

  // Eixo aproximado da travessia. O primeiro trecho cobre a ponte nativa
  // sobre a água; o segundo cobre a continuação que aparece sobre a margem.
  const BRIDGE_MASK_COORDS = [
    [-47.655125, -22.718132],
    [-47.654135, -22.718430]
  ];

  const BRIDGE_LAND_MASK_COORDS = [
    [-47.654160, -22.718423],
    [-47.653860, -22.718515]
  ];

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

  function waterMaskColor() {
    const layers = map.getStyle()?.layers || [];
    const water = layers.find(
      (layer) =>
        layer.type === "fill" &&
        /water/.test((layer.id || "").toLowerCase())
    );

    if (water) {
      try {
        const value = map.getPaintProperty(water.id, "fill-color");
        if (typeof value === "string") return value;
      } catch (_) {}
    }

    return "#8fb0ee";
  }

  function landMaskColor() {
    const layers = map.getStyle()?.layers || [];

    const background = layers.find((layer) => layer.type === "background");
    if (background) {
      try {
        const value = map.getPaintProperty(background.id, "background-color");
        if (typeof value === "string") return value;
      } catch (_) {}
    }

    const land = layers.find(
      (layer) =>
        layer.type === "fill" &&
        /(land|landuse|landcover|background)/.test(
          (layer.id || "").toLowerCase()
        )
    );

    if (land) {
      try {
        const value = map.getPaintProperty(land.id, "fill-color");
        if (typeof value === "string") return value;
      } catch (_) {}
    }

    return "#efeee9";
  }

  function hideNativeBridgeLabel() {
    const layers = map.getStyle()?.layers || [];

    layers.forEach((layer) => {
      if (layer.type !== "symbol") return;

      const sourceLayer = (layer["source-layer"] || "").toLowerCase();
      const id = (layer.id || "").toLowerCase();

      if (
        !/transportation|road|bridge|path|label/.test(sourceLayer + " " + id)
      ) return;

      try {
        const current = map.getFilter(layer.id);
        const excludeBridge = [
          "!",
          [
            "in",
            ["downcase", ["coalesce", ["get", "name"], ""]],
            ["literal", ["ponte pênsil", "ponte pensil"]]
          ]
        ];

        map.setFilter(
          layer.id,
          current ? ["all", current, excludeBridge] : excludeBridge
        );
      } catch (_) {}
    });
  }

  function hideNativePrefeituraLabel() {
    const layers = map.getStyle()?.layers || [];
    const names = [
      "prefeitura de piracicaba",
      "prefeitura municipal de piracicaba",
      "prefeitura do município de piracicaba",
      "centro cívico cultural e educacional florivaldo coelho prates"
    ];

    layers.forEach((layer) => {
      if (layer.type !== "symbol") return;

      try {
        const current = map.getFilter(layer.id);
        const excludePrefeitura = [
          "!",
          [
            "in",
            ["downcase", ["coalesce", ["get", "name"], ""]],
            ["literal", names]
          ]
        ];

        map.setFilter(
          layer.id,
          current ? ["all", current, excludePrefeitura] : excludePrefeitura
        );
      } catch (_) {}
    });
  }

  function addBridgeMaskAndLabel() {
    if (!map.getSource(BRIDGE_MASK_SOURCE)) {
      map.addSource(BRIDGE_MASK_SOURCE, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: BRIDGE_MASK_COORDS
          }
        }
      });
    }

    if (!map.getLayer(BRIDGE_MASK_LAYER)) {
      map.addLayer({
        id: BRIDGE_MASK_LAYER,
        type: "line",
        source: BRIDGE_MASK_SOURCE,
        minzoom: 12.25,
        paint: {
          "line-color": waterMaskColor(),
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12.25,
            3.2,
            14,
            6,
            16,
            12,
            18,
            22
          ],
          "line-opacity": 1,
          "line-blur": 0.12,
          "line-cap": "round"
        }
      });
    }

    if (!map.getSource(BRIDGE_LAND_MASK_SOURCE)) {
      map.addSource(BRIDGE_LAND_MASK_SOURCE, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: BRIDGE_LAND_MASK_COORDS
          }
        }
      });
    }

    if (!map.getLayer(BRIDGE_LAND_MASK_LAYER)) {
      map.addLayer({
        id: BRIDGE_LAND_MASK_LAYER,
        type: "line",
        source: BRIDGE_LAND_MASK_SOURCE,
        minzoom: 12.25,
        paint: {
          "line-color": landMaskColor(),
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12.25,
            3.2,
            14,
            6,
            16,
            12,
            18,
            22
          ],
          "line-opacity": 1,
          "line-blur": 0.12,
          "line-cap": "round"
        }
      });
    }

    if (!map.getSource(BRIDGE_LABEL_SOURCE)) {
      map.addSource(BRIDGE_LABEL_SOURCE, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {
            name: "Ponte Pênsil"
          },
          geometry: {
            type: "Point",
            coordinates: BRIDGE_ORIGIN
          }
        }
      });
    }

    if (!map.getLayer(BRIDGE_LABEL_LAYER)) {
      const baseLabel = firstLabelLayerId();
      let textFont;

      if (baseLabel) {
        try {
          textFont = map.getLayoutProperty(baseLabel, "text-font");
        } catch (_) {}
      }

      const layout = {
        "text-field": ["get", "name"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          12.35,
          10,
          14,
          12.5,
          16,
          15,
          18,
          17
        ],
        "text-anchor": "center",
        "text-offset": [0, -1.15],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-pitch-alignment": "viewport",
        "text-rotation-alignment": "viewport",
        "text-keep-upright": true,
        "symbol-height-offset": 7,
        "symbol-height-anchor": "ground"
      };

      if (Array.isArray(textFont) && textFont.length) {
        layout["text-font"] = textFont;
      }

      map.addLayer({
        id: BRIDGE_LABEL_LAYER,
        type: "symbol",
        source: BRIDGE_LABEL_SOURCE,
        minzoom: 12.35,
        layout,
        paint: {
          "text-color": "#686865",
          "text-halo-color": "rgba(243,243,241,0.96)",
          "text-halo-width": 1.4,
          "text-halo-blur": 0.25
        }
      });
    }

    updateBridgeLabelForViewport();
  }

  function updateBridgeLabelForViewport() {
    if (!map?.getLayer(BRIDGE_LABEL_LAYER)) return;

    const mobile = window.matchMedia("(max-width: 720px)").matches;

    map.setLayoutProperty(
      BRIDGE_LABEL_LAYER,
      "text-offset",
      mobile ? [0, -1.05] : [0, -1.25]
    );

    map.setLayoutProperty(
      BRIDGE_LABEL_LAYER,
      "text-max-width",
      mobile ? 11 : 16
    );
  }

  function addPrefeituraLabel() {
    if (!map.getSource(PREFEITURA_LABEL_SOURCE)) {
      map.addSource(PREFEITURA_LABEL_SOURCE, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { name: "Prefeitura de Piracicaba" },
          geometry: {
            type: "Point",
            coordinates: PREFEITURA_ORIGIN
          }
        }
      });
    }

    if (!map.getLayer(PREFEITURA_LABEL_LAYER)) {
      const baseLabel = firstLabelLayerId();
      let textFont;

      if (baseLabel) {
        try {
          textFont = map.getLayoutProperty(baseLabel, "text-font");
        } catch (_) {}
      }

      const layout = {
        "text-field": ["get", "name"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          12.0, 10,
          14, 12.5,
          16, 15,
          18, 17
        ],
        "text-anchor": "bottom",
        "text-offset": [0, -0.35],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-pitch-alignment": "viewport",
        "text-rotation-alignment": "viewport",
        "text-keep-upright": true,
        "symbol-height-offset": 58,
        "symbol-height-anchor": "ground"
      };

      if (Array.isArray(textFont) && textFont.length) {
        layout["text-font"] = textFont;
      }

      map.addLayer({
        id: PREFEITURA_LABEL_LAYER,
        type: "symbol",
        source: PREFEITURA_LABEL_SOURCE,
        minzoom: 12.0,
        layout,
        paint: {
          "text-color": "#575754",
          "text-halo-color": "rgba(243,243,241,0.97)",
          "text-halo-width": 1.5,
          "text-halo-blur": 0.25
        }
      });
    }

    updatePrefeituraLabelForViewport();
  }

  function updatePrefeituraLabelForViewport() {
    if (!map?.getLayer(PREFEITURA_LABEL_LAYER)) return;
    const mobile = window.matchMedia("(max-width: 720px)").matches;

    map.setLayoutProperty(
      PREFEITURA_LABEL_LAYER,
      "text-max-width",
      mobile ? 12 : 18
    );

    map.setLayoutProperty(
      PREFEITURA_LABEL_LAYER,
      "text-offset",
      mobile ? [0, -0.2] : [0, -0.4]
    );
  }

  function excludeGenericPrefeituraBuilding() {
    if (!map?.getSource(BUILDING_SOURCE) || !map.getLayer(BUILDING_LAYER)) return;

    try {
      const features = map.querySourceFeatures(BUILDING_SOURCE, {
        sourceLayer: "building"
      });

      let nearest = null;

      for (const feature of features) {
        const coords = feature?.geometry?.coordinates;
        if (!coords) continue;

        let west = Infinity;
        let east = -Infinity;
        let south = Infinity;
        let north = -Infinity;

        const walk = (value) => {
          if (!Array.isArray(value)) return;

          if (
            value.length >= 2 &&
            typeof value[0] === "number" &&
            typeof value[1] === "number"
          ) {
            west = Math.min(west, value[0]);
            east = Math.max(east, value[0]);
            south = Math.min(south, value[1]);
            north = Math.max(north, value[1]);
            return;
          }

          value.forEach(walk);
        };

        walk(coords);

        if (![west, east, south, north].every(Number.isFinite)) continue;

        const lng = (west + east) / 2;
        const lat = (south + north) / 2;
        const dx = (lng - PREFEITURA_ORIGIN[0]) * 102700;
        const dy = (lat - PREFEITURA_ORIGIN[1]) * 111320;
        const distance = Math.hypot(dx, dy);

        const id = feature.id ?? feature.properties?.id;

        if (
          distance < 110 &&
          id !== undefined &&
          id !== null &&
          (!nearest || distance < nearest.distance)
        ) {
          nearest = { id, distance };
        }
      }

      if (!nearest) return;

      const baseFilter = [
        "any",
        ["!", ["has", "is_underground"]],
        ["!=", ["get", "is_underground"], true]
      ];

      map.setFilter(BUILDING_LAYER, [
        "all",
        baseFilter,
        [
          "!=",
          ["coalesce", ["id"], ["get", "id"], ""],
          nearest.id
        ]
      ]);
    } catch (error) {
      console.debug("Prédio genérico da Prefeitura mantido.", error);
    }
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
              "#f0f1ed",
              15,
              "#e9eae6",
              18,
              "#e2e4e0"
            ],
            "fill-extrusion-height": heightExpression,
            "fill-extrusion-base": baseExpression,
            "fill-extrusion-opacity": 0.84,
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

    if (active) {
      map.once("idle", excludeGenericPrefeituraBuilding);
    }
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
    let THREE;
    let GLTFLoader;

    try {
      const modules = await Promise.all([
        import("https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs"),
        import("https://cdn.jsdelivr.net/npm/pmtiles@4.5.0/+esm"),
        import("three"),
        import("three/addons/loaders/GLTFLoader.js")
      ]);

      maplibregl = modules[0];
      Protocol = modules[1].Protocol;
      THREE = modules[2];
      GLTFLoader = modules[3].GLTFLoader;

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
      canvasContextAttributes: { antialias: true },
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

    const bridgeMercator = maplibregl.MercatorCoordinate.fromLngLat(
      BRIDGE_ORIGIN,
      BRIDGE_ALTITUDE
    );

    const bridgeTransform = {
      translateX: bridgeMercator.x,
      translateY: bridgeMercator.y,
      translateZ: bridgeMercator.z,
      rotateX: Math.PI / 2,
      rotateY: BRIDGE_ROTATION_Y,
      rotateZ: 0,
      scale: bridgeMercator.meterInMercatorCoordinateUnits()
    };

    const bridgeLayer = {
      id: BRIDGE_LAYER,
      type: "custom",
      renderingMode: "3d",

      onAdd(mapRef, gl) {
        this.map = mapRef;
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.45));

        const key = new THREE.DirectionalLight(0xffffff, 2.4);
        key.position.set(-30, -45, 80).normalize();
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xe8eefc, 1.1);
        fill.position.set(45, 20, 55).normalize();
        this.scene.add(fill);

        const loader = new GLTFLoader();
        loader.load(
          BRIDGE_MODEL_URL,
          (gltf) => {
            gltf.scene.traverse((object) => {
              if (!object.isMesh) return;
              object.frustumCulled = false;
              if (object.material) {
                object.material.depthTest = true;
                object.material.depthWrite = true;
              }
            });
            this.scene.add(gltf.scene);
            this.loaded = true;
            this.map.triggerRepaint();
          },
          undefined,
          (error) => console.warn("Não foi possível carregar a Ponte Pênsil 3D.", error)
        );

        this.renderer = new THREE.WebGLRenderer({
          canvas: mapRef.getCanvas(),
          context: gl,
          antialias: true
        });
        this.renderer.autoClear = false;
      },

      render(gl, args) {
        if (!this.loaded || this.map.getZoom() < 12.35) return;

        const rx = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          bridgeTransform.rotateX
        );
        const ry = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          bridgeTransform.rotateY
        );
        const rz = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          bridgeTransform.rotateZ
        );

        const projection = new THREE.Matrix4().fromArray(
          args.defaultProjectionData.mainMatrix
        );

        const model = new THREE.Matrix4()
          .makeTranslation(
            bridgeTransform.translateX,
            bridgeTransform.translateY,
            bridgeTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              bridgeTransform.scale,
              -bridgeTransform.scale,
              bridgeTransform.scale
            )
          )
          .multiply(rx)
          .multiply(ry)
          .multiply(rz);

        this.camera.projectionMatrix = projection.multiply(model);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      }
    };

    const prefeituraMercator = maplibregl.MercatorCoordinate.fromLngLat(
      PREFEITURA_ORIGIN,
      PREFEITURA_ALTITUDE
    );

    const prefeituraTransform = {
      translateX: prefeituraMercator.x,
      translateY: prefeituraMercator.y,
      translateZ: prefeituraMercator.z,
      rotateX: Math.PI / 2,
      rotateY: PREFEITURA_ROTATION_Y,
      rotateZ: 0,
      scale: prefeituraMercator.meterInMercatorCoordinateUnits()
    };

    const prefeituraLayer = {
      id: PREFEITURA_LAYER,
      type: "custom",
      renderingMode: "3d",

      onAdd(mapRef, gl) {
        this.map = mapRef;
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));

        const key = new THREE.DirectionalLight(0xffffff, 2.5);
        key.position.set(-35, -40, 90).normalize();
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xe9edf5, 1.15);
        fill.position.set(50, 25, 55).normalize();
        this.scene.add(fill);

        const loader = new GLTFLoader();
        loader.load(
          PREFEITURA_MODEL_URL,
          (gltf) => {
            gltf.scene.traverse((object) => {
              if (!object.isMesh) return;
              object.frustumCulled = false;
              if (object.material) {
                object.material.depthTest = true;
                object.material.depthWrite = true;
              }
            });

            this.scene.add(gltf.scene);
            this.loaded = true;
            this.map.triggerRepaint();
          },
          undefined,
          (error) =>
            console.warn("Não foi possível carregar a Prefeitura 3D.", error)
        );

        this.renderer = new THREE.WebGLRenderer({
          canvas: mapRef.getCanvas(),
          context: gl,
          antialias: true
        });
        this.renderer.autoClear = false;
      },

      render(gl, args) {
        if (!this.loaded || this.map.getZoom() < 11.9) return;

        const rx = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          prefeituraTransform.rotateX
        );
        const ry = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          prefeituraTransform.rotateY
        );
        const rz = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          prefeituraTransform.rotateZ
        );

        const projection = new THREE.Matrix4().fromArray(
          args.defaultProjectionData.mainMatrix
        );

        const model = new THREE.Matrix4()
          .makeTranslation(
            prefeituraTransform.translateX,
            prefeituraTransform.translateY,
            prefeituraTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              prefeituraTransform.scale,
              -prefeituraTransform.scale,
              prefeituraTransform.scale
            )
          )
          .multiply(rx)
          .multiply(ry)
          .multiply(rz);

        this.camera.projectionMatrix = projection.multiply(model);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      }
    };

    map.on("load", () => {
      lightenRoads();
      hideBaseStyleExtrusions();
      addOvertureBuildings();
      hideNativeBridgeLabel();
      hideNativePrefeituraLabel();
      addBridgeMaskAndLabel();
      addPrefeituraLabel();

      if (!map.getLayer(BRIDGE_LAYER)) {
        map.addLayer(bridgeLayer);
      }

      if (!map.getLayer(PREFEITURA_LAYER)) {
        map.addLayer(prefeituraLayer);
      }

      map.once("idle", excludeGenericPrefeituraBuilding);

      // Os rótulos customizados ficam acima dos modelos e sempre de frente.
      if (map.getLayer(BRIDGE_LABEL_LAYER)) {
        map.moveLayer(BRIDGE_LABEL_LAYER);
      }
      if (map.getLayer(PREFEITURA_LABEL_LAYER)) {
        map.moveLayer(PREFEITURA_LABEL_LAYER);
      }
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
        updateBridgeLabelForViewport();
        updatePrefeituraLabelForViewport();

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
