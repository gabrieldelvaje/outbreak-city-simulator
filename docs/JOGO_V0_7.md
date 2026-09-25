# OUTBREAK — Jogo V0.7

## Escopo

A campanha acompanha 360 dias e quatro fases de onda de aproximadamente 90 dias. Como quatro ondas em 360 dias são incompatíveis com uma divisão literal por semestre, a implementação interpreta o requisito como **quatro ciclos ao longo do ano**, aproximadamente trimestrais.

A transmissibilidade é sempre alta na interface.

## Abertura

O mapa permanece visível atrás de um overlay escurecido.

A janela inicial pede:

- nome da cidade;
- população de 10 a 20.000;
- vírus.

Ao confirmar, a população é distribuída. A janela desaparece e uma mensagem sobre o mapa pede a escolha do epicentro. O jogador abre uma residência/local, escolhe uma pessoa no grafo e habilita **Iniciar surto**.

Somente após iniciar o HUD lateral aparece.

## Tempo

O contador roda continuamente e rapidamente, de Dia 001 / 360 a Dia 360 / 360.

O HUD mostra a onda atual e indicadores de transmissão, hospital, óbitos, reinfecções e vacinação.

## Ondas

As quatro fases são:

- onda 1: dias 0–89;
- onda 2: 90–179;
- onda 3: 180–269;
- onda 4: 270–359.

Cada fase usa uma curva suave entre multiplicador de vale e pico. A primeira e a segunda são configuradas como mais fortes; doses posteriores e decisões podem reduzir os desfechos observados.

O formato é hipótese do jogo.

## Sala de crise

As políticas públicas aparecem em modais sobre o mapa. Os checkpoints dinâmicos são espaçados para reduzir alertas muito próximos; eventos críticos de hospital podem interromper imediatamente.

Há também checkpoints fixos de onda e vacinação.

## Capacidade hospitalar

**Ampliar leitos** adiciona 25% da capacidade existente no dia da decisão e pode ser utilizada novamente em uma crise futura.

Casos graves sem vaga acumulam dias sem atendimento. A mortalidade do cenário cresce com esses dias. O painel mostra separadamente os óbitos que ocorreram após atendimento negado.

Não se atribui causalmente um óbito a uma política específica; políticas alteram contatos/capacidade e seus desfechos são comparados dentro do cenário.

## Vacinação

A 1ª dose torna-se uma opção na 2ª onda.

A 2ª dose aparece em uma janela posterior e exige primeira dose.

A 3ª dose/reforço aparece mais tarde e exige segunda dose. Ela representa um cenário de reforço/atualização frente a cepas/variantes.

Os valores de eficácia são hipóteses de jogo, não parâmetros de uma vacina comercial real.

## Testes

Os testes verificam:

- teto de 20.000 agentes;
- campanha padrão de 360 dias;
- quatro números de onda;
- transmissibilidade alta na interface;
- três campanhas vacinais sequenciais;
- atendimento negado e óbitos associados;
- overlays de configuração e decisão;
- checkpoints anuais de ondas e doses;
- conservação e reprodutibilidade do motor.
