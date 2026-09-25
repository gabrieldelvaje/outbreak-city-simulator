# OUTBREAK — City Network Simulator

Simulador experimental de transmissão em uma cidade **inteiramente fictícia**, com mapa vetorial 2D e motor epidemiológico baseado em agentes sintéticos.

## Estado atual

- Mapa interativo publicado em GitHub Pages.
- Motor matemático **v2 data-informed** em `simulator/engine.mjs`.
- População configurável entre **10 e 30.000 agentes**.
- Estrutura etária e matrizes de contato do Brasil, duração de contatos POLYMOD, comportamento PNAD COVID, progressão clínica SIVEP-Gripe 2025 e capacidade hospitalar CNES foram incorporados ao conjunto `simulator/data/calibrated_parameters_v2.json`.
- O motor continua separado do SVG: paciente zero escolhido no mapa, rotas reais e bloqueio individual das três pontes ainda precisam ser conectados à simulação.

## Documentação científica

- [Análise e calibração v2](simulator/docs/CALIBRACAO_V2.md) — bases usadas, transformações, parâmetros, resultados, limitações e benchmark a 30 mil agentes.
- [Modelo matemático e metodologia](simulator/docs/MODELO_E_METODOLOGIA.md) — equações, estados, rede, hospital, alerta e interpretação.
- [Protocolo completo de vigilância, transmissão e decisões](docs/METODO_COMPLETO_VIGILANCIA_TRANSMISSAO_DECISOES.md).
- [Especificação do jogo e integração](docs/ESPECIFICACAO_JOGO_E_INTEGRACAO.md).
- [Parâmetros e limites das bases](docs/PARAMETROS_E_LIMITES_DAS_BASES.md).

## Motor v2

O motor combina uma rede temporal de contatos com estados `S/E/I/H/R/D`. Para cada suscetível, o risco diário acumulado usa:

`P(infecção)=1-exp(-Σ beta × duração_do_contato × peso_da_amostragem × suscetibilidade × proteção)`.

A frequência e mistura etária dos contatos vêm das matrizes brasileiras; a duração é sorteada por ambiente; a progressão até hospital/desfecho usa distribuições derivadas do SIVEP-Gripe 2025. O hospital pode emitir um **alerta de epidemia simulada** quando admissões excedem uma referência sazonal de SRAG do conjunto de parâmetros.

**Importante:** `beta` absoluto, duração latente/infecciosa, eficácia vacinal e efeitos causais isolados de lockdown/escola/home office continuam como hipóteses de sensibilidade, porque as bases fornecidas não identificam esses valores diretamente.

## Executar

Da raiz do repositório, com Node 20+:

```bash
node simulator/tests/test_engine.mjs
node simulator/examples/run_example.mjs
```

No código:

```js
import {configFromProfile, simulate} from './simulator/engine.mjs';

const parameters = await fetch('./simulator/data/calibrated_parameters_v2.json').then(r => r.json());
const config = configFromProfile(parameters, 'medium', {
  population: 30000,
  pathogenId: 'influenza',
  seed: 42,
  days: 180
});
const result = simulate(config);
```

## Mapa

Página: https://gabrieldelvaje.github.io/outbreak-city-simulator/

As pontes Norte, Central e Sul já possuem controles visuais no mapa. **Esses controles ainda não recalculam rotas do motor**; a integração espacial será a próxima etapa.

## Limite científico

O projeto é educacional e exploratório. Resultados são sintéticos e não constituem previsão médica, declaração epidemiológica oficial nem estimativa causal de políticas públicas reais.
