# OUTBREAK — V0.6: alertas progressivos e decisões recorrentes

**Motor epidemiológico:** `2.3.0-reinfection-waves`  
**Camada de jogo:** V0.6.

## Objetivo

A V0.5 parava a linha do tempo somente no primeiro alerta hospitalar. A V0.6 transforma a evolução da epidemia em uma sequência de **pontos de decisão**.

A partida continua normalmente enquanto não há um novo marco relevante. Quando a situação piora, a linha do tempo para exatamente no primeiro dia em que aquele marco aparece.

O jogador precisa escolher uma ação ou selecionar explicitamente `Continuar sem ação`.

## Marcos atuais

### 1. Hospital detectou a epidemia

Usa o `game_alert` do motor.

É o primeiro ponto de decisão obrigatório.

### 2. Disseminação ampla pela cidade

O jogo gera um novo ponto quando:

- pelo menos 75% dos bairros já foram atingidos; e
- ainda existe um número mínimo de casos ativos.

O objetivo é representar a passagem de um foco localizado para circulação urbana ampla.

### 3. Transmissão acelerando

Compara duas janelas consecutivas de 7 dias.

O marco aparece quando:

- a semana corrente possui volume mínimo de infecções; e
- os episódios da semana corrente são pelo menos 60% maiores que os da semana anterior.

### 4. Hospital sob pressão

Pausa quando a ocupação hospitalar atinge ou ultrapassa 50% da capacidade configurada.

### 5. Capacidade hospitalar crítica

Pausa quando a ocupação atinge ou ultrapassa 80%.

### 6. Nova onda em formação

O jogo acompanha a soma de novos episódios em janelas de 7 dias.

Depois de um pico, precisa ocorrer uma queda expressiva. Se, posteriormente, os episódios voltarem a crescer pelo menos 50% em relação à semana anterior e ultrapassarem um volume mínimo, um novo checkpoint de recrudescimento é criado.

O mecanismo pode gerar mais de uma nova onda durante a partida.

## Regras de interação

Quando um checkpoint é alcançado:

- a simulação para naquele dia;
- `Continuar` fica bloqueado;
- `+1 dia` fica bloqueado;
- as medidas disponíveis podem ser escolhidas;
- `Continuar sem ação` fica disponível.

A ausência de clique não é interpretada como decisão.

Quando o jogador responde, todos os checkpoints daquele mesmo dia ou anteriores são considerados tratados, evitando várias pausas sobrepostas no mesmo dia.

## Escolher uma intervenção

A medida entra em vigor no dia seguinte.

O cenário é recalculado com:

- a mesma população;
- a mesma seed;
- o mesmo paciente zero;
- as decisões anteriores;
- a nova intervenção.

Depois do recálculo, a linha do tempo continua automaticamente até o próximo ponto de decisão.

## Continuar sem ação

Nenhuma intervenção é adicionada.

A decisão fica registrada no histórico e a linha do tempo volta a correr imediatamente.

O botão pode ser usado novamente em checkpoints futuros; escolher não agir uma vez não significa escolher não agir pelo restante da partida.

## Intervenções entre checkpoints

Depois do primeiro alerta hospitalar, medidas ainda podem ser aplicadas mesmo quando a linha do tempo não está parada.

O botão `Continuar sem ação`, porém, existe apenas quando há um checkpoint obrigatório pendente.

## Natureza dos limiares

Os valores de 50% e 80% de ocupação, 75% dos bairros e os critérios de crescimento semanal são **mecânicas de progressão do jogo**.

Eles não são apresentados como:

- limites oficiais do Ministério da Saúde;
- critérios da OMS;
- protocolos hospitalares reais;
- estimativas causais derivadas das bases do projeto.

A função deles é criar momentos compreensíveis de gestão e comparação de escolhas dentro da cidade fictícia.

## Implementação

A detecção dos marcos foi isolada em:

`src/decision-checkpoints.js`.

A função `buildDecisionCheckpoints()` recebe a trajetória produzida pelo motor e devolve checkpoints ordenados por dia e severidade.

A função `nextDecisionCheckpoint()` impede que o relógio avance além do primeiro checkpoint ainda não respondido.

A interface mantém:

- `decisionCheckpoints`;
- `acknowledgedCheckpoints`;
- `currentDecisionCheckpoint`.

Isso permite recalcular a epidemia depois de uma intervenção sem repetir decisões já tomadas.

## Testes

`simulator/tests/test_decision_checkpoints.mjs` verifica que uma trajetória sintética de piora produz:

- alerta hospitalar;
- disseminação ampla;
- aceleração;
- pressão hospitalar;
- capacidade crítica;
- recrudescimento.

Também verifica que um checkpoint já respondido não bloqueia novamente a linha do tempo.

O contrato da interface testa que o estado `awaiting-decision` bloqueia a reprodução até uma resposta explícita.

## Limitações

Os checkpoints observam a trajetória já simulada e servem à mecânica do jogo.

A próxima melhoria pode transformar os alertas em um sistema ainda mais rico, com custos, comunicação pública, nível de confiança, disponibilidade de recursos e consequências econômicas de cada decisão.
