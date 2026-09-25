# OUTBREAK — City Network Simulator

Simulador experimental de transmissão em uma cidade **inteiramente fictícia**, com mapa vetorial 2D e motor epidemiológico baseado em agentes sintéticos.

## Versão jogável atual — V0.3

A V0.3 transforma a população em uma rede persistente antes do início do surto.

O fluxo atual é: escolher entre **10 e 30.000 agentes** → distribuir a população → abrir uma residência → inspecionar os domicílios e o grafo familiar → escolher uma pessoa específica como paciente zero → iniciar a epidemia → acompanhar a disseminação → tomar decisões após o alerta hospitalar.

A simulação roda em **Web Worker**, sem renderizar todos os agentes simultaneamente.

Página: https://gabrieldelvaje.github.io/outbreak-city-simulator/

## População e residências

Cada agente recebe idade/faixa etária, `householdId`, nó residencial `visualHome`, escola, trabalho, mercado habitual, destino comunitário e hospital de referência. Professor e profissional de saúde também são atributos persistentes quando sorteados.

Quando a população é maior que o número de marcadores residenciais do SVG, um mesmo marcador pode representar **vários domicílios**. Eles continuam epidemiologicamente separados: somente agentes com o mesmo `householdId` compartilham a camada familiar.

Ao clicar numa casa, a interface mostra total de residentes, número de domicílios, composição etária, seletor de domicílio, grafo de convivência e lista das pessoas. O jogador escolhe uma pessoa concreta como paciente zero.

## Rotina diária

O motor 2.1 processa os contatos em quatro blocos temporais:

- `home_morning`: convivência domiciliar pela manhã;
- `daytime`: escola, trabalho, hospital ou permanência em casa;
- `evening_outing`: mercado/comércio/restaurante ou parque/praça;
- `home_night`: retorno ao domicílio.

Fechar escolas ou aplicar home office não remove os agentes da rede: eles permanecem em casa durante o bloco correspondente. Fechar comércio/lazer remove aquela saída. Contatos familiares continuam possíveis.

A frequência e a mistura etária vêm das matrizes brasileiras; a duração dos contatos vem do POLYMOD. A probabilidade diária de realizar uma saída comunitária está explicitamente marcada no JSON como **hipótese de rotina do jogo**, não como estimativa empírica.

## Motor epidemiológico

- Motor: [`simulator/engine.mjs`](simulator/engine.mjs)
- Parâmetros: [`simulator/data/calibrated_parameters_v2.json`](simulator/data/calibrated_parameters_v2.json)
- Análise/calibração: [`simulator/docs/CALIBRACAO_V2.md`](simulator/docs/CALIBRACAO_V2.md)
- Metodologia: [`simulator/docs/MODELO_E_METODOLOGIA.md`](simulator/docs/MODELO_E_METODOLOGIA.md)
- Jogo V0.3: [`docs/JOGO_V0_3.md`](docs/JOGO_V0_3.md)
- Testes: [`simulator/tests/test_engine.mjs`](simulator/tests/test_engine.mjs)

**Versão do motor:** `2.1.0-spatial-routines`.

## Limitações atuais

As pontes Norte, Central e Sul ainda não são arestas individuais da rotina espacial. Os controles permanecem visuais; a próxima integração é fazer cada deslocamento atravessar uma rota real do grafo.

Também permanecem como hipóteses/sensibilidade os parâmetros não identificados pelas bases: beta absoluto por hora, períodos latente/infeccioso, eficácia de vacina hipotética e efeito causal isolado de políticas.

## Executar os testes

```bash
node simulator/tests/test_engine.mjs
node simulator/examples/run_example.mjs
```

## Limite científico

OUTBREAK é educacional e exploratório. Resultados são sintéticos e não constituem previsão médica, declaração epidemiológica oficial nem recomendação de política pública.
