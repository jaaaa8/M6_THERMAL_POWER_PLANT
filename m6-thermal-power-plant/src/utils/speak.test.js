import test from 'node:test';
import assert from 'node:assert/strict';
import { speak, stopSpeaking } from './speak.js';

function installBrowserSpeechMock() {
  let voices = [];
  const voiceHandlers = [];
  const spoken = [];

  globalThis.document = {
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
    speechSynthesis: {
      addEventListener(type, handler) {
        if (type === 'voiceschanged') voiceHandlers.push(handler);
      },
      cancel() {},
      getVoices() {
        return voices;
      },
      speak(utterance) {
        spoken.push({ text: utterance.text, voice: utterance.voice });
      },
    },
  };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
      this.voice = null;
    }
  };

  return {
    spoken,
    loadVoices(nextVoices) {
      voices = nextVoices;
      voiceHandlers.splice(0).forEach((handler) => handler());
    },
  };
}

test('only the latest pending speech uses the selected Vietnamese voice', () => {
  const browser = installBrowserSpeechMock();
  const femaleVoice = { name: 'Vietnamese Female', lang: 'vi-VN' };

  speak('Chào mừng người dùng');
  speak('Yêu cầu sửa chữa mới nhất');
  browser.loadVoices([femaleVoice]);

  assert.deepEqual(browser.spoken, [
    { text: 'Yêu cầu sửa chữa mới nhất', voice: femaleVoice },
  ]);
  stopSpeaking();
});
