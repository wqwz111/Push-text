// Initialize Firebase
var config = {
    apiKey: "AIzaSyDOZXLS_Gf5K343TuB1QTL-IwC27eNuv6U",
    authDomain: "dream-c5c23.firebaseapp.com",
    databaseURL: "https://dream-c5c23.firebaseio.com",
    projectId: "dream-c5c23",
    //storageBucket: "dream-c5c23.appspot.com",
    messagingSenderId: "273420774000"
};

var currentUser;
var fireDatabase;
var currentRoom = null;
var onNewMessage = null;

firebase.initializeApp(config);
fireDatabase = firebase.database();
chrome.storage.local.set({'logged-in': false});

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in.
        console.log("background logged in");
        chrome.storage.local.set({'logged-in': true});
        currentUser = user;

        chrome.runtime.sendMessage({directive: 'logged-in'}, null);
    } else {
        // User is signed out.
        console.log("logged out, reconnect");
        chrome.storage.local.set({'logged-in': false});
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

function getQiniuUploadToken(callback, forceTo) {
    chrome.storage.local.get('upload-token', function (item) {
        var uploadToken = item['upload-token'];
        if (!uploadToken || forceTo) {
            var url = "https://us-central1-dream-c5c23.cloudfunctions.net/qiniuUpToken";
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var token = JSON.parse(xhr.responseText).token;
                    storeQiniuUploadToken(token);
                    uploadToken = token;
                }
            };
            xhr.open("GET", url, false);
            xhr.send(null);
        }
        if (typeof callback === 'function') {
            callback(uploadToken);
        }
    });
}

function storeQiniuUploadToken(token) {
    chrome.storage.local.set({'upload-token': token});
}

function uploadFile(dataUri, roomNo, callback) {
    var getTokenCallback = function (token) {
        var name = Math.round(new Date().getTime() / 1000);
        var fileName = 'images/' + roomNo + '/' + name + '.jpg';
        var url = "http://upload-z2.qiniu.com/putb64/-1/key/" + urlSafeBase64(fileName);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (typeof callback === 'function') {
                        var downloadURL = "http://ovqjybx2u.bkt.clouddn.com/" + fileName;
                        callback(downloadURL);
                    }
                }
                if (xhr.status === 401) {
                    getQiniuUploadToken(getTokenCallback, true);
                }
            }
        };
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.setRequestHeader("Authorization", "UpToken " + token);
        xhr.send(dataUri.slice(23));
    };
    getQiniuUploadToken(getTokenCallback, false);
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
        case 'force-connect': {
            firebase.auth().signInAnonymously();
            console.log('force connect');
            break;
        }
        case 'sign-in': {
            if (currentUser) {
                return;
            }
            firebase.auth().signInAnonymously();
            console.log('signed in');
            break;
        }
    }
});

var childAdd = function (snapshot) {
    if (onNewMessage) {
        onNewMessage(snapshot.val());
    }
};

function capture(selText) {
    chrome.tabs.captureVisibleTab(null, {format: 'jpeg', quality: 50},
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


function urlSafeBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        })).replace(/\+/g, '-').replace(/\//g, '_');
}