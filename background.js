var data = {};

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
  switch (request.directive) {
    case 'capture': {
      capture();
      break;
    }
  }
});

function capture() {
  chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 },
    function (dataURI) {
      sendResponse(dataURI);
    });
}

function sendResponse(uri) {
  chrome.tabs.query({ active: true }, function (tabs) {
    data['directive'] = 'upload-file'
    data['dataUri'] = uri;
    chrome.tabs.sendMessage(tabs[0].id, data, null);
  });
}