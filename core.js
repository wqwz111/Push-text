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
        && snapshot.child(roomNoStr)
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
    case 'upload-file': {
      uploadFile(request.dataUri, currentRoom, function (downloadURL) {
        var msg = buildMsg(currentUser.uid, selText, downloadURL);
        sendMessageToRoom(currentRoom, msg);
      });
      break;
    }
    case 'enter-room': {
      createOrEnterRoom(request.newRoom, currentUser.uid, function (roomNo) {
        callback(roomNo);
        chrome.storage.local.set({ 'current-room': roomNo }, function () {
          currentRoom = roomNo;
        });
      });
      break;
    }
  }
});



var selText;
var currentRoom;

document.addEventListener('mousemove', function (e) {
  srcElement = e.srcElement;
  selText = srcElement.textContent;
}, false);

document.addEventListener('dblclick', function (e) {
  chrome.storage.local.get('current-room', function (item) {
    if (item['current-room']) {
      currentRoom = item['current-room'];
    }
  });
  var data = {
    directive: 'capture'
  };
  chrome.runtime.sendMessage(data, null);
}, false);

// document.addEventListener('keydown', function (e) {
//   if (e.ctrlKey && e.altKey && e.keyCode == 90) {//90 is 'Z'
//     var data = { contentText: selText };
//     chrome.runtime.sendMessage(data, null);
//   }
// }, false);

