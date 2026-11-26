import * as THREE from 'three';

const mat = (color, roughness=.82) => new THREE.MeshStandardMaterial({color, roughness});
const box = (w,h,d, material, x=0,y=0,z=0, radius=0) => {
  const geometry = radius ? new THREE.BoxGeometry(w,h,d,2,2,2) : new THREE.BoxGeometry(w,h,d);
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; return mesh;
};
const add = (group, mesh) => { group.add(mesh); return mesh; };

export function makeBuilding(type, color='#f4a9b8') {
  const g = new THREE.Group(); g.userData.kind=type; g.userData.color=color;
  const wall=mat(color), trim=mat('#fff4df'), roof=mat('#bd8f87'), dark=mat('#526d70'), glass=new THREE.MeshStandardMaterial({color:'#a9dce0',roughness:.25,metalness:.08,emissive:'#426e70',emissiveIntensity:.18});
  const base=mat('#e8dfc9');
  if (['house','tall','shop','castle'].includes(type)) {
    const h=type==='tall'?1.75:(type==='castle'?1.35:1.05), w=type==='castle'?1.65:1.25, d=type==='castle'?1.45:1.15;
    add(g,box(w,h,d,wall,0,h/2,0));
    // Rounded-looking roof made from a low-poly cone, with a soft eave.
    const roofGeo=new THREE.ConeGeometry(type==='castle'?1.12:.92,type==='castle'?.85:.72,4);
    const roofMesh=new THREE.Mesh(roofGeo,mat(type==='shop'?'#c58d79':type==='castle'?'#8d91b8':'#c88982'));
    roofMesh.rotation.y=Math.PI/4; roofMesh.position.y=h+.35; roofMesh.castShadow=true; g.add(roofMesh);
    add(g,box(w+.12,.09,d+.12,trim,0,h-.02,0));
    // Front door and windows.
    add(g,box(.27,.48,.055,mat('#9a776a'),0,.25,d/2+.031));
    add(g,box(.075,.075,.025,mat('#e8c58b'),.07,.24,d/2+.065));
    for(const x of [-.37,.37]) {
      const win=box(.23,.27,.045,glass,x,h*.62,d/2+.035); add(g,win);
      add(g,box(.27,.035,.065,trim,x,h*.62-.16,d/2+.04));
      add(g,box(.035,.31,.065,trim,x,h*.62,d/2+.04));
    }
    if(type==='tall') {
      add(g,box(.23,.27,.045,glass,0,1.32,d/2+.035));
      add(g,box(.34,.07,.22,trim,0,1.12,d/2+.08));
      add(g,box(.9,.08,.22,trim,0,.82,d/2+.08));
    }
    if(type==='shop') {
      add(g,box(.62,.2,.09,mat('#f2d78d'),0,h-.26,d/2+.06));
      add(g,box(.72,.1,.1,mat('#eaa5a9'),0,h-.12,d/2+.07));
    }
    if(type==='castle') {
      for(const x of [-.68,.68]) for(const z of [-.58,.58]) {
        add(g,box(.34,1.05,.34,wall,x,.65,z));
        const cap=new THREE.Mesh(new THREE.ConeGeometry(.28,.45,4),mat('#9b91b5')); cap.position.set(x,1.38,z); cap.rotation.y=Math.PI/4; cap.castShadow=true;g.add(cap);
      }
    }
  } else if(type==='tower') {
    add(g, new THREE.Mesh(new THREE.CylinderGeometry(.48,.58,2.1,8),wall)).position.y=1.05;
    const cap=new THREE.Mesh(new THREE.ConeGeometry(.7,.8,8),mat('#9b91b5'));cap.position.y=2.48;cap.castShadow=true;g.add(cap);
    for(let y of [.7,1.25,1.8]) add(g,box(.22,.27,.06,glass,0,y,.51));
    add(g,box(.27,.55,.06,mat('#967768'),0,.27,.54));
  } else if(type==='tree') {
    add(g,new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,.75,6),mat('#a77e62'))).position.y=.37;
    const crown=new THREE.Group(); crown.position.y=.92; g.add(crown);
    for(const p of [[0,0,0],[-.27,.1,.05],[.24,.08,-.03],[.03,.32,-.1]]) {
      const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.43,1),mat(['#91c8a8','#9bd0ae','#a9d7b7'][Math.floor(Math.random()*3)]));
      m.position.set(...p);m.castShadow=true;crown.add(m);
    }
    g.userData.sway=crown;
  } else if(type==='flower') {
    add(g,new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.35,5),mat('#78a987'))).position.y=.17;
    const center=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),mat('#f5d47d'));center.position.y=.39;g.add(center);
    for(let i=0;i<5;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.12,7,5),mat(['#f2aabb','#f6c7a1','#b8a8d9'][i%3]));const a=i*Math.PI*2/5;p.position.set(Math.cos(a)*.13,.4,Math.sin(a)*.13);g.add(p);}
  } else if(type==='bush') {
    for(const p of [[0,0,0],[-.22,.03,0],[.2,.04,.02],[.02,.14,-.12]]){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,1),mat('#91c6a5'));m.position.set(...p);m.castShadow=true;g.add(m);}
  } else if(type==='lamp') {
    add(g,new THREE.Mesh(new THREE.CylinderGeometry(.035,.06,.85,6),mat('#8c9990'))).position.y=.42;
    add(g,box(.25,.24,.25,mat('#f3d88f'),0,.94,0));
    const light=new THREE.PointLight('#ffdf9f',.55,3);light.position.y=.95;g.add(light);
  } else if(type==='bridge') {
    add(g,box(1.5,.13,.52,mat('#b78e70'),0,.22,0));
    for(const x of [-.62,.62]) for(const z of [-.19,.19]) add(g,box(.08,.55,.08,mat('#9d7d68'),x,.46,z));
    add(g,box(1.45,.07,.08,trim,0,.68,-.19));add(g,box(1.45,.07,.08,trim,0,.68,.19));
  } else if(type==='path') {
    add(g,box(.92,.07,.92,mat('#d8cbb3'),0,.04,0));
    for(let i=0;i<3;i++)add(g,box(.22,.025,.22,mat('#b9b19f'),-.22+i*.22,.085,.03));
  } else if(type==='water') {
    const m=new THREE.MeshStandardMaterial({color:'#82cbd1',roughness:.22,metalness:.05,transparent:true,opacity:.88});
    add(g,box(1,.035,1,m,0,.015,0));
  }
  add(g,box(1.18,.08,1.08,base,0,.02,0));
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return g;
}

export function makeIsland() {
  const group=new THREE.Group();
  const landMat=mat('#a9cda9'), sandMat=mat('#e8d8b8'), sideMat=mat('#82b8a9');
  // Floating circular island with stepped low-poly sides.
  const top=new THREE.Mesh(new THREE.CylinderGeometry(5.8,5.45,.65,12,1),landMat);top.position.y=-.12;top.receiveShadow=true;top.castShadow=true;group.add(top);
  const sand=new THREE.Mesh(new THREE.CylinderGeometry(5.55,5.5,.12,12),sandMat);sand.position.y=.25;group.add(sand);
  const lower=new THREE.Mesh(new THREE.CylinderGeometry(5.45,4.85,.75,12,1),sideMat);lower.position.y=-.78;lower.castShadow=true;group.add(lower);
  const underside=new THREE.Mesh(new THREE.ConeGeometry(4.85,1.1,12),sideMat);underside.position.y=-1.55;group.add(underside);
  // Small shore stones.
  for(let i=0;i<22;i++){const a=i/22*Math.PI*2;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.13+Math.random()*.09,0),mat('#d4c5a7'));rock.position.set(Math.cos(a)*5.47,-.1,Math.sin(a)*5.47);rock.scale.y=.55;group.add(rock);}
  return group;
}
