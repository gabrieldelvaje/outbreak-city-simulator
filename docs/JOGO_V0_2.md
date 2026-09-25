# OUTBREAK — primeira versão jogável V0.2

**Status:** implementado no GitHub Pages.  
**Motor:** `2.0.0-data-informed`.

## Fluxo da partida

1. O jogador escolhe população (10–30.000), doença e nível de transmissibilidade.
2. Clica numa casa ou local público para selecionar o foco inicial.
3. O navegador envia a configuração a `src/simulation-worker.js`.
4. O Worker carrega `calibrated_parameters_v2.json`, cria a configuração e executa `simulate()` fora da thread da interface.
5. O mapa reproduz os resultados por dia.
6. Quando o alerta hospitalar do motor é acionado, as decisões ficam disponíveis.
7. Uma decisão entra em vigor no dia seguinte. O cenário é recalculado com a mesma seed e as mesmas condições até aquele momento, adicionando a intervenção escolhida.
8. O jogador pode continuar, pausar e observar a nova trajetória.

## Foco inicial

O motor agora aceita:

- `initialSeedRegion`;
- `initialSeedContext`.

Contextos suportados: `home`, `school`, `work`, `retail`, `community` e `hospital`.

A seleção no SVG é convertida em região e contexto. Para uma escola, por exemplo, o primeiro infectado é escolhido entre agentes compatíveis com a escola daquela região. Para hospital, o motor prioriza trabalhadores de saúde.

Os nós residenciais do desenho são agregados. A casa escolhida é o ponto visual do paciente zero, enquanto o motor escolhe um domicílio sintético da mesma região.

## Projeção do motor sobre o mapa

O motor continua trabalhando com locais abstratos internos. A interface converte cada evento de infecção para um nó compatível:

- `household` → residência do distrito;
- `school` → escola;
- `work` → empresa/prédio cívico;
- `retail` → mercado/comércio/restaurante;
- `community` → parque/praça;
- `hospital` → hospital.

A escolha do nó dentro da categoria é determinística a partir de pessoa, fonte e dia, mantendo uma visualização reprodutível para a mesma seed.

A cor representa **atividade de infecção nos dez dias mais recentes**, não prevalência medida naquele prédio:

- amarelo: atividade baixa;
- laranja: atividade média;
- vermelho: atividade alta.

## Vigilância

A interface usa o `gameAlert` produzido pelo motor. Na configuração data-informed atual, o alerta compara admissões hospitalares recentes com uma referência sazonal de SRAG e exige janelas consecutivas acima do limite.

A mensagem é sempre **“alerta de epidemia simulada”**.

## Decisões disponíveis

### Fechar escolas
`school_closure`, fração 1.

### Home office
`remote_work`, fração 0,60. A fração é uma hipótese de jogo explícita e não uma eficácia causal estimada.

### Fechar lazer
`community_closure`, fração 1.

### Restringir comércio
`retail_limit`, fração 1.

### Lockdown
`lockdown`, fração 1. O motor preserva contatos domésticos e trabalhadores de saúde conforme suas regras.

### Vacinação
Cenário demonstrativo iniciado no dia seguinte à decisão, com aplicação diária equivalente a 1% da população (mínimo de 5 doses/dia), adesão de 75%, 14 dias até proteção e os parâmetros de proteção atualmente versionados no motor. Esses valores são hipóteses de cenário, não características de uma vacina específica.

## Recalcular decisões

A V0.2 ainda não mantém um estado incremental mutável dentro do Worker. Ao tomar uma decisão, o motor executa novamente o cenário completo usando a mesma seed e adiciona a intervenção a partir do dia seguinte.

Como a intervenção não existe nos dias anteriores, a trajetória anterior permanece reproduzível sob a mesma configuração. Essa estratégia permite jogabilidade determinística sem duplicar a lógica epidemiológica no front-end.

## Pontes

Os três controles de ponte continuam apenas visuais. `bridge_closure` do motor ainda representa travessias abstratas e não Ponte Norte/Central/Sul individualmente.

**Não considerar as pontes integradas epidemiologicamente na V0.2.**

## Critérios de aceite desta versão

- motor roda em Worker;
- população máxima permitida pela interface = 30.000;
- foco inicial obrigatório antes de iniciar;
- foco inicial chega ao motor como região + contexto;
- testes verificam que uma semente escolar começa na região/camada escolhida;
- painel diário reproduz os estados retornados pelo motor;
- alerta libera decisões;
- decisões alteram a configuração a partir do dia seguinte;
- nós do mapa apresentam atividade epidemiológica;
- controles existentes de zoom, inspeção, camadas e tema permanecem;
- pontes são explicitamente marcadas como pendentes de integração espacial.

## Próximas etapas

1. grafo viário real e três pontes individualizadas;
2. vínculo persistente entre domicílios internos e marcadores residenciais;
3. deslocamentos animados de amostras de agentes;
4. orçamento/custos das decisões;
5. desenvolvimento de vacina com etapas e tempo;
6. balanço final comparando cenários com múltiplas seeds.
