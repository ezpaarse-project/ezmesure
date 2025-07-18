export default function useSingleTabLinks(prefix) {
  const registeredTabs = new Map();
  const openInTab = (href, id) => {
    if (!href || !id) {
      throw new Error('Missing href or id');
    }

    const tab = registeredTabs.get(id);

    // If tab doesn't exist or is closed
    if (!tab || tab.closed) {
      const newTab = window.open(href, `${prefix}.${id}`);
      registeredTabs.set(id, newTab);
      return;
    }

    tab.focus();
  };

  return {
    openInTab,
  };
}
