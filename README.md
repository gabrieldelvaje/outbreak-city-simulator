# OUTBREAK — City Network Simulator

Simulador experimental de transmissão em uma cidade **inteiramente fictícia**, com mapa vetorial 2D e motor epidemiológico baseado em agentes sintéticos.

## Versão jogável atual — V0.7

A campanha agora acompanha **360 dias** e divide o ano de jogo em quatro fases de onda de aproximadamente 90 dias. A transmissibilidade da experiência jogável é sempre **alta**; o jogador escolhe apenas nome da cidade, população entre 10 e **20.000** pessoas e vírus (Influenza, COVID-19 ou VSR).

Página: https://gabrieldelvaje.github.io/outbreak-city-simulator/

## Fluxo da interface

A configuração aparece em uma janela sobre o mapa. Depois de distribuir a população, a configuração desaparece e o jogador escolhe o epicentro/paciente zero diretamente nos grafos de residências ou locais públicos. Ao iniciar o surto, abre-se o HUD lateral com o contador contínuo, a onda atual, indicadores, vacinação e histórico de decisões.

As decisões públicas aparecem em janelas sobre o mapa e pausam a linha do tempo. O jogador escolhe uma medida ou **Continuar sem ação**.

## Campanha anual e ondas

O motor usa quatro janelas de 90 dias, com modulação suave da pressão de transmissão e reintroduções externas. O calendário de quatro ondas é uma **mecânica de cenário**, não uma previsão epidemiológica derivada das bases.

A população mantém famílias, escola, trabalho, comércio, lazer e hospital persistentes, com mobilidade entre bairros. Recuperados podem perder imunidade e ser reinfectados.

## Hospital

Casos graves solicitam leito. Se a capacidade for atingida, o agente acumula dias de atendimento negado. O risco de morte aumenta no cenário conforme esses dias se acumulam. O painel separa **óbitos associados no modelo à falta de leito**.

A ação **Ampliar leitos** aumenta a capacidade em 25% da capacidade disponível no momento da decisão e pode ser escolhida novamente em crises posteriores.

Esse mecanismo é hipotético e não estima causalmente a mortalidade real de um sistema de saúde.

## Vacinação em três etapas

A V0.7 usa campanhas separadas:

- 1ª dose — disponível na 2ª onda;
- 2ª dose — janela posterior, respeitando intervalo mínimo;
- 3ª dose/reforço — disponível mais tarde como cenário para novas cepas/variantes.

Cada dose possui atraso até proteção e níveis de proteção contra infecção e gravidade. Esses valores estão marcados como **hipóteses de jogo não específicas de produto** em `calibrated_parameters_v2.json`.

## Motor e documentação

- Motor: [`simulator/engine.mjs`](simulator/engine.mjs)
- Parâmetros: [`simulator/data/calibrated_parameters_v2.json`](simulator/data/calibrated_parameters_v2.json)
- Metodologia: [`simulator/docs/MODELO_E_METODOLOGIA.md`](simulator/docs/MODELO_E_METODOLOGIA.md)
- Calibração e limites: [`simulator/docs/CALIBRACAO_V2.md`](simulator/docs/CALIBRACAO_V2.md)
- Jogo V0.7: [`docs/JOGO_V0_7.md`](docs/JOGO_V0_7.md)
- Testes: [`simulator/tests/test_engine.mjs`](simulator/tests/test_engine.mjs)

**Versão do motor:** `2.4.0-year-waves`.

## Limitações atuais

As pontes Norte, Central e Sul ainda não são arestas individuais das rotas. Também permanecem como hipóteses/sensibilidade o beta absoluto, latência/duração infecciosa, calendário exato das quatro ondas, eficácia das doses hipotéticas, duração da imunidade, reintroduções externas e incremento de mortalidade por atendimento negado.

As políticas alteram a rede e a capacidade e, portanto, alteram os desfechos do cenário. O simulador não atribui um óbito individual a uma política específica sem comparação contrafactual.

## Executar os testes

```bash
node simulator/tests/test_engine.mjs
node simulator/tests/test_game_contract.mjs
node simulator/tests/test_decision_checkpoints.mjs
```

## Limite científico

OUTBREAK é educacional e exploratório. Resultados são sintéticos e não constituem previsão médica, declaração epidemiológica oficial nem recomendação de política pública.
