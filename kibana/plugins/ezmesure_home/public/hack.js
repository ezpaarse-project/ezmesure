/* eslint-disable @kbn/eslint/require-license-header */
import $ from 'jquery';

$('.euiNavDrawer__expandButton').hide();

$('.euiNavDrawerGroup').hover(() => {
  $('.euiNavDrawer').removeClass('euiNavDrawer-isCollapsed');
  $('.euiNavDrawer').addClass('euiNavDrawer-isExpanded');
}, () => {
  $('.euiNavDrawer').removeClass('euiNavDrawer-isExpanded');
  $('.euiNavDrawer').addClass('euiNavDrawer-isCollapsed');
});
