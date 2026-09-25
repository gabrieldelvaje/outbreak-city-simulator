# OUTBREAK — City Network Simulator

Simulador experimental de transmissão em uma cidade **inteiramente fictícia**, com mapa vetorial 2D e motor epidemiológico baseado em agentes sintéticos.

## Versão jogável atual — V0.5

A V0.5 mantém a população persistente, a mobilidade entre bairros e acrescenta **perda de imunidade natural, reinfecções e reintroduções externas**, permitindo que a epidemia produza novas ondas mesmo quando a primeira curva cai.

O fluxo atual é: escolher entre **10 e 30.000 agentes** → distribuir a população → abrir uma residência → inspecionar domicílios e grafo familiar → escolher uma pessoa específica como paciente zero → iniciar a epidemia → acompanhar disseminação e novas ondas → tomar decisões após o alerta hospitalar.

Página: https://gabrieldelvaje.github.io/outbreak-city-simulator/

## População, rotina e cidade conectada

Cada agente recebe idade/faixa etária, `householdId`, nó residencial `visualHome`, escola, trabalho, mercado habitual, destino comunitário e hospital de referência.

Trabalho, escola, comércio, lazer e hospital podem estar fora do bairro de residência. Pessoas de bairros distintos se encontram nesses locais e retornam aos próprios domicílios, conectando a cidade epidemiologicamente.

O dia é processado em quatro blocos:

- `home_morning`;
- `daytime`;
- `evening_outing`;
- `home_night`.

## Reinfecção e ondas

O estado `R` não é mais necessariamente terminal. Após a recuperação, cada agente recebe uma janela temporária de imunidade natural. Quando essa janela termina:

`R → S`

A pessoa volta a ser suscetível e pode adquirir uma nova infecção.

Cada episódio guarda `episode` e `reinfection`, e o painel mostra **reinfecções acumuladas** separadamente do percentual de pessoas que já foram infectadas pelo menos uma vez.

O motor também possui reintroduções externas proporcionais ao tamanho da população. Elas representam pressão infecciosa proveniente de fora da cidade fictícia e ajudam a iniciar novas cadeias depois de períodos de baixa circulação.

A vacinação pode atingir suscetíveis **e recuperados**. Depois do atraso para proteção, ela reduz a probabilidade de infecção em contatos locais e também a chance de uma tentativa de reintrodução externa resultar em infecção bem-sucedida.

## Importante sobre os parâmetros de ondas

As bases fornecidas ao projeto **não identificam de forma defensável** a duração da imunidade esterilizante após infecção nem a frequência de introduções infecciosas vindas de fora da cidade.

Por isso, as janelas de imunidade e taxas de reintrodução estão em `scenario_assumptions.reinfection_wave_scenarios` e são marcadas como:

`GAME_ASSUMPTION_NOT_IDENTIFIED_BY_SUPPLIED_DATA`.

Elas são mecânicas de cenário do jogo, não estimativas clínicas.

## Motor epidemiológico

- Motor: [`simulator/engine.mjs`](simulator/engine.mjs)
- Parâmetros: [`simulator/data/calibrated_parameters_v2.json`](simulator/data/calibrated_parameters_v2.json)
- Análise/calibração: [`simulator/docs/CALIBRACAO_V2.md`](simulator/docs/CALIBRACAO_V2.md)
- Metodologia: [`simulator/docs/MODELO_E_METODOLOGIA.md`](simulator/docs/MODELO_E_METODOLOGIA.md)
- Jogo V0.5: [`docs/JOGO_V0_5.md`](docs/JOGO_V0_5.md)
- Testes: [`simulator/tests/test_engine.mjs`](simulator/tests/test_engine.mjs)

**Versão do motor:** `2.3.0-reinfection-waves`.

## Limitações atuais

As pontes Norte, Central e Sul ainda não são arestas individuais das rotas. A mobilidade entre bairros já existe no motor, mas ainda não percorre fisicamente uma ponte específica.

Também permanecem como hipóteses/sensibilidade beta absoluto por hora, períodos latente/infeccioso, eficácia da vacina hipotética, duração da imunidade natural, taxa de reintrodução externa e efeito causal isolado de políticas.

## Executar os testes

```bash
node simulator/tests/test_engine.mjs
node simulator/examples/run_example.mjs
```

## Limite científico

OUTBREAK é educacional e exploratório. Resultados são sintéticos e não constituem previsão médica, declaração epidemiológica oficial nem recomendação de política pública.
