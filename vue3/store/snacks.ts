type Message = {
  color: string;
  text: string;
  timeout?: number;
};

export const useSnacksStore = defineStore('snacks', () => {
  const messages = ref<Message[]>([]);

  function addMessage(message?: Message) {
    if (typeof message !== 'object') { return; }

    const msg = {
      color: message?.color,
      text: message?.text,
      timeout: message?.timeout || 3000,
    };

    messages.value.push(msg);
  }

  function error(text: string) {
    addMessage({ text, color: 'error' });
  }

  function info(text: string) {
    addMessage({ text, color: 'info' });
  }

  function success(text: string) {
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
