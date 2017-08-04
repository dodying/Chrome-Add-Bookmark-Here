function popup(e) {
  chrome.bookmarks.search({ url: e.url }, function(i) {
    if (i.length > 0) {
      chrome.bookmarks.remove(i[0].id);
    } else {
      var setting = JSON.parse(localStorage[localStorage.key(0)]);
      var obj = {
        parentId: setting.folder,
        title: e.title,
        url: e.url
      };
      if (setting.file) obj.index = setting.file;
      chrome.bookmarks.create(obj);
    }
  });
}
