chrome.bookmarks.getTree(function(i) {
  let all = i[0].children;
  walk(all, true);
  $('.folder>.title').click(function() {
    $(this).siblings().toggle();
  });
  $('.file,.folder').click(function(e) {
    e.stopPropagation();
    $('.file,.folder').removeClass('hover');
    $(this).addClass('hover');
  });
  $('#clear').click(function() {
    localStorage.removeItem($('.this').attr('id'));
    $('.this').text(chrome.i18n.getMessage('select'));
    $('.this').removeClass('this');
    $('#select').hide();
  });
  $('#enter').click(function() {
    let target = $('.hover');
    if (target.length === 0) return;
    let id = $('.this').attr('id');
    let setting = id in localStorage ? JSON.parse(localStorage[id]) : {};
    if (target.hasClass('folder')) {
      setting.folder = target.attr('name');
      setting.folderName = target.attr('title');
      setting.title = setting.folderName;
    } else if (target.hasClass('file')) {
      setting.folder = target.parent().attr('name');
      setting.folderName = target.parent().attr('title');
      setting.file = target.index();
      setting.fileName = target.attr('title');
      setting.title = setting.folderName + ' >> ' + setting.fileName;
    }
    $('.this').text(setting.title);
    localStorage[id] = JSON.stringify(setting);
    $('.this').removeClass('this');
    $('#select').hide();
  });
  $('#cancel').click(function() {
    $('.this').removeClass('this');
    $('#select').hide();
  });
  $('.quick').click(function() {
    $('.quick').removeClass('this');
    $(this).addClass('this');
    let position = $('.this').position();
    $('#select').css({
      display: 'block',
      left: position.left + 50 + 'px',
      top: position.top + 5 + 'px',
    });
  });
  $('#new').click(function() {
    newPosition(1);
  });
  $(window).on({
    unload: function() {
      chrome.runtime.reload();
    }
  });
});
$('title').text(chrome.i18n.getMessage('extName'));
$('#clear').text(chrome.i18n.getMessage('clear'));
$('#enter').text(chrome.i18n.getMessage('enter'));
$('#cancel').text(chrome.i18n.getMessage('cancel'));
$('.quickPlace').text(chrome.i18n.getMessage('place'));
$('.quick').text(chrome.i18n.getMessage('select'));
$('#new').text(chrome.i18n.getMessage('new'));
if (localStorage.length > 0) {
  let keys = Object.keys(localStorage);
  keys = keys[keys.length - 1].match(/\d+/)[0] * 1;
  newPosition(keys - 1);
  let setting;
  for (let i in localStorage) {
    setting = JSON.parse(localStorage[i]);
    $('#' + i).text(setting.title);
  }
}

function newPosition(i) {
  i--;
  let id = $('.quick').length + 1;
  $('<div><span class="quickPlace">' + chrome.i18n.getMessage('place') + '</span>' + id + ': <button id="quick' + id + '" class="quick">' + chrome.i18n.getMessage('select') + '</button></div>').appendTo('#setting');
  $('.quick').off('click').click(function() {
    $('.quick').removeClass('this');
    $(this).addClass('this');
    let position = $('.this').position();
    $('#select').css({
      display: 'block',
      left: position.left + 50 + 'px',
      top: position.top + 5 + 'px',
    });
  });
  if (i) newPosition(i);
}

function walk(array, show) {
  array.forEach(function(i) {
    $('<div></div>').attr('id', 'b' + i.id).attr('name', i.id).attr('title', i.title).html('<span class="title">' + '<img src="chrome://favicon/' + i.url + '"></img>' + (i.title || i.url || chrome.i18n.getMessage('unnamedFolder')) + '</span>').appendTo('#b' + i.parentId);
    if (!show) $('#b' + i.id).hide();
    if (i.children) {
      $('#b' + i.id).addClass('folder');
      walk(i.children);
    } else {
      $('#b' + i.id).addClass('file');
    }
  });
}
