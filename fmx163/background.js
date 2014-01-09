// Handle requests for passwords
var url_song_search = 'http://music.163.com/#/search/m/?type=1&autoplay=1';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === '163_play') {
        var url = url_song_search + '&s=' + request.song;
        console.log(chrome.extension.getURL('dialog.html'));
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
    }, 3000);
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


