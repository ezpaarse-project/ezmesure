import 'plugins/navbar/assets/less/style.less';
import chrome from 'ui/chrome'

const hiddenAppIds = chrome.getInjected('hiddenAppIds') || [];
hiddenAppIds.forEach(id => {
  chrome.getNavLinkById(id).hidden = true;
});