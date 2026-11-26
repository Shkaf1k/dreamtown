import * as THREE from 'three';

export class OrbitCamera {
  constructor(camera, renderer, target=new THREE.Vector3(0,0,0)) {
    this.camera=camera;this.renderer=renderer;this.target=target.clone();
    this.radius=13;this.theta=Math.PI/4;this.phi=1.02;this.dragging=false;this.pointer=null;this.last={x:0,y:0};this.pointers=new Map();this.startPinch=0;
    this.minRadius=7;this.maxRadius=24;this.apply();
    const el=renderer.domElement;
    el.addEventListener('pointerdown',e=>this.down(e));
    el.addEventListener('pointermove',e=>this.move(e));
    el.addEventListener('pointerup',e=>this.up(e));el.addEventListener('pointercancel',e=>this.up(e));
    el.addEventListener('wheel',e=>{e.preventDefault();this.radius=THREE.MathUtils.clamp(this.radius+e.deltaY*.012,this.minRadius,this.maxRadius);this.apply();},{passive:false});
    el.addEventListener('contextmenu',e=>e.preventDefault());
  }
  down(e){this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.renderer.domElement.setPointerCapture?.(e.pointerId);
    if(this.pointers.size===1){this.dragging=true;this.last={x:e.clientX,y:e.clientY};this.pointer=e.pointerId;}
    if(this.pointers.size===2){const p=[...this.pointers.values()];this.startPinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);this.dragging=false;}
  }
  move(e){if(!this.pointers.has(e.pointerId))return;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.pointers.size===2){const p=[...this.pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(this.startPinch){this.radius=THREE.MathUtils.clamp(this.radius-(d-this.startPinch)*.025,this.minRadius,this.maxRadius);this.apply();}this.startPinch=d;return;}
    if(this.dragging&&e.pointerId===this.pointer){const dx=e.clientX-this.last.x,dy=e.clientY-this.last.y;this.theta-=dx*.006;this.phi=THREE.MathUtils.clamp(this.phi+dy*.005,.35,1.42);this.last={x:e.clientX,y:e.clientY};this.apply();}
  }
  up(e){this.pointers.delete(e.pointerId);if(this.pointers.size<2)this.startPinch=0;if(!this.pointers.size){this.dragging=false;this.pointer=null;}}
  apply(){this.camera.position.set(this.target.x+this.radius*Math.sin(this.phi)*Math.sin(this.theta),this.target.y+this.radius*Math.cos(this.phi),this.target.z+this.radius*Math.sin(this.phi)*Math.cos(this.theta));this.camera.lookAt(this.target);}
  reset(){this.radius=13;this.theta=Math.PI/4;this.phi=1.02;this.target.set(0,0,0);this.apply();}
}
