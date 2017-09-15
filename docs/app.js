$(document).ready(function () {
    var server = new Room("https://push8.club");
    server.loginAnonymous();
    var localStorage = window.localStorage;
    var currentRoom = localStorage.getItem('current-room');
    var currentUser = null;

    server.onLoginStatusChanged(function (user) {
        if (user) {
            // User is signed in.
            console.log("logged in");
            $('.site-splash').attr('hidden', 'hidden');
            $('.site-wrapper').attr('hidden', null);
            currentUser = user;
            if (currentRoom) {
                $("#room-number").val(currentRoom);
                enterRoom(true);
            }
        } else {
            // User is signed out.
            console.log("logged out, reconnect");
            $('.site-splash').attr('hidden', null);
            $('.site-wrapper').attr('hidden', 'hidden');
        }
    });

    var onDataChanged = function (data) {
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

    $("#go").click(function () {
        if ($('#room-number').val().trim() !== "") {
            enterRoom();
        }
    });

    $(document).keydown(function (e) {
        if (e.keyCode === 13 && $('#room-number').val().trim() !== "") {//13 is 'Enter'
            enterRoom();
        }
    });
    $(window).on('beforeunload', function () {
        return "";
    });
    $(window).on('unload', function () {
        if (currentRoom) {
            console.log('leave room: ' + currentRoom);
            server.offBroadcast();
        }
    });

    function enterRoom(shouldForceLoad) {
        if (!currentUser) {
            return;
        }
        var roomNo = $("#room-number").val();
        if (typeof(shouldForceLoad) === 'undefined') {
            if (currentRoom === roomNo) {
                return;
            }
            server.offBroadcast();
        }
        server.onBroadcast(onDataChanged)
        localStorage.setItem('current-room', roomNo);
        currentRoom = roomNo;
        $("#msg-list").children().remove();

        server.enterRoom(roomNo, currentUser._id, null, function (req) {
            console.log('entered room: ' + roomNo);
            req.forEach(function (item) {
                onDataChanged(item);
            });
        });
    }
});