// Fictional local map coordinates (1600 x 900). The city is not a real-world GIS map.
export const WIDTH=1600,HEIGHT=900;
export const riverY=x=>345+66*Math.sin(x/185)+.11*x;
// Crossings share the same x coordinates as north/south road corridors (50+100n).
export const bridges=[
{id:'ponte-norte',name:'Ponte Norte',x:350,y:riverY(350),open:true},
{id:'ponte-central',name:'Ponte Central',x:850,y:riverY(850),open:true},
{id:'ponte-sul',name:'Ponte Sul',x:1250,y:riverY(1250),open:true}
];
export const districts=[
{id:'norte-verde',name:'Norte Verde',x:490,y:125,side:'norte',type:'Residencial · educação'},
{id:'jardim-do-rio',name:'Jardim do Rio',x:1060,y:130,side:'norte',type:'Residencial · comércio'},
{id:'vale-do-sol',name:'Vale do Sol',x:1450,y:130,side:'norte',type:'Residencial'},
{id:'centro-civico',name:'Centro Cívico',x:525,y:550,side:'sul',type:'Serviços públicos'},
{id:'vila-industrial',name:'Vila Industrial',x:205,y:865,side:'sul',type:'Indústria · logística'},
{id:'parque-leste',name:'Parque Leste',x:1010,y:585,side:'sul',type:'Comércio · trabalho'},
{id:'colinas-do-sul',name:'Colinas do Sul',x:1370,y:665,side:'sul',type:'Residencial · lazer'}
];
// Parks occupy real parcels, not arbitrary circles behind streets.
export const parks=[{x:100,y:185},{x:700,y:185},{x:1500,y:185},{x:100,y:635},{x:700,y:725},{x:1500,y:815}];
// Public buildings occupy reserved city blocks; coordinates are shared by the hub and its footprint.
export const places=[
{id:'escola-norte',type:'school',name:'Escola Norte Verde',x:500,y:275,region:'norte-verde',capacity:330,description:'Escola no quarteirão residencial. Os estudantes conectam domicílios e turmas.'},
{id:'mercado-norte',type:'market',name:'Mercado do Norte',x:200,y:275,region:'norte-verde',capacity:80,description:'Mercado no quarteirão comercial do Norte Verde.'},
{id:'escola-rio',type:'school',name:'Escola Jardim do Rio',x:1100,y:275,region:'jardim-do-rio',capacity:270,description:'Escola com prédio e pátio próprios no Jardim do Rio.'},
{id:'mercado-rio',type:'market',name:'Mercado do Rio',x:1300,y:365,region:'jardim-do-rio',capacity:100,description:'Mercado junto à avenida de acesso à Ponte Sul.'},
{id:'hospital-central',type:'hospital',name:'Hospital Municipal',x:500,y:725,region:'centro-civico',capacity:120,description:'Hospital municipal com quarteirão dedicado e acesso viário.'},
{id:'prefeitura',type:'civic',name:'Prefeitura',x:600,y:635,region:'centro-civico',capacity:160,description:'Edifício cívico com praça de acesso e quarteirão próprio.'},
{id:'praca-civica',type:'park',name:'Praça Cívica',x:300,y:635,region:'centro-civico',capacity:120,description:'Praça arborizada que ocupa uma quadra inteira.'},
{id:'fabrica-oeste',type:'office',name:'Distrito Empresarial Oeste',x:200,y:725,region:'vila-industrial',capacity:560,description:'Edifícios de trabalho e pátio de logística no bairro industrial.'},
{id:'escola-industrial',type:'school',name:'Escola Vila Industrial',x:100,y:815,region:'vila-industrial',capacity:220,description:'Escola com acesso a uma rua local, pátio e edifício próprio.'},
{id:'centro-empresarial',type:'office',name:'Centro Empresarial Leste',x:1100,y:725,region:'parque-leste',capacity:620,description:'Complexo de escritórios em um quarteirão do Parque Leste.'},
{id:'praca-torres',type:'park',name:'Praça das Torres',x:900,y:725,region:'parque-leste',capacity:150,description:'Praça pública arborizada entre os edifícios do Parque Leste.'},
{id:'escola-colinas',type:'school',name:'Escola Colinas do Sul',x:1400,y:815,region:'colinas-do-sul',capacity:280,description:'Escola de bairro com pátio e acesso pelas ruas locais.'},
{id:'parque-colinas',type:'park',name:'Parque das Colinas',x:1500,y:725,region:'colinas-do-sul',capacity:280,description:'Parque com áreas verdes e caminhos de pedestres.'}
];
export const placeColors={school:'#397fc6',market:'#db8940',hospital:'#cf5360',civic:'#627b98',park:'#39895b',office:'#7360a8'};
export const placeGlyphs={school:'E',market:'M',hospital:'+',civic:'C',park:'P',office:'T'};
