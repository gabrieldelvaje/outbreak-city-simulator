# Piracicaba — mapa urbano interativo

Um mesmo mapa com duas leituras da cidade.

## História

Camada 3D experimental com edifícios extrudados e landmarks modelados individualmente. A versão atual preserva a Ponte Pênsil e a Prefeitura de Piracicaba como objetos 3D customizados.

Acesse em `historia.html`.

## Transporte

Camada 2D com catálogo atual de linhas de ônibus e traçados abertos de relações `route=bus` do OpenStreetMap via Overpass.

A página inicial (`index.html`) abre em Transporte.

## Fontes

- Pira Mobilidade — catálogo de linhas e horários
- Prefeitura de Piracicaba
- OpenStreetMap / Overpass
- OpenFreeMap
- Overture Maps Buildings na camada História

## Estrutura

- `index.html` + `app.js` + `styles.css`: Transporte
- `historia.html` + `history.js` + `history.css`: História
- `models/`: landmarks GLB usados na camada História
