import { defineStore, shallowRef } from '#imports';

export const useDrawerStore = defineStore('drawer', () => {
  const isOpen = shallowRef(true);

  function toggle() {
    isOpen.value = !isOpen.value;
  }

  return {
    isOpen,
    toggle,
  };
});
