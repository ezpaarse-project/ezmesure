import {
  defineStore,
  shallowRef,
  ref,
  markRaw,
} from '#imports';

/**
 * @typedef {Object} DialogData
 * @property {import('vue').Component} component - The dialog component to display
 * @property {Object} [data] - The data to provide to the component
 * @property {Object} [listeners] - Listeners for component events
 */

export const useDialogStore = defineStore('dialog', () => {
  let close;
  const show = shallowRef(false);
  /**
   * @type {Ref<DialogData>}
   */
  const data = ref({});
  const listeners = ref({});
  const component = ref(null);

  /**
   * Open a dialog. Returns a promise that resolves when the dialog is closed.
   * @param {DialogData} options Data to display
   * @returns {Promise<boolean>}
   */
  function openDialog(options) {
    component.value = markRaw(options.component);
    data.value = { ...options?.data };
    listeners.value = { ...options?.listeners };
    show.value = true;

    return new Promise((resolve) => {
      close = () => resolve();
    });
  }

  /**
   * Close current dialog
   */
  function closeDialog() {
    show.value = false;

    if (close) {
      close();
    }
  }

  return {
    show,
    data,
    listeners,
    component,
    closeDialog,
    openDialog,
  };
});
