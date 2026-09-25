# OUTBREAK — análise dos dados e calibração parcial do motor v2

**Data da análise:** 25/09/2026  
**Versão do conjunto de parâmetros:** `2.0.0`  
**Versão do motor:** `2.0.0-data-informed`

> Esta entrega substitui parte das hipóteses do motor v1 por distribuições e taxas derivadas diretamente das bases fornecidas ao projeto. A calibração é **parcial**: transmissão absoluta por hora, período latente/infeccioso, eficácia causal de políticas e eficácia vacinal não são identificáveis nos arquivos disponíveis e continuam como parâmetros de sensibilidade explicitamente marcados.

## 1. Bases utilizadas

A análise usa os arquivos fornecidos ao projeto, sem redistribuir os microdados no repositório:

- `age_distribution.csv` e matrizes `contacts_matrix_{home,school,work,community,all}.csv` — distribuição etária do Brasil e matrizes de contato Prem 2021;
- `2008_Mossong_POLYMOD_contact_common.csv`, `participant_common.csv`, `hh_common.csv` e dicionário — forma da distribuição de duração de contatos e fração de contato físico;
- `PNAD_COVID_052020.zip` a `PNAD_COVID_112020.zip` + dicionário — composição domiciliar, trabalho, trabalho remoto, afastamento por distanciamento, procura por atendimento e hospitalização autorreferida;
- `INFLUD25-14-09-2026.csv` + dicionário SIVEP-Gripe — atraso sintomas→internação, UTI, evolução e classificação etiológica de SRAG em 2025;
- `Leitos_2025.csv` — capacidade cadastrada de leitos e UTI no CNES;
- WHO COVID, FluNet, FluID, incidência, cobertura, MERS e OxCGRT — validação de contexto/linhagem e regras de interpretação; não são convertidos automaticamente em beta, IFR ou efeito causal de políticas.

Os Parquet SIVEP 2019–2024 permanecem como insumos de validação. O conjunto v2 publicado aqui usa o CSV 2025 para os microparâmetros clínicos porque a harmonização dos esquemas anuais ainda não foi incorporada ao pipeline reproduzível. Isso evita misturar anos com definições/campos diferentes sem tratamento explícito.

## 2. População sintética

O motor mantém `10 <= N <= 30.000` agentes.

A distribuição etária brasileira fornecida foi agregada em:

| Faixa do motor | Probabilidade |
| --- | ---: |
| criança (0–17) | 0,23998 |
| adulto (18–64) | 0,65167 |
| idoso (65+) | 0,10835 |

A composição dos domicílios vem da PNAD COVID novembro/2020, ponderada por `V1032` na pessoa de referência do domicílio. O arquivo de parâmetros preserva a distribuição completa dos padrões criança/adulto/idoso em vez de forçar domicílios de 1–4 pessoas como no v1.

Parâmetros comportamentais também derivados da PNAD incluem probabilidade de ocupação por idade, frequência escolar de 6–17 anos, participação de profissionais de saúde e professores e indicadores mensais de trabalho remoto/distanciamento.

## 3. Rede de contatos

As matrizes Prem 2021 do Brasil foram agregadas das 16 faixas de cinco anos para as três faixas do motor, ponderadas pela distribuição etária brasileira.

Média ponderada de contatos por pessoa/dia:

| Camada | contatos/dia |
| --- | ---: |
| casa | 5,301 |
| escola | 1,579 |
| trabalho | 2,255 |
| comunidade | 5,301 |
| total | 14,436 |

O motor não usa apenas esses totais: `calibrated_parameters_v2.json` armazena a matriz 3×3 de mistura etária de cada camada, permitindo que a idade do agente influencie com quem ele tende a se encontrar.

## 4. Duração dos encontros

O POLYMOD é usado **somente para a forma da duração dos contatos**, porque é um estudo europeu; a frequência e mistura etária vêm das matrizes brasileiras.

Categorias utilizadas: `<5 min`, `5–15 min`, `15–60 min`, `1–4 h`, `>4 h`. Para cálculo no motor foram adotados representantes de 0,0417 h, 0,1667 h, 0,625 h, 2,5 h e 5 h. O último intervalo é aberto, portanto 5 h é aproximação computacional e deve ser testada em sensibilidade.

Duração média implícita pelos representantes:

| Camada | horas/contato |
| --- | ---: |
| casa | 3,079 |
| escola | 2,882 |
| trabalho | 1,587 |
| comunidade | 1,222 |

A transmissão continua probabilística:

`h_i = Σ beta × horas_ij × expansão_da_amostra × suscetibilidade_i × (1 − proteção_i)`

`P(infecção_i)=1−exp(−h_i)`.

Não existe um número fixo de minutos após o qual a infecção é garantida.

## 5. PNAD COVID — comportamento e atendimento

A análise mensal maio–novembro/2020 preserva os pesos amostrais. Entre os indicadores usados pelo motor/validação:

- trabalho remoto entre pessoas que trabalharam: aproximadamente 8,9%–13,0% no período;
- afastamento do trabalho por distanciamento: aproximadamente 4,5%–18,7%;
- razão horas efetivamente trabalhadas / horas habituais: aproximadamente 0,882–0,948;
- participação de profissionais de saúde entre ocupados: aproximadamente 3,87%–4,03%;
- procura por serviço de saúde entre pessoas com sintomas respiratórios definidos pelo questionário: aproximadamente 15,7%–28,6%;
- hospitalização entre pessoas com sintomas respiratórios: aproximadamente 0,47%–1,45%.

Esses valores são **observações comportamentais**, não estimativas causais de lockdown/home office. O motor usa intervenções para modificar a própria rede de encontros; não aplica “X% de eficácia” diretamente a partir da PNAD ou OxCGRT.

## 6. Capacidade hospitalar

A competência 202512 do CNES foi usada como referência de estoque cadastrado, não de disponibilidade em tempo real:

| capacidade | por 100 mil |
| --- | ---: |
| leitos existentes | 246,90 |
| leitos SUS | 166,80 |
| UTI existente | 30,93 |
| UTI SUS | 15,24 |

Para N=30.000, a referência bruta equivale a ~74 leitos existentes e ~9 leitos de UTI existentes. O cenário continua sobrescrevível, porque leito cadastrado não é sinônimo de leito livre/operacional.

## 7. SIVEP-Gripe 2025 — progressão clínica

Foram usados `DT_SIN_PRI`, `DT_INTERNA`, `UTI`, `DT_ENTUTI`, `DT_SAIDUTI`, `CLASSI_FIN`, `EVOLUCAO`, `DT_EVOLUCA`, idade e marcadores etiológicos. Registros com datas incompatíveis ou ausentes são excluídos do cálculo específico correspondente, sem transformar ausência em zero.

Três perfis clínicos são disponibilizados: influenza, COVID-19 e VSR. O motor usa distribuições empíricas discretas de 0–30 dias para sintomas→hospital e hospital→desfecho, estratificadas em criança/adulto/idoso.

Resumo condicionado aos casos hospitalizados registrados no SIVEP 2025:

| perfil | UTI criança | UTI adulto | UTI idoso | óbito criança | óbito adulto | óbito idoso |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| influenza | 20,66% | 34,04% | 32,54% | 1,49% | 13,35% | 19,44% |
| COVID-19 | 27,61% | 35,87% | 34,26% | 1,99% | 14,53% | 23,12% |
| VSR | 28,71% | 30,72% | 25,98% | 0,81% | 10,80% | 18,24% |

**Essas são proporções entre registros hospitalizados/SRAG, não IFR nem risco de morte de uma pessoa infectada.** O motor não pode convertê-las diretamente em mortalidade populacional sem um modelo de infecção→sintoma→procura→hospitalização.

## 8. Alerta de epidemia simulada

O hospital passa a funcionar como sensor tardio. A referência sazonal inicial usa as admissões SRAG registradas no SIVEP 2025 por semana epidemiológica e por 100 mil habitantes.

No v2, em cada janela móvel de sete dias:

1. converte-se a taxa da semana epidemiológica para o N da partida;
2. calcula-se o quantil superior de uma Poisson com `alpha=0,01`;
3. exige-se excesso em duas janelas consecutivas para emitir `game_alert`.

O alerta é rotulado como **alerta de epidemia simulada**, nunca como declaração oficial. Uma única série nacional de 2025 é uma referência provisória, não uma linha de base local multianual. Quando uma baseline local/multianual for incorporada, ela deverá substituir esse componente.

## 9. O que permanece não identificado

Os seguintes parâmetros **não** podem ser inferidos de forma defensável apenas das bases fornecidas:

- `beta` absoluto por hora efetiva de contato;
- duração latente e duração infecciosa;
- eficácia da vacina contra infecção/gravidade;
- IFR;
- efeito causal isolado de fechar escola, home office ou lockdown;
- multiplicador de mortalidade por ausência de leito;
- prevalência infecciosa entre viajantes/importações.

Por isso, `calibrated_parameters_v2.json` guarda esses valores em `scenario_assumptions`/`unidentified`. Os níveis de beta 0,012 / 0,030 / 0,065 por hora continuam sendo **sensibilidade de cenário**, não estimativas empíricas.

## 10. Mudanças do motor v2

- composição domiciliar e idades data-informed;
- matrizes de contato 3×3 por camada e idade;
- duração sorteada de contatos por ambiente;
- perfis clínicos influenza/COVID/VSR com PMFs SIVEP;
- capacidade hospitalar escalada pelo CNES;
- alerta hospitalar sazonal por excesso;
- `lockdown` preservando contatos domésticos e removendo escola/trabalho não essencial/varejo/comunidade;
- `school_closure`, `remote_work`, `workplace_closure`, `retail_limit`, `community_closure`, `case_isolation`, `hospital_capacity_change`;
- importação externa opcional para permitir reintrodução do patógeno após controle;
- conservação `S+E+I+H+R+D=N` e reprodutibilidade por seed.

Ainda falta conectar casas/locais/rotas do motor ao SVG real e individualizar as três pontes como arestas do grafo da interface.

## 11. Testes e desempenho

`node simulator/tests/test_engine.mjs` testa:

- reprodutibilidade com mesma seed;
- conservação da população;
- beta zero sem transmissão secundária;
- escola fechada sem transmissão escolar;
- lockdown removendo escola/trabalho/varejo/comunidade, sem eliminar casa;
- reintrodução externa quando explicitamente habilitada;
- casos graves alcançando o hospital com atrasos clínicos;
- geração de resumo de múltiplas execuções.

Teste local adicional em 25/09/2026: N=30.000, 30 dias, perfil influenza, transmissão média — ~5,6 s e ~220 MB de pico no ambiente de execução usado para esta análise. Esse benchmark não garante desempenho igual em iPhone/Safari; a integração visual deve usar Web Worker/atualização agregada.

## 12. Reprodutibilidade e versionamento

O repositório versiona:

- `simulator/engine.mjs` — motor executável;
- `simulator/data/calibrated_parameters_v2.json` — todas as distribuições e parâmetros derivados;
- `simulator/tests/test_engine.mjs` — invariantes e cenários mínimos;
- este documento — transformação, interpretação e limites;
- documentação geral do modelo e protocolo de vigilância/decisão.

Os microdados brutos não são copiados para o GitHub. Para reproduzir integralmente a calibração, é necessário usar os arquivos originais nas versões indicadas, preservar os pesos e filtros descritos e comparar o JSON produzido com o arquivo versionado. A próxima evolução do pipeline deve incluir harmonização explícita SIVEP 2019–2024 e uma baseline hospitalar multianual/local.