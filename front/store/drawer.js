import { defineStore, ref } from '#imports';

export const useDrawerStore = defineStore('drawer', () => {
  const isOpen = ref(true);

  function toggle() {
    isOpen.value = !isOpen.value;
  }

  return {
    isOpen,
    toggle,
  };
});
