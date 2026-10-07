# Dados

A V1 não armazena geometrias proprietárias de transporte.

- O catálogo de linhas atuais está embutido em `app.js` a partir da página pública da Pira Mobilidade.
- Os traçados são consultados em tempo de execução no OpenStreetMap por meio da API Overpass, usando relações `type=route` + `route=bus`.
- Apenas códigos que também existem no catálogo oficial são renderizados.

Isso mantém separado o que é **cadastro oficial da linha** do que é **geometria aberta colaborativa**.
