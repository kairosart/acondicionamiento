/****************************************************
 * ESTADO GLOBAL
 ****************************************************/
var app = {
  tickSound: new Howl({ src: ["assets/tick.mp3"] }),
  mantraAudio: null,
  urls: [],
  metronome: null,
  gallery: null
};

/****************************************************
 * SUBIDA DE IMÁGENES
 ****************************************************/
function handleFolderUpload(event) {
  const files = Array.from(event.target.files || []);
  const MAX_IMAGES = 50;

  app.urls = files
    .filter(f => f.type.startsWith("image/"))
    .slice(0, MAX_IMAGES)
    .map(file => URL.createObjectURL(file));

  const count = document.getElementById("file-count");
  if (count) {
    count.textContent = `${app.urls.length} imagen(es) cargadas`;
  }
}

/****************************************************
 * UTILIDAD: MEZCLAR
 ****************************************************/
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/****************************************************
 * TEXTO ANIMADO (MANTRA)
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
 * AUDIO MANTRA
 ****************************************************/
function playMantraAudio() {
  if (!app.mantraAudio) return;

  app.mantraAudio.currentTime = 0;
  app.mantraAudio.play().catch(() => {});
}

/****************************************************
 * INICIAR EXPERIENCIA
 ****************************************************/
function start() {
  // desbloqueo audio móvil
  try {
    Howler.ctx && Howler.ctx.resume();
  } catch {}

  if (!app.urls.length) {
    alert("Selecciona imágenes primero.");
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

  // preparar audio mantra (opcional)
  if (mantra) {
    app.mantraAudio = new Audio("assets/mantra/mantra1.mp3");
  } else {
    app.mantraAudio = null;
  }

  let beatCount = 0;
  const intervalMs = (60 / bpm) * 1000;

  // galería
  app.gallery = blueimp.Gallery(app.urls, {
    onclose: stop
  });

  // metrónomo principal
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

  const el = document.getElementById("mantra-display");
  if (el) {
    el.style.display = "none";
    el.textContent = "";
  }
}

/****************************************************
 * AJUSTES DESDE URL
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

  document.getElementById("files-input")
    ?.addEventListener("change", handleFolderUpload);

  document.getElementById("start-button")
    ?.addEventListener("click", start);
});

// seguridad móvil
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
