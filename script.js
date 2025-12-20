var app = {
  tickSound: new Howl({ src: ["assets/tick.mp3"], volume: 1.0 }),
  mantraSound: null,
  urls: [],
  metronome: null,
  isRunning: false  // NUEVO FLAG
};

function handleFolderUpload(event) {
  const files = Array.from(event.target.files || []);
  const MAX_IMAGES = 100;
  app.urls = files.filter(f => f.type.startsWith("image/"))
                  .slice(0, MAX_IMAGES)
                  .map(f => URL.createObjectURL(f));
  const count = document.getElementById("file-count");
  if (count) count.textContent = `${app.urls.length} archivo(s) cargados`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function showMantra(text) {
  const el = document.getElementById("mantra-display");
  if (!el) return;
  el.style.display = "block";
  el.textContent = text;
  el.style.animation = "none";
  void el.offsetHeight;
  el.style.animation = "";
}

function playMantraAudio() {
  if (!app.mantraSound) return;
  app.mantraSound.stop();
  app.mantraSound.play();
}

function openGallery() {
  if (!app.urls.length) return;

  new blueimp.Gallery(app.urls, {
    carousel: false,
    closeOnEscape: true,
    closeOnSlideClick: true,
    onclose: () => {
      stopSession();
    }
  });
}

function start() {
  if (app.isRunning) return; // No iniciar varias veces
  app.isRunning = true;

  if (!app.urls.length) {
    alert("Sube una carpeta con imágenes primero.");
    app.isRunning = false;
    return;
  }

  const bpm = parseInt(document.getElementById("beats-input")?.value, 10) || 0;
  const next = parseInt(document.getElementById("next-input")?.value, 10) || 0;
  const mantra = document.getElementById("mantra-input")?.value.trim();

  if (bpm <= 0) {
    alert("Introduce un BPM válido.");
    app.isRunning = false;
    return;
  }

  shuffleArray(app.urls);

  if (mantra) {
    app.mantraSound = new Howl({
      src: ["assets/mantra/mantra1.mp3"],
      volume: 0.15,
      preload: true,
      html5: true
    });
  } else {
    app.mantraSound = null;
  }

  let beatCount = 0;
  const intervalMs = (60 / bpm) * 1000;

  openGallery();

  app.metronome = setInterval(() => {
    if (!app.isRunning) return; // ⚠️ Check flag
    app.tickSound.play();
    beatCount++;

    if (mantra) {
      showMantra(mantra);
      playMantraAudio();
    }

    if (next > 0 && beatCount % next === 0) {
      const galleryEl = document.querySelector(".blueimp-gallery");
      if (galleryEl && galleryEl.classList.contains("blueimp-gallery")) {
        const event = new Event("next");
        galleryEl.dispatchEvent(event);
      }
    }
  }, intervalMs);
}

function stopSession() {
  app.isRunning = false; // Desactivar flag

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

function applySettingsFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("bpm")) document.getElementById("beats-input").value = params.get("bpm");
  if (params.get("next")) document.getElementById("next-input").value = params.get("next");
}

window.addEventListener("DOMContentLoaded", () => {
  applySettingsFromURL();
  document.getElementById("folder-input")?.addEventListener("change", handleFolderUpload);
  document.getElementById("start-button")?.addEventListener("click", start);
});

// Seguridad: parar al ocultar pestaña o cerrar ventana
document.addEventListener("visibilitychange", () => { if (document.hidden) stopSession(); });
window.addEventListener("beforeunload", stopSession);
