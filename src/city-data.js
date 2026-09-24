// Fictional topology: these coordinates are screen-space, not real addresses or GIS coordinates.
export const WIDTH=1600, HEIGHT=900;
export const riverY=x=>345+66*Math.sin(x/185)+.11*x;
export const districts=[
  {id:'norte-verde',name:'Norte Verde',x:275,y:125,side:'norte',type:'Residencial · escolas e mercados'},
  {id:'jardim-do-rio',name:'Jardim do Rio',x:985,y:148,side:'norte',type:'Residencial · serviços locais'},
  {id:'vale-do-sol',name:'Vale do Sol',x:1395,y:150,side:'norte',type:'Residencial · baixa densidade'},
  {id:'centro-civico',name:'Centro Cívico',x:400,y:595,side:'sul',type:'Serviços públicos · hospital'},
  {id:'vila-industrial',name:'Vila Industrial',x:205,y:785,side:'sul',type:'Empresas · logística'},
  {id:'parque-leste',name:'Parque Leste',x:1010,y:635,side:'sul',type:'Comércio · serviços'},
  {id:'colinas-do-sul',name:'Colinas do Sul',x:1320,y:775,side:'sul',type:'Residencial · lazer'}
];
export const bridges=[
  {id:'ponte-norte',name:'Ponte Norte',x:340,y:riverY(340),open:true},
  {id:'ponte-central',name:'Ponte Central',x:800,y:riverY(800),open:true},
  {id:'ponte-sul',name:'Ponte Sul',x:1270,y:riverY(1270),open:true}
];
export const parks=[
  {x:105,y:94,rx:120,ry:83},{x:620,y:103,rx:110,ry:76},{x:1170,y:100,rx:85,ry:70},
  {x:115,y:548,rx:96,ry:81},{x:682,y:742,rx:110,ry:88},{x:1405,y:685,rx:125,ry:65},
  {x:1520,y:350,rx:95,ry:62}
];
export const places=[
  {id:'escola-norte',type:'school',name:'Escola Norte Verde',x:465,y:245,region:'norte-verde',capacity:330,description:'Hub escolar sintético: estudantes e equipe compartilham contatos recorrentes.'},
  {id:'mercado-norte',type:'market',name:'Mercado do Norte',x:160,y:300,region:'norte-verde',capacity:80,description:'Mercado sintético, com contatos curtos e rotatividade de frequentadores.'},
  {id:'escola-rio',type:'school',name:'Escola Jardim do Rio',x:1050,y:248,region:'jardim-do-rio',capacity:270,description:'Escola sintética que conecta famílias de diversos bairros.'},
  {id:'mercado-rio',type:'market',name:'Mercado do Rio',x:1235,y:316,region:'jardim-do-rio',capacity:100,description:'Local comercial sintético com fluxos cotidianos de visitantes.'},
  {id:'hospital-central',type:'hospital',name:'Hospital Municipal',x:450,y:671,region:'centro-civico',capacity:120,description:'Hub de assistência sintético; a capacidade de atendimento será ligada ao motor epidemiológico.'},
  {id:'prefeitura',type:'civic',name:'Prefeitura',x:552,y:625,region:'centro-civico',capacity:160,description:'Serviço público sintético com deslocamentos de diferentes bairros.'},
  {id:'praca-civica',type:'park',name:'Praça Cívica',x:270,y:656,region:'centro-civico',capacity:120,description:'Espaço de convivência com contatos comunitários.'},
  {id:'fabrica-oeste',type:'office',name:'Distrito Empresarial Oeste',x:215,y:712,region:'vila-industrial',capacity:560,description:'Concentração de trabalho presencial e deslocamentos pendulares.'},
  {id:'escola-industrial',type:'school',name:'Escola Vila Industrial',x:90,y:810,region:'vila-industrial',capacity:220,description:'Escola sintética com estudantes do entorno.'},
  {id:'centro-empresarial',type:'office',name:'Centro Empresarial Leste',x:1100,y:715,region:'parque-leste',capacity:620,description:'Hub de escritórios que recebe trabalhadores das duas margens.'},
  {id:'praca-torres',type:'park',name:'Praça das Torres',x:902,y:657,region:'parque-leste',capacity:150,description:'Praça junto a uma região de serviços e empresas.'},
  {id:'escola-colinas',type:'school',name:'Escola Colinas do Sul',x:1390,y:810,region:'colinas-do-sul',capacity:280,description:'Escola sintética do setor residencial ao sul.'},
  {id:'parque-colinas',type:'park',name:'Parque das Colinas',x:1470,y:628,region:'colinas-do-sul',capacity:280,description:'Espaço aberto, com contatos comunitários esporádicos.'}
];
export const placeColors={school:'#397fc6',market:'#eb9249',hospital:'#db5c62',civic:'#7685ad',park:'#58a774',office:'#7a70b7'};
export const placeGlyphs={school:'E',market:'M',hospital:'+',civic:'C',park:'P',office:'T'};
