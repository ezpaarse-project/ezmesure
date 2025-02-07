import { defineStore, ref } from '#imports';

export const useSnacksStore = defineStore('snacks', () => {
  const messages = ref([]);

  function addMessage(message) {
    if (typeof message !== 'object') { return; }

    const msg = {
      color: message?.color,
      text: message?.text,
      timeout: message?.timeout || 3000,
    };

    messages.value.push(msg);
  }

  function error(text) {
    addMessage({ text, color: 'error' });
  }

  function info(text) {
    addMessage({ text, color: 'info' });
  }

  function success(text) {
    addMessage({ text, color: 'success' });
  }

  function removeMessage() {
    messages.value.shift();
  }

  return {
    messages,
    error,
    info,
    success,
    removeMessage,
  };
});
