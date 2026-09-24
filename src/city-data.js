// SVG city aligned to the reference image provided by the user.
export const WIDTH=1600, HEIGHT=900;
const X0=346,Y0=10,S=1.245;
const P=(x,y)=>({x:X0+S*x,y:Y0+S*y});
// Legacy function only for compatibility with the previous renderer.
export const riverY=x=>345+66*Math.sin(x/185)+.11*x;
export const bridges=[
{id:'ponte-norte',name:'Ponte Norte',...P(304,239),open:true},
{id:'ponte-central',name:'Ponte Central',...P(522,356),open:true},
{id:'ponte-sul',name:'Ponte Sul',...P(231,504),open:true}
];
export const districts=[
{id:'norte-verde',name:'Norte Verde',...P(148,114),side:'norte',type:'Residencial'},
{id:'jardim-do-rio',name:'Jardim do Rio',...P(370,104),side:'norte',type:'Residencial · educação'},
{id:'vale-do-sol',name:'Vale do Sol',...P(603,95),side:'norte',type:'Residencial'},
{id:'centro-civico',name:'Centro Cívico',...P(304,432),side:'sul',type:'Serviços públicos'},
{id:'vila-industrial',name:'Vila Industrial',...P(479,682),side:'sul',type:'Indústria · logística'},
{id:'parque-leste',name:'Parque Leste',...P(618,459),side:'sul',type:'Comércio · trabalho'},
{id:'colinas-do-sul',name:'Colinas do Sul',...P(142,633),side:'sul',type:'Residencial · lazer'}
];
export const parks=[P(124,326),P(338,350),P(528,197),P(435,592)];
const place=(id,type,name,u,v,region,capacity,description)=>({id,type,name,...P(u,v),region,capacity,description});
export const places=[
place('escola-norte','school','Escola Norte Verde',204,176,'norte-verde',330,'Escola em edifício próprio no bairro residencial.'),
place('mercado-norte','market','Mercado do Norte',155,223,'norte-verde',80,'Mercado de bairro com área comercial dedicada.'),
place('escola-rio','school','Escola Jardim do Rio',553,253,'jardim-do-rio',270,'Escola com pátio, próxima ao setor residencial da margem norte.'),
place('mercado-rio','market','Mercado do Rio',623,302,'vale-do-sol',100,'Mercado com acesso a uma avenida da margem norte.'),
place('hospital-central','hospital','Hospital Municipal',559,549,'parque-leste',120,'Hospital municipal e principal referência de atendimento da cidade.'),
place('prefeitura','civic','Prefeitura',439,501,'centro-civico',160,'Edifício administrativo reservado em lote próprio.'),
place('praca-civica','park','Praça Cívica',337,349,'centro-civico',120,'Praça central já presente no mapa de referência.'),
place('fabrica-oeste','office','Distrito Empresarial Oeste',467,578,'vila-industrial',560,'Área empresarial em quadra maior no setor sul.'),
place('escola-industrial','school','Escola Vila Industrial',322,603,'vila-industrial',220,'Escola com edifício e pátio próprios.'),
place('centro-empresarial','office','Centro Empresarial Leste',618,538,'parque-leste',620,'Complexo comercial e de trabalho em quadra dedicada.'),
place('praca-torres','park','Parque do Oeste',121,320,'norte-verde',150,'Parque existente no desenho original, sem novas praças sobrepostas.'),
place('escola-colinas','school','Escola Colinas',631,181,'vale-do-sol',280,'Escola do setor leste em lote residencial.'),
place('parque-colinas','park','Parque do Mirante',527,198,'vale-do-sol',280,'Área verde original ao norte do rio.')
];
export const placeColors={school:'#347fc5',market:'#df9044',hospital:'#cf5360',civic:'#607a98',park:'#39895b',office:'#7360a8'};
export const placeGlyphs={school:'E',market:'M',hospital:'+',civic:'C',park:'P',office:'T'};