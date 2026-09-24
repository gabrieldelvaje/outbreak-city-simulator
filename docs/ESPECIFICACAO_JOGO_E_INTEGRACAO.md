# OUTBREAK City — Especificação do jogo e integração ao motor (proposta v2)

**Estado:** requisitos de produto e critérios de implementação; **não significa que a funcionalidade já esteja implementada no site**. O motor v1 já versionado em `simulator/engine.mjs` é independente do SVG, aceita 10–30.000 agentes e possui apenas regiões e travessias abstratas. A execução para 100.000–500.000 agentes e a associação a edifícios/rotas reais são trabalho futuro.

## 1. Configuração, foco inicial e início

1. O usuário informa a população inteira entre **100.000 e 500.000** (slider + campo numérico), escolhe um perfil de doença, transmissibilidade baixa/média/alta e, opcionalmente, uma semente reprodutível. Separar claramente transmissibilidade, risco de agravamento por idade, duração da doença, detecção e mortalidade condicional; alta transmissibilidade não implica alta letalidade.
2. Antes de iniciar, o usuário clica num **nó residencial ou local público válido** para selecionar o local do paciente zero. A interface destaca o foco, o perfil, a população e o número inicial de pessoas infectadas (padrão: 1). Não aceitar rio, ponte, rua, parque sem fluxo modelado nem ponto no vazio. Se o usuário selecionar uma escola ou empresa, a primeira pessoa infectada deve pertencer à população que efetivamente frequenta aquele local naquele dia; se selecionar uma residência, deve morar naquele domicílio virtual.
3. Clicar em **Iniciar** gera uma cidade sintética consistente, fixa a semente e cria o primeiro caso no local selecionado. A cada passo simulado, registrar presença por local, encontros de contatos, infecções atribuídas à respectiva camada/local, progressão clínica, solicitações de internação e saídas. Controles: iniciar, pausar, avançar um dia, velocidade e reiniciar com a mesma semente.

## 2. Rede, população e representação do mapa

- A população de 100–500 mil corresponde a **agentes simulados**, não a 100–500 mil círculos SVG simultâneos. Os marcadores de casa e os edifícios desenhados são pontos/agrupamentos de visualização. Criar domicílios virtuais em clusters de quadra/região por trás dos marcadores; explicitar no painel quantos domicílios/pessoas cada nó agregado representa. **Não** atribuir centenas de milhares de moradores a umas poucas casas sem explicar essa agregação.
- Gerar faixas etárias e composições familiares a partir de distribuições sintéticas configuráveis, documentadas como premissas até haver fonte demográfica aplicável. Crianças em idade escolar vão para escolas, adultos empregados para locais de trabalho, trabalhadores de saúde para hospitais, idosos com rotina própria, todos com deslocamentos probabilísticos para mercados e comunidade; encontros domésticos ocorrem também sob restrições.
- A agenda varia por dia da semana e pelas políticas em vigor, preserva trabalho essencial, admite doença/afastamento e não força pessoa morta ou internada a deslocar-se. Cada hospital possui equipes e capacidade; fechar uma escola ou empresa modifica contatos e trajetos a partir do próximo passo.
- Criar grafo de circulação com as três pontes **como arestas/controles de travessia, jamais nós de infecção**. Fechar Norte, Central ou Sul independentemente impede aquela travessia; recalcular caminho pelas pontes abertas, ou cancelar deslocamento se não houver rota. O custo/tempo do trajeto alternativo deve poder alterar o comparecimento. Os controles visuais atuais ainda **não** fazem isso.
- Clicar em casa/escola/empresa/hospital deve abrir um subgrafo paginado/virtualizado de seus moradores/presentes, exibindo indivíduos, idade por faixa, vínculos e estados epidemiológicos; não renderizar milhares de elementos de uma só vez.

## 3. Epidemiologia e evento de epidemia

- Manter a transmissão estocástica por encontros e estados S/E/I/H/R/D já implementados, mas adaptar performance e a rede real. Parâmetros por patógeno são editáveis e devem informar unidade, recorte etário, fonte e incerteza. Os perfis `simulator/data/hypothetical_profiles.json` são **hipóteses demonstrativas**, não taxas inferidas automaticamente das séries da OMS/OxCGRT.
- **Não existe um número universal de internados/casos para declarar epidemia.** A definição epidemiológica depende de casos acima do esperado para o agente, população, local e período. No jogo, adotar um gatilho inicial **explicitamente fictício e configurável**, por exemplo: ao menos **20 casos novos detectados por 100.000 habitantes nos últimos 7 dias**, com crescimento ante os 7 dias anteriores e transmissão em mais de um domicílio. Para população de 100 mil isso corresponde a 20 casos detectados/7 dias; para 500 mil, a 100. O aviso exibido será **“Alerta de epidemia simulada”**, não uma declaração oficial. Permitir que o usuário intervenha desde o primeiro caso, sem esperar o gatilho.
- Monitorar separadamente incidência real simulada, casos detectados, óbitos, pedidos de internação, leitos ocupados e demanda não atendida. Alerta hospitalar ilustrativo em 85% da capacidade disponível para o surto; em 100% sinalizar lotação e registrar recusas/espera com efeitos clínicos configuráveis. Não usar o número de internados como definição epidemiológica da epidemia.

## 4. Decisões durante a simulação

- Escolhas com início, duração, área, adesão, custo, cobertura e atraso até o efeito: isolamento individual, quarentena localizada, fechamento de escolas, trabalho remoto para elegíveis, limite de encontros no comércio/comunidade, lockdown amplo, fecho individual de pontes, testes e detecção, leitos adicionais, equipes e insumos hospitalares.
- Manter funções essenciais e seus deslocamentos com regras próprias: hospitais e trabalhadores de saúde, abastecimento, serviços necessários, além de visitas hospitalares por casos que necessitam de cuidados. Um lockdown **não** zera todos os contatos; contatos domiciliares e a necessidade de cuidados continuam.
- Recursos e consequências são explícitos: orçamento, dias de vigência, disponibilidade de equipes, capacidade de atendimento e deslocamentos. Construir/expandir hospital leva tempo e exige profissionais; adicionar apenas uma cama numérica não basta em cenários avançados.
- Permitir decisões antes e depois do alerta. Cada decisão fica no histórico, com data, parâmetros, gasto e resultados subsequentes — sem fingir que uma curva observada demonstra causalidade por si só.

## 5. Vacinas e horizonte temporal

- Separar duas modalidades: **vacina já existente** (compra/recebimento, estoque, elegibilidade e distribuição) e **vacina contra patógeno novo** (investimento em pesquisa, etapas pré-clínica, fases clínicas, revisão regulatória, fabricação, logística e aplicação). Investimento pode ampliar capacidade ou acelerar etapas dentro de limites demonstrativos, mas **não garante sucesso nem elimina avaliações de segurança/eficácia**.
- Na modalidade de patógeno novo, permitir um cenário ilustrativo de desenvolvimento próximo de **um ano** como hipótese de jogo, com duração incerta e possibilidade de falha, não regra biológica/industrial. A OMS registrou a primeira validação emergencial de vacina contra COVID-19 em **31/12/2020**, aproximadamente um ano após os primeiros relatos; outros projetos levaram muito mais tempo. Desenvolvimento tradicional desde etapa pré-clínica até produção pode superar dez anos. Diferenciar autorização, produção, entrega e proteção após a dose.
- Modelar doses por dia, estoques, adesão, prioridade (ex.: equipes de saúde e pessoas em maior risco), dias para proteção, proteção contra infecção e agravamento; fontes de cobertura histórica **não** estimam a eficácia de vacina nova.

## 6. Balanço final e avaliação

- Painel diário: população por estado, infecções novas/detectadas, incidência por 100 mil/7 dias, transmissão por local e idade, internações solicitadas/admitidas, ocupação e demanda não atendida, óbitos sintéticos, vacinados/protegidos, rotas/ponte e orçamento.
- Encerrar por horizonte escolhido, extinção do surto simulada ou decisão do usuário. Mostrar curva, linha do tempo das medidas, custos, dias de sobrecarga e efeitos observados na **simulação**. Opcionalmente rodar comparação sem intervenções com **mesma configuração e múltiplas sementes**, exibindo intervalo entre realizações em vez de um “número de vidas salvas” determinístico ou inferência sobre a realidade.
- Exibir claramente limitações, incerteza e as bases de cada parâmetro. Não reduzir o resultado a uma nota única que esconda o compromisso entre resultados epidemiológicos, atendimento e custos.

## 7. Entregas técnicas e critérios de aceite

1. **V2 de performance:** substituir o teto `population<=30000` somente após implementação e teste de 100.000, 400.000 e 500.000 agentes em Web Worker com armazenamento compacto, amostragem limitada de contatos e atualizações agregadas da tela. Nunca criar O(N²) contatos nem 500 mil círculos SVG.
2. **Adaptador espacial:** dados vinculando `home_id`/`place_id` e distritos aos nós existentes; validar que todo foco inicial e todo deslocamento se referem a local real/virtual documentado, e que pontes fechadas não são atravessadas.
3. **Fluxo de jogo:** configuração, seleção de foco, passo diário, painel de eventos/decisões, alertas configuráveis, capacidade hospitalar, pesquisa/distribuição de vacina e resumo final; preservar zoom, cliques e aspecto do mapa atual.
4. **Testes:** conservação de estados, população fixa, reprodutibilidade por semente, pessoa hospitalizada/morta não se desloca, casos graves solicitam cuidado, escola fechada não tem frequência ordinária, equipe essencial mantém deslocamento permitido, ponte individual bloqueada não é usada, gatilho por 100 mil escala com N, recursos não ficam negativos, vacina não protege antes da data de proteção, benchmark a 500 mil agentes e interface responsiva.

## Fontes de contexto (não calibração automática)

- Definição de epidemia variável por agente/população/local/período: https://ihrbenchmark.who.int/document/glossary
- OMS, como vacinas são desenvolvidas e produzidas, 25/02/2025: https://www.who.int/news-room/feature-stories/detail/manufacturing-safety-and-quality-control
- OMS, primeira validação emergencial de vacina contra COVID-19, 31/12/2020: https://www.who.int/news/item/31-12-2020-who-issues-its-first-emergency-use-validation-for-a-covid-19-vaccine-and-emphasizes-need-for-equitable-global-access
- Modelo v1 e limites: `simulator/docs/MODELO_E_METODOLOGIA.md`.
