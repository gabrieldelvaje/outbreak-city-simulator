# OUTBREAK — jogo V0.3: famílias, rotina e paciente zero individual

**Status:** implementado no GitHub Pages.  
**Motor:** `2.1.0-spatial-routines`.

## Objetivo

A V0.3 substitui o foco inicial abstrato por uma população persistente e inspecionável. O usuário primeiro define N e distribui a população. Só depois escolhe o paciente zero.

## Distribuição da população

O Worker executa `makeCity()` antes do surto. A mesma seed é reutilizada quando a epidemia começa.

Cada agente recebe idade, família, residência visual e destinos habituais. A composição das famílias usa os padrões domiciliares versionados no conjunto de parâmetros.

Como o mapa possui menos marcadores residenciais que o número potencial de domicílios em N alto, um marcador pode conter vários domicílios. Eles permanecem epidemiologicamente separados por `householdId`.

## Residência e grafo familiar

Ao clicar numa residência após distribuir a população, o inspetor mostra:

- total de residentes associados ao nó;
- quantidade de domicílios;
- composição etária;
- seletor de domicílio;
- grafo de convivência;
- lista das pessoas com idade e função;
- rotina habitual da pessoa selecionada.

As linhas do grafo significam convivência no mesmo domicílio. Não representam relações sociais inferidas fora de casa.

## Paciente zero individual

O jogador seleciona uma pessoa. A interface envia `initialSeedAgentId`, `initialSeedRegion`, `initialSeedContext` e `initialSeedPlaceId`.

O teste automatizado exige que o primeiro evento de infecção contenha exatamente o ID escolhido e o nó visual correspondente.

## Rotina do dia

| bloco | presença principal |
| --- | --- |
| `home_morning` | domicílio |
| `daytime` | escola, trabalho, hospital ou casa |
| `evening_outing` | varejo ou comunidade |
| `home_night` | domicílio |

A transmissão só ocorre entre agentes presentes no mesmo local/bloco e selecionados pelo mecanismo de contato da matriz correspondente.

## Intervenções e substituição de rotina

- fechar escola: o aluno deixa a escola e permanece em casa no período diurno;
- home office: trabalhador elegível permanece em casa;
- fechar comércio: remove a saída de varejo;
- fechar lazer: remove a saída comunitária;
- lockdown: restringe escola, trabalho não essencial e saídas, preservando contatos familiares e funções essenciais;
- hospitalizados não seguem a rotina comum.

Portanto, uma medida altera **onde as pessoas se encontram**, em vez de aplicar diretamente um percentual fixo de redução de doença.

## Visualização

Eventos de infecção carregam `visualPlace`. A interface colore o local do encontro no mapa. A cor representa atividade recente de infecção, não prevalência observada.

## Hipóteses de rotina

A probabilidade de realizar uma saída pós-escola/trabalho está versionada como 0,55 em dia útil e 0,72 em fim de semana. Esses valores estão explicitamente marcados como `GAME_ASSUMPTION_NOT_ESTIMATED_FROM_SUPPLIED_DATA`.

A frequência dos contatos continua vindo das matrizes brasileiras e a duração continua vindo do POLYMOD.

## Limitação espacial seguinte

As pontes ainda não são arestas individuais. A próxima etapa é conectar cada destino à malha viária e exigir rota pela Ponte Norte, Central ou Sul quando houver travessia de margem.
