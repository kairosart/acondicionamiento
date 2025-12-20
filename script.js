/****************************************************
 * ESTADO GLOBAL
 ****************************************************/
var app = {
  tickSound: new Howl({ src: ["assets/tick.mp3"], volume: 1.0, html5: true }),
  mantraSound: null,
  urls: [],
  metronome: null,
  gallery: null,
  bpm: 0,
  next: 0,
  beatCount: 0,
  mantra: "",
};

/****************************************************
 * SUBIDA DE IMÁGENES
 ****************************************************/
function handleFolderUpload(event) {
  const files = Array.from(event.target.files || []);
  app.urls = files.filter(f => f.type.startsWith("image/"))
                  .map(f => URL.createObjectURL(f));
  document.getElementById("file-count").textContent = `${app.urls.length} archivo(s) cargados`;
}

/****************************************************
 * MOSTRAR MANTRA
 ****************************************************/
function showMantra(text){
  const el=document.getElementById("mantra-display");
  if(!el) return;
  el.style.display="block";
  el.textContent=text;
}

/****************************************************
 * DETENER TODO
 ****************************************************/
function stop() {
  clearInterval(app.metronome);
  app.metronome = null;

  if (app.mantraSound) app.mantraSound.stop();
  if (app.tickSound) app.tickSound.stop();

  const el = document.getElementById("mantra-display");
  if (el) { el.style.display="none"; el.textContent=""; }

  if (app.gallery) {
    app.gallery.close();
    app.gallery = null;
  }
}

/****************************************************
 * INICIAR SESIÓN
 ****************************************************/
function iniciarSesion() {
  stop();
  app.beatCount = 0;

  // Abrir galería
  app.gallery = blueimp.Gallery(app.urls, {
    onclose: stop
  });

  const intervalMs = (60 / app.bpm) * 1000;

  // Metrónomo
  app.metronome = setInterval(() => {
    app.tickSound.play();
    app.beatCount++;

    if (app.mantraSound) {
      showMantra(app.mantra);
      app.mantraSound.play();
    }

    if (app.next > 0 && app.beatCount % app.next === 0) {
      if (app.gallery && app.gallery.getIndex() < app.urls.length - 1) {
        app.gallery.next();
      }
    }
  }, intervalMs);
}

/****************************************************
 * BOTÓN INICIAR
 ****************************************************/
document.getElementById("start-button").addEventListener("click", () => {
  if (!app.urls.length) { alert("Sube imágenes primero"); return; }

  app.bpm = parseInt(document.getElementById("beats-input").value) || 0;
  app.next = parseInt(document.getElementById("next-input").value) || 0;
  app.mantra = document.getElementById("mantra-input").value.trim();

  if (app.bpm <= 0) { alert("Introduce un BPM válido"); return; }

  // Preparar mantra
  if (app.mantra) {
    const vol = parseFloat(document.getElementById("volume-mantra")?.value || 0.15);
    app.mantraSound = new Howl({
      src: ["assets/mantra/mantra1.mp3"],
      volume: vol,
      html5: true,
      preload: true
    });
  } else {
    app.mantraSound = null;
  }

  iniciarSesion();
});

/****************************************************
 * EVENTOS
 ****************************************************/
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("folder-input")?.addEventListener("change", handleFolderUpload);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
});
