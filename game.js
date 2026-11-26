import * as THREE from 'three';
import {makeIsland} from './buildings.js';
import {OrbitCamera} from './camera.js';
import {Editor} from './editor.js';
import {SaveManager} from './save.js';
import {AudioManager} from './audio.js';

const $=id=>document.getElementById(id);
const canvas=$('world');
let renderer,scene,camera,orbit,editor,saves,audio,clock,water,clouds=[],birds=[],day=true,gameStarted=false,toastTimer;
const raycaster=new THREE.Raycaster();

function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2100);}
function init3D(){
  scene=new THREE.Scene();scene.background=new THREE.Color('#b8dcd9');scene.fog=new THREE.Fog('#b8dcd9',18,38);
  camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);
  renderer=new THREE.WebGLRenderer({canvas,antialias:innerWidth>700,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  const hemi=new THREE.HemisphereLight('#fff5e4','#6f9b91',2.0);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff1d2',2.25);sun.position.set(-7,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;scene.add(sun);
  const fill=new THREE.DirectionalLight('#d1e8ff',.65);fill.position.set(8,5,-7);scene.add(fill);
  const island=makeIsland();scene.add(island);
  const waterGeo=new THREE.CircleGeometry(8.4,48),waterMat=new THREE.MeshStandardMaterial({color:'#80c8cd',roughness:.22,metalness:.06});water=new THREE.Mesh(waterGeo,waterMat);water.rotation.x=-Math.PI/2;water.position.y=-1.12;scene.add(water);
  // Decorative cloud puffs.
  for(let i=0;i<7;i++){const c=new THREE.Group();for(let j=0;j<4;j++){const m=new THREE.Mesh(new THREE.SphereGeometry(.42+Math.random()*.22,8,6),new THREE.MeshStandardMaterial({color:'#fffdf5',transparent:true,opacity:.8,roughness:1}));m.position.set(j*.38,.1+Math.random()*.12,Math.sin(j)*.12);c.add(m);}c.position.set((Math.random()-.5)*24,5+Math.random()*4,(Math.random()-.5)*18);c.userData.speed=.15+Math.random()*.18;scene.add(c);clouds.push(c);}
  // A few tiny stylized birds.
  for(let i=0;i<3;i++){const b=new THREE.Group();const m=new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),new THREE.MeshStandardMaterial({color:'#667f7c'}));b.add(m);const wingMat=new THREE.MeshStandardMaterial({color:'#667f7c'});for(const s of [-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(.24,.025,.07),wingMat);w.position.set(s*.14,.035,0);w.rotation.z=s*.2;b.add(w);}b.position.set(-7+i*2,3.5+i*.4,-5);b.userData.speed=.45+i*.12;scene.add(b);birds.push(b);}
  orbit=new OrbitCamera(camera,renderer);clock=new THREE.Clock();
  let autosaveTimer;
  editor=new Editor(scene,raycaster,camera,canvas,n=>{
    $('building-count').textContent=`${n} objects`;
    if(gameStarted){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>{try{saves.save(editor.serialize(),'Sunny Isle');}catch(e){toast(e.message);}},900);}
  },toast,audio);
  editor.setEnabled(false);
  window.addEventListener('resize',resize);
  animate();
}
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));}
function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();if(water)water.position.y=-1.12+Math.sin(t*.7)*.035;clouds.forEach(c=>{c.position.x+=c.userData.speed*.003;if(c.position.x>15)c.position.x=-15;});birds.forEach((b,i)=>{b.position.x+=b.userData.speed*.012;if(b.position.x>12)b.position.x=-12;b.position.y+=Math.sin(t*3+i)*.0015;b.rotation.z=Math.sin(t*4+i)*.08;});if(editor){editor.items.forEach(o=>{if(o.userData.sway)o.userData.sway.rotation.z=Math.sin(t*1.3+o.position.x)*.035;});}renderer.render(scene,camera);}
function enterGame(load=false){gameStarted=true;$('main-menu').classList.add('hidden');$('game-ui').classList.remove('hidden');editor.setEnabled(true);orbit.reset();if(load){const w=saves.getActive();if(w)editor.load(w.objects);}audio.startMusic();toast('Welcome to your little island.');}
function saveWorld(){try{saves.save(editor.serialize(),'Sunny Isle');toast('Your town has been saved.');}catch(e){toast(e.message);}}
function loadWorld(){const worlds=saves.list();if(!worlds.length){toast('No saved towns yet. Build something and save it!');return;}const choice=worlds.length===1?worlds[0]:worlds[0];const id=worlds.length===1?choice.id:prompt('Введите ID города для загрузки:\n'+worlds.map(w=>`${w.id} — ${w.name}`).join('\n'),choice.id);if(!id)return;try{const w=saves.load(id);editor.load(w.objects);$('world-label').textContent=w.name.toUpperCase();toast('Town loaded.');}catch(e){toast(e.message);}}
function bindUI(){
  $('play-btn').onclick=()=>enterGame(false);
  $('continue-btn').onclick=()=>{const w=saves.getActive();if(!w){toast('No saved town yet — start a new world!');return;}enterGame(true);};
  $('new-world-btn').onclick=()=>{if(gameStarted)editor.clear();else enterGame(false);if(gameStarted)editor.clear();saves.activeId=null;$('world-label').textContent='SUNNY ISLE';toast('A fresh island awaits.');};
  $('settings-btn').onclick=()=>$('settings-panel').classList.remove('hidden');
  $('close-settings').onclick=()=>$('settings-panel').classList.add('hidden');
  $('sound-toggle').onchange=e=>audio.setEnabled(e.target.checked);
  $('hints-toggle').onchange=e=>{$('tool-hint').style.opacity=e.target.checked?'1':'0';};
  document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active'));b.classList.add('active');editor.setTool(b.dataset.tool);const hints={house:'A sweet little home for your island.',tall:'A taller home with a tiny balcony.',tower:'A lookout tower for the skyline.',castle:'A tiny fairytale castle.',shop:'A cheerful little shop.',tree:'Add a leafy tree.',flower:'Plant a little pop of color.',bush:'A soft green shrub.',lamp:'Light up a cozy corner.',bridge:'A decorative footbridge.',path:'Place a stone path tile.',water:'Add a little pool of water.',eraser:'Tap an object to remove it.'};$('tool-hint').textContent=hints[b.dataset.tool]||'Tap the island to build.';});
  document.querySelectorAll('.swatch').forEach(b=>b.onclick=()=>{document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');editor.setColor(b.dataset.color);});
  $('custom-color').oninput=e=>{document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('selected'));editor.setColor(e.target.value);};
  $('undo-btn').onclick=()=>editor.undo();$('save-btn').onclick=saveWorld;$('load-btn').onclick=loadWorld;
  $('export-btn').onclick=()=>{saves.export(editor.serialize(),'Dreamtown');toast('JSON export created.');};
  $('import-btn').onclick=()=>$('import-file').click();
  $('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=await saves.import(file);editor.load(data);toast('Town imported successfully.');}catch(err){toast(err.message||'Import failed.');}e.target.value='';};
  $('clear-btn').onclick=()=>{if(confirm('Clear every object from this island?')){editor.clear();toast('Island cleared.');}};
  $('reset-camera').onclick=()=>{orbit.reset();toast('View reset.');};
  $('time-toggle').onclick=()=>{day=!day;const c=day?'#b8dcd9':'#33465d';scene.background.set(c);scene.fog.color.set(c);scene.children.filter(o=>o.isDirectionalLight).forEach(o=>o.intensity=day?2.25:.55);$('time-toggle').textContent=day?'☼ Day':'☾ Night';};
  $('home-btn').onclick=()=>{editor.setEnabled(false);$('game-ui').classList.add('hidden');$('main-menu').classList.remove('hidden');audio.stopMusic();};
}
try{audio=new AudioManager();saves=new SaveManager();init3D();bindUI();}catch(err){console.error(err);document.body.innerHTML='<div style="padding:30px;font:16px sans-serif;color:#40545a">Не удалось запустить 3D-сцену. Обновите браузер и убедитесь, что WebGL включён.<br><small>'+String(err.message||err)+'</small></div>';}
