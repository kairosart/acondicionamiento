/****************************************************
 * ESTADO GLOBAL
 ****************************************************/
var app = {
  tickSound: new Howl({ src: ["assets/tick.mp3"], volume: 1.0 }),
  mantraSound: null,
  urls: [],
  metronome: null
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

  // Reinicia animación CSS
  el.style.animation = "none";
  void el.offsetHeight;
  el.style.animation = "";
}

/****************************************************
 * AUDIO MANTRA
 ****************************************************/
function playMantraAudio() {
  if (!app.mantraSound) return;
  app.mantraSound.stop();
  app.mantraSound.play();
}

/****************************************************
 * ABRIR GALERÍA
 ****************************************************/
function openGallery() {
  if (!app.urls.length) return;

  // Nueva instancia de galería cada vez
  new blueimp.Gallery(app.urls, {
    carousel: false,
    closeOnEscape: true,
    closeOnSlideClick: true,
    onclose: () => {
      stop(); // limpia ticks y mantra al cerrar
    }
  });
}

/****************************************************
 * INICIAR SESIÓN
 ****************************************************/
function start() {
  // desbloqueo de audio en móviles
  if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume();

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

  // Preparar audio del mantra
  if (mantra) {
    app.mantraSound = new Howl({
      src: ["assets/mantra/mantra1.mp3"], // ruta de tu mantra
      volume: 0.15,
      preload: true,
      html5: true
    });
  } else {
    app.mantraSound = null;
  }

  let beatCount = 0;
  const intervalMs = (60 / bpm) * 1000;

  // Abrir galería
  openGallery();

  // Metrónomo
  app.metronome = setInterval(() => {
    app.tickSound.play();
    beatCount++;

    if (mantra) {
      showMantra(mantra);
      playMantraAudio();
    }

    if (next > 0 && beatCount % next === 0) {
      const galleryEl = document.querySelector(".blueimp-gallery");
      if (galleryEl && galleryEl.classList.contains("blueimp-gallery")) {
        // avanzar slide
        const event = new Event("next");
        galleryEl.dispatchEvent(event);
      }
    }
  }, intervalMs);
}

/****************************************************
 * DETENER TODO
 ****************************************************/
function stop() {
  if (app.metronome) {
    clearInterval(app.metronome);
    app.metronome = null;
  }

  if (app.mantraSound) app.mantraSound.stop();

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
  if (params.get("bpm")) document.getElementById("beats-input").value = params.get("bpm");
  if (params.get("next")) document.getElementById("next-input").value = params.get("next");
}

/****************************************************
 * EVENTOS
 ****************************************************/
window.addEventListener("DOMContentLoaded", () => {
  applySettingsFromURL();
  document.getElementById("folder-input")?.addEventListener("change", handleFolderUpload);
  document.getElementById("start-button")?.addEventListener("click", start);
});

// Seguridad: parar al ocultar pestaña o cerrar ventana
document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
window.addEventListener("beforeunload", stop);
