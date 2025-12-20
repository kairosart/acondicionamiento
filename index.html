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
 * SPINNER DE CARGA
 ****************************************************/
function showLoading(show) {
  let el = document.getElementById("loading-screen");
  if (!el) {
    el = document.createElement("div");
    el.id = "loading-screen";
    el.style.cssText = `
      position: fixed;
      top:0; left:0; right:0; bottom:0;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
    `;
    el.innerHTML = `<div class="spinner" style="
      border: 8px solid #f3f3f3;
      border-top: 8px solid #D48ACB;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      animation: spin 1s linear infinite;
    "></div>`;
    document.body.appendChild(el);

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  el.style.display = show ? "flex" : "none";
}

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
 * MEZCLAR ARRAY
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
  if (el) el.style.display = "none";

  if (app.gallery) {
    app.gallery.close();
    app.gallery = null;
  }
}

/****************************************************
 * INICIAR SESIÓN
 ****************************************************/
function iniciarSesion() {
  stop(); // parar cualquier sesión previa

  app.beatCount = 0;

  app.gallery = blueimp.Gallery(app.urls, {
    onclose: stop
  });

  const intervalMs = (60 / app.bpm) * 1000;

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

  showLoading(true);

  if (app.mantra) {
    const vol = parseFloat(document.getElementById("volume-mantra")?.value || 0.15);
    app.mantraSound = new Howl({
      src: ["assets/mantra/mantra1.mp3"],
      volume: vol,
      preload: true,
      html5: true,
      onload: () => {
        showLoading(false);
        iniciarSesion();
      },
      onloaderror: () => {
        alert("Error al cargar el mantra");
        showLoading(false);
      }
    });
  } else {
    showLoading(false);
    iniciarSesion();
  }
});

/****************************************************
 * EVENTOS
 ****************************************************/
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("folder-input")?.addEventListener("change", handleFolderUpload);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
});
