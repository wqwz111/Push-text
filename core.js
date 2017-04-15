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

document.addEventListener('mousemove', mousemove, false);
//document.addEventListener('dblclick', dblClick, false);
document.addEventListener('keydown', keydown, false);