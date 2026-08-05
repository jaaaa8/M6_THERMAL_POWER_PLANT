
const ROLE_LABELS = {
  ADMIN: 'Quản trị viên',
  WORKER: 'Nhân viên',
  MATERIALS_STOREKEEPER: 'Thủ kho vật tư',
  TOOLS_STOREKEEPER: 'Thủ kho công cụ',
  WORKSHOP_FOREMAN: 'Quản đốc phân xưởng',
  SHIFT_LEADER: 'Trưởng ca',
  CREW_LEADER: 'Tổ trưởng',
  MAINTENANCE_FOREMAN: 'Quản đốc bảo trì',
  TEAM_LEADER: 'Đội trưởng',
  SAFETY_SUPERVISOR: 'Giám sát an toàn',
};

let currentAudio = null;
let interactionHandler = null;

export function stopSpeaking() {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  } catch { /* ignore */ }
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  removeInteractionStop();
}

function armInteractionStop() {
  removeInteractionStop();
  interactionHandler = () => stopSpeaking();

  setTimeout(() => {
    if (!interactionHandler) return;
    document.addEventListener('click', interactionHandler, { once: true, capture: true });
    document.addEventListener('keydown', interactionHandler, { once: true, capture: true });
    window.addEventListener('scroll', interactionHandler, { once: true, capture: true });
  }, 200);
}

function removeInteractionStop() {
  if (interactionHandler) {
    document.removeEventListener('click', interactionHandler, { capture: true });
    document.removeEventListener('keydown', interactionHandler, { capture: true });
    window.removeEventListener('scroll', interactionHandler, { capture: true });
    interactionHandler = null;
  }
}

export function speak(text) {
  if (!text) return;
  stopSpeaking(); // dừng câu cũ nếu đang phát
  try {
    const audio = new Audio(`/api/v1/tts?text=${encodeURIComponent(text)}`);
    currentAudio = audio;
    audio.onended = () => { currentAudio = null; removeInteractionStop(); };
    audio.onerror = () => speakWithSynth(text);
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => speakWithSynth(text));
    }
    armInteractionStop();
  } catch {
    speakWithSynth(text);
  }
}

function speakWithSynth(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const utter = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN';
      u.rate = 1;
      const viVoice = synth.getVoices().find((v) => (v.lang || '').toLowerCase().startsWith('vi'));
      if (viVoice) u.voice = viVoice;
      synth.cancel();
      synth.speak(u);
    };

    if (synth.getVoices().length) utter();
    else synth.addEventListener('voiceschanged', utter, { once: true });
    armInteractionStop();
  } catch {
    /* im lặng — loa chỉ là tính năng phụ */
  }
}

export function getWelcomeText(user) {
  const name = user?.fullName || user?.username || 'bạn';
  const roleLabel = ROLE_LABELS[user?.roles?.[0]] || 'người dùng';
  return `Chào mừng ${name} đã đăng nhập với vai trò ${roleLabel}`;
}

export function speakWelcome(user) {
  speak(getWelcomeText(user));
}
