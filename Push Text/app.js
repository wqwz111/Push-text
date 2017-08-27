$(document).ready(function () {
    var backgroundPage = null;
    $("#go").click(function () {
        enterRoom();
        setDataChangeListener();
    });

    chrome.storage.local.get('current-room', function (item) {
        if (item['current-room']) {
            $("#room-number").val(item['current-room']);
        }
    });
    setDataChangeListener();

    function enterRoom() {
        var roomNo = $("#room-number").val();
        var data = {
            directive: 'enter-room',
            newRoom: roomNo
        };
        chrome.storage.local.get('current-room', function (item) {
            if (item['current-room']) {
                if (item['current-room'] === $("#room-number").val()) {
                    return;
                }
                data.oldRoom = item['current-room'];
            }
            chrome.storage.local.set({'current-room': roomNo});
            backgroundPage.enterRoom(data);
            $("#msg-list").children().remove();
        });
    }

    function setDataChangeListener() {
        chrome.runtime.getBackgroundPage(function (bp) {
            if (!bp) return;

            backgroundPage = bp;
            backgroundPage.onDataChange(function (data) {
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
            });
        });
    }
});