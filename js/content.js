document.addEventListener('contextmenu', function(e) {
  e = e.target;
  let message = {
    title: document.title,
    url: document.location.href
  };
  console.log(e.tagName);
  if (e.tagName.match(/^(A|IMG)$/)) {
    message.url = e.href || e.src;
    message.title = (e.textContent || e.title || e.alt || '').trim();
  }
  let selection = window.getSelection().toString();
  if (selection) {
    message.title = selection;
    if (/:\/\//.test(selection)) message.url = selection;
  }
  console.log(message);
  chrome.runtime.sendMessage(message);
}, true);
