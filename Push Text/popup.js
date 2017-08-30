$(document).ready(function () {
   signIn();

   var enteredRoom = false;

   $("#enter-room").click(function () {
      var newNo = $("#room-number").val();
      var oldNo = $("#current-number").text();
      if (newNo && newNo.trim() != "") {
         enterRoom(newNo, oldNo);
      }
   });

   $("#tab-room").click(function () {
      chrome.tabs.create({ url: 'app.html' });
   });

   $("#leave-room").click(function () {
      var roomNo = $("#current-number").text();
      leaveRoom(roomNo);
   });

   $("#current-number").bind("DOMNodeInserted", function () {
      if ($("#current-number").text() == "none") {
         $("#leave-room").hide();
      } else {
         $("#leave-room").show();
      }
   });

   chrome.storage.local.get('current-room', function (item) {
      if (item['current-room']) {
         var newNo = item['current-room'];
         chrome.storage.local.get('current-room', function (item) {
            if (item['entered-room']) {
               enterRoom(newNo);
               console.log('enter room, popup');
            } else {
               $("#current-number").text(newNo);
            }
         });
      } else {
         $("#leave-room").hide();
      }
   });
});

function signIn() {
   var data = {
      directive: 'sign-in'
   };
   chrome.runtime.sendMessage(data, null);
}

function leaveRoom(roomNo) {
   var data = {
      directive: 'leave-room',
      roomNo: roomNo
   };
   $("#current-number").text("none");
   chrome.storage.local.remove('entered-room');
   chrome.runtime.sendMessage(data, null);
   chrome.storage.local.remove('current-room');
}

function enterRoom(newNo, oldNo) {
   var data = {
      directive: 'enter-room',
      newRoom: newNo
   };
   if (typeof (oldNo) != 'undefined') {
      data.oldRoom = oldNo;
   }

   $("#current-number").text(newNo);
   chrome.storage.local.set({ 'entered-room': true });
   chrome.runtime.sendMessage(data, null);
   chrome.storage.local.set({ 'current-room': newNo });
}