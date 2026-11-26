import * as THREE from 'three';
import {makeBuilding} from './buildings.js';

export class Editor {
  constructor(scene,raycaster,camera,canvas,onChange,onToast,audio){this.scene=scene;this.raycaster=raycaster;this.camera=camera;this.canvas=canvas;this.onChange=onChange;this.onToast=onToast;this.audio=audio;this.items=[];this.tool='house';this.color='#f4a9b8';this.undoStack=[];this.preview=null;this.pointer=new THREE.Vector2();this.groundY=.34;this.grid=1;this.islandRadius=5.05;this.enabled=false;
    this.ground=new THREE.Plane(new THREE.Vector3(0,1,0),-this.groundY);
    canvas.addEventListener('pointermove',e=>this.pointerMove(e));
    canvas.addEventListener('pointerdown',e=>{this.pendingTap={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};});
    canvas.addEventListener('pointerup',e=>this.pointerUp(e));
  }
  setEnabled(v){this.enabled=v;if(!v)this.removePreview();}
  setTool(tool){this.tool=tool;this.removePreview();this.onToast(tool==='eraser'?'Tap an object to remove it.':`Selected: ${tool}. Tap the island to build.`);}
  setColor(color){this.color=color;if(this.preview&&this.preview.userData.kind)this.updatePreviewColor();}
  updatePreviewColor(){this.removePreview();}
  removePreview(){if(this.preview){this.scene.remove(this.preview);this.preview=null;}}
  pointerRay(e){const r=this.canvas.getBoundingClientRect();this.pointer.x=((e.clientX-r.left)/r.width)*2-1;this.pointer.y=-((e.clientY-r.top)/r.height)*2+1;this.raycaster.setFromCamera(this.pointer,this.camera);}
  intersectGround(){const p=new THREE.Vector3();if(!this.raycaster.ray.intersectPlane(this.ground,p))return null;const x=Math.round(p.x/this.grid)*this.grid,z=Math.round(p.z/this.grid)*this.grid;if(Math.hypot(x,z)>this.islandRadius)return null;return new THREE.Vector3(x,this.groundY,z);}
  pointerMove(e){if(!this.enabled)return;this.pointerRay(e);const p=this.intersectGround();if(!p||this.tool==='eraser'){this.removePreview();return;}if(!this.preview){this.preview=makeBuilding(this.tool,this.color);this.preview.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.55;}});this.scene.add(this.preview);}this.preview.position.copy(p);this.preview.position.y-=.02;this.preview.rotation.y=Math.PI/4;}
  pointerDown(e){if(!this.enabled||e.button!==0)return;this.pointerRay(e);
    // Ignore taps that were actually camera drags.
    if(this._lastDown&&performance.now()-this._lastDown.time<250&&Math.hypot(e.clientX-this._lastDown.x,e.clientY-this._lastDown.y)>7)return;
    const p=this.intersectGround();if(!p)return;
    if(this.tool==='eraser'){this.eraseAt(p);return;}
    if(this.tool==='water'&&this.items.some(o=>o.userData.kind==='water'&&o.position.distanceTo(p)<.7)){this.onToast('There is already water here.');return;}
    const item={kind:this.tool,color:this.color,x:p.x,z:p.z,rotation:Math.PI/4};
    this.add(item,true);
  }
  add(data,record=false){const g=makeBuilding(data.kind,data.color);g.position.set(data.x,this.groundY,data.z);g.rotation.y=data.rotation||0;g.userData.kind=data.kind;g.userData.color=data.color;g.userData.record=data;this.scene.add(g);this.items.push(g);if(record)this.undoStack.push({type:'add',index:this.items.length-1,data});this.onChange(this.items.length);this.audio?.place(data.kind);this.spawnPop(g);this.tryConnect(g);return g;}
  spawnPop(g){g.scale.setScalar(.01);const start=performance.now(),duration=260;const tick=()=>{const t=Math.min(1,(performance.now()-start)/duration);const s=1-Math.pow(1-t,3);g.scale.setScalar(s);if(t<1)requestAnimationFrame(tick);};tick();}
  tryConnect(g){const near=this.items.filter(o=>o!==g&&o.position.distanceTo(g.position)<1.15);if(near.length&&['house','tall','shop'].includes(g.userData.kind)){g.userData.balcony=true;const balcony=new THREE.Mesh(new THREE.BoxGeometry(.7,.07,.25),new THREE.MeshStandardMaterial({color:'#f3e4c9'}));balcony.position.set(0,.78,.72);balcony.castShadow=true;g.add(balcony);}if(g.userData.kind==='bridge')g.rotation.y=Math.atan2(g.position.x,g.position.z);}
  eraseAt(p){let best=-1,dist=1.15;this.items.forEach((o,i)=>{const d=Math.hypot(o.position.x-p.x,o.position.z-p.z);if(d<dist){dist=d;best=i;}});if(best<0){this.onToast('Nothing to remove here.');return;}const o=this.items[best],data=this.serializeOne(o);this.scene.remove(o);this.items.splice(best,1);this.undoStack.push({type:'remove',index:best,data});this.onChange(this.items.length);this.audio?.erase();}
  undo(){const a=this.undoStack.pop();if(!a){this.onToast('Nothing to undo yet.');return;}if(a.type==='add'){const o=this.items[a.index];if(o){this.scene.remove(o);this.items.splice(a.index,1);}}else this.addAt(a.data,a.index);this.onChange(this.items.length);this.onToast('Last action undone.');}
  addAt(data,index){const g=makeBuilding(data.kind,data.color);g.position.set(data.x,this.groundY,data.z);g.rotation.y=data.rotation||0;g.userData.kind=data.kind;g.userData.color=data.color;this.scene.add(g);this.items.splice(Math.min(index,this.items.length),0,g);}
  serializeOne(o){return {kind:o.userData.kind,color:o.userData.color,x:o.position.x,z:o.position.z,rotation:o.rotation.y};}
  serialize(){return this.items.map(o=>this.serializeOne(o));}
  clear(){this.items.forEach(o=>this.scene.remove(o));this.items=[];this.undoStack=[];this.onChange(0);}
  load(objects){this.clear();for(const o of objects){if(!o||typeof o.kind!=='string'||!Number.isFinite(o.x)||!Number.isFinite(o.z))continue;this.add({kind:o.kind,color:o.color||'#f4a9b8',x:o.x,z:o.z,rotation:o.rotation||0},false);}this.undoStack=[];}
}
