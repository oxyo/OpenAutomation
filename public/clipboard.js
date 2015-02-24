
function handleConnectionSetup() {

    $(document).on('pagebeforeshow', '#connectionSet-UpPage', function () {
        if (window.localStorage.getItem('oa.serverID')) $('input#oaKeyInput').val(window.localStorage.getItem('oa.serverID'));
        if (window.localStorage.getItem('oa.serverIP')) $('input#oaIPAddressInput').val(window.localStorage.getItem('oa.serverIP'));
    });

    $("#oaKeyInput").bind("change", function (event, ui) {
        window.localStorage.setItem('oa.serverID', $('#oaKeyInput').val());
    });

    $("#oaIPAddressInput").bind("change", function (event, ui) {
        window.localStorage.setItem('oa.serverIP', $('#oaIPAddressInput').val());
    });

    $(document).on("tap", '#clearOAKey', function () {
        $("input#oaKeyInput").val('');
    });

    $(document).on("tap", '#clearOAIP', function () {
        $('input#oaIPAddressInput').val('');
    });

}


controlB0.prop("href", '#'+ oa.oa.rooms[activeRoom.id].app);

$( "div.box" ).on( "swipe", swipeHandler );


dbT.find({ _id: { $lt: '2015-02-22' }}, function (err, docs) {
    // docs contains Omicron Persei 8
});

getAPIRequest.appID = req.query.appID;
getAPIRequest.apirequest = req.query.apirequest;

//process.nextTick(function(){
// });