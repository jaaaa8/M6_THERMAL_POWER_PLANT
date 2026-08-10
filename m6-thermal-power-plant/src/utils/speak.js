
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

let speechGeneration = 0;
let interactionHandler = null;

export function stopSpeaking() {
  speechGeneration += 1;
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  removeInteractionStop();
}

function armInteractionStop(generation) {
  removeInteractionStop();
  interactionHandler = () => stopSpeaking();

  setTimeout(() => {
    if (generation !== speechGeneration || !interactionHandler) return;
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
  stopSpeaking();
  const generation = speechGeneration;

  try {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const utter = () => {
      if (generation !== speechGeneration) return;

      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'vi-VN';
      speech.rate = 1;
      const viVoice = synth.getVoices()
        .find((voice) => (voice.lang || '').toLowerCase().startsWith('vi'));
      if (viVoice) speech.voice = viVoice;

      synth.cancel();
      synth.speak(speech);
    };

    if (synth.getVoices().length) utter();
    else synth.addEventListener('voiceschanged', utter, { once: true });
    armInteractionStop(generation);
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
