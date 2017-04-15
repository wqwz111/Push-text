var selText;

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
  switch (request.directive) {
    case 'upload-file': {
      break;
    }
  }
});

document.addEventListener('mousemove', function (e) {
  srcElement = e.srcElement;
  selText = srcElement.textContent;
}, false);

document.addEventListener('dblclick', function (e) {
  var data = {
    directive: 'capture',
    selText: selText
  };
  chrome.runtime.sendMessage(data, null);
}, false);

// document.addEventListener('keydown', function (e) {
//   if (e.ctrlKey && e.altKey && e.keyCode == 90) {//90 is 'Z'
//     var data = { contentText: selText };
//     chrome.runtime.sendMessage(data, null);
//   }
// }, false);

