var config = {
    socker_url: 'https://push8.club'
};
var server = new Room(config.socker_url);
server.loginAnonymous();
var currentUser;
var onNewMessage = null;

chrome.storage.local.set({'logged-in': false});

server.onLoginStatusChanged(function (user) {
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
    }
});

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

function sendMessageToRoom(msg) {
    server.sendMessage(currentUser._id, msg);
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
            var msg = buildMsg(currentUser._id, request.content);
            sendMessageToRoom(msg);
            break;
        }
        case 'force-connect': {
            console.log('force connect');
            break;
        }
        case 'sign-in': {
            if (currentUser) {
                return;
            }
            console.log('signed in');
            break;
        }
    }
});

function capture(selText) {
    chrome.tabs.captureVisibleTab(null, {format: 'jpeg', quality: 50},
        function (dataURI) {
            uploadFile(dataURI, server.currentRoom(), function (downloadURL) {
                var msg = buildMsg(currentUser._id, selText, downloadURL);
                sendMessageToRoom(msg);
            });
        });
}

function onDataChange(callback) {
    if (typeof callback === 'function') {
        onNewMessage = callback;
    }
}

function enterRoom(request) {
    if (request.oldRoom) {
        server.offBroadcast(onNewMessage);
    }
    server.enterRoom(request.newRoom, currentUser._id, null, function (req) {
        console.log('entered room: ' + request.newRoom);
        if (typeof onNewMessage === 'function') {
            server.onBroadcast(onNewMessage);
            req.forEach(function (item) {
                onNewMessage(item);
            });
        }
    });
}

function leaveRoom() {
    server.leaveRoom(currentUser._id, function () {
        server.offBroadcast(onNewMessage);
        console.log('left room');
    });
}

function urlSafeBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        })).replace(/\+/g, '-').replace(/\//g, '_');
}