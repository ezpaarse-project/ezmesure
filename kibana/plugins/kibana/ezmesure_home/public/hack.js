import $ from 'jquery';

$('.euiNavDrawer__expandButton').hide();

$('#navDrawerMenu').hover(() => {
  $('.euiNavDrawer').removeClass('euiNavDrawer-isCollapsed');
  $('.euiNavDrawer').addClass('euiNavDrawer-isExpanded');
}, () => {
  $('.euiNavDrawer').removeClass('euiNavDrawer-isExpanded');
  $('.euiNavDrawer').addClass('euiNavDrawer-isCollapsed');
});
