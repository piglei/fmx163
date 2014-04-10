(function(){
    var old_is_paused;
    var current_song, current_song_old;

    var _loop = function(){
        //var song = (typeof(FM) !== 'undefined') && FM.getCurrentSongInfo();
        //if (song) {
        //    song = {song: song.songName, artist: song.artistName}
        //    document.dispatchEvent(new CustomEvent('fmx163_song_changed', {
        //        detail: song,
        //    }));
        //}
        if (current_song && (current_song != current_song_old)) {
            song = {
                song: current_song.title, 
                artist: current_song.artist,
                album: current_song.albumtitle,
                url: current_song.url,
                len: current_song.len
            }
            current_song_old = current_song;

            document.dispatchEvent(new CustomEvent('fmx163_song_changed', {
                detail: song,
            }));
        }

        // Get is_paused
        try {
            var is_paused = window.DBR.is_paused();
        } catch(err) {
            var is_paused = false;
        }
        if (old_is_paused !== true) {
            var event_name = is_paused?'fmx163_player_pause':'fmx163_player_play';
            document.dispatchEvent(new CustomEvent(event_name));
        }
        old_is_paused = is_paused;

        // **Hack** setCurrentSongInfo function
        if (typeof window.extStatusHandler !== 'undefined') {
            window.__extStatusHandler = window.extStatusHandler;
            window.extStatusHandler = function(t) {
                t = $.parseJSON(t);
                if (typeof t.song !== 'undefined') {
                    current_song = t.song;
                }
                return window.__extStatusHandler(t);
            }
        }
    }

    // Start main loop
    setInterval(_loop, 200);
})();


// Customized config for jiathis
var jiathis_config = {
    url: "https://chrome.google.com/webstore/detail/%E9%AB%98%E5%93%81%E8%B4%A8%E8%B1%86%E7%93%A3fm/pdgnopcbjjdkdeaimdbncphhcgjaaifi",
    title: "#插件分享：高品质豆瓣FM#",
    summary:"给大家推荐一个好用的Chrome插件，可以轻松享受320k豆瓣FM，一个字，赞。"
}
