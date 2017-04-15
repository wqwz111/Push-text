$(document).ready(function () {
    $("#enter-room").click(function () {
        var newNo = $("#room-number").val();
        var oldNo = $("#current-number").text();
        enterRoom(newNo, oldNo);
        $("#current-number").text(newNo);
    });

    $("#leave-room").click(function () {
        var roomNo = $("#current-number").text();
        leaveRoom(roomNo);
        $("#current-number").text("无");
    });

    $("#current-number").bind("DOMNodeInserted",function() {
        if ($("#current-number").text() == "无") {
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