# OUTBREAK — City Network Simulator

Simulador experimental de transmissão em uma cidade **inteiramente fictícia**, com mapa vetorial 2D e um motor de infecção baseado em agentes sintéticos. A experiência pretende mostrar a defasagem entre transmissão invisível, sintomas, busca por atendimento, identificação do surto e decisões que mudam os contatos e a mobilidade.

## Mapa interativo (GitHub Pages)

- Cidade 2D baseada na referência vetorial do projeto, com rio, três pontes, bairros, residências e locais públicos.
- Zoom, seleção de locais, grafos ilustrativos e controles **ainda apenas visuais** das pontes.
- Página: https://gabrieldelvaje.github.io/outbreak-city-simulator/

## Motor matemático — implementação atual v1

O **código executável já está no repositório**: [simulator/README.md](simulator/README.md), [simulator/engine.mjs](simulator/engine.mjs), [parâmetros hipotéticos](simulator/data/hypothetical_profiles.json), [metodologia do motor v1](simulator/docs/MODELO_E_METODOLOGIA.md), [testes](simulator/tests/test_engine.mjs) e [linhagem histórica resumida](simulator/data/historical_provenance.json). É um protótipo estocástico individual com estados S/E/I/H/R/D, contatos por tipo de local, internação, detecção, vacinação e intervenções configuráveis. Permite entre **10 e 30.000 agentes**; este é o teto da próxima interface, condicionado a testes de desempenho no navegador.

Para executar a partir da raiz do projeto (Node 20+):

```bash
node simulator/tests/test_engine.mjs
node simulator/examples/run_example.mjs
```

**Estado da integração:** o motor produz séries e eventos sintéticos **isoladamente**, mas não está associado às pessoas e construções do SVG. Os bloqueios de pontes no site ainda não recalculam rotas nem contágios. A v1 não implementa linha de base histórica de atendimentos hospitalares, transmissão por fase pré-sintomática separada, reinfecção ou importações externas; esses itens são requisitos da v2.

## Documentação científica e regras de jogo (além deste README)

- **[Protocolo completo de vigilância, transmissão, decisões, reabertura, análise contrafactual e reprodutibilidade](docs/METODO_COMPLETO_VIGILANCIA_TRANSMISSAO_DECISOES.md)** — documento de referência da v2: define o hospital como sensor tardio, o alerta por atendimentos acima de uma linha de base comparável, as medidas como mudanças de rede (mantendo contatos familiares), a possibilidade condicional de nova onda, os indicadores finais e quais bases adicionais devem ser obtidas. Explicita fórmulas, variáveis, métodos, fontes, incertezas, testes e o **estado ainda não implementado**.
- [Especificação da interface, grafo e 30 mil agentes](docs/ESPECIFICACAO_JOGO_E_INTEGRACAO.md).
- [Parâmetros identificáveis e limites das bases fornecidas](docs/PARAMETROS_E_LIMITES_DAS_BASES.md).
- [Modelo executável v1 e suas hipóteses](simulator/docs/MODELO_E_METODOLOGIA.md).

**Diferença entre epidemia e pandemia:** o jogo se passa em uma única cidade e só pode emitir um **alerta fictício de epidemia local**. Não declarará uma pandemia mundial com base na ocupação de um hospital. A regra anterior de “20 casos por 100 mil/7 dias” era um exemplo demonstrativo e não deve ser tratada como limiar oficial ou linha de base observada. A v2 especifica comparação do volume de atendimentos respiratórios com o esperado para o mesmo sistema, estação e população de referência; depende de dados e validação antes de ser habilitada como método empírico.

**Limite científico:** as séries da OMS e as políticas OxCGRT são observações históricas; β por contato, incubation/contagiosidade, gravidade por idade, risco de óbito e eficácia causal das medidas **não estão calibrados automaticamente** com esses arquivos. Percentuais de casos evitados no jogo serão diferenças **entre distribuições de simulações**, não estimativas de efeitos reais de políticas. Não utilizar os resultados como previsão médica ou decisão sanitária real.

## Publicação

GitHub Pages publica a raiz da branch `main`, usando `index.html`. O diretório `simulator/` funciona independentemente como módulo ES JavaScript no navegador ou Node, sem backend.
