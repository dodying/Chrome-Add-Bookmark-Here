function updateStatus(tabId, marked) {
  marked = marked || '';
  chrome.browserAction.setBadgeText({
    text: marked.toString(),
    tabId: tabId
  });
  let star = 'images/icons/star';
  if (!marked) star += '-o';
  chrome.browserAction.setIcon({
    tabId,
    path: {
      '16': star + '-16.png',
      '48': star + '-48.png'
    }
  });
}
