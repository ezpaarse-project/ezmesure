import { defineStore, ref } from '#imports';
import { getErrorMessage } from '@/lib/errors';

/**
 * @typedef {object} SnackMessage
 * @property {string} [color] Color of the snack
 * @property {string} [title] Title of the snack
 * @property {string} [text] Text to show
 * @property {number} [timeout] Timeout of the snack
 */

export const useSnacksStore = defineStore('snacks', () => {
  const messages = ref([]);

  /**
   * Add a message to the queue
   *
   * @param {SnackMessage} message Message to show
   */
  function addMessage(message) {
    if (typeof message !== 'object') { return; }

    const msg = {
      color: message?.color,
      text: message?.text,
      title: message?.title,
      timeout: message?.timeout || 3000,
    };

    messages.value.push(msg);
  }

  /**
   * Add a error snack to the queue
   *
   * @param {string} friendly Friendly text to show
   * @param {unknown} [err] Error to show
   */
  function error(friendly, err) {
    if (!err) {
      addMessage({ text: friendly, color: 'error' });
      return;
    }

    if (err.name !== 'FetchError') {
      addMessage({ title: friendly, text: err.message ?? `${err}`, color: 'error' });
      return;
    }

    addMessage({ title: friendly, text: getErrorMessage(err), color: 'error' });
  }

  /**
   * Add an info snack to the queue
   *
   * @param {string} text Text to show
   */
  function info(text) {
    addMessage({ text, color: 'info' });
  }

  /**
   * Add a success snack to the queue
   *
   * @param {string} text Text to show
   */
  function success(text) {
    addMessage({ text, color: 'success' });
  }

  /**
   * Removes the first message
   */
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
