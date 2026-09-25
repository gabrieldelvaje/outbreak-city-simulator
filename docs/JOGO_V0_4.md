# OUTBREAK — V0.4: disseminação entre bairros

**Motor:** `2.2.0-city-mixing`.

## Problema corrigido

Na V0.3 a residência era persistente, mas escola, trabalho, comércio e lazer eram selecionados quase sempre dentro da mesma região. Isso criava componentes urbanos excessivamente fechados: o surto crescia em um bairro e podia desaparecer antes de alcançar o restante da cidade.

Na V0.4, **bairro de residência não é mais o limite da rotina**.

## Rede interbairros

Cada agente continua com uma residência e um domicílio fixos, mas recebe destinos persistentes que podem ficar em outras regiões:

- trabalho;
- escola;
- mercado/comércio/restaurante;
- parque/praça;
- hospital de referência.

A escolha de um destino externo considera a capacidade dos locais disponíveis nas outras regiões. Pessoas de bairros diferentes podem, portanto, compartilhar a mesma empresa, escola, mercado ou área de lazer e depois retornar para suas próprias famílias.

Isso cria a cadeia esperada:

`casa A → trabalho B → contato com morador C → casa C → escola/mercado D → ...`

## Parâmetros de mistura

O conjunto `calibrated_parameters_v2.json` registra explicitamente as probabilidades usadas para selecionar um destino habitual fora do bairro de residência:

- trabalho: 0,40;
- escola: 0,15;
- varejo/comércio: 0,45;
- comunidade/lazer: 0,35;
- hospital: 0,50.

**Status:** `CITY_NETWORK_GAME_ASSUMPTION_NOT_ESTIMATED_FROM_SUPPLIED_DATA`.

Esses valores não são estimativas observadas para Piracicaba, Brasil ou qualquer cidade real. Eles são hipóteses estruturais da cidade fictícia para manter a rede epidemiologicamente conectada. Devem ser substituídos se uma matriz origem–destino compatível for incorporada.

## Eventos de transmissão

Cada evento de infecção agora registra:

- `targetRegion`: bairro de residência da pessoa infectada;
- `sourceRegion`: bairro de residência da fonte;
- `placeRegion`: bairro onde ocorreu o contato;
- `visualPlace`: nó mostrado no mapa;
- `block`: bloco da rotina diária.

O resumo da execução inclui:

- `regionsReached`;
- `crossRegionTransmissions`.

## Interface

O painel mostra `Bairros atingidos / total de bairros`.

Após distribuir a população, a interface informa quantos agentes possuem ao menos um destino persistente em outro bairro. Locais públicos podem receber pessoas de várias regiões.

## Teste de regressão

O teste automatizado exige que:

1. existam trabalhadores com emprego fora do bairro de residência;
2. existam consumidores e usuários de lazer com destinos fora do bairro;
3. um surto iniciado em um agente pendular consiga alcançar mais de uma região;
4. haja ao menos uma transmissão entre residentes de regiões diferentes;
5. as demais invariantes epidemiológicas continuem válidas.

## Limitação ainda existente

A mobilidade interbairros já existe epidemiologicamente, mas as três pontes do mapa ainda não são arestas individuais do caminho. A etapa seguinte é atribuir uma rota física a cada deslocamento e fazer Ponte Norte, Central e Sul controlarem essas rotas.
