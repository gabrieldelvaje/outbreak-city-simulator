# OUTBREAK — City Network Simulator

Simulador experimental de transmissão em uma cidade **inteiramente fictícia**, com mapa vetorial 2D e um motor de infecção baseado em agentes sintéticos, documentado e versionado separadamente.

## Mapa interativo (GitHub Pages)

- Cidade 2D baseada na referência vetorial do projeto, com rio, três pontes, bairros, residências e locais públicos.
- Zoom, seleção de locais, grafos ilustrativos e controles visuais de pontes.
- Página: https://gabrieldelvaje.github.io/outbreak-city-simulator/

## Motor matemático de infecção — implementação v1

O **código executável já está no repositório**: [simulator/README.md](simulator/README.md), [simulator/engine.mjs](simulator/engine.mjs), [parâmetros hipotéticos](simulator/data/hypothetical_profiles.json), [metodologia e fontes](simulator/docs/MODELO_E_METODOLOGIA.md), [testes](simulator/tests/test_engine.mjs) e [linhagem dos dados históricos](simulator/data/historical_provenance.json). É um modelo estocástico individual com estados S/E/I/H/R/D, rede de contatos por tipo de local, atenção hospitalar, detecção, vacinação e intervenções configuráveis.

Para executar a partir da raiz do projeto (Node 20+):

```bash
node simulator/tests/test_engine.mjs
node simulator/examples/run_example.mjs
```

**Estado da integração:** o motor já pode produzir séries e eventos sintéticos **isoladamente**, mas ainda não está conectado às pessoas e construções do SVG nem aos botões do mapa. Em especial, a v1 calcula bloqueio genérico de travessias entre margens; abrir ou bloquear uma das três pontes na interface **ainda não recalcula o surto**. Essa conexão do grafo viário real, o relógio Play/Pause/Step e a projeção dos resultados no mapa são os próximos trabalhos.

**Limite científico:** as bases históricas da OMS e OxCGRT são referências observacionais distintas dos parâmetros demonstrativos da cidade. β por contato, incubação, períodos, riscos por idade, eficácia da vacina e impactos de medidas do simulador **não foram calibrados** com os arquivos enviados. Não utilizar o modelo para previsão médica ou efeitos causais no mundo real.

## Publicação

GitHub Pages está configurado para publicar a raiz da branch `main`, usando `index.html`. O diretório `simulator/` funciona independentemente como módulo ES JavaScript no navegador ou Node, sem backend.
