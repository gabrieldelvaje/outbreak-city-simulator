# OUTBREAK — modelo matemático e metodologia

**Versão do motor:** `2.5.0-severity-report`  
**Conjunto principal:** `../data/calibrated_parameters_v2.json`

A análise das bases e limitações está em [CALIBRACAO_V2.md](CALIBRACAO_V2.md). A mecânica atual da interface está em [../../docs/JOGO_V0_7.md](../../docs/JOGO_V0_7.md).

## 1. Estados

Cada agente ocupa um estado exclusivo:

`S`, `E`, `I`, `H`, `R` ou `D`.

A conservação continua obrigatória:

`S + E + I + H + R + D = N`.

A diferença da v2.3 é que `R` pode ser temporário:

`S → E → I → R → S`

ou, nos casos graves:

`I → H → R/D`.

Depois que a imunidade natural configurada termina, um recuperado volta para `S` e pode sofrer reinfecção.

## 2. População e topologia persistentes

A população jogável aceita de 10 a 20.000 agentes. Para a mesma configuração e seed, `makeCity(cfg)` produz a mesma população sintética.

Cada agente recebe idade, domicílio interno, marcador residencial, escola, trabalho, mercado, destino comunitário, hospital e atributos ocupacionais.

Vários domicílios podem compartilhar um marcador residencial do mapa; apenas pessoas do mesmo `householdId` compartilham a camada familiar.

## 3. Mobilidade entre bairros

O bairro define a residência, não todos os destinos da pessoa.

Destinos persistentes de trabalho, escola, varejo, comunidade e hospital podem ser selecionados em outro bairro. Isso permite que pessoas de regiões diferentes se encontrem no mesmo local e levem a infecção de volta às próprias famílias.

As proporções de destinos externos são hipóteses explícitas da rede do jogo e estão em `scenario_assumptions.city_mixing`.

## 4. Rotina temporal

O dia possui quatro blocos:

1. `home_morning`;
2. `daytime`;
3. `evening_outing`;
4. `home_night`.

Escola, trabalho e hospital operam no bloco diurno. Varejo/comunidade aparecem no fim do dia. Agentes retornam ao domicílio à noite.

Intervenções alteram presença nesses blocos, mas não apagam os agentes da rede.

## 5. Transmissão

Para suscetível `i`:

`h_i(t)=Σ beta × horas_ij × expansão × suscetibilidade_i × (1-proteção_i)`

`P(infecção_i,t)=1-exp[-h_i(t)]`.

A frequência/mistura etária vem das matrizes brasileiras e a duração dos contatos usa POLYMOD.

Não existe limiar determinístico de minutos.

Cada evento de infecção registra, entre outros campos:

- pessoa infectada e fonte;
- dia e bloco;
- camada;
- local interno e nó visual;
- bairro da fonte, do alvo e do local;
- número do episódio;
- indicador de reinfecção.

## 6. Imunidade natural e reinfecção

Ao se recuperar sem óbito, o agente entra em `R` e recebe `immunityUntilDay`.

A duração é sorteada uniformemente entre `naturalImmunityDaysMin` e `naturalImmunityDaysMax` do perfil de cenário.

Quando:

`day >= immunityUntilDay`

o motor registra `immunity_waned` e executa:

`R → S`.

A próxima infecção da mesma pessoa incrementa `infectionCount` e é registrada com `reinfection=true`.

**Essas durações não são estimadas pelas bases fornecidas.** O campo de reinfecção do SIVEP/COVID não é usado como duração de imunidade.

## 7. Reintroduções e novas ondas

Mesmo depois de uma cadeia local diminuir, a cidade pode receber tentativas de reintrodução externa.

A taxa é escalada pela população:

`λ_import = N × taxa_por_1000_por_dia / 1000`.

O número diário de tentativas segue Poisson.

Esse mecanismo representa apenas uma pressão infecciosa externa abstrata. As bases fornecidas não identificam prevalência infecciosa de viajantes nem frequência real de introduções para a cidade fictícia.

A combinação de:

- circulação interbairros;
- perda de imunidade natural;
- reintroduções externas;
- população ainda suscetível;

permite novas ondas sem um comando artificial de “criar onda”.

## 8. Vacinação

A vacinação pode ser aplicada a agentes em `S` ou `R`.

Depois de `daysToProtection`, a proteção contra infecção reduz o hazard dos contatos locais.

Nas reintroduções externas, uma pessoa protegida pode bloquear uma tentativa de infecção com probabilidade `infectionProtectionFraction`.

Assim, em um cenário com vacinação ampla, novas ondas podem diminuir mesmo que continuem existindo tentativas de introdução.

Os valores de eficácia continuam hipotéticos enquanto não houver produto/patógeno específico incorporado.

## 9. Indicadores acumulados

A v2.3 distingue:

- `cumulativeUniqueInfected`: pessoas que já tiveram pelo menos uma infecção;
- `cumulativeInfectionEpisodes`: episódios totais;
- `cumulativeReinfections`: episódios após a primeira infecção;
- `newReinfections`: reinfecções do dia;
- `immunityWaned`: pessoas que perderam imunidade natural naquele dia.

No resumo:

- `uniqueEverInfected`;
- `reinfections`;
- `peopleReinfected`;
- `regionsReached`;
- `crossRegionTransmissions`.

## 10. Intervenções

São suportadas fechamento escolar, home office, fechamento de trabalho, varejo/comunidade, restrição de mobilidade, lockdown, isolamento de casos, fechamento abstrato de travessias e alteração de capacidade hospitalar.

Percentuais de redução de casos são resultados da simulação, não eficácia causal real.

## 11. Testes

Os testes cobrem:

- conservação e reprodutibilidade;
- beta zero;
- fechamento escolar e lockdown;
- transmissão domiciliar;
- mobilidade entre bairros;
- paciente zero exato;
- reintrodução externa;
- perda de imunidade;
- reinfecção;
- redução de reinfecções por vacinação protetora em cenário controlado;
- população máxima de 20.000 agentes.

## 12. Limitações

- pontes ainda não são arestas individuais;
- deslocamento é presença em locais, não movimento contínuo;
- parâmetros de mistura urbana são hipóteses do jogo;
- duração da imunidade natural e taxa de reintrodução são hipóteses do jogo;
- beta, latência, duração infecciosa e eficácia vacinal não são identificados pelas bases fornecidas;
- SIVEP 2019–2024 ainda não foi harmonizado ao conjunto clínico publicado.

Consulte [CALIBRACAO_V2.md](CALIBRACAO_V2.md) antes de interpretar qualquer parâmetro.


## 13. Campanha anual V0.7

A experiência jogável usa 360 dias e quatro fases de aproximadamente 90 dias. `waveDynamics.waveSchedule` modula suavemente o beta de sensibilidade e a intensidade de reintroduções externas dentro de cada fase. O número da onda é gravado diariamente em `waveNumber`.

Esse calendário é uma hipótese de design do jogo e não uma reconstrução observada de uma epidemia real.

## 14. Atendimento negado e mortalidade

Casos graves sem vaga acumulam `careDeniedDays`. O risco de morte condicionado à gravidade é aumentado por `unmetCareMortalityPerDeniedDay`, com limite superior de probabilidade.

Quando ocorre um óbito após pelo menos um dia de atendimento negado, o evento registra `deathAssociatedWithUnmetCare=true`. O resumo contém `unmetCareDeaths`.

Isso representa uma associação interna do cenário com falta de capacidade; não é inferência causal sobre políticas reais.

## 15. Vacinação por dose

`vaccinationCampaigns` aceita até três campanhas sequenciais. Cada agente registra `vaccineDoses`, `lastVaccinatedDay` e `vaccineHistory`.

Cada campanha define dose, disponibilidade, doses/dia, adesão, intervalo mínimo, atraso até proteção e proteção contra infecção/gravidade. A proteção efetiva usa a melhor dose já maturada.

Os parâmetros das três doses são hipóteses de cenário, não eficácia de um produto específico.


## 16. Balanceamento de gravidade V0.8

O perfil jogável aplica `playableSeverityMultiplier=4` ao proxy de probabilidade de caso grave/hospitalar construído a partir dos componentes já documentados. O objetivo é tornar a capacidade hospitalar uma restrição material durante uma campanha sintética de 360 dias.

**Status:** `GAME_BALANCE_ASSUMPTION_NOT_CLINICAL_ESTIMATE`.

Casos graves sem vaga passam por um hazard diário adicional `unmetCareDailyDeathHazard=0.055`, crescente com os dias sucessivos sem atendimento e limitado a 0,45 por dia no motor.

Esse mecanismo foi introduzido para o jogo e não deve ser usado como estimativa clínica.

## 17. Relatório contrafactual interno

Ao final da campanha, a interface solicita ao Worker uma segunda execução com mesma seed, população e paciente zero, removendo:

- intervenções;
- ampliações de leito;
- vacinação.

O relatório compara os dois resultados. Como ambas as trajetórias são saídas do mesmo modelo, a diferença é descrita como **efeito contrafactual simulado**, e não como eficácia causal observada de política pública.
