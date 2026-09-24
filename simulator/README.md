# OUTBREAK — motor de infecção v1

Motor matemático **executável e reprodutível** de infecção respiratória sintética, independente do SVG e sem backend: ES modules JavaScript, compatível com Node 20+ ou navegador moderno. Esta pasta incorpora o protótipo já preparado no pacote `OUTBREAK_motor_completo_v1` do projeto, além de sua configuração, teste e rastreabilidade das bases epidemiológicas.

**Importante:** os perfis de transmissibilidade baixa/média/alta e TODAS as probabilidades clínicas, tempos, proteção vacinal, contatos e capacidade são **hipóteses demonstrativas editáveis**, não parâmetros ajustados estatisticamente às séries observacionais carregadas. Não interpretar os resultados como previsões ou evidência de eficácia real de medidas.

## Arquivos

- [`engine.mjs`](engine.mjs): agentes, rede temporal por domicílio/escola/trabalho/mercado/praça/hospital, transmissão, progressão S/E/I/H/R/D, capacidade hospitalar, detecção, vacinação, intervenções, resultados diários e resumos entre sementes.
- [`data/hypothetical_profiles.json`](data/hypothetical_profiles.json): cenários e valores hipotéticos explicitados, sem calibração clínica.
- [`data/historical_provenance.json`](data/historical_provenance.json): linhagem, dimensões e limites de interpretação das 7 fontes históricas consolidadas (somente metadados, não pessoas ou parâmetros calibrados).
- [`docs/MODELO_E_METODOLOGIA.md`](docs/MODELO_E_METODOLOGIA.md): equação, hipóteses, unidades, fontes, limitações e plano para integrar o motor aos nós do mapa.
- [`tests/test_engine.mjs`](tests/test_engine.mjs): conservação de pessoas, semente, risco zero, contato por escola/trabalho, pontes, atendimento, vacinas, alerta e validação.
- [`examples/run_example.mjs`](examples/run_example.mjs): execução sintética demonstrativa e 10 sementes.

## Como executar

Da raiz do repositório:

```bash
node simulator/tests/test_engine.mjs
node simulator/examples/run_example.mjs
```

O módulo pode ser importado no navegador, sem instalar biblioteca nem enviar dados pessoais:

```js
import {simulate,configFromProfile} from './simulator/engine.mjs';
const profiles=await fetch('./simulator/data/hypothetical_profiles.json').then(r=>r.json());
const scenario=configFromProfile(profiles,'medium',{population:1200,seed:42,days:120});
const result=simulate(scenario);
console.log(result.daily,result.events,result.summary);
```

`simulate()` roda todo o horizonte e devolve `daily` (séries), `events` (contágios, altas, hospitalização, notificação, vacinação e alertas), `summary` e `city` sintéticos. `simulate(config,{onDay})` aceita callback a cada dia, mas a execução completa ainda é síncrona; Play/Pause/Step em tempo real será outro trabalho.

## Como o contágio é calculado

`P_i(t) = 1 − exp[− Σ_j β × horas_de_contato × suscetibilidade_relativa_i × (1 − proteção_vacinal_i)]`. O somatório percorre contatos simulados do suscetível `i` com fontes infecciosas `j` nas camadas ativas do dia. Não há transmissão fora de encontro elegível nesta implementação. `beta` é uma hipótese por **hora de contato efetivo**, não uma taxa epidemiológica observada. O tempo de latência, duração infecciosa, gravidade, recuperação, morte, detecção e vacina vêm do perfil editável. `S+E+I+H+R+D=N` em cada dia; o estado `D` só representa óbitos atribuídos ao surto fictício.

## Situação da integração com o mapa atual

**O motor está comitado, mas ainda não está ligado aos botões e nós do site.** Seu gerador cria ID/estrutura de casas, escolas e regiões abstratos independentes da planta SVG. Em particular, `bridge_closure` bloqueia genericamente viagens sintéticas entre margens, **não** identifica qual das três pontes Norte/Central/Sul está fechada, nem encontra rota alternativa. Fechar uma ponte no mapa hoje continua sendo uma ação visual; para afetar a curva de infecção será necessário vincular o estado das três pontes à rede real de mobilidade, associar pessoas aos edifícios existentes e expor o relógio ao site.

## Bases históricas e limites

Os anexos de pesquisa incluem OMS COVID-19, OxCGRT, OMS FluNet, OMS FluID, OMS incidência anual de doenças imunopreveníveis, OMS/UNICEF cobertura vacinal e OMS MERS. Os dados têm granularidades e denominadores diferentes e **não devem ser convertidos automaticamente em β, R0, IFR, eficácia de tratamento/vacina ou duração de uma doença**. O histórico consolidado e os agregados globais permanecem no pacote de pesquisa offline, para não colocar dezenas de MB de observações mundiais no carregamento inicial do mapa. O motor não depende de download desses arquivos para funcionar.

Para detalhes de linhagem, equações e limites, consulte a [metodologia](docs/MODELO_E_METODOLOGIA.md). A etapa futura de calibração específica por patógeno exigirá referências clínicas independentes, demografia/matrizes de contatos compatíveis e validação fora da amostra.
