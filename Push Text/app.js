$(document).ready(function () {
   var backgroundPage = null;
   var roomId;
   $("#go").click(function () {
      setDataChangeListener();
      enterRoom();
   });

   chrome.storage.local.get('current-room', function (item) {
      if (item['current-room'] && item['current-room'] !== "") {
         $("#room-number").val(item['current-room']);
         setDataChangeListener();
         enterRoom(true);
      }
   });

   $(window).on('beforeunload', function () {
      prepareToLeaveRoom();
      return "";
   });
   $(window).on('unload', function () {
      if (typeof(roomId) != 'undefined') {
         leaveRoom(roomId);
      }
   });

   function prepareToLeaveRoom() {
      chrome.storage.local.get('current-room', function (item) {
         if (item['current-room']) {
            roomId = item['current-room'];
         }
      });
   }

   function leaveRoom(id) {
      data = {roomNo: id};
      console.log('leave room: ' + data.roomNo);
      backgroundPage.leaveRoom(data);
   }

   function enterRoom(shouldForceLoad) {
      chrome.storage.local.get('current-room', function (item) {
         var roomNo = $("#room-number").val();
         var data = {
            directive: 'enter-room',
            newRoom: roomNo
         };
         if (item['current-room']) {
            if (typeof(shouldForceLoad) == 'undefined') {
               if (item['current-room'] === roomNo) {
                  return;
               }
               data.oldRoom = item['current-room'];
            }
         }
         chrome.storage.local.set({ 'current-room': roomNo });
         backgroundPage.enterRoom(data);
         $("#msg-list").children().remove();
      });
   }

   function setDataChangeListener() {
      chrome.runtime.getBackgroundPage(function (bp) {
         if (!bp) return;

         backgroundPage = bp;
         backgroundPage.onDataChange(function (data) {
            if (data.fileUrl) {
               $("#msg-list").prepend("<div class='card'>" +
                  "<img class='card-img card-img-top' src='" +
                  data.fileUrl + "' alt='Card image cap'>" +
                  "<div class='card-block'>" +
                  "<p class='card-text'>" +
                  data.content + "</p></div></div>");
               $(".card-img").click(function () {
                  $("#modal-img").attr("src", $(this).attr("src"));
                  $("#modal").modal('show');
               });
            } else {
               $("#msg-list").prepend("<div class='card'>" +
                  "<div class='card-block'>" +
                  "<p class='card-text'>" +
                  data.content + "</p></div></div>");
            }
         });
      });
   }
});