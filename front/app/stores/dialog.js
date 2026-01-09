import { defineStore, shallowRef, ref } from '#imports';

/**
 * @typedef {Object} DialogData
 * @property {string} [title] Title of the dialog
 * @property {string} [text] Text of the dialog
 * @property {string} [agreeText] Text to display on the agree button. (Defaults to 'Agree')
 * @property {string} [agreeIcon] Icon to display on the agree button. (Defaults to unset)
 * @property {() => void | Promise<void>} [onAgree] Callback to execute when user agrees
 * @property {string} [disagreeText] Text to display on the disagree button (Defaults to 'Disagree')
 * @property {string} [disagreeIcon] Icon to display on the disagree button (Defaults to unset)
 * @property {() => void | Promise<void>} [onDisagree] Callback to execute when user disagrees
 */

export const useDialogStore = defineStore('dialog', () => {
  let close;
  const show = shallowRef(false);
  /**
   * @type {Ref<DialogData>}
   */
  const data = ref({});

  /**
   * Open dialog to confirm user action. Returns promise that resolves to `true` or `false`
   * depending on user choice. You can use callbacks too : `true`/`opts.onAgree` when user agrees,
   * `false`/`opts.onDisagree` when user disagrees.
   *
   * Callbacks allow promises, and shows loader while promise is pending.
   *
   * @param {DialogData} options Data to display
   *
   * @returns {Promise<boolean>}
   */
  function openConfirm(options) {
    data.value = { ...options };
    show.value = true;
    return new Promise((resolve) => {
      close = (value) => resolve(value);
    });
  }

  /**
   * Close current dialog
   *
   * @param {boolean} value Value to return: `true` when user agrees, `false` when user disagrees
   *
   * @return {boolean} If user agreed or disagreed
   */
  function closeConfirm(value) {
    show.value = false;
    if (!close) {
      return value;
    }

    close(value);
    return value;
  }

  return {
    show,
    data,
    closeConfirm,
    openConfirm,
  };
});
