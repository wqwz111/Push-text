$(document).ready(function () {
    var config = {
        apiKey: "AIzaSyDOZXLS_Gf5K343TuB1QTL-IwC27eNuv6U",
        authDomain: "dream-c5c23.firebaseapp.com",
        databaseURL: "https://dream-c5c23.firebaseio.com",
        storageBucket: "dream-c5c23.appspot.com"
    };
    firebase.initializeApp(config);
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in.
            console.log("logged in");
            $('.site-splash').attr('hidden', 'hidden');
            $('.site-wrapper').attr('hidden', null);
        } else {
            // User is signed out.
            console.log("logged out, reconnect");
            $('.site-splash').attr('hidden', null);
            $('.site-wrapper').attr('hidden', 'hidden');
            firebase.auth().signInAnonymously();
        }
    });

    var fireDatabase = firebase.database();
    var localStorage = window.localStorage;

    var onDataChanged = function (snap) {
        var data = snap.val();
        if (data.fileUrl) {
            $("#msg-list").prepend("<div class='card'>" +
                "<img class='card-img card-img-top lazyload'" +
                " data-src='" + data.fileUrl + "' alt='Card image cap'>" +
                "<div class='card-block'>" +
                "<p class='card-text'>" +
                data.content + "</p></div></div>");
            $(".card-img").click(function () {
                $("#modal-img").attr("src", $(this).attr("src"));
                $("#modal").modal('show');
            });
            lazyload();
        } else {
            $("#msg-list").prepend("<div class='card'>" +
                "<div class='card-block'>" +
                "<p class='card-text'>" +
                data.content + "</p></div></div>");
        }
    };

    var currentRoom = localStorage.getItem('current-room');
    if (currentRoom) {
        $("#room-number").val(currentRoom);
        enterRoom(true);
    }

    $("#go").click(function () {
        enterRoom();
    });

    $(document).keydown(function (e) {
        if (e.keyCode === 13) {//13 is 'Enter'
            enterRoom();
        }
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

    function enterRoom(shouldForceLoad) {
        var roomNo = $("#room-number").val();
        if (typeof(shouldForceLoad) === 'undefined') {
            if (currentRoom === roomNo) {
                return;
            }
            leaveRoom(currentRoom);
        }
        setDataChangeListener(roomNo, onDataChanged);
        localStorage.setItem('current-room', roomNo);
        currentRoom = roomNo;
        $("#msg-list").children().remove();
        console.log('enter room: ' + roomNo);
    }

    function leaveRoom(roomNo) {
        if (roomNo !== null) {
            var ref = fireDatabase.ref('/rooms/' + roomNo + '/messages');
            ref.off('child_added', onDataChanged);
        }
    }

    function setDataChangeListener(roomNo, listener) {
        if (roomNo !== null && typeof(listener) === 'function') {
            var ref = fireDatabase.ref('/rooms/' + roomNo + '/messages');
            ref.off('child_added', listener);
            ref.on('child_added', listener);
        }
    }
});