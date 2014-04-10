define(['jquery', 'base_utils', 'lib/cryptojs/md5'], function($, base_utils){

var API_SONG_SEARCH = 'http://music.163.com/api/search/get/web';
var API_SONG_DETAIL = 'http://music.163.com/api/song/detail/';

var SECONDS_JITTER = 5;

return {
    // Thanks WingGao:
    // https://github.com/WingGao/DoubanQQFm/blob/master/MyDoubanFM/NetEase.cs#L115-L129
    encrypt_dfsid: function(dfsid) {
        var dfsid = base_utils.str_to_bytes(String(dfsid));
        var salt = base_utils.str_to_bytes('3go8&$8*3*3h0k(2)2');
        var result = []
        for (var i = 0; i < dfsid.length; i++) {
            result.push(dfsid[i] ^ salt[i % salt.length]);
        }
        result = base_utils.bytes_to_str(result);
        result = CryptoJS.MD5(result).toString(CryptoJS.enc.Base64);
        return result.replace(/\//g, '_').replace(/\+/g, '-');
    },
    get_song_url: function(song) {
        var self = this;
        info = song['hMusic'];
        if (!info) {
            return;
        }
        var dfsid = info['dfsId'];
        var path = self.encrypt_dfsid(dfsid);
        return 'http://m2.music.126.net/' + path + '/' + dfsid + '.' + info['extension'];
    },
    // Query for song detail
    get_song_detail: function(song_ids, callback) {
        $.getJSON(API_SONG_DETAIL, {
            //id: song_id,
            ids: JSON.stringify(song_ids)
        }, function(resp){
            callback && callback(resp.songs);
        }).fail(function() {
            callback && callback(null);
        });
    },
    query: function(song, callback) {
        var self = this;
        var success_callback = function(resp) {
            var songs = resp.result.songs;
            var matchs_found = false;
            var best_song_id, first_song_id;
            var song_ids = [];
            // Check fuzzy album name
            $.each(songs, function(i, item) {
                $.each(item.artists, function(i, artist_item){
                    if (base_utils.fuzzy_equal(artist_item.name, song.artist)) {
                        song_ids.push(item.id);
                        return false;
                    }
                });
            });
            if (song_ids.length === 0) {
                callback && callback(null);
                return 
            }
            // Query for song's mp3Url, then send play event
            self.get_song_detail(song_ids, function(infos){
                var matched_song_info;
                $.each(infos, function(i, song_info) {
                    // Ignore music with now high quality file
                    if (!song_info['bMusic']) return;
                    var len = song_info['bMusic']['playTime'] / 1000;

                    console.log('Checking music length ', song['len'], len);
                    if (Math.abs(len - song['len']) <= SECONDS_JITTER) {
                        matched_song_info = song_info;
                        return false;
                    }
                });

                if (matched_song_info) {
                    // Update mp3Url key with a better one
                    var kbps = 320;
                    var mp3_url = self.get_song_url(matched_song_info);
                    if (!mp3_url) {
                        var kbps = 160;
                        mp3_url = matched_song_info.mp3Url;
                    }

                    callback && callback({
                        'source': '网易云音乐',
                        'name': matched_song_info.name,
                        'album': matched_song_info.album.name,
                        'artist': matched_song_info.artists[0].name,
                        'mp3_url': mp3_url,
                        'kbps': kbps,
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
                success_callback(resp);
                //try {
                //    success_callback(resp);
                //} catch(err) {
                //    callback && callback(null);
                //    return;
                //}
            }
        });
    }
}

});
