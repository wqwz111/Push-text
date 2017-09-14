function Room(url) {
    this._url = url;
    this._socket = io(url);
    this._roomNo = null;
}

Room.prototype.currentRoom = function () {
    return this._roomNo;
};

Room.prototype.loginAnonymous = function () {
    this._socket.emit('login');
};

Room.prototype.logout = function (userId) {
    this._socket.emit('logout', {user_id: userId});
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

Room.prototype.leaveRoom = function (uid) {
    this._socket.emit('leave-room', {
        current_room: this._roomNo,
        user_id: uid
    });
    this._roomNo = null;
};

Room.prototype.sendMessage = function (uid, message) {
    this._socket.emit('new-message', {
        user_id: uid,
        msg: message
    });
};

Room.prototype.onBroadcast = function (listener) {
    if (typeof listener === 'function') {
        this._socket.on('broadcast', function (req) {
            listener(req);
        });
    }
};

Room.prototype.offBroadcast = function () {
    this._socket.off('broadcast');
};

Room.prototype.onConnect = function (listener) {
    if (typeof listener === 'function') {
        this._socket.on('connect', function (req) {
            listener(req);
        })
    }
};

Room.prototype.onDisConnect = function (listener) {
    if (typeof listener === 'function') {
        this._socket.on('disconnect', function (req) {
            listener(req);
        });
    }
};

Room.prototype.onError = function (listener) {
    if (typeof listener === 'function') {
        this._socket.off('error', listener);
        this._socket.on('error', function (err) {
            listener(err);
        });
    }
};

Room.prototype.onLoginStatusChanged = function (listener) {
    if (typeof listener === 'function') {
        this._socket.on('logged-in', function (req) {
            listener(req);
        });
        this._socket.on('logged-out', function (req) {
            listener(null);
        });
    }
};

Room.prototype.onChangeRoomSuccess = function (listener) {
    if (typeof listener === 'function') {
        this._socket.on('room-change-success', function (req) {
            listener(req);
        });
    }
}