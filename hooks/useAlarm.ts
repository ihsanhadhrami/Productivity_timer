import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationSound } from '../types';

/**
 * Alarm engine: plays the selected notification sound on repeat, with
 * vibration (Android) and haptic feedback (iOS), until stopped.
 *
 * Handles the mobile audio quirks internally - one shared AudioContext that is
 * never closed, unlocking on user gesture, Safari resume retries, and keeping
 * the context alive while the timer runs.
 *
 * Usage:
 *   const alarm = useAlarm(selectedSound, isRunning);
 *   onClick={alarm.unlockAudio}  // call from any user gesture before the alarm is needed
 *   alarm.playAlarm(); alarm.stopAlarm(); alarm.previewSound('chime');
 */

// Notification Sound Options
export const NOTIFICATION_SOUNDS: { id: NotificationSound; name: string; description: string }[] = [
  { id: 'crystals', name: 'Crystals', description: 'iPhone-style melody' },
  { id: 'chime', name: 'Chime', description: 'Gentle bell chime' },
  { id: 'pulse', name: 'Pulse', description: 'Soft pulse beat' },
  { id: 'bell', name: 'Bell', description: 'Classic bell ring' },
  { id: 'synth', name: 'Synth Wave', description: 'Electronic tone' },
];

type Note = { freq: number; duration: number; type?: OscillatorType };

// freq 0 is a rest
const MELODIES: Record<NotificationSound, Note[]> = {
  // iPhone Crystals-like melody
  crystals: [
    { freq: 1318.5, duration: 0.15 }, // E6
    { freq: 1567.98, duration: 0.15 }, // G6
    { freq: 1760, duration: 0.15 }, // A6
    { freq: 1567.98, duration: 0.15 }, // G6
    { freq: 1318.5, duration: 0.15 }, // E6
    { freq: 1174.66, duration: 0.3 }, // D6
  ],
  // Gentle bell chime
  chime: [
    { freq: 523.25, duration: 0.4 }, // C5
    { freq: 659.25, duration: 0.4 }, // E5
    { freq: 783.99, duration: 0.6 }, // G5
  ],
  // Soft pulse beat
  pulse: [
    { freq: 220, duration: 0.1, type: 'sine' },
    { freq: 0, duration: 0.1 },
    { freq: 220, duration: 0.1, type: 'sine' },
    { freq: 0, duration: 0.1 },
    { freq: 330, duration: 0.2, type: 'sine' },
  ],
  // Classic bell ring
  bell: [
    { freq: 830.6, duration: 0.5 }, // G#5
    { freq: 0, duration: 0.1 },
    { freq: 830.6, duration: 0.5 }, // G#5
  ],
  // Electronic synth wave
  synth: [
    { freq: 440, duration: 0.1, type: 'sawtooth' },
    { freq: 554.37, duration: 0.1, type: 'sawtooth' },
    { freq: 659.25, duration: 0.1, type: 'sawtooth' },
    { freq: 880, duration: 0.3, type: 'sawtooth' },
  ],
};

const getAudioContextClass = (): typeof AudioContext | undefined =>
  window.AudioContext || (window as any).webkitAudioContext;

const playSilentBuffer = (ctx: AudioContext) => {
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
};

const playMelody = (audioContext: AudioContext, soundType: NotificationSound) => {
  let startTime = audioContext.currentTime;

  MELODIES[soundType].forEach((note) => {
    if (note.freq === 0) {
      startTime += note.duration;
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = note.freq;
    oscillator.type = note.type || 'sine';

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + note.duration);

    startTime += note.duration;
  });
};

export function useAlarm(selectedSound: NotificationSound, isTimerRunning: boolean) {
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);

  const alarmIntervalRef = useRef<number | null>(null);
  const sharedAudioContextRef = useRef<AudioContext | null>(null); // Persistent context for mobile
  const vibrationIntervalRef = useRef<number | null>(null); // Persistent vibration during alarm
  const hapticNodeRef = useRef<OscillatorNode | null>(null); // iOS haptic oscillator

  // Unlock AudioContext for mobile browsers (must be called on user interaction)
  const unlockAudio = useCallback(() => {
    console.log('🔓 Unlocking AudioContext...');
    try {
      const AudioContextClass = getAudioContextClass();
      if (!AudioContextClass) {
        console.warn('❌ AudioContext not supported on this device');
        return false;
      }

      // Always create fresh context if none exists or if closed
      if (!sharedAudioContextRef.current || sharedAudioContextRef.current.state === 'closed') {
        sharedAudioContextRef.current = new AudioContextClass();
        console.log('✅ Created new AudioContext, state:', sharedAudioContextRef.current.state);
      }

      const ctx = sharedAudioContextRef.current;

      // SAFARI FIX: Must resume AND play sound on same user gesture
      if (ctx.state === 'suspended') {
        console.log('⏸️  AudioContext suspended, resuming...');
        ctx.resume().then(() => {
          console.log('▶️  AudioContext resumed, state:', ctx.state);

          // Safari: Play silent buffer immediately after resume
          try {
            playSilentBuffer(ctx);
            console.log('🔇 Silent buffer played for unlock');
          } catch (bufferError) {
            console.warn('⚠️  Silent buffer error (non-critical):', bufferError);
          }
        }).catch(e => {
          console.warn('❌ Failed to resume AudioContext:', e);
        });
      } else if (ctx.state === 'running') {
        console.log('✅ AudioContext already running');

        // Play silent buffer even if running (Safari requirement)
        try {
          playSilentBuffer(ctx);
          console.log('🔇 Silent buffer played for iOS');
        } catch (bufferError) {
          console.warn('⚠️  Silent buffer error:', bufferError);
        }
      }

      return true;

    } catch (e) {
      console.warn('❌ Failed to unlock AudioContext:', e);
      return false;
    }
  }, []);

  // Plays a sound once (preview) or on repeat as the alarm
  const playSound = useCallback(async (soundType: NotificationSound, preview = false): Promise<boolean> => {
    console.log('🔊 playSound called:', soundType, 'preview:', preview);

    try {
      const AudioContextClass = getAudioContextClass();
      if (!AudioContextClass) {
        console.warn('❌ AudioContext not supported');
        throw new Error('AudioContext not supported');
      }

      let audioContext: AudioContext;

      if (preview) {
        // For preview, always create new context
        audioContext = new AudioContextClass();
        console.log('🎵 Created new AudioContext for preview');
      } else {
        // For alarm, use or create shared context
        // SAFARI FIX: NEVER close the context, always reuse
        if (!sharedAudioContextRef.current || sharedAudioContextRef.current.state === 'closed') {
          console.log('🆕 Creating new shared AudioContext for alarm');
          sharedAudioContextRef.current = new AudioContextClass();
        }
        audioContext = sharedAudioContextRef.current;
      }

      console.log('📍 AudioContext state before resume:', audioContext.state);

      // CRITICAL: Wait for resume to complete before playing
      // Safari will NOT play audio if context is suspended
      if (audioContext.state === 'suspended') {
        console.log('⏸️  AudioContext suspended, attempting resume...');
        try {
          await audioContext.resume();
          console.log('▶️  AudioContext resumed successfully, state:', audioContext.state);

          // Safari: Wait a tiny bit for resume to fully complete
          await new Promise(resolve => setTimeout(resolve, 10));

        } catch (resumeError) {
          console.warn('❌ Resume failed:', resumeError);

          // Safari fallback: Create completely new context
          if (!preview) {
            console.log('🔄 Creating fallback AudioContext');
            audioContext = new AudioContextClass();
            sharedAudioContextRef.current = audioContext;

            // Try resume again on new context
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
            }
          } else {
            throw resumeError;
          }
        }
      }

      // Final state check - MUST be running
      if (audioContext.state !== 'running') {
        console.warn('⚠️  AudioContext not running after resume, state:', audioContext.state);

        // Last resort: try resume one more time
        try {
          await audioContext.resume();
          await new Promise(resolve => setTimeout(resolve, 10));
        } catch (e) {
          console.error('❌ Cannot get AudioContext to run');
          throw new Error('AudioContext failed to run');
        }
      }

      console.log('✅ AudioContext ready, state:', audioContext.state);

      playMelody(audioContext, soundType);
      console.log('🎶 First melody played');

      if (!preview) {
        // Repeat for alarm - Safari needs careful interval handling
        alarmIntervalRef.current = window.setInterval(async () => {
          try {
            // Check if shared context exists and is usable
            const ctx = sharedAudioContextRef.current;

            if (!ctx) {
              console.warn('⚠️  No AudioContext in alarm interval');
              return;
            }

            // Safari: Check context state and resume if needed
            if (ctx.state !== 'running') {
              console.log('⏸️  Context not running during alarm (state:', ctx.state, '), resuming...');
              try {
                await ctx.resume();
                console.log('▶️  Context resumed, state:', ctx.state);
              } catch (resumeError) {
                console.warn('❌ Failed to resume in alarm interval:', resumeError);
              }
            }

            // Play melody if context is now running
            if (ctx.state === 'running') {
              playMelody(ctx, soundType);
              console.log('🔁 Alarm repeat - melody played');
            } else {
              console.warn('⚠️  AudioContext still not running, state:', ctx.state);
            }
          } catch (intervalError) {
            console.warn('❌ Error in alarm interval:', intervalError);
          }
        }, 1500);

        setIsAlarmPlaying(true);
        console.log('⏰ Alarm started, will repeat every 1.5s');
        return true;
      } else {
        // For preview, close after playing once
        setTimeout(() => {
          try {
            audioContext.close();
            console.log('🔇 Preview AudioContext closed');
          } catch (e) {
            console.warn('⚠️  Error closing preview context:', e);
          }
        }, 2000);
        return true;
      }
    } catch (e) {
      console.error('❌ Failed to play sound:', e);

      // Fallback: Try vibration on mobile devices
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200, 100, 200]);
          console.log('📳 Using vibration fallback');
        } catch (vibError) {
          console.warn('❌ Vibration also failed:', vibError);
        }
      }

      return false;
    }
  }, []);

  // Start persistent vibration pattern that repeats with the alarm
  const startVibration = useCallback(() => {
    // Clear any existing vibration interval
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }

    // Android/Windows: Use Vibration API with repeating pattern
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([300, 100, 300, 100, 300]);
        // Repeat vibration every 1.5s to sync with alarm sound
        vibrationIntervalRef.current = window.setInterval(() => {
          try {
            navigator.vibrate([300, 100, 300, 100, 300]);
          } catch (_) {}
        }, 1500);
        console.log('📳 Vibration started (Vibration API)');
      } catch (_) {}
    }

    // iOS/Safari: Vibration API is NOT supported.
    // Use a sub-bass oscillator (1Hz) routed to speaker at low gain.
    // On Apple devices this causes physical haptic feedback via the Taptic Engine
    // even when the ringer switch is muted, because AudioContext output
    // bypasses the mute switch when the session is already active.
    try {
      const ctx = sharedAudioContextRef.current;
      if (ctx && ctx.state === 'running') {
        // Stop any previous haptic node
        if (hapticNodeRef.current) {
          try { hapticNodeRef.current.stop(); } catch (_) {}
          hapticNodeRef.current = null;
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1, ctx.currentTime); // Sub-bass 1 Hz
        gain.gain.setValueAtTime(0.15, ctx.currentTime); // Low volume
        // Pulsing pattern: ramp up and down
        const now = ctx.currentTime;
        for (let i = 0; i < 20; i++) {
          const t = now + i * 1.5;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.15, t + 0.3);
          gain.gain.setValueAtTime(0.15, t + 0.6);
          gain.gain.linearRampToValueAtTime(0, t + 0.9);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 30); // Auto-stop after 30s safety limit
        hapticNodeRef.current = osc;
        console.log('📳 iOS haptic oscillator started');
      }
    } catch (e) {
      console.warn('⚠️ iOS haptic simulation failed:', e);
    }
  }, []);

  // Stop all vibration
  const stopVibration = useCallback(() => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if ('vibrate' in navigator) {
      try { navigator.vibrate(0); } catch (_) {}
    }
    if (hapticNodeRef.current) {
      try { hapticNodeRef.current.stop(); } catch (_) {}
      hapticNodeRef.current = null;
    }
    console.log('📳 Vibration stopped');
  }, []);

  // Play alarm with selected sound
  const playAlarm = useCallback(async () => {
    console.log('playAlarm called, selected sound:', selectedSound);

    // Try to play sound
    await playSound(selectedSound);

    // Start persistent vibration (Android + iOS haptic)
    startVibration();
  }, [playSound, selectedSound, startVibration]);

  // Stop alarm sound
  const stopAlarm = useCallback(() => {
    try {
      // Clear the repeating interval
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
        console.log('Alarm interval cleared');
      }

      // DON'T close the shared AudioContext - closing it would require
      // user interaction to unlock again, and audio wouldn't play after stopping

      // Stop all vibration and haptic feedback
      stopVibration();

    } catch (e) {
      console.warn('Error stopping alarm:', e);
    }
    setIsAlarmPlaying(false);
  }, [stopVibration]);

  const previewSound = useCallback((soundType: NotificationSound) => {
    playSound(soundType, true);
  }, [playSound]);

  // Re-unlock audio context periodically while timer is running (iOS fix)
  useEffect(() => {
    let keepAliveInterval: number | undefined;

    if (isTimerRunning && sharedAudioContextRef.current) {
      keepAliveInterval = window.setInterval(() => {
        const ctx = sharedAudioContextRef.current;
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };
  }, [isTimerRunning]);

  return { isAlarmPlaying, playAlarm, stopAlarm, previewSound, unlockAudio };
}
