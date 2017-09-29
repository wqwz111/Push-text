$(document).ready(function () {
    var backgroundPage = null;
    var currentRoom;
    $("#go").click(function () {
        enterRoom();
    });
    $(document).keydown(function (e) {
        if (e.keyCode === 13) {//13 is 'Enter'
            enterRoom();
        }
    });

    chrome.storage.local.get('current-room', function (item) {
        if (item['current-room'] && item['current-room'] !== "") {
            $("#room-number").val(item['current-room']);
            enterRoom(true);
            currentRoom = item['current-room'];
        }
    });

    var onDataChange = function (data) {
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
        chrome.runtime.getBackgroundPage(function (bp) {
            if (!bp) return;
            backgroundPage = bp;

            chrome.storage.local.get('current-room', function (item) {
                var roomNo = $("#room-number").val();
                var data = {
                    directive: 'enter-room',
                    newRoom: roomNo
                };
                if (item['current-room']) {
                    if (typeof(shouldForceLoad) === 'undefined') {
                        if (item['current-room'] === roomNo) {
                            return;
                        }
                        data.oldRoom = item['current-room'];
                    }
                }
                chrome.storage.local.set({'current-room': roomNo});
                backgroundPage.enterRoom(data, onDataChange);
                $("#msg-list").children().remove();
            });
        });
    }
});