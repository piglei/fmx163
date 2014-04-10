define(['jquery', 'base_utils'], function($, base_utils){

var BAIDU_API_SONG_SEARCH = 'http://music.baidu.com/search';
var BAIDU_API_SONG_DETAIL = 'http://play.baidu.com/data/music/songlink';

var SECONDS_JITTER = 5;

return {
    get_song_detail: function(song_ids, callback) {
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
    query: function(song, callback) {
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
                        'kbps': 320,
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
                success_callback(resp);
                //try {
                //    success_callback(resp);
                //} catch(err) {
                //    callback && callback(null);
                //}
            }
        });
    }
}

});
