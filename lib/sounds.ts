/**
 * Утилита для воспроизведения звуковых эффектов
 * Использует Web Audio API для генерации звуков
 */
class SoundManager {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== "undefined" && "AudioContext" in window) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Воспроизводит звук правильного ответа
   */
  playSuccess() {
    this.playTone(523.25, 0.1, "sine"); // C5
  }

  /**
   * Воспроизводит звук неправильного ответа
   */
  playError() {
    this.playTone(220, 0.15, "sawtooth"); // A3
  }

  /**
   * Воспроизводит звук переворота карточки
   */
  playFlip() {
    this.playTone(440, 0.05, "sine"); // A4
  }

  /**
   * Генерирует и воспроизводит тон
   */
  private playTone(frequency: number, duration: number, type: OscillatorType = "sine") {
    if (!this.audioContext) {
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Плавное нарастание и затухание
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Проверяет доступность звука
   */
  isAvailable(): boolean {
    return this.audioContext !== null;
  }
}

export const sounds = new SoundManager();

