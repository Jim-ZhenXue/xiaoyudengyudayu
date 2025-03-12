// Sound effects utility for the game
import { useState, useEffect } from 'react';

// Types of sound effects available in the game
export enum SoundEffectType {
  DROP = 'drop',
  DRAG = 'drag',
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  BUTTON_CLICK = 'buttonClick',
}

// URLs for the actual sound files
const soundEffectUrls: Partial<Record<SoundEffectType, string>> = {
  [SoundEffectType.CORRECT]: '/sounds/correct.mp3',
  [SoundEffectType.INCORRECT]: '/sounds/incorrect.mp3',
};

// Define our simple sound effects with different frequencies and durations for the other sounds
const generateTone = (frequency: number, duration: number, volume: number = 0.5, type: OscillatorType = 'sine'): HTMLAudioElement => {
  // Create an audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create an oscillator for the tone
  const oscillator = audioContext.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  // Create a gain node for volume control
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
  
  // Connect the nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Start and stop the oscillator
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
  
  // Create a dummy audio element to satisfy our interface
  const audio = new Audio();
  
  // We will use this method to trigger the tone
  audio.play = () => {
    // Create a new audio context each time to handle repeated plays
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
    
    return Promise.resolve(); // Return a resolved promise to match the Audio.play() API
  };
  
  return audio;
};

// Create audio element for a sound effect file
const createAudioElement = (url: string): HTMLAudioElement => {
  const audio = new Audio(url);
  audio.preload = 'auto';
  return audio;
};

// Generate our sound effects
const generateSoundEffects = (): Record<SoundEffectType, HTMLAudioElement> => {
  const sounds: Record<SoundEffectType, HTMLAudioElement> = {
    [SoundEffectType.DRAG]: generateTone(350, 150, 0.3, 'sine'),
    [SoundEffectType.DROP]: generateTone(200, 300, 0.4, 'sine'),
    [SoundEffectType.BUTTON_CLICK]: generateTone(800, 80, 0.3, 'sine'),
    [SoundEffectType.CORRECT]: createAudioElement(soundEffectUrls[SoundEffectType.CORRECT]!),
    [SoundEffectType.INCORRECT]: createAudioElement(soundEffectUrls[SoundEffectType.INCORRECT]!),
  };
  
  return sounds;
};

// Local storage key for sound preferences
const SOUND_ENABLED_KEY = 'sound-enabled';

// Check if sound is enabled from local storage
export const isSoundEnabled = (): boolean => {
  try {
    const storedPreference = localStorage.getItem(SOUND_ENABLED_KEY);
    return storedPreference !== null ? JSON.parse(storedPreference) : true;
  } catch (e) {
    return true; // Default to enabled if there's an error
  }
};

// Set sound enabled preference to local storage
export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(enabled));
  } catch (e) {
    console.error('Could not save sound preference:', e);
  }
};

// Class to manage sound effects
class SoundEffectManager {
  private audioElements: Record<SoundEffectType, HTMLAudioElement>;
  private enabled: boolean;

  constructor() {
    this.enabled = isSoundEnabled();
    this.audioElements = generateSoundEffects();
  }

  // Play a sound effect if sound is enabled
  public play(type: SoundEffectType): void {
    if (!this.enabled) return;
    
    try {
      const audio = this.audioElements[type];
      if (audio) {
        audio.play().catch((error) => {
          console.error(`Error playing sound ${type}:`, error);
        });
      }
    } catch (e) {
      console.error(`Error playing sound ${type}:`, e);
    }
  }

  // Set whether sound effects are enabled
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    setSoundEnabled(enabled);
  }

  // Get whether sound effects are enabled
  public getEnabled(): boolean {
    return this.enabled;
  }
}

// Create a singleton instance of the sound effect manager
export const soundEffectManager = new SoundEffectManager();

// React hook for using sound effects in components
export function useSoundEffects() {
  const [enabled, setEnabled] = useState<boolean>(soundEffectManager.getEnabled());

  // Toggle sound effects on/off
  const toggleSound = () => {
    const newState = !enabled;
    setEnabled(newState);
    soundEffectManager.setEnabled(newState);
  };

  // Play a sound effect
  const playSound = (type: SoundEffectType) => {
    soundEffectManager.play(type);
  };

  // Synchronize state with the manager on mount
  useEffect(() => {
    setEnabled(soundEffectManager.getEnabled());
  }, []);

  return { enabled, toggleSound, playSound };
}
