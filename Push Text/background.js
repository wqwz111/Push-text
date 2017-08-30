// Initialize Firebase
var config = {
   apiKey: "AIzaSyDOZXLS_Gf5K343TuB1QTL-IwC27eNuv6U",
   authDomain: "dream-c5c23.firebaseapp.com",
   databaseURL: "https://dream-c5c23.firebaseio.com",
   projectId: "dream-c5c23",
   storageBucket: "dream-c5c23.appspot.com",
   messagingSenderId: "273420774000"
};

var currentUser;
var fireDatabase;

firebase.initializeApp(config);
fireDatabase = firebase.database();

firebase.auth().onAuthStateChanged(function (user) {
   if (user) {
      // User is signed in.
      console.log("logged in")
      currentUser = user;
   } else {
      // User is signed out.
      console.log("logged out, reconnect")
      firebase.auth().signInAnonymously();
   }
});

function addDataChangeListener(roomNo, callback) {
   var ref = fireDatabase.ref('/rooms/' + roomNo + '/messages');
   ref.off('child_added', callback);
   ref.on('child_added', callback);
}

function removeDataChangeListener(roomNo, callback) {
   var ref = fireDatabase.ref('/rooms/' + roomNo + '/messages');
   ref.off('child_added', callback);
}

function uploadFile(dataUri, roomNo, callback) {
   var fileName = Math.round(new Date().getTime() / 1000);
   var ref = firebase.storage().ref('/images/' + roomNo + '/' + fileName + '.png');
   ref.putString(dataUri, 'data_url').then(function (snapshot) {
      if (typeof callback === 'function') {
         callback(snapshot.downloadURL);
      }
   });
}

function buildMsg(uid, content, fileUrl) {
   return {
      uid: uid,
      content: content,
      fileUrl: fileUrl
   };
}

function sendMessageToRoom(roomNo, msg) {
   var refPath = 'rooms/' + roomNo + '/messages';
   var ref = fireDatabase.ref(refPath);
   var newMsgKey = ref.push().key;
   var newData = {};
   newData[newMsgKey] = msg;
   ref.update(newData);
}

function addUserToRoom(roomNo, uid) {
   var ref = fireDatabase.ref('rooms/' + roomNo + '/users');
   var newData = {};
   newData[uid] = 1;
   ref.update(newData);
}

function removeUserFromRoom(roomNo, uid, callback) {
   fireDatabase.ref('rooms')
      .once('value', function (snapshot) {
         var roomNoStr = roomNo.toString();
         var uidStr = uid.toString();
         if (snapshot.hasChild(roomNoStr)
            && snapshot.child(roomNoStr).child('users')
               .hasChild(uidStr)) {
            var ref = fireDatabase.ref('rooms/' + roomNo + '/users');
            ref.child(uidStr).remove();
            if (typeof callback === 'function') {
               callback(roomNo);
            }
         }
      });
}

function createOrEnterRoom(roomNo, uid, callback) {
   fireDatabase.ref('rooms')
      .once('value', function (snapshot) {
         var roomNoStr = roomNo.toString();
         if (!snapshot.hasChild(roomNoStr)) {
            fireDatabase.ref('rooms/' + roomNo).set({
            ownerId: uid,
            createdTime: firebase.database.ServerValue.TIMESTAMP
            });
            addUserToRoom(roomNo, uid);
            if (typeof callback === 'function') {
               callback(roomNo);
            }
         } else if (!snapshot.child(roomNoStr)
            .hasChild(uid.toString())) {
            addUserToRoom(roomNo, uid);
            if (typeof callback === 'function') {
               callback(roomNo);
            }
         }
      });
}

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
   switch (request.directive) {
      case 'enter-room': {
         var uid = currentUser.uid;
         enterRoom(request);
         break;
      }
      case 'capture': {
         chrome.storage.local.get('current-room', function (item) {
            if (item['current-room']) {
               capture(request.selText);
            }
         });
         break;
      }
      case 'leave-room': {
         leaveRoom(request);
         break;
      }
      case 'send-message': {
         var msg = buildMsg(currentUser.uid, request.content);
         sendMessageToRoom(currentRoom, msg);
         break;
      }
      case 'sign-in': {
         console.log('sign in');
         if (currentUser) {
            return;
         }
         firebase.auth().signInAnonymously();
         break;
      }
   }
});

var currentRoom = null;
var onNewMessage = null;

var childAdd = function (snapshot) {
   if (onNewMessage) {
      onNewMessage(snapshot.val());
   }
}

function capture(selText) {
   chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 50 },
      function (dataURI) {
         uploadFile(dataURI, currentRoom, function (downloadURL) {
            var msg = buildMsg(currentUser.uid, selText, downloadURL);
            sendMessageToRoom(currentRoom, msg);
         });
      });
}

function onDataChange(callback) {
   if (typeof callback === 'function') {
      onNewMessage = callback;
   }
}

function enterRoom(request) {
   var uid = currentUser.uid;
   if (request.oldRoom) {
      removeUserFromRoom(request.oldRoom, uid);
      console.log('left room: ' + request.oldRoom);
   }
   console.log('entered room: ' + request.newRoom);
   createOrEnterRoom(request.newRoom, uid, function (roomNo) {
      addDataChangeListener(roomNo, childAdd);
      currentRoom = roomNo;
   });
}

function leaveRoom(request) {
   var uid = currentUser.uid;
   removeUserFromRoom(request.roomNo, uid, function (roomNo) {
      removeDataChangeListener(roomNo, childAdd);
      currentRoom = null;
   });
   console.log('left room: ' + request.roomNo);
}
