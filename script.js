/****************************************************
 * ESTADO GLOBAL
 ****************************************************/
var app = {
  tickSound: new Howl({
    src: ["assets/tick.mp3"],
    volume: 2.0
  }),

  mantraSound: null,   // Howler para mantra
  urls: [],
  metronome: null,
  gallery: null
};

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
  if (count) {
    count.textContent = `${app.urls.length} archivo(s) cargados`;
  }
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
 * MANTRA VISUAL (ANIMADO)
 ****************************************************/
function showMantra(text) {
  const el = document.getElementById("mantra-display");
  if (!el) return;

  el.style.display = "block";
  el.textContent = text;

  // Reinicia animación CSS
  el.style.animation = "none";
  void el.offsetHeight;
  el.style.animation = "";
}

/****************************************************
 * AUDIO MANTRA (HOWLER)
 ****************************************************/
function playMantraAudio() {
  if (!app.mantraSound) return;

  app.mantraSound.stop(); // reiniciar siempre
  app.mantraSound.play();
}

/****************************************************
 * INICIAR EXPERIENCIA
 ****************************************************/
function start() {
  // desbloqueo global de audio
  Howler.volume(1.0);
  Howler.mute(false);

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

  // Preparar audio del mantra (MP3)
  if (mantra) {
    app.mantraSound = new Howl({
      src: ["assets/mantra/mantra1.mp3"],
      volume: 0.15,
      preload: true,
      html5: true   // 🔑 🔑 🔑 CLAVE ABSOLUTA
    });

  } else {
    app.mantraSound = null;
  }

  let beatCount = 0;
  const intervalMs = (60 / bpm) * 1000;

  // Iniciar galería
  app.gallery = blueimp.Gallery(app.urls, {
    onclose: stop
  });

  // Metrónomo principal
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

  if (app.mantraSound) {
    app.mantraSound.stop();
  }

  const el = document.getElementById("mantra-display");
  if (el) {
    el.style.display = "none";
    el.textContent = "";
  }
}

/****************************************************
 * AJUSTES DESDE URL (?bpm=60&next=4)
 ****************************************************/
function applySettingsFromURL() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("bpm")) {
    document.getElementById("beats-input").value = params.get("bpm");
  }

  if (params.get("next")) {
    document.getElementById("next-input").value = params.get("next");
  }
}

/****************************************************
 * EVENTOS
 ****************************************************/
window.addEventListener("DOMContentLoaded", () => {
  applySettingsFromURL();

  document.getElementById("folder-input")
    ?.addEventListener("change", handleFolderUpload);

  document.getElementById("start-button")
    ?.addEventListener("click", start);
});

// Seguridad móvil: parar al ocultar pestaña
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
