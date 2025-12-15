// Objeto global para almacenar el estado de la aplicación
var sissy = {
  tickSound: new Howl({ src: ["assets/tick.mp3"] }),
  voices: [], // Almacena las voces disponibles
  urls: [], // Almacena las URLs de las imágenes subidas
  isSpeaking: false, // Indica si el TTS está hablando
  metronome: null, // Intervalo del metrónomo
  ttsInterval: null, // Intervalo para el TTS del mantra
  gallery: null, // Instancia de la galería Blueimp
};

// Rellenar el selector de voces
function populateVoiceList() {
  const voiceSelect = document.getElementById("voice-select");
  sissy.voices = speechSynthesis.getVoices();

  // Limpiar opciones existentes
  voiceSelect.innerHTML = "";

  // Rellenar el desplegable con las voces disponibles
  sissy.voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})${voice.default ? " [predeterminada]" : ""}`;
    voiceSelect.appendChild(option);

    // Seleccionar automáticamente Google UK English Female si está disponible
    if (voice.name === "Google UK English Female" && voice.lang === "en-GB") {
      voiceSelect.selectedIndex = index;
    }
  });

  // Usar la primera voz si ninguna está seleccionada
  if (voiceSelect.selectedIndex === -1) {
    voiceSelect.selectedIndex = 0;
  }
}

// Asegurarse de que las voces estén cargadas (algunos navegadores lo hacen de forma asíncrona)
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
} else {
  populateVoiceList();
}

// Manejar la subida de carpetas y mostrar el número de archivos
function handleFolderUpload(event) {
  const files = event.target.files;
  sissy.urls = Array.from(files).map(file => URL.createObjectURL(file));

  const fileCountElement = document.getElementById("file-count");
  if (fileCountElement) {
    fileCountElement.textContent = `${sissy.urls.length} archivo(s) subidos`;
  }
}

// Función auxiliar para mezclar un array aleatoriamente
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Intercambiar elementos
  }
}

// Iniciar la presentación y el metrónomo
function start() {
  if (!sissy.urls || sissy.urls.length === 0) {
    alert("Por favor, sube primero una carpeta con imágenes.");
    return;
  }

  const bpm = parseInt(document.getElementById("beats-input").value) || 0;
  const next = parseInt(document.getElementById("next-input").value) || 0;
  const mantra = document.getElementById("mantra-input").value.trim();

  // Mezclar las imágenes
  shuffleArray(sissy.urls);

  if (bpm > 0) {
    let beatCount = 0;

    // Iniciar la presentación
    sissy.gallery = blueimp.Gallery(sissy.urls, {
      onclose: stop,
      onslideend: (index) => {
        if (index === sissy.urls.length - 1) {
          const remainingBeats = next - (beatCount % next);
          setTimeout(stop, (60 / bpm) * 1000 * remainingBeats);
        }
      },
    });

    // Iniciar el metrónomo
    sissy.metronome = setInterval(() => {
      sissy.tickSound.play();
      beatCount++;

      if (next > 0 && beatCount % next === 0) {
        if (sissy.gallery.getIndex() < sissy.urls.length - 1) {
          sissy.gallery.next();
        }
      }
    }, (60 / bpm) * 1000);

    // Iniciar el TTS del mantra
    if (mantra) {
      const interval = (60 / bpm) * 1000;
      sissy.ttsInterval = setInterval(() => {
        speakMantra(mantra);
      }, interval);
    }
  } else {
    alert("Por favor, introduce un BPM válido (pulsos por minuto).");
  }
}

// Detener la presentación y el metrónomo
function stop() {
  if (sissy.isSpeaking) {
    const checkSpeakingInterval = setInterval(() => {
      if (!sissy.isSpeaking) {
        clearInterval(checkSpeakingInterval);
        finalizeStop();
      }
    }, 100);
  } else {
    finalizeStop();
  }
}

// Finalizar el proceso de parada
function finalizeStop() {
  clearInterval(sissy.metronome);
  clearInterval(sissy.ttsInterval);
  sissy.metronome = null;
  sissy.ttsInterval = null;

  const mantraDisplay = document.getElementById("mantra-display");
  mantraDisplay.style.display = "none";
  mantraDisplay.textContent = "";
  mantraDisplay.style.animation = "none";

  setTimeout(() => {
    speechSynthesis.cancel();
  }, 100);
}

// Pronunciar el mantra usando TTS
function speakMantra(mantra) {
  const mantraDisplay = document.getElementById("mantra-display");
  mantraDisplay.style.display = "block";
  mantraDisplay.textContent = mantra;

  const utterance = new SpeechSynthesisUtterance(mantra);
  utterance.volume = 0.8;
  utterance.rate = 1;
  utterance.pitch = 1;

  const voiceSelect = document.getElementById("voice-select");
  const selectedVoiceIndex = parseInt(voiceSelect.value, 10);
  if (!isNaN(selectedVoiceIndex) && sissy.voices[selectedVoiceIndex]) {
    utterance.voice = sissy.voices[selectedVoiceIndex];
  }

  speechSynthesis.speak(utterance);

  sissy.isSpeaking = true;
  utterance.onend = () => {
    sissy.isSpeaking = false;
  };
}

// Aplicar ajustes desde la URL
function applySettingsFromURL() {
  const params = new URLSearchParams(window.location.search);

  const bpm = params.get("bpm");
  if (bpm !== null) {
    document.getElementById("beats-input").value = bpm;
  }

  const next = params.get("next");
  if (next !== null) {
    document.getElementById("next-input").value = next;
  }
}

// Aplicar ajustes desde un enlace proporcionado
function applySettingsFromLink(link) {
  try {
    const url = new URL(link);
    const params = new URLSearchParams(url.search);

    const bpm = params.get("bpm");
    if (bpm !== null) {
      document.getElementById("beats-input").value = bpm;
    }

    const next = params.get("next");
    if (next !== null) {
      document.getElementById("next-input").value = next;
    }

    alert("¡Configuración importada correctamente!");
  } catch (error) {
    alert("Enlace inválido. Revisa el formato e inténtalo de nuevo.");
  }
}

// Eventos
window.addEventListener("DOMContentLoaded", applySettingsFromURL);
document.getElementById("folder-input").addEventListener("change", handleFolderUpload);
document.getElementById("start-button").addEventListener("click", start);
document.getElementById("apply-link-button").addEventListener("click", () => {
  const link = document.getElementById("import-link-input").value.trim();
  if (link) {
    applySettingsFromLink(link);
  } else {
    alert("Por favor, introduce un enlace válido.");
  }
});
