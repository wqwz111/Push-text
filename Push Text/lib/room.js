function Room(url) {
    this._url = url;
    this._socket = io(url);
    this._roomNo = null;
}

Room.prototype.currentRoom = function () {
    return this._roomNo;
};

Room.prototype.loginAnonymous = function (callback) {
    this._socket.emit('login');
};

Room.prototype.enterRoom = function (newRoom, uid, passwd, callback) {
    var data = {
        new_room: newRoom,
        user_id: uid,
        password: passwd
    };
    this._socket.emit('enter-room', data, callback);
    this._roomNo = newRoom;
};

Room.prototype.leaveRoom = function (uid, callback) {
    this._socket.emit('leave-room', {
        current_room: this._roomNo,
        user_id: uid
    }, callback);
    this._roomNo = null;
};

Room.prototype.sendMessage = function (uid, message, callback) {
    this._socket.emit('new-message', {
        user_id: uid,
        msg: message
    }, callback);
};

Room.prototype.onBroadcast = function (callback) {
    this._socket.on('broadcast', function (req) {
        callback(req);
    });
};

Room.prototype.onConnect = function (callback) {
    this._socket.on('connect', function (req) {
        callback(req);
    })
};

Room.prototype.onDisConnect = function (callback) {
    this._socket.on('disconnect', function (req) {
        callback(req);
    });
};

Room.prototype.onError = function (callback) {
    this._socket.on('error', function (err) {
        callback(err);
    });
};

Room.prototype.onLoginStatusChanged = function (callback) {
    this._socket.on('logged-in', function (req) {
        callback(req);
    });
    this._socket.on('logged-out', function (req) {
        callback(null);
    });
};