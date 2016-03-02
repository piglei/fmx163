require(['config', 'jquery', 'controllers/163', 'controllers/baidu'],
function( config,   $,        controller_163,    controller_baidu){

var SKEY_FM_TAB_ID = 'doubanfm_tab_id';


// Send message to douban tab
var send_message_to_douban_tab = function(request) {
    chrome.storage.local.get(SKEY_FM_TAB_ID, function(result){
        var tab_id = result[SKEY_FM_TAB_ID];
        chrome.tabs.sendMessage(tab_id, request);
    });
}


var listen_events = function(){
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === 'fm_inited') {
            // Save douban fm tab id
            var data = {}
            data[SKEY_FM_TAB_ID] = sender.tab.id;
            chrome.storage.local.set(data);
            // Refresh extension config file
            refresh_config();
        } else if (request.type === 'play_new_song') {
            var song = request.song;
            var _do_play = function(index) {
                var current_source = ENABLED_SOURCES[index];
                if (current_source === 'douban') {
                    send_message_to_douban_tab({type: 'fm_play_raw_mp3'});
                    return
                }
                var controller = SOURCE_CONTROLLERS[current_source];
                controller && controller.query(song, function(result) {
                    if (result) {
                        send_message_to_douban_tab({type: 'fm_play_new_song', song: result});
                    } else {
                        return _do_play(index + 1);
                    }
                });
            };
            _do_play(0);
        }
    });
};


var ENABLED_SOURCES;
var SOURCE_CONTROLLERS = {
    'baidu': controller_baidu,
    '163': controller_163
};


var refresh_config = function() {
    config.load_config(function(current_config){
        ENABLED_SOURCES = current_config.sources;
        ENABLED_SOURCES.push('douban');
    });
}


config.load_config(function(current_config){
    ENABLED_SOURCES = current_config.sources;
    ENABLED_SOURCES.push('douban');
    listen_events();
});


// Spoot `Referrer` header for request to 163 and baidu
var sites_need_spoot_referrer = [
    {
        'referrer': 'http://music.163.com/',
        'urls': ["*://*.music.126.net/*", "http://music.163.com/*"]
    },
    {
        'referrer': 'http://music.baidu.com/',
        'urls': ["*://music.baidu.com/*", "*://yinyueshiting.baidu.com/*", "*://119.75.215.114/*"]
    },
    {
        'referrer': 'http://play.baidu.com/',
        'urls': ["*://play.baidu.com/*"]
    }
]

$.each(sites_need_spoot_referrer, function(i, obj){
    chrome.webRequest.onBeforeSendHeaders.addListener(
        function(details) {
            var referrer_header_found = false;
            for (var i = 0; i < details.requestHeaders.length; ++i) {
                if (details.requestHeaders[i].name === 'Referer') {
                    details.requestHeaders[i].value = obj.referrer;
                    referrer_header_found = true;
                    break;
                }
            }
            if (!referrer_header_found) {
                details.requestHeaders.push({'name': 'Referer', 'value': obj.referrer})
            }
            return {requestHeaders: details.requestHeaders};
        },
        {urls: obj.urls},
        ["blocking", "requestHeaders"]
    );
});


// Modify CSP header for douban.fm
chrome.webRequest.onHeadersReceived.addListener(function(details) {
        $.each(details.responseHeaders, function(i, header){
            if (header.name.toLowerCase()=== 'content-security-policy') {
                header.value += ' *.126.net *.163.com 119.75.215.114';
            }
        });
        return { // Return the new HTTP header
            responseHeaders: details.responseHeaders
        };
    }, 
    {urls: ["*://douban.fm/"]}, 
    ["blocking", "responseHeaders"]
);

});
