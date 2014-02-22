// Handle requests for passwords
var SKEY_FM_TAB_ID = 'doubanfm_tab_id';

var API_SONG_SEARCH = 'http://music.163.com/api/search/get/web';
var API_SONG_DETAIL = 'http://music.163.com/api/song/detail/'


// Clean up an string, make it lower case and remove white spaces
var clean_up_string = function(s) {
    //result = s.toLowerCase().replace(/[\s'"]|\(.*\)|\[.*\]|\.\.\./g, '').replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
    result = s.toLowerCase().replace(/[\s'"]|\(.*\)|\[.*\]|\.\.\./g, '');
    return result;
}


var fuzzy_equal = function(s1, s2) {
    s1 = clean_up_string(s1);
    s2 = clean_up_string(s2);
    if (s1 === s2) return true;
    if (s1.length > 3 && s2.indexOf(s1) !== -1) return true;
    if (s2.length > 3 && s1.indexOf(s2) !== -1) return true;
    return false;
}


// Send message to douban tab
var send_message_to_douban_tab = function(request) {
    chrome.storage.local.get(SKEY_FM_TAB_ID, function(result){
        tab_id = result[SKEY_FM_TAB_ID];
        chrome.tabs.sendMessage(tab_id, request);
    });
}


// Get song detail by song_id
var get_song_detail = function(song_id, callback) {
    $.getJSON(API_SONG_DETAIL, {id: song_id, ids: '[' + song_id + ']'}, function(resp){
        callback && callback(resp.songs[0]);
    }).fail(function() {
        send_message_to_douban_tab({type: 'fm_play_raw_mp3'});
    });
}


// Call 163 api to search for songs
var query_163_to_play_song = function(song) {
    var success_callback = function(resp) {
        var songs = resp.result.songs;
        var matchs_found = false;
        var best_song_id, first_song_id;
        if (!songs) {
            send_message_to_douban_tab({type: 'fm_play_raw_mp3'});
            return 
        }
        $.each(songs, function(i, item) {
            if (!first_song_id) {first_song_id = item.id};
            $.each(item.artists, function(i, artist_item){
                if (fuzzy_equal(item.album.name, song.album)) {
                    best_song_id = item.id;
                    matchs_found = true;
                    return false;
                }
            });
            // Break if artist matchs
            if (matchs_found) return false;
        });
        if (!matchs_found) {
            best_song_id = first_song_id;
        }
        // Query for song's mp3Url, then send play event
        get_song_detail(best_song_id, function(song_info){
            send_message_to_douban_tab({
                type: 'fm_play_new_song',
                song: song_info
            });
        });
    };

    $.ajax({
        type: 'POST',
        url: API_SONG_SEARCH,
        data: {
            type: '1',
            s: song.song + ' ' + song.artist,
            offset: '0',
            limit: '30'
        }, 
        dataType: 'json',
        error: function(){
            send_message_to_douban_tab({type: 'fm_play_raw_mp3'});
            return;
        },
        success: function(resp) {
            try {
                success_callback(resp);
            } catch(err) {
                send_message_to_douban_tab({type: 'fm_play_raw_mp3'});
                return;
            }
        }
    });
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'fm_inited') {
        // Save douban fm tab id
        var data = {}
        data[SKEY_FM_TAB_ID] = sender.tab.id;
        chrome.storage.local.set(data);
    } else if (request.type === '163_play') {
        song = request.song;
        query_163_to_play_song(song);
    } else if (request.type === 'notify') {
        notify(request.title, request.message);
    } 
});


// Show desktop notification
var notify = function(title, message) {
    var notification = webkitNotifications.createNotification(
        '', title, message
    );
    notification.show();
    // Auto close in 3 seconds
    setTimeout(function(){
        notification.cancel();
    }, 5000);
}  


// Create a new tab form douban FM
var crete_new_tab = function(url){
    chrome.tabs.create({
        url: url,
        active: false
    }, function(tab) {
        chrome.storage.local.set({'163_tab_id': tab.id})
    });
}


// Spoot `Referrer` header for request to 163
var referrer_163 = 'http://music.163.com/';

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        var referrer_header_found = false;
        for (var i = 0; i < details.requestHeaders.length; ++i) {
            if (details.requestHeaders[i].name === 'Referer') {
                details.requestHeaders[i].value = referrer_163;
                referrer_header_found = true;
                break;
            }
        }
        if (!referrer_header_found) {
            details.requestHeaders.push({'name': 'Referer', 'value': referrer_163})
        }
        return {requestHeaders: details.requestHeaders};
    },
    {urls: ["*://*.music.126.net/*", "http://music.163.com/*"]},
    ["blocking", "requestHeaders"]
);

