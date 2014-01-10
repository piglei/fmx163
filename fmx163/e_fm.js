(function(){
    var _loop = function(){
        var song = (typeof(FM) !== 'undefined') && FM.getCurrentSongInfo();
        if (song) {
            song = {song: song.songName, artist: song.artistName}
            document.dispatchEvent(new CustomEvent('fmx163_song_changed', {
                detail: song,
            }));
        }
    }

    // Start main loop
    setInterval(_loop, 200);
})();


