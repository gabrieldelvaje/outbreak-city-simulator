# OUTBREAK — modelo matemático e metodologia (v2)

**Versão do motor:** `2.0.0-data-informed`  
**Conjunto principal:** `../data/calibrated_parameters_v2.json`

A análise detalhada das bases, parâmetros derivados, resultados e limitações está em [CALIBRACAO_V2.md](CALIBRACAO_V2.md). O protocolo de vigilância e decisões está em [../../docs/METODO_COMPLETO_VIGILANCIA_TRANSMISSAO_DECISOES.md](../../docs/METODO_COMPLETO_VIGILANCIA_TRANSMISSAO_DECISOES.md).

## 1. Estados e tempo

O passo do motor é diário. Cada agente ocupa um estado exclusivo:

- `S`: suscetível;
- `E`: infectado latente;
- `I`: infeccioso;
- `H`: hospitalizado;
- `R`: recuperado;
- `D`: óbito atribuído ao surto sintético.

A conservação é obrigatória: `S+E+I+H+R+D=N`.

## 2. População e contatos

A população aceita de 10 a 30.000 agentes. Idades, domicílios, frequência escolar e trabalho são sorteados a partir das distribuições versionadas no conjunto v2.

A frequência e mistura etária dos contatos usam matrizes 3×3 por ambiente. Para manter desempenho, o motor amostra um número limitado de pares e aplica um fator de expansão que preserva o número esperado de contatos da linha da matriz.

Camadas: `household`, `school`, `work`, `retail`, `community` e `hospital`.

## 3. Transmissão

Para um suscetível `i`:

`h_i(t)=Σ_j beta × horas_ij × expansão × suscetibilidade_i × (1-proteção_i)`

`P(infecção_i,t)=1-exp[-h_i(t)]`.

A duração do encontro é sorteada segundo a distribuição do ambiente. O modelo não usa um limiar determinístico de minutos.

**Não identificado empiricamente:** o valor absoluto de `beta`. Os níveis baixo/médio/alto são cenários de sensibilidade, não estimativas clínicas.

## 4. Progressão clínica

Perfis disponíveis: influenza, COVID-19 e VSR.

O conjunto v2 armazena PMFs empíricas de 0–30 dias para:

- sintomas → internação;
- internação → alta/óbito.

Também armazena proporção de UTI e óbito entre hospitalizados por faixa etária. Esses números são condicionados à seleção do SIVEP/SRAG e **não são IFR**.

A probabilidade de um sintomático necessitar internação é uma aproximação híbrida documentada em `CALIBRACAO_V2.md`; não deve ser apresentada como risco clínico populacional validado.

## 5. Hospital e alerta

A capacidade inicial é escalada pela referência CNES de leitos cadastrados e pode ser sobrescrita no cenário.

O alerta padrão da v2 é `hospital_excess`: compara admissões dos últimos sete dias com uma taxa semanal SRAG por 100 mil e calcula um limite superior de Poisson. O jogo exige duas janelas consecutivas acima do limite antes do primeiro `game_alert`.

Esse mecanismo é um **alerta de epidemia simulada**, não um critério oficial.

## 6. Intervenções

Intervenções suportadas:

- `school_closure`;
- `remote_work`;
- `workplace_closure`;
- `mobility_restriction`;
- `bridge_closure`;
- `retail_limit`;
- `community_closure`;
- `hospital_capacity_change`;
- `lockdown`;
- `case_isolation`.

O lockdown remove presença escolar, trabalho não essencial, varejo e comunidade, mas mantém contatos domésticos e funções essenciais conforme configuração. Os percentuais de redução de casos são resultados **da própria simulação**, não efeitos causais importados de OxCGRT/PNAD.

## 7. Reintrodução e vacinação

`externalImportationRatePerDay` pode introduzir novos casos de forma explícita; com valor zero, o motor não cria casos espontaneamente depois da extinção.

A vacinação modela disponibilidade, doses, adesão, prioridade, atraso para proteção e proteção contra infecção/gravidade. Esses valores permanecem cenários configuráveis enquanto não houver evidência específica de produto/patógeno incorporada.

## 8. Reprodutibilidade

Toda execução registra seed, versão do motor e `parameterSetId` quando informado. Os testes cobrem reprodutibilidade, conservação, beta zero, fechamento de escola, lockdown, importação externa e fluxo hospitalar.

Executar:

```bash
node simulator/tests/test_engine.mjs
```

## 9. Limitações atuais

- integração com o SVG ainda pendente;
- três pontes ainda não são arestas individualizadas no motor;
- SIVEP 2019–2024 não foi harmonizado no conjunto v2 publicado; o perfil clínico usa 2025;
- baseline hospitalar é nacional/2025, não local multianual;
- beta, períodos latente/infeccioso, eficácia vacinal e efeitos causais de políticas continuam não identificados pelas bases fornecidas.

Consulte [CALIBRACAO_V2.md](CALIBRACAO_V2.md) antes de interpretar qualquer parâmetro.
