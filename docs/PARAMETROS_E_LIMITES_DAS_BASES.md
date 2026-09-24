# OUTBREAK — Parâmetros, identificação e validação com os dados fornecidos

**Escopo v1:** 10–30.000 agentes sintéticos. Este documento distingue fatos observados nos arquivos do projeto, estimativas condicionais a um modelo e hipóteses de cenário. Nenhuma taxa de transmissão, gravidade ou eficácia causal deve ser apresentada ao usuário como proveniente das bases se a variável correspondente não for identificável nelas.

## 1. Inventário e usos autorizados

| Arquivo de entrada | Variáveis relevantes efetivamente presentes | Utilização válida | Não identifica isoladamente |
| --- | --- | --- | --- |
| `WHO-COVID-19-global-data(1).csv` | `Date_reported`, `Country`, `Country_code`, `New_cases`, `New_deaths` e acumulados | Série semanal de casos/óbitos **reportados** por país para descrição e eventual ajuste de trajetórias com observação/defasagem explícitas | Infecções totais, duração de exposição por pessoa, probabilidade de transmissão por hora, IFR, duração de incubação e hospitalização |
| `OxCGRT_compact_national_v1.csv` | `CountryCode`, `Date`, `C1M_School closing`, `C2M_Workplace closing`, `C6M_Stay at home requirements`, `C7M_Restrictions on internal movement` e flags | Calendário e categorias de políticas anunciadas por país; descrição temporal e covariáveis de cenários | % de contatos evitados, adesão real, taxa de cumprimento, eficácia causal de cada intervenção |
| `VIW_FNT.csv` e `VIW_FLU_METADATA.csv` | semana, país, origem da vigilância, amostras processadas e positivas, vírus/subtipo | Positividade nas **amostras testadas** em estratos compatíveis | Probabilidade de infecção na população e risco por contato; total e subtipos sobrepostos não devem ser somados |
| `VIW_FID_EPI.csv` | semanas, grupos etários, ILI/SARI e denominadores/cobertura quando presentes | Vigilância sindrômica descritiva na faixa/unidade correta | Internação, leitos ou gravidade individual **confirmada** para um vírus específico |
| `incidence-rate-data(1).xlsx` | incidência anual por doença, país e unidade declarada | Comparações anuais com denominador e cobertura apropriados | Risco diário de transmissão pessoa a pessoa |
| `coverage-data(1).xlsx` | cobertura por vacina/antígeno, população-alvo, país e ano | Distribuição/cobertura histórica dentro do grupo correto | Eficácia clínica da vacina, proteção contra agente novo ou tempo de P&D |
| `WHO-MERS-global-data(1).csv` | casos acumulados e data do último caso por país | Descrição transversal na data de extração | Curva diária/semanal ou momento de cada infecção |

Os arquivos são de escala nacional ou vigilância agregada: **nenhum contém pares de indivíduos, tempo efetivo de contato, exposição ambiental ligada a um desfecho positivo, matrizes de contato da cidade fictícia ou capacidade de leitos do mapa**. Não combinar anos/países, fontes laboratoriais, faixas etárias sobrepostas, taxas e contagens sem denominadores e definições compatíveis.

## 2. Tempo de exposição na equação

Para contato de pessoa infecciosa `j` com suscetível `i` no local `l`, registrar duração efetiva `t_ijl` (horas), camada (domicílio, escola, trabalho, varejo, comunidade, hospital), fase infecciosa e eventuais modificadores individuais/ambientais. A intensidade de exposição modelada é `h_ijl = beta_patogeno,l × t_ijl × fatores_ijl`. A soma das intensidades no dia `H_i=Σ_j,l h_ijl` dá `P(infecção_i)=1−exp(−H_i)`; o sorteio continua estocástico. `beta` mede **perigo por hora efetiva de exposição sob os pressupostos do cenário**, não probabilidade por encontro. Não existe `tempo mínimo universal necessário para pegar a doença`: fixadas as condições, mais tempo aumenta a probabilidade, mas não garante a transmissão. Se a UI apresentar um tempo associado a um risco-alvo, escrever `t(p)=−ln(1−p)/(beta × fatores)` e rotular **resultado do cenário condicionado a seus parâmetros**, nunca resultado observado pela OMS.

**Situação do código:** `simulator/engine.mjs` já utiliza duração por camada (`contactHours`) multiplicada por `beta`. Os valores `0.012`, `0.030`, `0.065` por hora em `simulator/data/hypothetical_profiles.json`, as durações de encontro e as probabilidades clínicas ali presentes são hipóteses de demonstração. As bases listadas acima **não autorizam** renomear qualquer um desses valores como estimativa empírica. Duração de permanência em escola ≠ duração efetiva de contato infeccioso próximo; a modelagem da rede deve declarar essa distinção.

## 3. O que pode ser estimado — e sob quais hipóteses

1. **Trajetórias observadas:** por país e janela compatível, calcular casos notificados semanais, crescimento e razões entre indicadores quando as definições permitirem. Tratar atrasos, faltantes, mudanças na testagem e revisões. Esses são atributos dos relatórios, não estimativas automáticas de infecções.
2. **Ajuste de transmissibilidade efetiva agregada (opcional):** escolher país, período, vírus e um modelo de observação de casos (subnotificação e atraso), estrutura de contatos hipotética e parâmetros clínicos provenientes de fontes apropriadas; estimar um conjunto de parâmetros que reproduza a trajetória notificada, com intervalos e análise de sensibilidade. **Beta por hora não fica identificado unicamente** pela mesma curva quando duração/quantidade de contatos e detecção também são livres: reportar combinações compatíveis, nunca um beta clínico único supostamente medido.
3. **OxCGRT e associações temporais (opcional):** alinhar códigos com séries de casos/óbitos no mesmo país e data, testar defasagens pré-especificadas e observar simultaneidade de políticas, sazonalidade, capacidade de testagem e reação das autoridades a casos em alta. Registrar associações/limitações. Não converter `C1M=3` em `−X% transmissão` nem tratar correlação como eficácia causal de fechamento de escolas, home office ou lockdown.
4. **Intervenções que o jogo consegue verificar mecanicamente:** medir em cada execução quantos encontros/viagens o próprio simulador remove, redireciona ou substitui. Essa **diferença interna da rede sintética** pode ser calculada diretamente e confrontada com cenários de controle, com várias sementes. Não é uma medição da eficácia real da política na população.
5. **Clínica e vacina:** para probabilidades por idade de agravamento/óbito, atraso de incubação, tempo de internação, eficácia e disponibilidade de vacina nova, obter fontes clínicas específicas se o objetivo for calibração histórica. Se não houver, expor como hipóteses com análise de sensibilidade.

## 4. Contrato versionado de parâmetros por perfil

Cada parâmetro disponível ao motor deve documentar: `pathogen_id`, doença/variante, país/grupo etário/período relevante, `parameter_name`, `value`, `unit`, `range_or_distribution`, `evidence_status` (`observed`, `model_estimated`, `hypothetical`, `unavailable`), `source_dataset`, `source_field`, `source_url_or_reference`, `estimation_method`, `observation_model`, `assumptions`, `uncertainty`, `model_version` e data do corte. Quando faltar identificação empírica, manter o nome de hipótese e não inventar intervalo de confiança ou minutos de exposição.

**Regra para a UI:** o jogador poderá escolher perfis de doença somente com legenda visível de proveniência; nenhum indicador deve confundir fato histórico, parâmetro ajustado sob hipótese e evento sintético. As decisões do usuário alteram a agenda e a exposição no motor; registrar `startDay`, `endDay`, área, elegibilidade, adesão assumida, contatos removidos/substituídos, exceções essenciais e custo. Aplicar um fator de eficácia adicional somente com fonte pertinente e metodologia explícita, ou rotulá-lo como hipótese configurável.

## 5. Testes de aceitação da calibração e do jogo

- Entrada do jogo nunca excede **30.000** agentes; população conservada em S+E+I+H+R+D durante a simulação.
- Sem contato ativo ou com `beta=0`, não surgem transmissões secundárias; com parâmetros fixos, a probabilidade analítica cresce monotonamente com tempo efetivo, sem limiar temporal rígido.
- O local e a duração do encontro são auditáveis nos eventos; bloquear uma ponte realmente impede usá-la no grafo espacial quando esse adaptador estiver implementado.
- Ações de contenção mudam contatos e deslocamentos registrados, preservando rotinas essenciais e admitindo contatos domiciliares substitutos.
- Qualquer perfil marcado `observed` ou `model_estimated` possui extração reproduzível, denominador/unidade, período, estimativa de incerteza e validação; nenhum parâmetro demonstrativo é rotulado como dado oficial.

**Estado:** trata-se de especificação e auditoria de identificabilidade, não de uma calibração concluída. O motor atual funciona com hipóteses demonstrativas enquanto as estimativas admissíveis não forem ajustadas, auditadas e testadas. Consulte `simulator/docs/MODELO_E_METODOLOGIA.md` e `docs/ESPECIFICACAO_JOGO_E_INTEGRACAO.md`.
