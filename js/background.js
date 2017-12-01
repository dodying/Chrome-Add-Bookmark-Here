if (localStorage.length === 0) {
  openSetting();
  throw new Error('No Setting');
}

chrome.browserAction.onClicked.addListener(function(e) {
  popup(e);
});

chrome.bookmarks.onCreated.addListener(refreshBookmark);
chrome.bookmarks.onRemoved.addListener(refreshBookmark);
chrome.bookmarks.onChanged.addListener(refreshBookmark);
chrome.bookmarks.onImportEnded.addListener(refreshBookmark);
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    chrome.bookmarks.search({ url: tab.url }, function(e) {
      updateStatus(tabId, e.length);
    });
  }
});
refreshBookmark();

for (let i in localStorage) {
  if (!(i.match(/^quick/))) continue;
  let setting = JSON.parse(localStorage[i]);
  chrome.contextMenus.create({
    type: 'normal',
    id: i,
    contexts: ['all'],
    title: chrome.i18n.getMessage('addTo') + ': ' + setting.title
  });
}
chrome.contextMenus.create({
  type: 'separator'
});

chrome.contextMenus.create({
  type: 'normal',
  id: 'totalWindow',
  contexts: ['all'],
  title: 'Bookmark total Window'
});

chrome.contextMenus.create({
  type: 'normal',
  id: 'currentWindow',
  contexts: ['all'],
  title: 'Bookmark current Window'
});


if (chrome.omnibox) {
  let urlMatch = /^(https?|ftp|file|chrome(-extension)?):\/\/.+/i;
  let jsMatch = /^javascript:.+/i;
  let bookmarks, result, reg, mode, notice, tag;
  chrome.bookmarks.search({}, function(e) {
    bookmarks = e;
  });
  chrome.omnibox.onInputStarted.addListener(function() {
    chrome.bookmarks.search({}, function(e) {
      bookmarks = e;
    });
  });
  chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
    setSuggest('Search <match>' + text + '</match> in Bookmark');
    if (text.match(/[&'<>]/)) {
      suggest([{
        content: 'chrome://bookmarks/',
        description: 'Invalid Symbol'
      }]);
      return;
    }
    text = text.trim();
    mode = text.match(/^f(older)?:[\s+]?/i) ? 'folder' : text.match(/^t(itle)?:[\s+]?/i) ? 'title' : text.match(/^u(rl)?:[\s+]?/i) ? 'url' : 'normal';
    text = text.replace(/^(f(older)?|t(itle)?|u(rl)?):[\s+]?/i, '');
    if (text === '') return;
    result = [];
    reg = new RegExp(text, 'i');
    bookmarks.forEach(function(i) {
      if (mode === 'folder') {
        if (!i.url && i.title.match(reg)) {
          i.type = 'title';
          result.push(i);
        }
      } else if (mode === 'title') {
        if (i.title.match(reg)) {
          i.type = 'title';
          result.push(i);
        }
      } else if (mode === 'url') {
        if (i.url && i.url.match(reg) && !i.url.match(jsMatch)) {
          i.type = 'url';
          result.push(i);
        }
      } else if (mode === 'normal') {
        if (i.title.match(reg)) {
          i.type = 'title';
          result.push(i);
        } else if (i.url && i.url.match(reg) && !i.url.match(jsMatch)) {
          i.type = 'url';
          result.push(i);
        }
      }
    });
    notice = [];

    for (var i = 0; i < result.length; i++) {
      if (i >= 5) break;
      tag = result[i].type === 'title' ? 'match' : 'url';
      notice.push({
        content: result[i].url || 'chrome://bookmarks/#' + result[i].id,
        description: escapeXML(result[i][result[i].type]).replace(reg, '<' + tag + '>' + text + '</' + tag + '>')
      });
    }
    if (notice.length === 1) {
      setSuggest(notice[0].description);
      notice.splice(0, 1);
    }
    suggest(notice);
  });
  chrome.omnibox.onInputEntered.addListener(function(text) {
    if (result.length === 1) text = result[0].url || 'chrome://bookmarks/#' + result[0].id;
    if (text.match(urlMatch)) {
      openTab(text);
    } else {
      openTab('chrome://bookmarks/#q=' + text);
    }
  });
  chrome.omnibox.onInputCancelled.addListener(function() {

  });
}

chrome.runtime.onMessage.addListener(function(message) {
  sessionStorage.message = JSON.stringify(message);
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId.match(/^quick/)) {
    addBookmark(info, tab);
  } else if (info.menuItemId === 'totalWindow') {
    addBookmark2(false);
  } else if (info.menuItemId === 'currentWindow') {
    addBookmark2(true);
  }
});



function setSuggest(text) {
  chrome.omnibox.setDefaultSuggestion({
    description: text
  });
}

function refreshBookmark() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.bookmarks.search({ url: tab.url }, function(results) {
        updateStatus(tab.id, results.length);
      });
    });

  });
}


function openTab(url) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {
    if (tabs[0].url === 'chrome://newtab/') {
      chrome.tabs.update(tabs[0].id, {
        url: url
      });
    } else {
      chrome.tabs.create({
        url: url
      });
    }
  });
}

function addBookmark(info, tab) {
  var obj;
  var setting = JSON.parse(localStorage[info.menuItemId]);
  if (info.selectionText || info.linkUrl || info.srcUrl) {
    var message = JSON.parse(sessionStorage.message);
    obj = {
      parentId: setting.folder,
      title: message.title,
      url: message.url
    };
  } else if (info.frameUrl) {
    obj = {
      parentId: setting.folder,
      title: tab.title,
      url: info.frameUrl
    };
  } else {
    obj = {
      parentId: setting.folder,
      title: tab.title,
      url: tab.url
    };
  }
  if (setting.file) obj.index = setting.file;
  chrome.bookmarks.create(obj);
}


function addBookmark2(isCurrent) {
  var setting = JSON.parse(localStorage['window_' + isCurrent * 1]);
  var obj = {
    parentId: setting.folder,
    title: new Date().toLocaleString(navigator.language, { hour12: false })
  };
  if (setting.file) obj.index = setting.file;
  var query = {};
  if (isCurrent) query.currentWindow = true;
  chrome.bookmarks.create(obj, function(result) {
    chrome.tabs.query(query, function(tabs) {
      tabs.forEach(function(tab) {
        chrome.bookmarks.create({
          parentId: result.id,
          title: tab.title,
          url: tab.url
        });
      });
    });
  });
}

function openSetting() {
  openTab(chrome.runtime.getURL('options.html'));
}

function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
