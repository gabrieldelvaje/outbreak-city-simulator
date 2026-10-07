(() => {
  "use strict";

  const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

  const URBAN_BOUNDS = [
    [-47.7420, -22.8120],
    [-47.5580, -22.6220]
  ];

  const MAX_BOUNDS = [
    [-47.93, -23.01],
    [-47.36, -22.43]
  ];

  const OVERPASS_BBOX = "-23.01,-47.93,-22.43,-47.36";
  const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ];

  const OFFICIAL_ROUTES = [
    ["002", "Panorâmica"],
    ["003", "São Dimas via Parque da Rua do Porto"],
    ["004", "São Dimas via Rua Bernardino de Campos"],
    ["007", "Nova América"],
    ["021", "Monte Alegre"],
    ["101", "Jardim Monumento"],
    ["103", "Nho Quim"],
    ["106", "Algodoal"],
    ["107", "Cristóvão Colombo via Centro Cívico"],
    ["119", "Godinhos"],
    ["120", "Mário Dedini"],
    ["123", "Vila Fátima"],
    ["124", "Jardim Gilda"],
    ["126", "Bosques do Lenheiro"],
    ["200", "Cecap / TPI / TCE"],
    ["202", "Eldorado / TPI / TCE"],
    ["203", "Jardim Noiva da Colina / TPI"],
    ["207", "Vila Independência"],
    ["210", "Unileste / TCI"],
    ["211", "Unileste / TPI"],
    ["212", "Hospital Regional / TCE"],
    ["213", "Perdizes / TPI / TCE"],
    ["214", "Parque Chapadão / TPI / TCE"],
    ["216", "Unileste / TCE"],
    ["217", "Sol Nascente / TPI"],
    ["219", "Parque 1º de Maio"],
    ["220", "Sol Nascente / TCI via TPI"],
    ["221", "Parque Peória / TPI"],
    ["222", "Jardim Oriente / TCI"],
    ["223", "Parque Peória / TCI via TPI"],
    ["225", "Parque Água Branca"],
    ["230", "Reserva Taquaral / TCE"],
    ["231", "Glebas Taquaral / TCE"],
    ["240", "Cecap / TCI via TPI"],
    ["242", "Santa Casa / TCI / TPI"],
    ["246", "Hospital Unimed / TCI / TPI"],
    ["301", "Pauliceia / TCI"],
    ["304", "Monte Líbano / TPA"],
    ["306", "Jardim Oriente / TPA / TPI"],
    ["309", "Campestre / TPA"],
    ["312", "Higienópolis / TCI / TPA"],
    ["315", "Jaraguá"],
    ["317", "Jardim Paraíso / TPA"],
    ["319", "Jardim Costa Rica / TPA"],
    ["321", "Vila Cristina / TPA"],
    ["322", "Novo Horizonte / TCI"],
    ["323", "Jardim Itapuã / TPA"],
    ["324", "Jardim Glória"],
    ["325", "Santa Fé"],
    ["328", "São Jorge / TPA / TSJ"],
    ["330", "Usina Santa Helena / TPA"],
    ["335", "Jardim Monte Cristo / TCI / TPA"],
    ["400", "Ártemis / TVS"],
    ["401", "Ártemis / TCI"],
    ["402", "Parque Piracicaba / TVS"],
    ["403", "Lago Azul / Conexão Ártemis"],
    ["404", "Boa Esperança / TVS via Jardim São Luís"],
    ["405", "Paredão Vermelho / Conexão Ártemis"],
    ["406", "Bessy / TCI"],
    ["407", "Boa Esperança / TVS via Av. Euclides de Figueiredo"],
    ["408", "Vale do Sol / TVS"],
    ["409", "Bessy / TVS"],
    ["410", "Parque Orlanda / TVS"],
    ["411", "Vila Breda / TVS"],
    ["412", "Santa Olímpia / TVS"],
    ["414", "Ipês / TVS"],
    ["415", "Vida Nova / TVS"],
    ["416", "Uninoroeste / TVS"],
    ["430", "Parque Piracicaba / TCI"],
    ["444", "Sônia / TCI"],
    ["501", "Tanquinho"],
    ["503", "Santa Rosa"],
    ["504", "Água Santa"],
    ["505", "Uninorte"],
    ["506", "Parque Tecnológico"],
    ["507", "Parque Automotivo via Hyundai"],
    ["701", "Jardim Jupiá via Av. Dr. Paulo de Moraes"],
    ["702", "Jardim Jupiá via Centro Cívico"],
    ["712", "Pau D'Alhinho"],
    ["713", "Bongue / Ondinhas"],
    ["801", "São Jorge / TCI via Praça Takaki"],
    ["802", "São Jorge / TCI via Jardim Planalto"],
    ["811", "Anhumas / TSJ"],
    ["812", "Santo Antônio / TSJ"],
    ["813", "Almeida / TSJ"],
    ["815", "Ibitiruna / TSJ"],
    ["816", "Nova Suíça / TSJ"],
    ["817", "Residencial Nova Suíça / TSJ"],
    ["826", "Novo Horizonte / TSJ / TPA"],
    ["1100", "Perimetral / TPA / TVS via TPI"],
    ["1200", "Pauliceia / TVS"]
  ].map(([ref, name]) => ({ ref, name }));

  const OFFICIAL_BY_NUMBER = new Map(
    OFFICIAL_ROUTES.map((route) => [String(Number(route.ref)), route])
  );

  const SERIES_COLORS = new Map([
    [0, "#0736fe"],
    [1, "#7256d8"],
    [2, "#159a6b"],
    [3, "#e57b19"],
    [4, "#d64b4b"],
    [5, "#008fb3"],
    [7, "#ba4f89"],
    [8, "#487c72"],
    [11, "#38485f"],
    [12, "#795548"]
  ]);

  const mapStatus = document.getElementById("map-status");
  const routeList = document.getElementById("route-list");
  const searchInput = document.getElementById("route-search");
  const routeCount = document.getElementById("route-count");
  const networkButton = document.getElementById("show-network");
  const resetViewButton = document.getElementById("reset-view");
  const panelToggle = document.getElementById("panel-toggle");
  const routePanel = document.getElementById("route-panel");
  const selectedCard = document.getElementById("selected-route");
  const selectedRef = document.getElementById("selected-ref");
  const selectedName = document.getElementById("selected-name");
  const closeSelected = document.getElementById("close-selected");

  let map = null;
  let routeGeoJSON = { type: "FeatureCollection", features: [] };
  let mappedRefs = new Set();
  let selectedRoute = null;

  function setStatus(message) {
    if (mapStatus) mapStatus.textContent = message;
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function officialRouteFromValue(value) {
    const match = String(value || "").match(/(?:^|\D)0*(\d{1,4})(?:\D|$)/);
    if (!match) return null;
    return OFFICIAL_BY_NUMBER.get(String(Number(match[1]))) || null;
  }

  function routeColor(ref) {
    const number = Number(ref);
    let series = Math.floor(number / 100);
    if (number < 100) series = 0;
    if (number >= 1000) series = Math.floor(number / 100);
    return SERIES_COLORS.get(series) || "#56606d";
  }

  function lightenBaseMap() {
    const layers = map.getStyle()?.layers || [];

    layers.forEach((layer) => {
      const id = (layer.id || "").toLowerCase();

      if (layer.type === "fill-extrusion") {
        try {
          map.setLayoutProperty(layer.id, "visibility", "none");
        } catch (_) {}
        return;
      }

      if (layer.type !== "line") return;

      const isRoad =
        /(road|street|transportation|highway|motorway|trunk|primary|secondary|tertiary|minor|service)/.test(id) &&
        !/(rail|transit|ferry|water|boundary)/.test(id);

      if (!isRoad) return;

      try {
        const isCasing = /(casing|outline|border)/.test(id);
        map.setPaintProperty(
          layer.id,
          "line-color",
          isCasing ? "#dedfdb" : "#fbfbf8"
        );

        if (map.getPaintProperty(layer.id, "line-opacity") !== undefined) {
          map.setPaintProperty(layer.id, "line-opacity", isCasing ? 0.72 : 0.96);
        }
      } catch (_) {}
    });
  }

  function fitUrbanView(animate = false) {
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    map.fitBounds(URBAN_BOUNDS, {
      padding: mobile
        ? { top: 32, right: 28, bottom: 230, left: 28 }
        : { top: 48, right: 48, bottom: 48, left: 350 },
      duration: animate ? 700 : 0,
      bearing: 0,
      pitch: 0,
      essential: true
    });
  }

  function buildOverpassQuery() {
    return `[out:json][timeout:45];
relation["type"="route"]["route"="bus"](${OVERPASS_BBOX});
out tags geom;`;
  }

  async function requestOverpass(endpoint) {
    const body = new URLSearchParams({ data: buildOverpassQuery() });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    return response.json();
  }

  async function fetchRouteData() {
    let lastError = null;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        return await requestOverpass(endpoint);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Não foi possível carregar os traçados.");
  }

  function convertOverpassToGeoJSON(data) {
    const features = [];
    const refs = new Set();

    for (const element of data?.elements || []) {
      if (element.type !== "relation") continue;
      const tags = element.tags || {};

      const official =
        officialRouteFromValue(tags.ref) ||
        officialRouteFromValue(tags.route_ref) ||
        officialRouteFromValue(tags.name);

      if (!official) continue;

      const color = routeColor(official.ref);
      let part = 0;

      for (const member of element.members || []) {
        if (member.type !== "way" || !Array.isArray(member.geometry)) continue;

        const coordinates = member.geometry
          .map((point) => [point.lon, point.lat])
          .filter(
            (coordinate) =>
              Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1])
          );

        if (coordinates.length < 2) continue;

        features.push({
          type: "Feature",
          properties: {
            ref: official.ref,
            name: official.name,
            color,
            relationId: element.id,
            part: part++,
            from: tags.from || "",
            to: tags.to || ""
          },
          geometry: {
            type: "LineString",
            coordinates
          }
        });

        refs.add(official.ref);
      }
    }

    mappedRefs = refs;
    return { type: "FeatureCollection", features };
  }

  function boundsForRoute(ref) {
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;

    for (const feature of routeGeoJSON.features) {
      if (feature.properties.ref !== ref) continue;

      for (const [lng, lat] of feature.geometry.coordinates) {
        west = Math.min(west, lng);
        east = Math.max(east, lng);
        south = Math.min(south, lat);
        north = Math.max(north, lat);
      }
    }

    if (![west, south, east, north].every(Number.isFinite)) return null;

    return [
      [west, south],
      [east, north]
    ];
  }

  function addRouteLayers() {
    if (!map.getSource("bus-routes")) {
      map.addSource("bus-routes", {
        type: "geojson",
        data: routeGeoJSON
      });
    } else {
      map.getSource("bus-routes").setData(routeGeoJSON);
    }

    if (!map.getLayer("bus-route-casing")) {
      map.addLayer({
        id: "bus-route-casing",
        type: "line",
        source: "bus-routes",
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": "rgba(255,255,255,0.96)",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10, 2.2,
            14, 4.5,
            17, 7
          ],
          "line-opacity": 0.82
        }
      });
    }

    if (!map.getLayer("bus-routes-all")) {
      map.addLayer({
        id: "bus-routes-all",
        type: "line",
        source: "bus-routes",
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10, 1.2,
            14, 2.5,
            17, 4
          ],
          "line-opacity": 0.72
        }
      });
    }

    if (!map.getLayer("bus-route-selected")) {
      map.addLayer({
        id: "bus-route-selected",
        type: "line",
        source: "bus-routes",
        filter: ["==", ["get", "ref"], ""],
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10, 3,
            14, 5,
            17, 8
          ],
          "line-opacity": 1
        }
      });
    }
  }

  function showNetwork() {
    selectedRoute = null;
    selectedCard?.setAttribute("hidden", "");

    if (map.getLayer("bus-route-selected")) {
      map.setFilter("bus-route-selected", ["==", ["get", "ref"], ""]);
      map.setPaintProperty("bus-routes-all", "line-opacity", 0.72);
      map.setPaintProperty("bus-route-casing", "line-opacity", 0.82);
    }

    renderRouteList(searchInput?.value || "");
    fitUrbanView(true);
    setStatus(`${mappedRefs.size} linhas com traçado aberto carregadas`);
  }

  function selectRoute(ref, fit = true) {
    const route = OFFICIAL_ROUTES.find((item) => item.ref === ref);
    if (!route) return;

    if (!mappedRefs.has(ref)) {
      setStatus(`Linha ${ref}: traçado ainda não disponível no OpenStreetMap`);
      return;
    }

    selectedRoute = ref;

    map.setFilter("bus-route-selected", ["==", ["get", "ref"], ref]);
    map.setPaintProperty("bus-routes-all", "line-opacity", 0.11);
    map.setPaintProperty("bus-route-casing", "line-opacity", 0.18);

    if (selectedRef) selectedRef.textContent = ref;
    if (selectedName) selectedName.textContent = route.name;
    selectedCard?.style.setProperty("--selected-color", routeColor(ref));
    selectedCard?.removeAttribute("hidden");

    renderRouteList(searchInput?.value || "");

    if (fit) {
      const bounds = boundsForRoute(ref);
      if (bounds) {
        const mobile = window.matchMedia("(max-width: 720px)").matches;
        map.fitBounds(bounds, {
          padding: mobile
            ? { top: 72, right: 34, bottom: 250, left: 34 }
            : { top: 72, right: 70, bottom: 70, left: 390 },
          maxZoom: 15.7,
          duration: 700,
          essential: true
        });
      }
    }

    setStatus(`Linha ${ref} · ${route.name}`);
  }

  function renderRouteList(search = "") {
    if (!routeList) return;

    const term = normalizeText(search.trim());
    const visible = OFFICIAL_ROUTES.filter((route) => {
      if (!term) return true;
      return normalizeText(`${route.ref} ${route.name}`).includes(term);
    });

    routeList.innerHTML = visible
      .map((route) => {
        const mapped = mappedRefs.has(route.ref);
        const active = selectedRoute === route.ref;
        const color = routeColor(route.ref);

        return `
          <button
            class="route-row${active ? " is-active" : ""}${mapped ? "" : " is-unmapped"}"
            type="button"
            data-route="${route.ref}"
            ${mapped ? "" : 'aria-disabled="true"'}
          >
            <span class="route-swatch" style="--route-color:${color}"></span>
            <span class="route-code">${route.ref}</span>
            <span class="route-name">${route.name}</span>
            <span class="route-state" aria-hidden="true">${mapped ? "↗" : "—"}</span>
          </button>
        `;
      })
      .join("");

    routeList.querySelectorAll(".route-row").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.classList.contains("is-unmapped")) {
          setStatus(`Linha ${button.dataset.route}: traçado aberto ainda não encontrado`);
          return;
        }

        selectRoute(button.dataset.route);
      });
    });
  }

  function wireMapInteractions() {
    map.on("mouseenter", "bus-routes-all", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "bus-routes-all", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", "bus-routes-all", (event) => {
      const feature = event.features?.[0];
      const ref = feature?.properties?.ref;
      if (ref) selectRoute(ref, false);
    });
  }

  async function loadRoutes() {
    setStatus("Carregando linhas de ônibus…");

    try {
      const data = await fetchRouteData();
      routeGeoJSON = convertOverpassToGeoJSON(data);
      addRouteLayers();
      wireMapInteractions();
      renderRouteList(searchInput?.value || "");

      if (routeCount) {
        routeCount.textContent = `${mappedRefs.size} de ${OFFICIAL_ROUTES.length} linhas com traçado aberto`;
      }

      setStatus(`${mappedRefs.size} linhas com traçado aberto carregadas`);
    } catch (error) {
      console.warn("Falha ao carregar linhas de ônibus.", error);

      if (routeCount) {
        routeCount.textContent = `${OFFICIAL_ROUTES.length} linhas no catálogo oficial`;
      }

      renderRouteList(searchInput?.value || "");
      setStatus("Catálogo carregado · traçados temporariamente indisponíveis");
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
      center: [-47.652, -22.724],
      zoom: 11.4,
      minZoom: 9.7,
      maxZoom: 18.5,
      pitch: 0,
      bearing: 0,
      maxBounds: MAX_BOUNDS,
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
        customAttribution: "Linhas: Pira Mobilidade · traçados: OpenStreetMap"
      }),
      "bottom-right"
    );

    map.on("load", () => {
      lightenBaseMap();
      fitUrbanView(false);
      renderRouteList();
      loadRoutes();
    });

    map.on("error", (event) => {
      if (event?.error) console.warn(event.error);
    });

    searchInput?.addEventListener("input", (event) => {
      renderRouteList(event.target.value);
    });

    networkButton?.addEventListener("click", showNetwork);
    resetViewButton?.addEventListener("click", showNetwork);
    closeSelected?.addEventListener("click", showNetwork);

    panelToggle?.addEventListener("click", () => {
      routePanel?.classList.toggle("is-collapsed");
      panelToggle.setAttribute(
        "aria-expanded",
        String(!routePanel?.classList.contains("is-collapsed"))
      );
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => map.resize(), 150);
    });
  }

  startMap();
})();
