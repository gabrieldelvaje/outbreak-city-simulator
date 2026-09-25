# OUTBREAK — City Network Simulator

Simulador experimental de transmissão em uma cidade **inteiramente fictícia**, com mapa vetorial 2D e motor epidemiológico baseado em agentes sintéticos.

## Primeira versão jogável — V0.2

O mapa e o motor v2 agora estão conectados em uma primeira experiência de jogo no GitHub Pages.

O usuário pode:

- escolher entre **10 e 30.000 agentes**;
- escolher Influenza, COVID-19 ou VSR;
- escolher transmissibilidade baixa, média ou alta;
- clicar numa residência ou local público para definir o **foco inicial**;
- iniciar, pausar, avançar dia a dia e alterar a velocidade;
- acompanhar atividade recente da infecção nos nós do mapa;
- observar expostos/infecciosos/internados, novos casos, leitos e óbitos;
- receber um **alerta de epidemia simulada** quando admissões hospitalares excedem a referência do motor;
- após o alerta, aplicar fechamento de escolas, home office, fechamento de lazer, restrição de comércio, lockdown ou um cenário de vacinação;
- recalcular o restante da trajetória mantendo a mesma configuração e semente.

A simulação roda em um **Web Worker**, evitando bloquear a interface enquanto o motor calcula populações maiores.

Página: https://gabrieldelvaje.github.io/outbreak-city-simulator/

## Como a integração funciona

O mapa possui sete distritos visuais. Na V0.2 eles são associados às regiões sintéticas do motor. O local escolhido pelo usuário define a região e o tipo de ambiente do primeiro caso:

- residência → domicílio;
- escola → camada escolar;
- empresa/prefeitura → trabalho;
- mercado/loja/restaurante → varejo;
- parque/praça → comunidade;
- hospital → profissional de saúde compatível quando disponível.

Os marcadores residenciais são **agregações visuais**. Portanto, escolher uma casa ancora o paciente zero naquele nó para a interface e no mesmo distrito para o motor, mas ainda não cria uma relação 1:1 permanente entre cada marcador e um único domicílio interno.

Os eventos gerados pelo motor são projetados de volta nos nós compatíveis do mesmo distrito. A intensidade visual considera infecções recentes, permitindo acompanhar a expansão espacial aproximada sem renderizar 30 mil pessoas simultaneamente.

## Motor epidemiológico

- Motor: [`simulator/engine.mjs`](simulator/engine.mjs)
- Parâmetros: [`simulator/data/calibrated_parameters_v2.json`](simulator/data/calibrated_parameters_v2.json)
- Análise/calibração: [`simulator/docs/CALIBRACAO_V2.md`](simulator/docs/CALIBRACAO_V2.md)
- Metodologia matemática: [`simulator/docs/MODELO_E_METODOLOGIA.md`](simulator/docs/MODELO_E_METODOLOGIA.md)
- Testes: [`simulator/tests/test_engine.mjs`](simulator/tests/test_engine.mjs)
- Primeira versão do jogo: [`docs/JOGO_V0_2.md`](docs/JOGO_V0_2.md)

A frequência e mistura etária dos contatos usam matrizes brasileiras; duração de contatos usa distribuições do POLYMOD; comportamento incorpora indicadores da PNAD COVID; progressão hospitalar usa SIVEP-Gripe 2025; capacidade hospitalar usa referência CNES.

## Limitações atuais da V0.2

As pontes Norte, Central e Sul **ainda não alteram as rotas do motor**. Os controles continuam visuais. A próxima etapa espacial é transformar cada ponte em uma aresta individual do grafo viário.

Também permanecem como cenários de sensibilidade os parâmetros não identificados diretamente pelas bases fornecidas, incluindo beta absoluto por hora, período latente/infeccioso e eficácia de uma vacina hipotética.

As decisões do jogador modificam a rede simulada. Seus percentuais de efeito são resultados daquele cenário sintético, e não estimativas causais de políticas reais.

## Executar os testes

```bash
node simulator/tests/test_engine.mjs
node simulator/examples/run_example.mjs
```

## Limite científico

OUTBREAK é um projeto educacional e exploratório. Resultados são sintéticos e não constituem previsão médica, declaração epidemiológica oficial nem recomendação de política pública.
