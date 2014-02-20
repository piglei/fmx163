// Author: piglei <piglei2007@gmail.com>
// Date: 2014-01-07

(function(){
    var current_song;
    var icon_default_url = chrome.extension.getURL('icons/icon32.png');
    var icon_douban_url = chrome.extension.getURL('icons/icon_douban.ico');


    // Play mp3 by url
    var play_mp3 = function(url) {
        $('#fmx163-player-audio').attr('src', url);
        var audio = $('#fmx163-player-audio')[0]
        audio.loop = false;
        audio.play();
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === 'fm_play_new_song') {
            var song = request.song;
            console.log('Playing mp3 from external: ' + song.mp3Url);
            play_mp3(song.mp3Url)
            $('#player-info').attr('title', '* 正在播放: ' + song.artists[0].name +
                '<' + song.album.name + '> - ' + song.name);
            $('#fmx163-player-icon img').attr('src', icon_default_url);
        }
        else if (request.type === 'fm_play_raw_mp3') {
            // Play low quality douban's mp3 file
            if (current_song) {
                console.log('Playing mp3 from douban: ' + current_song.url);
                play_mp3(current_song.url);
                $('#player-info').attr('title', '正在播放豆瓣源');
                $('#fmx163-player-icon img').attr('src', icon_douban_url);
            }
        }
    });

    // Embed e_fm.js
    var s = document.createElement('script');
    s.src = chrome.extension.getURL('e_fm.js');
    (document.head||document.documentElement).appendChild(s);
    s.onload = function() {
        s.parentNode.removeChild(s);
    };

    var now_playing;

    var play_new_song = function(song){
        current_song = song;
        song_name = song.song;
        if (song_name && (song_name != now_playing)) {
            now_playing = song_name;
            console.log('Now playing: ' + now_playing);

            chrome.runtime.sendMessage({
                type: '163_play',
                song: song
            }, function(response) {
                console.log(response);
            });
        }
    }

    $(function(){
        // Send init message
        chrome.runtime.sendMessage({type: 'fm_inited'});

        document.addEventListener('fmx163_song_changed', function(e) {
            play_new_song(e.detail);
        });
        document.addEventListener('fmx163_player_play', function(e) {
            $('#fmx163-player').css('opacity', '1');
            $('#fmx163-player-audio')[0].play();
        });
        document.addEventListener('fmx163_player_pause', function(e) {
            $('#fmx163-player').css('opacity', '0.2');
            $('#fmx163-player-audio')[0].pause();
        });

        $("#fm-section").append('<div class="fmx163-tip fmx163-volumn-tip">请手动<strong>慢慢关闭豆瓣FM的音量</strong>，不然会出现"二重唱"哦 ' + 
                                '<a href="javascript:">我知道了</a>' +
                                '<div class="arrow-up"></div></div>');
        $("#fm-section").append('<div class="fmx163-tip fmx163-about">本插件仅供学习交流使用<br>' +
                                 '如需关闭，请在Chrome插件管理页面禁用或卸载本插件<br/>' + 
                                 '<a href="http://me.alipay.com/piglei" target="_blank">请作者喝杯咖啡</a> ' +
                                 '| <a href="http://www.zlovezl.cn/articles/fmx163-released/" target="_blank">联系作者</a></div>');
        $("#fm-section").append('<div id="fmx163-player">' + 
                                '<audio id="fmx163-player-audio" type="audio/mpeg" controls></audio> ' + 
                                '<div id="fmx163-player-icon"><a href="javascript:void(0)" style="background: transparent" id="player-info">' +
                                '<img src="' + icon_default_url + '" /></a>' + 
                                '</div></div>');

        // Blink once and bind click function
        setTimeout(function(){
            $('.fmx163-volumn-tip').fadeOut(1000, function(){$(this).fadeIn()});
        }, 2000);
        $('.fmx163-volumn-tip a').bind('click', function(){$(this).parent().remove()});
    })
})()
