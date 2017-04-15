$(document).ready(function () {
   $("#enter-room").click(function () {
      var roomNo = $("#room-number").val();
      var data = {
         directive: 'enter-room',
         newRoom: roomNo
      };
      chrome.tabs.query({ active: true }, function (tabs) {
         chrome.tabs.sendMessage(tabs[0].id, data);
      });
      $("#current-number").text(roomNo);
      chrome.storage.local.set({ 'current-room': roomNo });
   });

   chrome.storage.local.get('current-room', function (item) {
      if (item['current-room']) {
         $("#current-number").text(item['current-room']);
      }
   });
});