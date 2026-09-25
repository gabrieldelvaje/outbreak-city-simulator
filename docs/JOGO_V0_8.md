# OUTBREAK — Jogo V0.8

## Objetivo da revisão

A V0.8 corrige três pontos observados em teste manual:

1. mortalidade e pressão hospitalar estavam baixas demais mesmo após grande disseminação;
2. os marcadores cresciam de tamanho conforme a infecção;
3. o fim dos 360 dias não explicava o efeito das decisões tomadas.

## Gravidade e falta de leito

O cenário jogável aplica um multiplicador de gravidade explícito sobre o proxy de hospitalização usado pelo motor.

Casos graves continuam solicitando leito diariamente. Quando não há vaga:

- o agente acumula `careDeniedDays`;
- o evento `bed_denied` é registrado;
- existe um hazard diário sintético de morte durante a espera;
- se o agente morrer após falta de vaga, `deathAssociatedWithUnmetCare=true`.

O HUD mantém óbitos totais e óbitos após falta de leito separados.

Esses parâmetros são balanceamento do jogo, não taxas clínicas observadas.

## Cenário sem ação

O conjunto de testes possui uma campanha anual de alta transmissão com:

- nenhuma intervenção;
- nenhuma vacina;
- nenhuma ampliação de leito.

Esse cenário precisa produzir demanda hospitalar consequente, esgotamento da capacidade e mortalidade associada à falta de atendimento. Isso impede regressões para partidas em que a cidade inteira é infectada/reinfectada sem pressão clínica perceptível.

## Marcadores do mapa

As casas e locais públicos não mudam de tamanho.

O mapa usa somente cor:

- amarelo: baixa atividade recente;
- laranja: atividade intermediária;
- vermelho: atividade intensa.

O nível usa a quantidade de infecções dos últimos dez dias dividida pelo número de pessoas vinculadas ao nó, com salvaguardas por contagem absoluta.

## Relatório final

Ao chegar ao Dia 360, o jogo gera automaticamente um cenário contrafactual.

A nova execução preserva:

- população;
- vírus;
- seed;
- paciente zero;
- topologia e rotina sintéticas.

E remove:

- fechamento de escola;
- home office;
- restrição de comércio/lazer;
- lockdown;
- aumento de leitos;
- 1ª, 2ª e 3ª doses.

O relatório compara:

- pessoas infectadas ao menos uma vez;
- episódios totais;
- reinfecções;
- internações;
- pico de internados;
- dias de sobrecarga;
- pessoas sem leito;
- óbitos após falta de leito;
- óbitos totais.

Se o jogador só escolheu “Continuar sem ação”, os dois cenários devem coincidir sob a mesma seed.

Se houve intervenções, o relatório descreve reduções ou aumentos observados **dentro do modelo**.

## Limite de interpretação

O relatório não afirma que uma política pública real causaria a mesma redução. Ele compara duas trajetórias sintéticas controladas do OUTBREAK.
