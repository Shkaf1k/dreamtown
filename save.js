const KEY='dreamtown.worlds.v1', ACTIVE='dreamtown.active.v1';
export class SaveManager {
  constructor(){this.worlds=this.read();this.activeId=localStorage.getItem(ACTIVE)||null;}
  read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){console.warn('Save data could not be read',e);return {};}}
  write(){try{localStorage.setItem(KEY,JSON.stringify(this.worlds));}catch(e){throw new Error('Не удалось сохранить: возможно, закончилось место в хранилище браузера.');}}
  save(objects,name='Sunny Isle'){const id=this.activeId||'world-'+Date.now();this.activeId=id;this.worlds[id]={id,name,updated:Date.now(),objects:JSON.parse(JSON.stringify(objects))};this.write();localStorage.setItem(ACTIVE,id);return id;}
  list(){return Object.values(this.worlds).sort((a,b)=>b.updated-a.updated);}
  load(id){const world=this.worlds[id];if(!world)throw new Error('Сохранённый город не найден.');this.activeId=id;localStorage.setItem(ACTIVE,id);return JSON.parse(JSON.stringify(world));}
  getActive(){if(!this.activeId)return null;return this.worlds[this.activeId]||null;}
  removeAll(){this.worlds={};this.activeId=null;localStorage.removeItem(KEY);localStorage.removeItem(ACTIVE);}
  export(objects,name='Dreamtown'){const blob=new Blob([JSON.stringify({app:'DREAMTOWN',version:1,name,objects},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'dreamtown'}.json`;a.click();URL.revokeObjectURL(url);}
  async import(file){const data=JSON.parse(await file.text());if(!data||!Array.isArray(data.objects))throw new Error('Файл не похож на сохранение DREAMTOWN.');return data.objects;}
}
