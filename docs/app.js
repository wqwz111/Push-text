$(document).ready(function () {
   var config = {
      apiKey: "AIzaSyDOZXLS_Gf5K343TuB1QTL-IwC27eNuv6U",
      authDomain: "dream-c5c23.firebaseapp.com",
      databaseURL: "https://dream-c5c23.firebaseio.com",
      projectId: "dream-c5c23",
      storageBucket: "dream-c5c23.appspot.com",
      messagingSenderId: "273420774000"
   };
   var fireDatabase;
   var localStorage = window.localStorage;
   firebase.initializeApp(config);
   fireDatabase = firebase.database();

   var currentRoom = localStorage.getItem('current-room');
   if (currentRoom) {
      console.log('enter room: ' + currentRoom);
      $("#room-number").val(currentRoom);
      enterRoom(true);
   }

   $("#go").click(function () {
      enterRoom();
   });

   $(window).on('beforeunload', function () {
      return "";
   });
   $(window).on('unload', function () {
      if (currentRoom) {
         console.log('leave room: ' + currentRoom);
         leaveRoom(currentRoom);
      }
   });

   function onDataChanged(snap) {
      var data = snap.val();
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
   };

   function enterRoom(shouldForceLoad) {
      var roomNo = $("#room-number").val();
      if (currentRoom) {
         if (typeof(shouldForceLoad) == 'undefined') {
            if (currentRoom === roomNo) {
               return;
            }
            leaveRoom(currentRoom);
         }
         setDataChangeListener(roomNo, onDataChanged);
         localStorage.setItem('current-room', roomNo);
         currentRoom = roomNo;
         $("#msg-list").children().remove();
      }
   }

   function leaveRoom(roomNo) {
      var ref = fireDatabase.ref('/rooms/' + roomNo + '/messages');
      ref.off('child_added', onDataChanged);
   }

   function setDataChangeListener(roomNo, listener) {
      var ref = fireDatabase.ref('/rooms/' + roomNo + '/messages');
      ref.off('child_added', listener);
      ref.on('child_added', listener);
   }
});