/**
 * Text-to-Speech утилита для озвучки слов
 */
export class TTS {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      
      // Загружаем голоса асинхронно (могут загружаться с задержкой)
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  /**
   * Озвучивает текст
   */
  speak(text: string, lang: string = "en-US", rate: number = 1.0, pitch: number = 1.0) {
    if (!this.synth) {
      console.warn("SpeechSynthesis не поддерживается");
      return;
    }

    // Останавливаем предыдущее озвучивание
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Пытаемся найти подходящий голос для языка
    const preferredVoices = this.voices.filter((voice) => voice.lang.startsWith(lang.split("-")[0]));
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }

    this.synth.speak(utterance);
  }

  /**
   * Останавливает озвучивание
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Проверяет доступность TTS
   */
  isAvailable(): boolean {
    return this.synth !== null;
  }
}

export const tts = new TTS();

