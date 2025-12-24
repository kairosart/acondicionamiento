const app = {
  urls: [],
  gallery: null,
  metronome: null,
  beatCount: 0,
  mantra: "",
  bpm: 0,
  next: 0,
  tick: new Howl({ src:["assets/tick.mp3"], volume:1.0, html5:true }),
  mantraSound: null
};

function showSpinner() {
  const s = document.getElementById("mantra-spinner");
  if (s) s.style.display = "flex";
}

function hideSpinner() {
  const s = document.getElementById("mantra-spinner");
  if (s) s.style.display = "none";
}


// Subir imágenes
document.getElementById("folder-input").addEventListener("change", e => {
  app.urls = Array.from(e.target.files)
    .filter(f => f.type.startsWith("image/"))
    .map(f => URL.createObjectURL(f));

  document.getElementById("file-count").textContent =
    app.urls.length + " archivos cargados";
});

// Mostrar mantra con fade
function showMantra(text, durationMs) {
  const el = document.getElementById("mantra-display");
  if (!el) return;

  el.textContent = text;
  el.style.display = "flex";
  el.style.opacity = "1";

  el.style.animation = "none";
  void el.offsetHeight;

  el.style.animation = `mantraFadeSoft ${durationMs}ms ease-in-out`;

  setTimeout(() => { el.style.opacity = "0"; }, durationMs);
}

// Parar sesión
function stopSession() {
  if(app.metronome){ clearInterval(app.metronome); app.metronome=null; }
  app.tick.stop();
  if(app.mantraSound){ app.mantraSound.stop(); app.mantraSound=null; }
  const el = document.getElementById("mantra-display");
  el.style.display="none";
  el.textContent="";
  hideSpinner();
}

// Iniciar sesión
document.getElementById("start-button").addEventListener("click", ()=>{
  if(!app.urls.length){ alert("Sube imágenes primero"); return; }

  app.bpm = parseInt(document.getElementById("beats-input").value);
  app.next = parseInt(document.getElementById("next-input").value) || 0;
  app.mantra = document.getElementById("mantra-input").value.trim();
  if(!app.bpm || app.bpm<=0){ alert("BPM inválido"); return; }

  stopSession();
  app.beatCount = 0;

  if(app.mantra){
    showSpinner();

    app.mantraSound = new Howl({
    src: ["assets/mantra/mantra1.mp3"],
    volume: 0.15,
    html5: true,
    preload: true,
      onload: () => {
        hideSpinner();
      },
      onloaderror: () => {
        hideSpinner();
        alert("Error al cargar el mantra");
      }
    });
  }

  app.gallery = blueimp.Gallery(app.urls, { onclose: ()=>{ stopSession(); app.gallery=null; } });

  const interval = (60 / app.bpm) * 1000;
  app.metronome = setInterval(()=>{
    app.tick.play();
    app.beatCount++;
    if(app.mantra){ showMantra(app.mantra, interval); if(app.mantraSound) app.mantraSound.play(); }
    if(app.next>0 && app.beatCount % app.next===0){ if(app.gallery) app.gallery.next(); }
  }, interval);
});

// MODAL
const modal = document.getElementById('guide-modal');
const openGuide = document.getElementById('open-guide');
const openPrivacy = document.getElementById('open-privacy');
const closeTop = document.getElementById('close-guide');
const closeBottom = document.getElementById('close-guide-btn');
const inner = document.getElementById('modal-inner-content');

function openModal(url){
  modal.style.display='block';
  document.body.style.overflow='hidden';
  inner.innerHTML='<p>Cargando…</p>';
  fetch(url)
    .then(r=>r.text())
    .then(html=>{ inner.innerHTML=html; })
    .catch(()=>{ inner.innerHTML='<p>Error al cargar el contenido.</p>'; });
}

function closeModal(){
  modal.style.display='none';
  document.body.style.overflow='';
  inner.innerHTML='';
}

openGuide.addEventListener('click', e=>{ e.preventDefault(); openModal('documents/guia.html'); });
openPrivacy.addEventListener('click', e=>{ e.preventDefault(); openModal('documents/privacy.html'); });
closeTop.addEventListener('click', closeModal);
closeBottom.addEventListener('click', closeModal);
window.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });

// Seguridad: cambio de pestaña
document.addEventListener("visibilitychange", ()=>{
  if(document.hidden) stopSession();
});
