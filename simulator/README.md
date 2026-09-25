# OUTBREAK — motor epidemiológico v2

Motor estocástico em JavaScript, sem dependências de runtime, compatível com Node 20+ e navegador moderno.

## Arquivos principais

- [`engine.mjs`](engine.mjs) — motor v2.
- [`data/calibrated_parameters_v2.json`](data/calibrated_parameters_v2.json) — parâmetros e distribuições data-informed.
- [`docs/CALIBRACAO_V2.md`](docs/CALIBRACAO_V2.md) — análise completa, transformações e limites.
- [`docs/MODELO_E_METODOLOGIA.md`](docs/MODELO_E_METODOLOGIA.md) — especificação matemática atual.
- [`tests/test_engine.mjs`](tests/test_engine.mjs) — invariantes e cenários mínimos.
- `data/hypothetical_profiles.json` — preservado como configuração histórica do v1; para novos cenários prefira o conjunto v2.

## O que foi incorporado

A v2 usa:

- distribuição etária brasileira e composição domiciliar ponderada;
- matrizes de contato Brasil por idade e camada `home/school/work/community`;
- distribuição de duração de contatos por ambiente do POLYMOD;
- PNAD COVID para indicadores de trabalho, home office, distanciamento e procura de atendimento;
- SIVEP-Gripe 2025 para atraso sintomas→hospital, duração até desfecho, UTI e mortalidade **condicionada à hospitalização/SRAG**;
- CNES Leitos 2025 para capacidade de referência;
- baseline sazonal de admissões SRAG para o alerta fictício do jogo.

## Executar

```bash
node simulator/tests/test_engine.mjs
node simulator/examples/run_example.mjs
```

Exemplo:

```js
import {configFromProfile, simulate} from './simulator/engine.mjs';

const params = await fetch('./simulator/data/calibrated_parameters_v2.json').then(r => r.json());
const config = configFromProfile(params, 'medium', {
  population: 10000,
  pathogenId: 'influenza',
  seed: 20260925,
  days: 180
});
const result = simulate(config);
console.log(result.daily, result.events, result.summary);
```

Perfis clínicos disponíveis no conjunto v2: `influenza`, `covid19` e `rsv`.

## Limites

A calibração é parcial. As bases não identificam `beta` por hora, latência, duração infecciosa, IFR, eficácia de vacina nova nem o efeito causal isolado de políticas. Esses componentes permanecem parâmetros explícitos de cenário/sensibilidade.

O motor ainda usa regiões abstratas. Casas, paciente zero, rotas reais e cada ponte do SVG serão conectados numa etapa posterior.
