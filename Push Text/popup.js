$(document).ready(function () {
   //signIn();

   $("#enter-room").click(function () {
      var newNo = $("#room-number").val();
      var oldNo = $("#current-number").text();
       if (newNo && newNo.trim() !== "") {
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
       if ($("#current-number").text() === "none") {
         $("#leave-room").hide();
      } else {
         $("#leave-room").show();
      }
   });

   $('#connection-status').click(function () {
       var data = {
           directive: 'force-connect'
       };
       chrome.runtime.sendMessage(data, null);
   });

   chrome.storage.local.get('logged-in', function(item) {
       if (item['logged-in']) {
           doAfterObtainConnection();
       } else {
           doAfterLostConnection()
       }
   });
});

function doAfterObtainConnection() {
    chrome.storage.local.get('current-room', function (item) {
        var newNo = item['current-room'];
        if (!newNo) {
            $("#leave-room").hide();
        } else {
            $("#current-number").text(newNo);
        }
    });
    $('#connection-status').hide();
    $('#enter-room').prop('disabled', false);
    $('#tab-room').prop('disabled', false);
}

function doAfterLostConnection() {
    $('#connection-status').show();
    $('#enter-room').prop('disabled', true);
    $('#tab-room').prop('disabled', true);
}

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
   chrome.runtime.sendMessage(data, null);
   chrome.storage.local.remove('current-room');
}

function enterRoom(newNo, oldNo) {
   var data = {
      directive: 'enter-room',
      newRoom: newNo
   };
    if (typeof (oldNo) !== 'undefined') {
      data.oldRoom = oldNo;
   }

   $("#current-number").text(newNo);
   chrome.runtime.sendMessage(data, null);
   chrome.storage.local.set({ 'current-room': newNo });
}