import { textToSpeech } from '../services/geminiService';

export class VoiceController {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'fr-FR';
      }
    }
  }

  startListening(onResult: (text: string) => void, onError: (err: any) => void) {
    if (!this.recognition) {
      onError("Speech recognition not supported");
      return;
    }

    // Warm up AudioContext
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      console.log(`[Voice] Recognition result: ${text}`);
      onResult(text);
    };

    this.recognition.onerror = (event: any) => {
      console.error(`[Voice] Recognition error:`, event);
      onError(event.error);
    };

    try {
      this.recognition.start();
      console.log("[Voice] Listening started...");
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      console.log("[Voice] Listening stopped manually.");
    }
  }

  async speak(text: string): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        console.time("TTS_Latency");
        const base64 = await textToSpeech(text);
        console.timeEnd("TTS_Latency");
        
        if (!base64) {
          throw new Error("Empty TTS response");
        }

        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const arrayBuffer = bytes.buffer;
        const pcmData = new Int16Array(arrayBuffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0;
        }

        const audioBuffer = this.audioContext.createBuffer(1, floatData.length, 24000);
        audioBuffer.getChannelData(0).set(floatData);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.onended = () => {
          resolve();
        };
        source.start();
      } catch (error) {
        console.warn("[Voice] Falling back to Web Speech API due to error:", error);
        this.speakFallback(text, resolve);
      }
    });
  }

  private speakFallback(text: string, onEnd: () => void) {
    if (!('speechSynthesis' in window)) {
      onEnd();
      return;
    }
    
    window.speechSynthesis.cancel();

    // Sometimes voices are not loaded yet
    const startSpeaking = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.pitch = 0.9;
      utterance.rate = 1.25;
      
      const voices = window.speechSynthesis.getVoices();
      // Try to find a good male voice for JARVIS
      const frVoice = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Google') || v.name.includes('Male'))) 
                   || voices.find(v => v.lang.startsWith('fr'));
      
      if (frVoice) utterance.voice = frVoice;

      utterance.onend = () => {
        onEnd();
      };

      utterance.onerror = (e) => {
        console.error("[Voice] SpeechSynthesis error:", e);
        onEnd();
      };

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => startSpeaking(), { once: true });
    } else {
      startSpeaking();
    }
  }
}

export const jarvisVoice = new VoiceController();
