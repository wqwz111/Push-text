// Initialize Firebase
var config = {
  apiKey: "AIzaSyDOZXLS_Gf5K343TuB1QTL-IwC27eNuv6U",
  authDomain: "dream-c5c23.firebaseapp.com",
  databaseURL: "https://dream-c5c23.firebaseio.com",
  projectId: "dream-c5c23",
  storageBucket: "dream-c5c23.appspot.com",
  messagingSenderId: "273420774000"
};
firebase.initializeApp(config);
var fireDatabase = firebase.database();

var currentUser = {};

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    console.log("logged in")
    currentUser = user;
  } else {
    // User is signed out.
    console.log("logged out")
    removeUserFromRoom(currentUser.roomNo, currentUser.uid);
    currentUser = null;
  }
});

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
        var msg = buildMsg(uid, "Member leaved.", null);
        sendMessageToRoom(roomNo, msg);
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
          ownerId: uid
        });
        addUserToRoom(roomNo, uid);
        var msg = buildMsg(uid, "New member joined.", null);
        sendMessageToRoom(roomNo, msg);
        if (typeof callback === 'function') {
          callback(roomNo);
        }
      } else if (!snapshot.child(roomNoStr)
        .hasChild(uid.toString())) {
        addUserToRoom(roomNo, uid);
        var msg = buildMsg(uid, "New member joined.", null);
        sendMessageToRoom(roomNo, msg);
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
      if (request.oldRoom) {
        removeUserFromRoom(request.oldRoom, uid);
        console.log('left room: ' + request.oldRoom);
      }
      console.log('entered room: ' + request.newRoom);
      createOrEnterRoom(request.newRoom, uid, function (roomNo) {
        chrome.storage.local.set({ 'current-room': roomNo }, function () {
          currentRoom = roomNo;
        });
      });
      break;
    }
    case 'capture': {
      capture(request.selText);
      break;
    }
  }
});

function capture(selText) {
  chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 },
    function (dataURI) {
      uploadFile(dataURI, currentRoom, function (downloadURL) {
        var msg = buildMsg(currentUser.uid, selText, downloadURL);
        sendMessageToRoom(currentRoom, msg);
      });
    });
}