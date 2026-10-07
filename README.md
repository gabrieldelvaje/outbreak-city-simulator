# Piracicaba — Transporte Público

Mapa interativo das linhas de ônibus de Piracicaba.

## V1

- mapa 100% 2D em MapLibre GL JS;
- catálogo atual de linhas baseado na página **Linhas e Horários** da Pira Mobilidade;
- traçados carregados como dados abertos de relações `route=bus` do OpenStreetMap via Overpass;
- busca por número ou destino;
- clique em uma linha para isolá-la e enquadrar seu percurso;
- visualização da rede inteira;
- interface responsiva para desktop e mobile.

## Fontes

- Pira Mobilidade — catálogo de linhas e horários: https://piramobilidade.com.br/linhas-e-horarios/
- Prefeitura de Piracicaba — transporte urbano: https://piracicaba.sp.gov.br/servicos/linhas-de-onibus-horarios-e-itinerarios/
- OpenStreetMap / Overpass — geometria aberta dos traçados.
- OpenFreeMap — mapa-base.

### Observação sobre cobertura

O catálogo de linhas e o traçado têm fontes diferentes. Uma linha oficial pode aparecer na lista sem geometria caso sua relação ainda não esteja mapeada ou atualizada no OpenStreetMap. A interface deixa essas linhas visualmente desativadas em vez de inventar um percurso.
