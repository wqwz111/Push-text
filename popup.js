$(document).ready(function () {
    $("#enter-room").click(function () {
        var newNo = $("#room-number").val();
        var oldNo = $("#current-number").text();
        enterRoom(newNo, oldNo);
        $("#current-number").text(newNo);
    });

    chrome.storage.local.get('current-room', function (item) {
        if (item['current-room']) {
            var newNo = item['current-room'];
            $("#current-number").text(newNo);
        }
    });
});

function enterRoom(newNo, oldNo) {
    var data = {
        directive: 'enter-room',
        newRoom: newNo,
        oldRoom: oldNo
    };

    chrome.runtime.sendMessage(data, null);
    chrome.storage.local.set({ 'current-room': newNo });
}