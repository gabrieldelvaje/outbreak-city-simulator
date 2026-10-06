# Piracicaba 3D

Uma base cartográfica interativa de Piracicaba criada para evoluir, nas próximas versões, para um mapa de memória urbana e patrimônio histórico.

## V1

A primeira versão substitui integralmente o antigo **Outbreak City Simulator** e reduz o escopo ao essencial: fazer Piracicaba funcionar como uma maquete digital navegável.

### Entregue nesta versão

- mapa centrado em Piracicaba;
- navegação com zoom, rotação e inclinação;
- edifícios extrudados em 3D a partir da camada de buildings do OpenMapTiles;
- alternância 2D / 3D;
- retorno animado ao centro;
- layout responsivo para desktop e mobile;
- publicação estática compatível com GitHub Pages;
- nenhuma chave de API.

## Stack

- **MapLibre GL JS**
- **OpenFreeMap**
- **OpenMapTiles / OpenStreetMap**
- HTML, CSS e JavaScript puro

A V1 usa o estilo Liberty da instância pública do OpenFreeMap e adiciona uma camada própria de extrusão de edifícios.

## Próximas versões

### V2 — lugares
Adicionar pontos de interesse selecionados e navegação por lugares.

### V3 — landmarks 3D
Substituir volumes genéricos por modelos `.glb` próprios de marcos como:

- Engenho Central;
- Mercado Municipal;
- Catedral de Santo Antônio;
- Museu Prudente de Moraes;
- Estação da Paulista;
- Museu da Água.

Os modelos poderão ser posicionados sobre o mapa com longitude, latitude, rotação, escala e altitude.

### V4 — patrimônio
Integrar a base do CODEPAC, filtros por categoria, situação do bem, ano de proteção e fotografias históricas.

### V5 — memória da cidade
Linha do tempo, antes/agora e reconstruções de edifícios desaparecidos.

## Estrutura

```
.
├── index.html
├── styles.css
├── app.js
├── data/
│   └── README.md
└── models/
    └── README.md
```

## Dados e atribuição

A cartografia da V1 vem do OpenStreetMap por meio do OpenFreeMap/OpenMapTiles. A atribuição permanece visível no mapa.

O mapa-base não utiliza nem copia tiles, modelos 3D ou imagens do Google Maps.
