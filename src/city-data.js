// The 740 × 740 source illustration is the coordinate system for the actual city.
// Keep source-space landmarks aligned with assets/city-reference.svg.
export const WIDTH=1600, HEIGHT=900;
export const MAP={x:346,y:10,scale:1.245,size:740};
const P=(x,y)=>({x:MAP.x+MAP.scale*x,y:MAP.y+MAP.scale*y});
export const riverY=x=>345+66*Math.sin(x/185)+.11*x; // legacy API compatibility only
export const bridges=[
{id:'ponte-norte',name:'Ponte Norte',...P(304,239),open:true},
{id:'ponte-central',name:'Ponte Central',...P(536,352),open:true},
{id:'ponte-sul',name:'Ponte Sul',...P(356,503),open:true}
];
export const districts=[
{id:'norte-verde',name:'Norte Verde',...P(150,136),side:'norte',type:'Residencial'},
{id:'jardim-do-rio',name:'Jardim do Rio',...P(370,108),side:'norte',type:'Residencial · educação'},
{id:'vale-do-sol',name:'Vale do Sol',...P(615,130),side:'norte',type:'Residencial'},
{id:'centro-civico',name:'Centro Cívico',...P(323,383),side:'sul',type:'Serviços públicos'},
{id:'vila-industrial',name:'Vila Industrial',...P(494,650),side:'sul',type:'Indústria · logística'},
{id:'parque-leste',name:'Parque Leste',...P(617,452),side:'sul',type:'Comércio · trabalho'},
{id:'colinas-do-sul',name:'Colinas do Sul',...P(142,624),side:'sul',type:'Residencial · lazer'}
];
const place=(id,type,name,u,v,region,capacity,description)=>({id,type,name,...P(u,v),region,capacity,description});
export const places=[
place('escola-norte','school','Escola Norte Verde',201,198,'norte-verde',330,'Escola em um dos edifícios do setor residencial noroeste da imagem original.'),
place('mercado-norte','market','Mercado do Norte',161,255,'norte-verde',80,'Mercado em lote comercial existente, próximo à avenida do setor oeste.'),
place('escola-rio','school','Escola Jardim do Rio',551,253,'jardim-do-rio',270,'Escola em um dos lotes a leste do rio.'),
place('mercado-rio','market','Mercado do Rio',610,298,'vale-do-sol',100,'Mercado em um dos edifícios comerciais junto ao eixo viário oriental.'),
place('hospital-central','hospital','Hospital Municipal',559,549,'parque-leste',120,'Hospital no conjunto de edifícios maiores ao sudeste do mapa.'),
place('prefeitura','civic','Prefeitura',491,555,'centro-civico',160,'Prédio público em um lote grande junto ao parque sul.'),
place('praca-civica','park','Praça Cívica',342,355,'centro-civico',120,'Área verde central já existente no mapa original.'),
place('fabrica-oeste','office','Distrito Empresarial Oeste',356,587,'vila-industrial',560,'Empresas instaladas no conjunto de edifícios da margem sul.'),
place('escola-industrial','school','Escola Vila Industrial',346,657,'vila-industrial',220,'Escola em um dos lotes do setor sul.'),
place('centro-empresarial','office','Centro Empresarial Leste',606,562,'parque-leste',620,'Conjunto de escritórios nos lotes comerciais do leste.'),
place('praca-torres','park','Parque do Oeste',114,328,'norte-verde',150,'Parque do setor oeste já existente na ilustração.'),
place('escola-colinas','school','Escola Colinas',546,143,'vale-do-sol',280,'Escola em um dos lotes residenciais do extremo nordeste.'),
place('parque-colinas','park','Parque do Mirante',540,188,'vale-do-sol',280,'Parque nordeste já existente na ilustração.')
];
export const placeColors={school:'#347fc5',market:'#df9044',hospital:'#cf5360',civic:'#607a98',park:'#39895b',office:'#7360a8'};
export const placeGlyphs={school:'E',market:'M',hospital:'+',civic:'C',park:'P',office:'T'};