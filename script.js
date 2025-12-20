var app = {
  tickSound: new Howl({src:["assets/tick.mp3"], volume:1}),
  mantraSound: null,
  urls: [],
  metronome: null,
  gallery: null,
  isRunning: false
};

document.getElementById("folder-input").addEventListener("change", e=>{
  const files = Array.from(e.target.files||[]);
  app.urls = files.filter(f=>f.type.startsWith("image/")).map(f=>URL.createObjectURL(f));
  document.getElementById("file-count").textContent = `${app.urls.length} archivo(s) cargados`;
});

function showMantra(text){
  const el = document.getElementById("mantra-display");
  if(!el) return;
  el.style.display="block";
  el.textContent=text;
}

function playMantraAudio(){ if(app.mantraSound) app.mantraSound.play(); }

function start(){
  if(app.isRunning) return;
  app.isRunning=true;

  if(!app.urls.length){ alert("Sube imágenes primero"); app.isRunning=false; return; }

  const bpm=parseInt(document.getElementById("beats-input").value)||0;
  const next=parseInt(document.getElementById("next-input").value)||0;
  const mantra=document.getElementById("mantra-input").value.trim();
  const loading=document.getElementById("loading-screen");
  loading.style.display="flex";

  if(mantra){
    app.mantraSound=new Howl({
      src:["assets/mantra/mantra1.mp3"],
      volume: parseFloat(document.getElementById("volume-mantra").value),
      preload:true,
      html5:true,
      onload:()=>{ loading.style.display="none"; iniciarSesion(bpm,next,mantra); }
    });
  }else{ loading.style.display="none"; iniciarSesion(bpm,next,mantra); }
}

function iniciarSesion(bpm,next,mantra){
  app.gallery=blueimp.Gallery(app.urls,{onclose:stop});

  let beatCount=0;
  const intervalMs=(60/bpm)*1000;

  // Primer tick inmediato
  app.tickSound.volume(parseFloat(document.getElementById("volume-tick").value));
  app.tickSound.play();
  if(mantra){ showMantra(mantra); playMantraAudio(); }
  beatCount++;

  app.metronome=setInterval(()=>{
    if(!app.isRunning) return;
    app.tickSound.volume(parseFloat(document.getElementById("volume-tick").value));
    app.tickSound.play();
    beatCount++;
    if(mantra){ showMantra(mantra); playMantraAudio(); }
    if(next>0 && beatCount%next===0 && app.gallery) app.gallery.next();
  }, intervalMs);
}

function stop(){
  app.isRunning=false;
  clearInterval(app.metronome);
  if(app.mantraSound) app.mantraSound.stop();
  const el=document.getElementById("mantra-display");
  if(el){ el.style.display="none"; el.textContent=""; }
}

document.getElementById("start-button").addEventListener("click",start);
document.getElementById("volume-tick").addEventListener("input", e=>{ app.tickSound.volume(parseFloat(e.target.value)); });
document.getElementById("volume-mantra").addEventListener("input", e=>{ if(app.mantraSound) app.mantraSound.volume(parseFloat(e.target.value)); });

document.addEventListener("visibilitychange", ()=>{ if(document.hidden) stop(); });
