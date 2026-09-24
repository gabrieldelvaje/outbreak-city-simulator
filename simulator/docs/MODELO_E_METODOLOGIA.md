# OUTBREAK — Modelo matemático e linhagem de dados (v1)

> **Protótipo de simulação estocástica, não calibrado.** Os arquivos históricos enviados ao projeto fornecem séries observacionais de referência. Eles **não** determinam automaticamente a transmissibilidade por contato, a incubação, a mortalidade por infecção, a eficácia de uma vacina nova ou a eficácia causal de intervenções. Todos esses números do perfil v1 são **hipóteses editáveis**, não taxas estimadas das bases. Não usar resultados sintéticos para previsão clínica, gestão hospitalar real ou avaliação de políticas públicas reais.

## 1. Dados históricos observados versus parâmetros simulados

O projeto consolidou 5.965.243 registros de fontes reais num histórico separado, preservando país ISO3, doença/agrupamento, indicador, intervalo temporal, frequência, idade/estrato, valor, unidade, dataset e coluna de origem. Esse histórico **não** é uma amostra de agentes da cidade fictícia. Seu manifesto resumido é versionado em `../data/historical_provenance.json`; os arquivos CSV/Excel de entrada e o histórico completo não são incorporados ao GitHub Pages nesta entrega. O modelo roda sem acessar esses dados.

| Fonte | Indicadores que efetivamente apresenta | O que NÃO autoriza derivar diretamente |
| --- | --- | --- |
| WHO COVID-19 global | casos e óbitos **notificados** por país/semana | infecções reais, IFR, beta por contato, R0 causal |
| OxCGRT | códigos ordinais de políticas nacionais em 2020–2022 | redução percentual efetiva de contatos e eficácia causal |
| WHO FluNet | amostras testadas/positivas por vigilância e subtipo | número de infectados na população ou taxa de transmissão |
| WHO FluID | ILI/SARI sindrômicas por idade/estrato | casos confirmados ou hospitalizações de um vírus específico |
| WHO incidence VPD | taxas anuais de incidência, doença/unidade declarada | risco diário individual sem denominador e contexto |
| WHO vacinação | coberturas anuais por antígeno/categoria/grupo-alvo | proteção individual contra um vírus novo ou tempo para desenvolver vacina |
| WHO MERS | contagem cumulativa por país na data de extração | curva de incidência semanal pela data do último caso |

Não somar total influenza a subtipos já incluídos nesse total; não somar categorias etárias sobrepostas ou origens de vigilância distintas. Não misturar unidades de taxa e contagem, converter lacuna em zero ou converter calendário anual para uma incidência diária inventada. Uma comparação com recortes históricos é **descritiva**, nunca calibração automática do motor.

## 2. População, rede e tempo

`makeCity(cfg)` gera **N** agentes fictícios (idades categóricas `child`, `adult`, `older`) em domicílios de 1–4 membros. Cada pessoa tem residência e, quando aplicável, escola, trabalho, mercado, praça e hospital; a cidade possui regiões abstratas. A população fica fixa na versão 1 (sem nascimento, migração, outras causas de morte ou reinfecção). Os IDs de casas e locais gerados pelo motor **não correspondem** ainda aos IDs do SVG. Uma camada de associação entre agentes, residências reais do desenho e `place_id` do mapa precisa ser desenvolvida separadamente.

O passo temporal é **um dia**. As redes de encontro mudam com agenda e medidas: domicílio (`household`), escola (`school`), trabalho (`work`), varejo (`retail`), comunidade (`community`) e hospital (`hospital`). O modelo simula encontros pares estocásticos limitados por `contactsPerPerson[layer]` e `contactHours[layer]`. A forma de mistura e a composição demográfica são premissas ilustrativas; não representam matrizes medidas da cidade.

## 3. Transmissão e progressão clínica

Os estados exclusivos são `S` suscetível, `E` exposto, `I` infeccioso, `H` hospitalizado, `R` recuperado, `D` óbito atribuído ao surto sintético. Uma infecção faz `S → E`; após `latentDays`, `E → I`; após avaliação clínica há eventual `I → H`; ao terminar o episódio, `I/H → R` ou `D`. Hospitalizados deixam a circulação normal; pessoas expostas **não** transmitem nesta v1. Recuperação confere imunidade permanente aqui (hipótese, não afirmação clínica).

Para o suscetível `i`, em um dia, a intensidade acumulada é:

`h_i(t) = Σ_{j∈contatos infecciosos} β × horas_do_contato × suscetibilidade_relativa_i × (1 − proteção_vacinal_i)`

`P(infecção_i no dia t) = 1 − exp(−h_i(t))`.

A fonte da transmissão é atribuída probabilisticamente entre os contatos que contribuíram para `h_i`; eventos registram dia, pessoa, fonte, local e camada. O perfil v1 usa valores de **β por hora efetiva de contato 0,012 / 0,030 / 0,065** para os níveis baixo/médio/alto. Esses valores são **inventados para demonstração**, não estimativas de nenhum patógeno real; tampouco representam `R0`.

Os demais parâmetros são versionados em `../data/hypothetical_profiles.json`: `latentDays`, `infectiousDays`, probabilidade de sintomas e de detecção, atrasos, gravidade por idade, morte em casos graves com/sem atendimento, leitos, duração da internação, horas e número de encontros por camada, susceptibilidade relativa, alerta local, vacina e agenda de intervenções. Toda probabilidade clínica deve ser recalibrada com fontes clínicas independentes antes de qualquer estudo de agente real.

## 4. Hospitalização, detecção e vacina

Gravidade é sorteada **uma vez** por caso, por faixa etária. Uma pessoa grave pode solicitar leito; admissão depende de `beds` e ocupação. São registrados solicitações, admissões, ocupação, demanda não atendida e óbitos; os riscos com/sem atendimento são **hipóteses contrafactuais do jogo**, não estimativas de eficácia de atendimento real. O limite de leitos não vem de FluID.

Infecções verdadeiras sintéticas são distintas de casos `reported_case`: sintomas, probabilidade de detecção e `reportDelayDays` determinam observação. `alert.detectedCasesThreshold` em `alert.windowDays` dispara somente um `game_alert` local fictício; uma única cidade não permite declarar pandemia mundial.

A vacina é um atributo adicional do agente suscetível: disponibilização, doses/dia, adesão, prioridade, dias até proteção, proteção contra infecção e contra agravamento são todos configuráveis e **não foram inferidos** da cobertura histórica de antígenos existentes. Esquema de uma dose, sem perda de proteção, apenas nesta v1.

## 5. Intervenções e pontes

`school_closure` remove encontros escolares; `remote_work` e `workplace_closure` alteram presença ocupacional; `mobility_restriction`, `retail_limit` e `community_closure` alteram itinerários; `hospital_capacity_change` altera leitos. As medidas contêm `startDay`, `endDay`, `fraction` e, quando implementado, `regionIds`. Contatos domiciliares continuam possíveis com escolas fechadas. Nenhuma mudança de código ordinal do OxCGRT é convertida em eficácia de intervenção.

**Limitação importante das três pontes:** o motor v1 disponibilizado neste commit modela um bloqueio **agregado** de travessias inter-regionais de trabalho (`bridge_closure`) por lados abstratos, **não** o fechamento individual de `ponte-norte`, `ponte-central` e `ponte-sul` nem rotas alternativas pelo grafo viário do SVG. Os botões existentes no mapa permanecem apenas visuais até que um adaptador de rotas incorpore as três arestas reais à agenda de agentes. Não afirmar que fechar um botão já modifica a curva de infecção.

## 6. Conservação, testes e incerteza

Em qualquer dia: `S + E + I + H + R + D = N_inicial` e `vivos = N_inicial − D`. O resultado distingue novos casos verdadeiros, casos detectados, pedidos/admissões/ocupação, doses, eventos por camada e alertas. Executar `node simulator/tests/test_engine.mjs` a partir da raiz do repositório para testar reprodutibilidade por semente, conservação, contatos, cenários, capacidade, vacina e validação de entradas. `summarizeRuns()` resume quantis empíricos de várias sementes, sem tratar uma realização como previsão.

**Etapa de integração futura:** mapear os agentes e domicílios sintéticos aos nós reais já desenhados; gerar trajetos por ponte; ligar os controles visuais ao estado de intervenções; acrescentar Play/Pause/Step e resultados diários do motor à interface. Este commit entrega o **núcleo matemático executável em módulo independente**, sem substituir o site do mapa nem fingir que seus nós já estejam conectados às taxas.

## 7. Fontes originais declaradas nos arquivos do projeto

- [OMS COVID-19](https://data.who.int/dashboards/covid19/data)
- [Oxford COVID-19 Government Response Tracker e codebook](https://github.com/OxCGRT/covid-policy-dataset)
- [OMS FluNet](https://www.who.int/tools/flunet)
- [OMS vigilância influenza / FluID](https://www.who.int/teams/global-influenza-programme/surveillance-and-monitoring)
- [OMS vacinação e incidência de doenças imunopreveníveis](https://immunizationdata.who.int/)
- [OMS MERS](https://data.who.int/dashboards/mers)
- Documento original fornecido no projeto: `OUTBREAK_City_Simulator(1).docx`.
