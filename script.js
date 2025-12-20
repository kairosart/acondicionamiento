/****************************************************
 * ESTADO GLOBAL
 ****************************************************/
var app = {
  tickSound: new Howl({
    src: ["assets/tick.mp3"],
    volume: 1.0 // Tick más fuerte
  }),
  mantraSound: null,
  urls: [],
  metronome: null,
  gallery: null
};

/****************************************************
 * DESBLOQUEO AUDIO (GESTO DE USUARIO)
 ****************************************************/
function unlockAudio() {
  if (Howler.ctx && Howler.ctx.state === 'suspended') {
    Howler.ctx.resume();
  }
}

/****************************************************
 * SUBIDA DE IMÁGENES
 ****************************************************/
function handleFolderUpload(event) {
  const files = Array.from(event.target.files || []);
  const MAX_IMAGES = 100;

  app.urls = files
    .filter(f => f.type.startsWith("image/"))
    .slice(0, MAX_IMAGES)
    .map(file => URL.createObjectURL(file));

  const count = document.getElementById("file-count");
  if (count) count.textContent = `${app.urls.length} archivo(s) cargados`;
}

/****************************************************
 * UTILIDAD: MEZCLAR ARRAY
 ****************************************************/
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/****************************************************
 * MANTRA VISUAL
 ****************************************************/
function showMantra(text) {
  const el = document.getElementById("mantra-display");
  if (!el) return;

  el.style.display = "block";
  el.textContent = text;

  // reinicia animación CSS
  el.style.animation = "none";
  void el.offsetHeight;
  el.style.animation = "";
}

/****************************************************
 * AUDIO MANTRA (HOWLER)
 ****************************************************/
function playMantraAudio() {
  if (!app.mantraSound) return;

  app.mantraSound.stop();
  app.mantraSound.play();
}

/****************************************************
 * INICIAR SESIÓN
 ****************************************************/
function start() {
  unlockAudio(); // desbloquea audio con gesto de usuario
  Howler.mute(false);
  Howler.volume(1.0);

  if (!app.urls.length) {
    alert("Sube una carpeta con imágenes primero.");
    return;
  }

  const bpm = parseInt(document.getElementById("beats-input")?.value, 10) || 0;
  const next = parseInt(document.getElementById("next-input")?.value, 10) || 0;
  const mantra = document.getElementById("mantra-input")?.value.trim();

  if (bpm <= 0) {
    alert("Introduce un BPM válido.");
    return;
  }

  shuffleArray(app.urls);

  // preparar audio mantra
  if (mantra) {
    app.mantraSound = new Howl({
      src: ["assets/mantra/mantra1.mp3"], // reemplaza con tu mantra
      volume: 0.15, // más suave que el tick
      preload: true,
      html5: true,
      onplayerror: function() {
        this.once('unlock', function() { this.play(); });
      }
    });
  } else {
    app.mantraSound = null;
  }

  let beatCount = 0;
  const intervalMs = (60 / bpm) * 1000;

  // iniciar galería
  app.gallery = blueimp.Gallery(app.urls, { 
    onclose: stop 
  });

  // metronomo principal
  app.metronome = setInterval(() => {
    app.tickSound.play();
    beatCount++;

    if (mantra) {
      showMantra(mantra);
      playMantraAudio();
    }

    if (next > 0 && beatCount % next === 0) {
      if (app.gallery && app.gallery.getIndex() < app.urls.length - 1) {
        app.gallery.next();
      }
    }
  }, intervalMs);
}

/****************************************************
 * DETENER TODO
 ****************************************************/
function stop() {
  clearInterval(app.metronome);
  app.metronome = null;

  if (app.mantraSound) app.mantraSound.stop();

  const el = document.getElementById("mantra-display");
  if (el) {
    el.style.display = "none";
    el.textContent = "";
  }

  // cerrar galería si está abierta
  if (app.gallery && app.gallery.close) app.gallery.close();
  app.gallery = null;
}

/****************************************************
 * AJUSTES DESDE URL
 ****************************************************/
function applySettingsFromURL() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("bpm")) document.getElementById("beats-input").value = params.get("bpm");
  if (params.get("next")) document.getElementById("next-input").value = params.get("next");
}

/****************************************************
 * EVENTOS
 ****************************************************/
window.addEventListener("DOMContentLoaded", () => {
  applySettingsFromURL();

  document.getElementById("folder-input")?.addEventListener("change", handleFolderUpload);

  // Botón iniciar
  document.getElementById("start-button")?.addEventListener("click", start);
});

// Seguridad móvil: parar al ocultar pestaña
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});

// Detener al cerrar ventana o pestaña
window.addEventListener("beforeunload", stop);
