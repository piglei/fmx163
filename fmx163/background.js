// Handle requests for passwords
var url_song_search = 'http://music.163.com/#/search/m/?type=1&autoplay=1';
var skey_fm_tab_id = 'doubanfm_tab_id';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'fm_inited') {
        // Save douban fm tab id
        var data = {}
        data[skey_fm_tab_id] = sender.tab.id;
        chrome.storage.local.set(data);
    } else if (request.type === '163_play') {
        song = request.song;
        var url = url_song_search + '&s=' + encodeURIComponent(song.song) + 
                  '&artist=' + encodeURIComponent(song.artist);
        // Open a new tab for the first time
        chrome.storage.local.get('163_tab_id', function(tab_id){
            tab_id = tab_id['163_tab_id'];

            if (!tab_id || tab_id === {}) {
                crete_new_tab(url);
            } else {
                chrome.tabs.get(tab_id, function(tab) {
                    // check if tab does not exists
                    if (typeof tab == 'undefined') {
                        crete_new_tab(url);
                    } else {
                        chrome.tabs.update(tab_id, {url: url}, function(tab) {
                            chrome.tabs.reload(tab.id);
                        });
                    }
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


