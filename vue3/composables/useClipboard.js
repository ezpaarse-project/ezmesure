import { computed } from '#imports';

export default function useClipboard() {
  const available = computed(
    () => navigator?.clipboard && typeof navigator.clipboard.writeText === 'function',
  );

  function writeClipboard(text) {
    if (!available.value) {
      return Promise.reject(new Error('Clipboard not available'));
    }

    return navigator.clipboard.writeText(text);
  }

  return {
    clipboardAvailable: available,
    writeClipboard,
  };
}
