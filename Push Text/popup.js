$(document).ready(function () {
    $("#enter-room").click(function () {
        var newNo = $("#room-number").val();
        var oldNo = $("#current-number").text();
        if (newNo) {
            enterRoom(newNo, oldNo);
            $("#current-number").text(newNo);
        }
    });

    $("#tab-room").click(function () {
        chrome.tabs.create({url: 'app.html'});
    });

    $("#leave-room").click(function () {
        var roomNo = $("#current-number").text();
        leaveRoom(roomNo);
        $("#current-number").text("none");
    });

    $("#current-number").bind("DOMNodeInserted",function() {
        if ($("#current-number").text() == "none") {
            $("#leave-room").hide();
        } else {
            $("#leave-room").show();
        }
    });

    chrome.storage.local.get('current-room', function (item) {
        if (item['current-room']) {
            var newNo = item['current-room'];
            $("#current-number").text(newNo);
        } else {
            $("#leave-room").hide();
        }
    });
});

function leaveRoom(roomNo) {
    var data = {
        directive: 'leave-room',
        roomNo: roomNo
    };

    chrome.runtime.sendMessage(data, null);
    chrome.storage.local.remove('current-room');
}

function enterRoom(newNo, oldNo) {
    var data = {
        directive: 'enter-room',
        newRoom: newNo,
        oldRoom: oldNo
    };

    chrome.runtime.sendMessage(data, null);
    chrome.storage.local.set({ 'current-room': newNo });
}