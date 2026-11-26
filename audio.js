export class AudioManager {
  constructor(){this.enabled=true;this.ctx=null;this.master=null;this.musicTimer=null;this.note=0;}
  init(){if(this.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=.12;this.master.connect(this.ctx.destination);}
  tone(freq=440,duration=.13,type='sine',volume=.25){if(!this.enabled)return;this.init();if(!this.ctx)return;if(this.ctx.state==='suspended')this.ctx.resume();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);o.connect(g);g.connect(this.master);o.start();o.stop(this.ctx.currentTime+duration);}
  place(kind='house'){this.tone(kind==='tree'||kind==='flower'?660:kind==='water'?390:520,.12,'sine',.22);setTimeout(()=>this.tone(kind==='house'?790:880,.1,'sine',.12),55);}
  erase(){this.tone(250,.09,'triangle',.15);}
  setEnabled(v){this.enabled=v;if(this.master)this.master.gain.value=v?.12:0;if(v)this.startMusic();else this.stopMusic();}
  startMusic(){if(!this.enabled||this.musicTimer)return;this.init();const notes=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46];this.musicTimer=setInterval(()=>{if(this.enabled)this.tone(notes[this.note++%notes.length],.65,'sine',.035);},760);}
  stopMusic(){clearInterval(this.musicTimer);this.musicTimer=null;}
}
