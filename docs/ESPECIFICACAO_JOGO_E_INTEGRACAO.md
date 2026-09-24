# OUTBREAK City — Especificação do jogo e integração ao motor (revisão v2)

**Estado:** requisitos de produto e critérios de implementação; esta especificação não significa que a integração já esteja funcionando no site. O motor v1 em `simulator/engine.mjs` é independente do SVG, aceita de **10 a 30.000 agentes** e ainda usa regiões e travessias abstratas. **O máximo selecionável do jogo será 30.000 habitantes/agentes sintéticos** nesta versão; remover as referências anteriores a 100.000–500.000 e NÃO ampliar o teto apenas por configurar um campo de entrada. Renderizar nós agregados, não 30 mil bolinhas ao mesmo tempo. A capacidade final da interface depende de testes de desempenho em dispositivos reais.

## 1. Configuração e paciente zero

1. O usuário escolhe uma população inteira entre 10 e 30.000 (limites idênticos aos efetivamente aceitos pelo motor), o perfil da doença, os parâmetros disponibilizados e uma semente opcional; a interface deve deixar clara a diferença entre perfil histórico parcialmente calibrado e cenário hipotético.
2. O foco inicial é uma residência ou estabelecimento válido selecionado no mapa. O paciente zero deve morar ou estar presente ali; a escolha não pode produzir a primeira infecção em outro lugar. Escolas recebem alunos e funcionários efetivamente presentes; empresas recebem trabalhadores, e assim por diante. Rio, rua e pontes não são nós de transmissão.
3. O usuário inicia, pausa, avança dias, altera velocidade e reinicia com a mesma configuração/seed. O motor deve registrar o encontro e o local que originaram cada transmissão posterior.

## 2. População, mapa e itinerários

- Gerar população sintética por faixas etárias, domicílios, escolas, locais de trabalho e rotinas por dia da semana, explicitando distribuições assumidas e suas fontes. Marcadores de casa no SVG representam agregados de moradias virtuais quando necessário: mostrar a quantidade real de pessoas/domicílios associada a cada marcador.
- Separar cálculo de renderização, preferencialmente usando Web Worker e atualizações agregadas; testar ao menos 100, 1.000, 10.000 e **30.000** agentes antes de liberar o seletor. Não renderizar todas as pessoas/arestas simultaneamente.
- Crianças em idade escolar vão às escolas, adultos empregados aos trabalhos, equipes essenciais aos hospitais, e viagens a mercados/comunidade dependem de agenda; pessoas internadas ou mortas não transitam normalmente. Fechamento de escola ou home office não extingue contatos domiciliares.
- Ponte Norte, Central e Sul são **arestas de mobilidade**, nunca nós epidemiológicos. Fechar uma impede somente aquela travessia e obriga o recálculo de rotas pelos acessos restantes ou cancela o deslocamento. Os controles atuais do SVG ainda são visuais: não afirmar efeito epidemiológico até a integração efetiva.

## 3. Disseminação baseada em exposição e fontes

Adotar uma rede temporal de contatos e uma função probabilística de exposição. Para suscetível i, no passo Δt, `H_i=Σ_j β[p,ambiente] × t_ij × modificadores_ij`; `P_i(infecção)=1−exp(−H_i)`. `t_ij` é duração efetiva de encontro com pessoa infecciosa; o parâmetro β tem unidade inversa à unidade de tempo e **não é uma probabilidade fixa por encontro nem um prazo universal para contaminação**. Contatos mais longos elevam o risco sob as mesmas condições, mas não garantem infecção. Documentar limites de duração, mistura, susceptibilidade, carga infecciosa relativa por fase e intervenções ambientais antes de adicionar tais modificadores ao motor.

**Regra de evidência:** cada perfil selecionável deve ter um registro versionado com `pathogen_id`, variante/período/população quando pertinente, nome do parâmetro, estimativa e intervalo, unidade, fonte/coluna, janela temporal, método de cálculo, pressupostos e status (`observado`, `estimado_sob_modelo`, `hipotético` ou `indisponível`). Não rotular os atuais β=0,012/0,030/0,065 por hora como valores derivados da OMS: são hipóteses de demonstração. Não afirmar que as bases enviadas informam um número de minutos necessários para infectar, pois **não contêm duração de contatos entre pessoas vinculada a um desfecho de infecção**.

- WHO COVID-19 global: casos e mortes **notificados** semanalmente por país; pode restringir trajetórias observadas e, com um modelo de observação e hipóteses declaradas, ajustar parâmetros efetivos agregados. Não identifica sozinho beta por hora, período de incubação, risco individual de hospitalização, IFR ou duração de contato.
- FluNet: testes e amostras positivas por período e subtipo, separados por origem da vigilância; positividade de amostras não é probabilidade de transmissão por encontro, e subtipos não devem ser somados de novo ao total.
- FluID: ILI/SARI por população, idade e rede de vigilância; SARI não é internação confirmada de um vírus específico e `SARI_INPATIENTS` não é oferta de leitos.
- Incidência anual de doenças imunopreveníveis e cobertura vacinal por antígeno/grupo-alvo podem fornecer contexto com unidade e denominador corretos; não permitem extrair beta diário ou eficácia de uma vacina nova.
- WHO MERS: fotografia cumulativa por país; não criar série diária de incidência a partir da data do último caso.

Só oferecer como **perfil historicamente parametrizado** aquilo que tiver evidência suficiente e processo de estimação documentado. Para parâmetros indisponíveis, oferecer hipótese identificada e análise de sensibilidade, sem apresentá-la como resultado empírico. Recalibrar separadamente dinâmica de transmissão, subnotificação, gravidade por idade e riscos de óbito, sem deduzir uns dos outros. Comparar saídas simuladas às séries observadas no mesmo intervalo, unidade e população de referência; usar validação temporal fora da amostra e múltiplas sementes quando aplicável.

## 4. Medidas e seus efeitos

Escolas fechadas alteram presença e contatos escolares; home office afeta trabalhadores elegíveis e seus deslocamentos; restrições de circulação alteram destinos; máscaras/ventilação, se implementadas, afetariam intensidade de exposição com parâmetros próprios; quarentena atua nos contatos de grupos/áreas definidos. Saúde e abastecimento essenciais continuam operando, e novas interações domiciliares devem ser consideradas quando a rotina muda. Leitos e equipe determinam acesso a atendimento, não a classificação da epidemia.

**O OxCGRT registra se, quando e em que categoria políticas nacionais foram adotadas; seus códigos e flags NÃO representam uma redução percentual de contatos nem identificam isoladamente a eficácia causal de lockdown, escola fechada ou home office.** É possível analisar associações descritivas defasadas com séries epidemiológicas compatíveis, controlando disponibilidade de testes, sazonalidade, políticas simultâneas e causalidade reversa, mas sem alegar um efeito causal específico a partir desses arquivos. No jogo, o efeito mecânico do fechamento é remover/reorientar encontros *efetivamente modelados*. Qualquer adesão, cancelamento de viagens, contatos substitutos ou modificador de risco sem medida apropriada é hipótese explícita com intervalo testado em cenários. Nunca usar um código OxCGRT como um multiplicador percentual automático de β.

## 5. Alerta, hospital e vacina

Não existe número universal de casos/internações que defina epidemia. O jogo usa gatilho configurável e rotulado **alerta fictício de epidemia simulada**, independente da ocupação hospitalar. Distinguir infecções simuladas de casos detectados, momento do primeiro contágio, primeira admissão e alerta; a intervenção pode começar no primeiro dia.

Casos graves solicitam atendimento; registrar demanda, vagas, admissão, internações, fila, alta e óbito. Riscos clínicos por idade/gravidade, duração da hospitalização e efeitos da falta de atendimento precisam de fontes clínicas adicionais ou hipótese explícita: os CSVs sindrômicos não identificam esses parâmetros para o paciente individual do jogo.

Separar vacinação existente de P&D de vacina nova. Cobertura vacinal histórica é observação por antígeno/grupo-alvo, não eficácia, duração de P&D ou proteção contra vírus hipotético. Investimento e prazo são parâmetros de cenário com incerteza, etapas regulatórias, fabricação e distribuição distintas; não prometer vacina automática em um ano.

## 6. Resultado, testes e escopo

O balanço final inclui curva de estados S/E/I/H/R/D, incidência simulada e detectada, internações, sobrecarga, mortes sintéticas, custos, pontes/rotas, vacinação e decisões por data. Comparações de estratégias exigem condições iniciais compatíveis, múltiplas sementes e intervalos de resultados, sem alegar eficácia clínica ou política real.

**Aceite antes de declarar integração concluída:** entrada máxima=30.000 aceita em motor e UI; paciente zero localizado no nó escolhido; duração de contatos entra de fato na equação; nenhuma transmissão sem contato ativo; conservação de N; hospitalizados/mortos sem mobilidade ordinária; serviços essenciais mantidos; pontes fechadas nunca usadas; intervenção altera agendas e contatos; parâmetros auditáveis e separação entre observado/estimado/hipotético; teste reprodutível e benchmark a 30 mil.

A metodologia detalhada do motor atual permanece em `simulator/docs/MODELO_E_METODOLOGIA.md`. A matriz de identificabilidade e as regras de calibração das fontes ficam em `docs/PARAMETROS_E_LIMITES_DAS_BASES.md`. **Esta revisão fixa o escopo e os requisitos científicos, não declara calibração concluída ou botões já conectados ao motor.**
