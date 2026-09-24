// Switch only the site's visual theme; map geometry, data and controls are unchanged.
const root=document.documentElement;
const toggle=document.getElementById('theme-toggle');
const themeMeta=document.querySelector('meta[name="theme-color"]');
const STORAGE_KEY='outbreak-city-theme';
let initial='light';
try{initial=localStorage.getItem(STORAGE_KEY)==='dark'?'dark':'light';}catch{/* Storage can be disabled. */}
function applyTheme(theme){
  const dark=theme==='dark';
  root.dataset.theme=dark?'dark':'light';
  root.style.colorScheme=dark?'dark':'light';
  if(themeMeta)themeMeta.content=dark?'#202b3b':'#f3f5f3';
  toggle.setAttribute('aria-pressed',String(dark));
  toggle.setAttribute('aria-label',dark?'Ativar modo claro':'Ativar modo escuro');
  toggle.setAttribute('title',dark?'Ativar modo claro':'Ativar modo escuro');
  toggle.querySelector('.theme-toggle__icon').textContent=dark?'☀':'☾';
  toggle.querySelector('.theme-toggle__label').textContent=dark?'Modo claro':'Modo escuro';
}
applyTheme(initial);
toggle.addEventListener('click',()=>{
  const next=root.dataset.theme==='dark'?'light':'dark';
  applyTheme(next);
  try{localStorage.setItem(STORAGE_KEY,next);}catch{/* The toggle still works without storage. */}
});
