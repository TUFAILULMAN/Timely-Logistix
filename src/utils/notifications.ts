/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Audio Chime Synthesizer using Web Audio API
 * Generates a clean, dual-harmonic crystal bell chime without external audio files.
 */
export function playNotificationChime(): void {
  try {
    const isMuted = localStorage.getItem('tl_chat_sound_enabled') === 'false';
    if (isMuted) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    const now = audioCtx.currentTime;

    // Primary Bell Tone (High crystal bell - 880Hz / A5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.20, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.38);

    // Harmonizing Overtone (1318.5Hz / E6)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.08);
    gain2.gain.setValueAtTime(0.24, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.68);
  } catch {
    // Autoplay restrictions or audio disabled
  }
}

/**
 * Request browser-level notification permissions via the Notifications API
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playNotificationChime();
      try {
        new Notification('Timely Logistix-DMS', {
          body: '🔔 Chat notifications enabled for live dispatch coordination!',
          icon: '/favicon.ico',
          silent: true // sound is synthesized via Web Audio API
        });
      } catch {
        // Notification constructor fallback
      }
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Trigger an incoming chat message browser notification
 */
export function triggerBrowserNotification(
  senderName: string,
  senderRole: string,
  content: string,
  messageId: string,
  onClick?: () => void
): void {
  // Always play the notification chime if sound is enabled
  playNotificationChime();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const roleLabel = senderRole === 'ADMIN' ? 'Owner' : senderRole === 'SALES' ? 'Sales' : 'Dispatch';
      const notification = new Notification(`💬 ${senderName} (${roleLabel})`, {
        body: content.length > 120 ? `${content.slice(0, 117)}...` : content,
        tag: `tl_chat_${messageId}`,
        icon: '/favicon.ico',
        silent: true
      });

      notification.onclick = () => {
        window.focus();
        if (onClick) onClick();
        notification.close();
      };
    } catch {
      // Fallback
    }
  }
}
