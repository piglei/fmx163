(function(){
    var old_is_paused;
    var _loop = function(){
        var song = (typeof(FM) !== 'undefined') && FM.getCurrentSongInfo();
        if (song) {
            song = {song: song.songName, artist: song.artistName}
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
    }

    // Start main loop
    setInterval(_loop, 200);
})();


