/****************************************************
 * DETECCIÓN DE CAPACIDADES
 ****************************************************/
const TTS_SUPPORTED = "speechSynthesis" in window;

/****************************************************
 * ESTADO GLOBAL
 ****************************************************/
var sissy = {
  tickSound: new Howl({ src: ["assets/tick.mp3"] }),
  voices: [],            // Voces en español (filtradas)
  urls: [],              // URLs de imágenes
  isSpeaking: false,
  metronome: null,
  ttsInterval: null,
  gallery: null
};

/****************************************************
 * CARGAR VOCES EN ESPAÑOL (ROBUSTO)
 ****************************************************/
function populateVoiceList() {
  if (!TTS_SUPPORTED) return;

  const voiceSelect = document.getElementById("voice-select");
  const allVoices = speechSynthesis.getVoices();

  if (!voiceSelect) return;

  voiceSelect.innerHTML = "";
  sissy.voices = [];

  let preferredIndex = 0;

  allVoices.forEach((voice) => {
    if (voice.lang && voice.lang.startsWith("es")) {
      const option = document.createElement("option");
      option.value = sissy.voices.length;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);

      sissy.voices.push(voice);

      if (
        voice.name.includes("Google") ||
        voice.name.includes("Microsoft") ||
        voice.lang === "es-ES"
      ) {
        preferredIndex = sissy.voices.length - 1;
      }
    }
  });

  if (sissy.voices.length > 0) {
    voiceSelect.selectedIndex = preferredIndex;
  } else {
    voiceSelect.innerHTML = "<option>No hay voces en español</option>";
  }
}

// Carga asíncrona de voces
if (TTS_SUPPORTED) {
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
  }
  populateVoiceList();
}

/****************************************************
 * SUBIDA DE IMÁGENES (CARPETA O MÚLTIPLES)
 ****************************************************/
function handleFolderUpload(event) {
  const files = Array.from(event.target.files || []);
  const MAX_IMAGES = 50;

  sissy.urls = files
    .filter(f => f.type.startsWith("image/"))
    .slice(0, MAX_IMAGES)
    .map(file => URL.createObjectURL(file));

  const fileCountElement = document.getElementById("file-count");
  if (fileCountElement) {
    fileCountElement.textContent = `${sissy.urls.length} imagen(es) cargadas`;
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
 * INICIAR EXPERIENCIA
 ****************************************************/
function start() {
  // Desbloqueo de audio móvil
  try {
    Howler.ctx && Howler.ctx.resume && Howler.ctx.resume();
  } catch {}

  if (!sissy.urls.length) {
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

  shuffleArray(sissy.urls);

  let beatCount = 0;
  const intervalMs = (60 / bpm) * 1000;

  // Galería
  sissy.gallery = blueimp.Gallery(sissy.urls, {
    onclose: stop
  });

  // Metrónomo
  sissy.metronome = setInterval(() => {
    sissy.tickSound.play();
    beatCount++;

    if (next > 0 && beatCount % next === 0) {
      if (sissy.gallery && sissy.gallery.getIndex() < sissy.urls.length - 1) {
        sissy.gallery.next();
      }
    }
  }, intervalMs);

  // TTS
  if (mantra && intervalMs >= 600) {
    sissy.ttsInterval = setInterval(() => {
      speakMantra(mantra);
    }, intervalMs);
  }
}

/****************************************************
 * DETENER TODO
 ****************************************************/
function stop() {
  if (sissy.isSpeaking) {
    const wait = setInterval(() => {
      if (!sissy.isSpeaking) {
        clearInterval(wait);
        finalizeStop();
      }
    }, 100);
  } else {
    finalizeStop();
  }
}

function finalizeStop() {
  clearInterval(sissy.metronome);
  clearInterval(sissy.ttsInterval);

  sissy.metronome = null;
  sissy.ttsInterval = null;

  const mantraDisplay = document.getElementById("mantra-display");
  if (mantraDisplay) {
    mantraDisplay.style.display = "none";
    mantraDisplay.textContent = "";
  }

  if (TTS_SUPPORTED) {
    speechSynthesis.cancel();
  }
}

/****************************************************
 * HABLAR MANTRA (CON FALLBACK)
 ****************************************************/
function speakMantra(mantra) {
  const mantraDisplay = document.getElementById("mantra-display");
  if (mantraDisplay) {
    mantraDisplay.style.display = "block";
    mantraDisplay.textContent = mantra;
  }

  if (!TTS_SUPPORTED || !sissy.voices.length) return;

  const utterance = new SpeechSynthesisUtterance(mantra);
  utterance.lang = "es-ES";
  utterance.volume = 0.8;
  utterance.rate = 0.9; // móvil-friendly
  utterance.pitch = 1;

  const voiceSelect = document.getElementById("voice-select");
  const index = parseInt(voiceSelect?.value, 10);

  if (!isNaN(index) && sissy.voices[index]) {
    utterance.voice = sissy.voices[index];
  }

  sissy.isSpeaking = true;
  utterance.onend = () => (sissy.isSpeaking = false);

  speechSynthesis.speak(utterance);
}

/****************************************************
 * AJUSTES DESDE URL
 ****************************************************/
function applySettingsFromURL() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("bpm"))
    document.getElementById("beats-input").value = params.get("bpm");

  if (params.get("next"))
    document.getElementById("next-input").value = params.get("next");
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

// iOS: detener si la pestaña se oculta
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
