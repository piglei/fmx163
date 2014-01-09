// Author: piglei <piglei2007@gmail.com>
// Date: 2014-01-07
(function(){
    // Embed e_fm.js
    var s = document.createElement('script');
    s.src = chrome.extension.getURL('e_fm.js');
    (document.head||document.documentElement).appendChild(s);
    s.onload = function() {
        s.parentNode.removeChild(s);
    };

    var now_playing;

    var play_new_song = function(song_name){
        if (song_name && (song_name != now_playing)) {
            now_playing = song_name;
            console.log('Now playing: ' + now_playing);

            chrome.runtime.sendMessage({
                type: '163_play',
                song: now_playing
            }, function(response) {
                console.log(response);
            });
        }
    }

    $(function(){
        document.addEventListener('fmx163_song_changed', function(e) {
            play_new_song(e.detail);
        });

        $("#fm-section").append('<div class="fmx163-tip fmx163-volumn-tip">请手动关闭豆瓣FM的音量，不然会出现"二重唱"哦 ↑</div>');
        $("#fm-section").append('<div class="fmx163-tip fmx163-about">"FMx163"使用网易云音乐来同步播放豆瓣FM的所有歌曲，仅供学习交流使用<br>' +
                                 '如需关闭，请在Chrome插件管理页面禁用或卸载"FMx163"插件<br/>' + 
                                 'Github：<a href="https://github.com/piglei/fmx163" target="_blank">https://github.com/piglei/fmx163</a><br/>' +
                                 '作者：<a href="mailto: piglei2007@gmail.com">piglei2007@gmail.com</a></div>');
    })
})()
