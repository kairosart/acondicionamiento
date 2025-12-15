/****************************************************
 * ESTADO GLOBAL DE LA APLICACIÓN
 ****************************************************/
var sissy = {
  tickSound: new Howl({ src: ["assets/tick.mp3"] }),
  voices: [],            // Voces en español disponibles (filtradas)
  urls: [],              // URLs de imágenes subidas
  isSpeaking: false,     // Indica si el TTS está hablando
  metronome: null,       // Intervalo del metrónomo
  ttsInterval: null,     // Intervalo del TTS del mantra
  gallery: null          // Instancia de Blueimp Gallery
};

/****************************************************
 * CARGAR Y FORZAR VOCES EN ESPAÑOL (CORREGIDO)
 ****************************************************/
function populateVoiceList() {
  const voiceSelect = document.getElementById("voice-select");
  const allVoices = speechSynthesis.getVoices();

  voiceSelect.innerHTML = "";
  sissy.voices = [];

  let preferredIndex = 0;

  allVoices.forEach((voice) => {
    if (voice.lang && voice.lang.startsWith("es")) {
      const option = document.createElement("option");
      option.value = sissy.voices.length; // índice LOCAL
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);

      sissy.voices.push(voice);

      // Prioridad automática
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
    alert("No hay voces en español disponibles en este navegador.");
  }
}

// Carga asíncrona de voces
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
} else {
  populateVoiceList();
}

/****************************************************
 * SUBIDA DE CARPETA DE IMÁGENES
 ****************************************************/
function handleFolderUpload(event) {
  const files = event.target.files;
  sissy.urls = Array.from(files).map(file => URL.createObjectURL(file));

  const fileCountElement = document.getElementById("file-count");
  if (fileCountElement) {
    fileCountElement.textContent = `${sissy.urls.length} archivo(s) subidos`;
  }
}

/****************************************************
 * MEZCLAR ARRAY ALEATORIAMENTE
 ****************************************************/
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/****************************************************
 * INICIAR PRESENTACIÓN + METRÓNOMO + TTS
 ****************************************************/
function start() {
  if (!sissy.urls || sissy.urls.length === 0) {
    alert("Por favor, sube primero una carpeta con imágenes.");
    return;
  }

  const bpm = parseInt(document.getElementById("beats-input").value) || 0;
  const next = parseInt(document.getElementById("next-input").value) || 0;
  const mantra = document.getElementById("mantra-input").value.trim();

  if (bpm <= 0) {
    alert("Introduce un BPM válido (pulsos por minuto).");
    return;
  }

  shuffleArray(sissy.urls);

  let beatCount = 0;

  // Galería
  sissy.gallery = blueimp.Gallery(sissy.urls, {
    onclose: stop,
    onslideend: (index) => {
      if (index === sissy.urls.length - 1 && next > 0) {
        const remainingBeats = next - (beatCount % next);
        setTimeout(stop, (60 / bpm) * 1000 * remainingBeats);
      }
    }
  });

  // Metrónomo
  sissy.metronome = setInterval(() => {
    sissy.tickSound.play();
    beatCount++;

    if (next > 0 && beatCount % next === 0) {
      if (sissy.gallery.getIndex() < sissy.urls.length - 1) {
        sissy.gallery.next();
      }
    }
  }, (60 / bpm) * 1000);

  // TTS del mantra
  if (mantra) {
    const interval = (60 / bpm) * 1000;
    sissy.ttsInterval = setInterval(() => {
      speakMantra(mantra);
    }, interval);
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
  mantraDisplay.style.display = "none";
  mantraDisplay.textContent = "";
  mantraDisplay.style.animation = "none";

  setTimeout(() => speechSynthesis.cancel(), 100);
}

/****************************************************
 * HABLAR MANTRA (ESPAÑOL FORZADO)
 ****************************************************/
function speakMantra(mantra) {
  const mantraDisplay = document.getElementById("mantra-display");
  mantraDisplay.style.display = "block";
  mantraDisplay.textContent = mantra;

  const utterance = new SpeechSynthesisUtterance(mantra);
  utterance.lang = "es-ES";
  utterance.volume = 0.8;
  utterance.rate = 1;
  utterance.pitch = 1;

  const voiceSelect = document.getElementById("voice-select");
  const selectedIndex = parseInt(voiceSelect.value, 10);

  if (!isNaN(selectedIndex) && sissy.voices[selectedIndex]) {
    utterance.voice = sissy.voices[selectedIndex];
  }

  speechSynthesis.speak(utterance);

  sissy.isSpeaking = true;
  utterance.onend = () => {
    sissy.isSpeaking = false;
  };
}

/****************************************************
 * AJUSTES DESDE URL
 ****************************************************/
function applySettingsFromURL() {
  const params = new URLSearchParams(window.location.search);

  const bpm = params.get("bpm");
  if (bpm !== null) document.getElementById("beats-input").value = bpm;

  const next = params.get("next");
  if (next !== null) document.getElementById("next-input").value = next;
}

/****************************************************
 * IMPORTAR AJUSTES DESDE ENLACE
 ****************************************************/
function applySettingsFromLink(link) {
  try {
    const url = new URL(link);
    const params = new URLSearchParams(url.search);

    const bpm = params.get("bpm");
    if (bpm !== null) document.getElementById("beats-input").value = bpm;

    const next = params.get("next");
    if (next !== null) document.getElementById("next-input").value = next;

    alert("¡Configuración importada correctamente!");
  } catch {
    alert("Enlace inválido. Revisa el formato.");
  }
}

/****************************************************
 * EVENTOS
 ****************************************************/
window.addEventListener("DOMContentLoaded", applySettingsFromURL);
document.getElementById("folder-input").addEventListener("change", handleFolderUpload);
document.getElementById("start-button").addEventListener("click", start);
document.getElementById("apply-link-button").addEventListener("click", () => {
  const link = document.getElementById("import-link-input").value.trim();
  if (link) applySettingsFromLink(link);
  else alert("Introduce un enlace válido.");
});
