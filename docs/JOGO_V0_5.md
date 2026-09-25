# OUTBREAK — V0.5: reinfecções e ondas

**Motor:** `2.3.0-reinfection-waves`.

## Objetivo

A V0.4 permitiu a disseminação entre bairros, mas um surto ainda podia desaparecer rapidamente quando a primeira geração de infectados se recuperava.

A V0.5 remove a hipótese implícita de imunidade natural permanente.

## Ciclo individual

Depois da primeira infecção:

`S → E → I → R`.

O recuperado recebe uma janela temporária de imunidade. Ao final:

`R → S`.

Se essa pessoa for infectada novamente, o evento é registrado como reinfecção e `infectionCount` aumenta.

## Novas ondas

O jogo não cria uma onda em uma data fixa.

Novas ondas podem emergir quando coincidem:

- recuperados retornando à suscetibilidade;
- pessoas nunca infectadas;
- circulação entre bairros;
- tentativas de introdução externa;
- ausência ou baixa cobertura vacinal.

Com isso, uma curva que caiu pode voltar a crescer sem intervenção do jogador.

## Reintrodução externa

Cada perfil possui uma taxa de tentativas por 1.000 habitantes/dia. O número diário é amostrado com Poisson.

A tentativa não garante infecção: quando a pessoa sorteada já possui proteção vacinal ativa, a introdução pode ser bloqueada.

## Vacinação

A vacinação passa a aceitar suscetíveis e recuperados.

Em recuperados, a vacinação não altera imediatamente o estado `R`; ela cria proteção para quando a imunidade natural terminar.

Isso permite usar a vacina como mecanismo de redução das ondas futuras em vez de simplesmente encerrar a epidemia por regra.

## Interface

O painel agora mostra:

- novos episódios do dia;
- percentual de pessoas únicas que já foram infectadas;
- reinfecções acumuladas;
- bairros atingidos;
- ativos, internados, leitos e óbitos.

O percentual “Já infectados” não cai quando alguém perde imunidade: ele é calculado por pessoas únicas que já tiveram ao menos um episódio.

## Parâmetros atuais

Os intervalos de imunidade e as taxas de reintrodução são cenários computacionais, não estimativas derivadas das bases.

Eles estão documentados no JSON e em `simulator/docs/CALIBRACAO_V2.md`.

## Testes

O conjunto de testes exige que:

1. um recuperado volte a `S` após a janela configurada;
2. uma reintrodução posterior possa produzir reinfecção;
3. o output diário contabilize reinfecções;
4. vacinação com proteção total em um cenário controlado reduza reinfecções;
5. conservação e demais invariantes continuem válidas.

## Próxima etapa

A principal limitação espacial continua sendo o roteamento físico pelas três pontes. A principal evolução epidemiológica futura é calibrar imunidade/reinfecção com fontes específicas por patógeno em vez de manter esses intervalos como hipóteses de jogo.
