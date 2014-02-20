// Handle requests for passwords
var url_song_search = 'http://music.163.com/#/search/m/?type=1&autoplay=1';
var skey_fm_tab_id = 'doubanfm_tab_id';

var API_SONG_SEARCH = 'http://music.163.com/api/search/get/web';
var API_SONG_DETAIL = 'http://music.163.com/api/song/detail/'


// Clean up an artist name, make it lower case and remove white spaces
var clean_up_artist = function(s) {
    return s.toLowerCase().replace(/\s/g, '');
}

// Get song detail by song_id
var get_song_detail = function(song_id, callback) {
    $.getJSON(API_SONG_DETAIL, {id: song_id, ids: '[' + song_id + ']'}, function(resp){
        callback && callback(resp.songs[0]);
    })
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'fm_inited') {
        // Save douban fm tab id
        var data = {}
        data[skey_fm_tab_id] = sender.tab.id;
        chrome.storage.local.set(data);
    } else if (request.type === '163_play') {
        song = request.song;

        // Call 163 api to search for songs
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
            success: function(resp) {
                var songs = resp.result.songs;
                var matchs_found = false;
                var best_song_id, first_song_id;
                if (!songs) {
                    chrome.runtime.sendMessage({type: '163_no_music_found', song: song.song});
                    return 
                }
                $.each(songs, function(i, item) {
                    if (!first_song_id) {first_song_id = item.id};
                    $.each(item.artists, function(i, artist_item){
                        if (clean_up_artist(artist_item.name) === clean_up_artist(song.artist)) {
                            best_song_id = item.id;
                            matchs_found = true;
                            return false;
                        }
                    })
                    // Break if artist matchs
                    if (matchs_found) return false;
                });
                if (!matchs_found) {
                    best_song_id = first_song_id;
                }
                // Query for song's mp3Url, then send play event
                get_song_detail(best_song_id, function(song_info){
                    chrome.storage.local.get(skey_fm_tab_id, function(result){
                        tab_id = result[skey_fm_tab_id];
                        chrome.tabs.sendMessage(tab_id, {
                            type: 'fm_play_new_song',
                            song: song_info
                        });
                    });
                });
            }
        });

    } else if (request.type === 'notify') {
        notify(request.title, request.message);
    } else if (request.type === '163_no_music_found') {
        var title = 'FMx163 提示';
        var message = '没有在网易云音乐中找到歌曲"' + request.song + '"，请手动切换到下一首。';
        notify(title, message);
        // Reload fm page, because we can not play next song direct
        chrome.storage.local.get(skey_fm_tab_id, function(result){
            tab_id = result[skey_fm_tab_id];

            //if (tab_id && tab_id !== {}) {
            //    chrome.tabs.get(tab_id, function(tab) {
            //        chrome.tabs.reload(tab.id);
            //    });
            //}
        });
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

