# OUTBREAK — modelo matemático e metodologia (v2.1)

**Versão do motor:** `2.1.0-spatial-routines`  
**Conjunto principal:** `../data/calibrated_parameters_v2.json`

A análise das bases e limitações está em [CALIBRACAO_V2.md](CALIBRACAO_V2.md). A mecânica da interface atual está em [../../docs/JOGO_V0_3.md](../../docs/JOGO_V0_3.md).

## 1. Estados

Cada agente ocupa um estado exclusivo: `S`, `E`, `I`, `H`, `R` ou `D`.

`S + E + I + H + R + D = N` em todos os dias da simulação.

## 2. População persistente e topologia

A população aceita de 10 a 30.000 agentes. Para a mesma configuração e seed, `makeCity(cfg)` produz a mesma população sintética.

Cada agente recebe idade, domicílio interno `householdId`, marcador residencial `visualHome`, escola, trabalho, mercado, destino comunitário, hospital e atributos ocupacionais.

Quando `spatialModel` é fornecido pela interface, os locais públicos usam os IDs reais do SVG. Os domicílios internos permanecem distintos mesmo quando vários são associados ao mesmo marcador residencial. Assim, um nó visual pode representar vários domicílios, mas os contatos familiares ocorrem somente dentro do mesmo `householdId`.

## 3. Rotina temporal

O passo epidemiológico agregado continua diário, porém os contatos são processados em quatro blocos ordenados:

1. `home_morning`;
2. `daytime`;
3. `evening_outing`;
4. `home_night`.

De manhã e à noite, agentes vivos e não hospitalizados convivem em seus domicílios. Em dias úteis, estudantes frequentam a escola e trabalhadores o trabalho quando não há medida que os remova. Pessoas sem destino diurno ou afetadas por fechamento/home office permanecem em casa. No fim do dia, agentes não restritos podem realizar uma saída de varejo ou comunidade.

A probabilidade diária de realizar a saída comunitária está em `scenario_assumptions.routine_outing_probability`. Esses valores são **hipóteses do jogo**, não estimativas das bases fornecidas.

## 4. Contatos e transmissão

Para suscetível `i`:

`h_i(t)=Σ_j beta × horas_ij × expansão × suscetibilidade_i × (1-proteção_i)`

`P(infecção_i,t)=1-exp[-h_i(t)]`.

A frequência e mistura etária vêm das matrizes brasileiras por ambiente. A duração é sorteada das distribuições POLYMOD. A camada interna `household` usa explicitamente a matriz/duração `home`.

Não existe um número determinístico de minutos que garanta infecção. Cada infecção secundária registra dia, bloco temporal, agente fonte, camada, local interno, nó visual e duração do encontro usada no cálculo.

Um agente infectado em um bloco entra em `E` e não transmite retroativamente no mesmo dia.

## 5. Paciente zero

A configuração aceita `initialSeedAgentId`, `initialSeedRegion`, `initialSeedContext` e `initialSeedPlaceId`.

Quando `initialSeedAgentId` é informado, essa pessoa é o paciente zero exato. A interface prepara a população e executa o surto com a mesma seed, preservando a identidade, família e destinos do agente escolhido.

## 6. Intervenções

São suportadas `school_closure`, `remote_work`, `workplace_closure`, `retail_limit`, `community_closure`, `mobility_restriction`, `lockdown`, `case_isolation`, `bridge_closure` e alterações de capacidade hospitalar.

Na v2.1, fechar uma escola desloca o estudante para casa no período diurno; home office faz o mesmo para o trabalhador elegível; fechamento de comércio/lazer remove a saída correspondente; lockdown restringe escola, trabalho não essencial e saídas, mas não elimina a convivência familiar.

Percentuais de casos evitados são resultados do cenário simulado, não eficácia causal real.

## 7. Hospital, alerta e vacina

A progressão clínica e o alerta hospitalar seguem o conjunto v2. A interface usa sempre a expressão **alerta de epidemia simulada**.

A vacinação permanece configurável e seus valores não calibrados continuam explicitamente hipotéticos.

## 8. Reprodutibilidade e testes

Os testes automatizados cobrem conservação, reprodutibilidade, beta zero, fechamento escolar, lockdown, importação externa, fluxo hospitalar, paciente zero exato, residência visual persistente, blocos temporais e transmissão familiar usando a matriz `home`.

Executar:

```bash
node simulator/tests/test_engine.mjs
```

## 9. Limitações

- as três pontes ainda não são individualizadas na rotina espacial;
- deslocamento é representado por mudança de presença entre locais, não por movimento contínuo nas ruas;
- a probabilidade diária de saída comunitária é hipótese do jogo;
- SIVEP 2019–2024 ainda não foi harmonizado ao conjunto clínico publicado;
- beta, latência, duração infecciosa, eficácia vacinal e efeitos causais de políticas continuam parcialmente ou não identificados.

Consulte [CALIBRACAO_V2.md](CALIBRACAO_V2.md) antes de interpretar resultados.
