# OUTBREAK — City Network Simulator

Simulador experimental de transmissão em uma cidade **inteiramente fictícia**. O mapa 2D, a rede de mobilidade e o motor epidemiológico serão desenvolvidos em etapas para publicação estática via GitHub Pages.

## Primeira entrega

- Cidade 2D autoral inspirada na clareza visual de aplicativos de mapas, sem usar tiles proprietários.
- Rio e três pontes como gargalos de mobilidade; bairros, residências e locais públicos identificáveis.
- Zoom, seleção de locais e camadas de visualização; preparação para nós/grafos expansíveis.

## Próximas etapas

1. Integrar o motor estocástico já prototipado à topologia espacial do mapa.
2. Conectar casas, escolas, empresas, mercados, praças e hospitais a uma agenda de agentes sintéticos.
3. Implementar fechamento de locais, home office, intervenções nas pontes e vacinação com parâmetros explicitamente hipotéticos/documentados.
4. Adicionar indicadores e análises de múltiplas simulações, preservando separação entre observações históricas e dados simulados.

**Limite científico:** esta aplicação é educacional e exploratória, não faz previsões médicas nem atribui efeitos causais a intervenções históricas.

## Publicação

Configurar em **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**. A entrada do site será `index.html`. Após a publicação: https://gabrieldelvaje.github.io/outbreak-city-simulator/
