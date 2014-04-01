// Handle requests for passwords
var SKEY_FM_TAB_ID = 'doubanfm_tab_id';

var API_SONG_SEARCH = 'http://music.163.com/api/search/get/web';
var API_SONG_DETAIL = 'http://music.163.com/api/song/detail/'

var BAIDU_API_SONG_SEARCH = 'http://music.baidu.com/search';
var BAIDU_API_SONG_DETAIL = 'http://play.baidu.com/data/music/songlink';

var SECONDS_JITTER = 5


// Send message to douban tab
var send_message_to_douban_tab = function(request) {
    chrome.storage.local.get(SKEY_FM_TAB_ID, function(result){
        var tab_id = result[SKEY_FM_TAB_ID];
        chrome.tabs.sendMessage(tab_id, request);
    });
}


// Base functions
var base_utils = {
    // Clean up an string, make it lower case and remove white spaces
    'clean_up_string': function(s) {
        //result = s.toLowerCase().replace(/[\s'"]|\(.*\)|\[.*\]|\.\.\./g, '').replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
        result = s.toLowerCase().replace(/[\s'"']|\(.*\)|\[.*\]|\.\.\./g, '');
        return result;
    },
    'fuzzy_equal':  function(s1, s2) {
        var self = this;
        s1 = self.clean_up_string(s1);
        s2 = self.clean_up_string(s2);
        if (s1 === s2) return true;
        if (s1.length > 3 && s2.indexOf(s1) !== -1) return true;
        if (s2.length > 3 && s1.indexOf(s2) !== -1) return true;
        return false;
    }
}


var controller_163 = {
    // Query for song detail
    'get_song_detail': function(song_ids, callback) {
        $.getJSON(API_SONG_DETAIL, {
            //id: song_id,
            ids: JSON.stringify(song_ids)
        }, function(resp){
            callback && callback(resp.songs);
        }).fail(function() {
            callback && callback(null);
        });
    },
    'query': function(song, callback) {
        var self = this;
        var success_callback = function(resp) {
            var songs = resp.result.songs;
            var matchs_found = false;
            var best_song_id, first_song_id;
            var song_ids = [];
            // Check fuzzy album name
            $.each(songs, function(i, item) {
                if (base_utils.fuzzy_equal(item.album.name, song.album)) {
                    song_ids.push(item.id);
                }
            });
            if (song_ids.length === 0) {
                callback && callback(null);
                return 
            }
            // Query for song's mp3Url, then send play event
            self.get_song_detail(song_ids, function(infos){
                var matched_song_info;
                $.each(infos, function(i, song_info) {
                    var len = song_info['mMusic']['playTime'] / 1000;

                    console.log('Checking music length ', song['len'], len);
                    if (Math.abs(len - song['len']) <= SECONDS_JITTER) {
                        matched_song_info = song_info;
                        return false;
                    }
                });

                if (matched_song_info) {
                    callback && callback({
                        'source': '网易云音乐',
                        'name': matched_song_info.name,
                        'album': matched_song_info.album.name,
                        'artist': matched_song_info.artists[0].name,
                        'mp3_url': matched_song_info.mp3Url,
                        'website': 'http://music.163.com/#/song?id=' + matched_song_info.id
                    });
                } else {
                    callback && callback(null);
                }
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
                callback && callback(null);
                return;
            },
            success: function(resp) {
                try {
                    success_callback(resp);
                } catch(err) {
                    callback && callback(null);
                    return;
                }
            }
        });
    }
}

var controller_baidu = {
    'get_song_detail': function(song_ids, callback) {
        $.ajax({
            type: 'POST',
            url: BAIDU_API_SONG_DETAIL,
            data: {
                'songIds': song_ids.join(','),
                'hq': 1,
                'type': 'm4a,mp3',
                'rate': '',
                'pt': 0,
                'flag': -1,
                's2p': -1,
                'prerate': -1,
                'bwt': -1,
                'dur': -1,
                'bat': -1,
                'bp': -1,
                'pos': -1,
                'auto': -1
            }, 
            dataType: 'json',
            error: function(){
                callback && callback(null);
            },
            success: function(resp) {
                var result = resp.data.songList;
                callback && callback(result);
            }
        });
    },
    'query': function(song, callback) {
        var self = this;
        var success_callback = function(resp){
            var resp = $(resp);
            var best_song_id;
            var song_ids = [];
            resp.find('li[data-songitem]').each(function(i, elem){
                if ($(elem).find('span.icon-thirdparty').length > 0) {
                    return;
                }
                // No need to check here, we will check music length later
                //
                //var song_name = $.trim($(elem).find('span.song-title').text());
                //var artist = $.trim($(elem).find('span.singer').text());
                //var album = $.trim($(elem).find('span.album-title').text());
                //album = album.slice(1, -1)
                //console.log(song_name, song.song, base_utils.fuzzy_equal(song_name, song.song));
                //console.log(artist, song.artist, base_utils.fuzzy_equal(artist, song.artist));
                //console.log(album, song.album, base_utils.fuzzy_equal(album, song.album));

                var song_item = $(elem).data('songitem');
                song_ids.push(song_item.songItem.sid);

            });
            if (song_ids.length === 0) {
                callback && callback(null);
                return;
            }

            // Query get song detail API
            self.get_song_detail(song_ids, function(infos){
                if (!infos || infos.length === 0) {
                    callback && callback(null);
                    return
                }
                var mp3_url, max_rate;
                var matched_song_info;
                $.each(infos, function(i, song_info) {
                    $.each(song_info.linkinfo, function(i, item) {
                        i = parseInt(i);
                        // Rate greater than 320 sucks!
                        if (i <= 320 && (!max_rate || i > max_rate )) {
                            max_rate = i;
                            len = item['time'];
                        }
                    });
                    console.log('Checking music length ', song['len'], len);
                    if (max_rate >= 320 && Math.abs(len - song['len']) <= SECONDS_JITTER) {
                        mp3_url = song_info.linkinfo[max_rate]['songLink'];
                        matched_song_info = song_info;
                        return false;
                    }
                });

                if (matched_song_info) {
                    callback && callback({
                        'source': '百度音乐',
                        'name': matched_song_info.songName,
                        'album': matched_song_info.albumName,
                        'artist': matched_song_info.artistName,
                        'mp3_url': mp3_url,
                        'website': 'http://music.baidu.com/song/' + matched_song_info.songId
                    });
                } else {
                    callback && callback(null);
                }
            });
        }
        
        // Use song name and artist as search key
        var key = song.song + ' ' + song.artist;
        $.ajax({
            type: 'GET',
            url: BAIDU_API_SONG_SEARCH,
            data: {
                key: key
            },
            dataType: 'html',
            error: function(){
                callback && callback(null);
            },
            success: function(resp) {
                try {
                    success_callback(resp);
                } catch(err) {
                    callback && callback(null);
                }
            }
        });
    }
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
    config_utils.load_config(function(config){
        ENABLED_SOURCES = config.sources;
        ENABLED_SOURCES.push('douban');
    });
}


config_utils.load_config(function(config){
    ENABLED_SOURCES = config.sources;
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

