var selText;

var dblClick = function (e) {
  var data = {
    directive: 'capture',
    selText: selText
  };
  chrome.runtime.sendMessage(data, null);
};
var mousemove = function (e) {
  srcElement = e.srcElement;
  selText = srcElement.textContent;
};
var keydown = function (e) {
  if (e.ctrlKey && e.altKey && e.keyCode == 90) {//90 is 'Z'
    var data = {
      directive: 'capture',
      selText: selText
    };
    chrome.runtime.sendMessage(data, null);
  }
};
chrome.extension.onMessage.addListener(function (request, sender, callback) {
  switch (request.directive) {
    case 'upload-file': {
      break;
    }
    case 'leave-room': {
      document.removeEventListener("mousemove", mousemove);
      //document.removeEventListener("dblclick", dblClick);
      document.removeEventListener("keydown", keydown);
      break;
    }
    case 'enter-room': {
      document.addEventListener('mousemove', mousemove, false);
      //document.addEventListener('dblclick', dblClick, false);
      document.addEventListener('keydown', keydown, false);
    }
  }
});