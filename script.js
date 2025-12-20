const app = {
  urls: [],
  gallery: null,
  metronome: null,
  beatCount: 0,
  mantra: "",
  bpm: 0,
  next: 0,

  tick: new Howl({
    src: ["assets/tick.mp3"],
    volume: 1.0,
    html5: true
  }),

  mantraSound: null
};

/* ===============================
   SUBIR IMÁGENES
================================ */
document.getElementById("folder-input").addEventListener("change", e => {
  app.urls = Array.from(e.target.files)
    .filter(f => f.type.startsWith("image/"))
    .map(f => URL.createObjectURL(f));

  document.getElementById("file-count").textContent =
    app.urls.length + " archivos cargados";
});

/* ===============================
   MANTRA VISUAL
================================ */
function showMantra(text) {
  const el = document.getElementById("mantra-display");
  if (!el) return;

  el.style.display = "block";
  el.textContent = text;

  // 🔁 Reiniciar animación SIEMPRE
  el.style.animation = "none";
  void el.offsetHeight; // fuerza reflow
  el.style.animation = "mantraFade 1.5s ease-in-out";
}

/* ===============================
   PARAR AUDIO Y TIMERS (NO GALERÍA)
================================ */
function stopSession() {
  if (app.metronome) {
    clearInterval(app.metronome);
    app.metronome = null;
  }

  app.tick.stop();

  if (app.mantraSound) {
    app.mantraSound.stop();
  }

  const el = document.getElementById("mantra-display");
  el.style.display = "none";
  el.textContent = "";
}

/* ===============================
   INICIAR
================================ */
document.getElementById("start-button").addEventListener("click", () => {

  if (!app.urls.length) {
    alert("Sube imágenes primero");
    return;
  }

  app.bpm = parseInt(document.getElementById("beats-input").value);
  app.next = parseInt(document.getElementById("next-input").value) || 0;
  app.mantra = document.getElementById("mantra-input").value.trim();

  if (!app.bpm || app.bpm <= 0) {
    alert("BPM inválido");
    return;
  }

  stopSession();
  app.beatCount = 0;

  if (app.mantra) {
    app.mantraSound = new Howl({
      src: ["assets/mantra/mantra1.mp3"],
      volume: 0.15,
      html5: true
    });
  }

  app.gallery = blueimp.Gallery(app.urls, {
    onclose: () => {
      stopSession();   // 👈 SOLO esto
      app.gallery = null;
    }
  });

  const interval = (60 / app.bpm) * 1000;

  app.metronome = setInterval(() => {
    app.tick.play();
    app.beatCount++;

    if (app.mantra) {
      showMantra(app.mantra);
      if (app.mantraSound) app.mantraSound.play();
    }

    if (app.next > 0 && app.beatCount % app.next === 0) {
      if (app.gallery) app.gallery.next();
    }
  }, interval);
});

/* ===============================
   SEGURIDAD: CAMBIO DE PESTAÑA
================================ */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopSession();
  }
});
