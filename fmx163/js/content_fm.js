require(['config', 'jquery'],
function( config,   $){

    var current_song;
    var icon_default_url = chrome.extension.getURL('icons/icon32.png');
    var icon_douban_url = chrome.extension.getURL('icons/icon_douban.ico');
    var icon_github = chrome.extension.getURL('icons/github_favicon.ico');
    var music_source = '163';
    var current_config;

    // Check if extension has been disabled
    config.load_config(function(result){
        current_config = result;
        if (result.enabled) {
            init();
        }
    });

    // Play mp3 by url
    var play_mp3 = function(url) {
        $('#download_mp3_file').data('href', url);

        $('#fmx163-player-audio').attr('src', url);
        var audio = $('#fmx163-player-audio')[0]
        audio.play();
    }

    // Play douban
    var play_douban_music = function() {
        if (current_song) {
            console.log('Playing mp3 from douban: ' + current_song.url);
            play_mp3(current_song.url);
            $('#player-info').attr('title', '正在播放豆瓣源');
            $('#fmx163-player-info-icon img').attr('src', icon_douban_url);
            $('#fmx163-player-info-icon a').attr('href', 'javascript:void(0)');
        }
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === 'fm_play_new_song') {
            var song = request.song;
            console.log('Playing mp3 from external: ' + song.mp3_url);
            play_mp3(song.mp3_url)
            $('#player-info').attr('title', '* 正在播放' + song.source + '源: ' + song.artist +
                '<' + song.album + '> - ' + song.name + '(' + song.kbps + 'kbps)');
            $('#fmx163-player-info-icon img').attr('src', icon_default_url);
            $('#fmx163-player-info-icon a').attr('href', song.website);
        }
        else if (request.type === 'fm_play_raw_mp3') {
            // Play low quality douban's mp3 file
            play_douban_music();
        }
    });

    // Embed e_fm.js
    var s = document.createElement('script');
    s.src = chrome.extension.getURL('js/embedded_fm.js');
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
                type: 'play_new_song',
                source: music_source,
                song: song
            }, function(response) {
                console.log(response);
            });
        }
    }


    // Init function of extension
    var init = function() {
        $(function(){
            // Send init message
            chrome.runtime.sendMessage({type: 'fm_inited'});

            document.addEventListener('fmx163_song_changed', function(e) {
                play_new_song(e.detail);
            });
            document.addEventListener('fmx163_player_play', function(e) {
                $('#fmx163-player,#fmx163-player-info').css('opacity', '1');
                $('#fmx163-player-audio')[0].play();
            });
            document.addEventListener('fmx163_player_pause', function(e) {
                $('#fmx163-player,#fmx163-player-info').css('opacity', '0.2');
                $('#fmx163-player-audio')[0].pause();
            });

            // Check config
            if (current_config.volumn_tip_dismissed) {
                $("#fm-section").append('<div class="fmx163-tip fmx163-volumn-tip">请手动<strong>慢慢关闭豆瓣FM的音量</strong>，不然会出现"二重唱"哦' + 
                                        '<div style="text-align: center"><a href="javascript:void(0)">我知道了</a> | ' + 
                                        '<a href="javascript:void(0)" id="dismiss_tip">不再提醒</a></div>' +
                                        '<div class="arrow-up"></div></div>');
            }

            $("#fm-section").append('<div class="fmx163-tip fmx163-about">本插件仅供学习交流使用' + 
                                     '<div class="div-fork"><a href="https://github.com/piglei/fmx163" target="_blank">Fork me on <img src="' + icon_github + '" /></a></div><br>' +
                                     '如果在播放过程频繁遇到卡顿问题，请点击地址栏右侧的插件图标尝试修改配置<br/>' + 
                                     '<a href="http://me.alipay.com/piglei" target="_blank">请作者喝杯咖啡</a> ' +
                                     '| <a href="http://www.zlovezl.cn/articles/fmx163-released/" target="_blank">联系作者</a>' + 
                                     '<div class="wrapper-jiathis"><div style="float: left; margin-right: 8px;">分享插件: </div><div class="jiathis_style"><a class="jiathis_button_qzone"></a> <a class="jiathis_button_tsina"></a> <a class="jiathis_button_tqq"></a> <a class="jiathis_button_weixin"></a> <a class="jiathis_button_renren"></a> <a class="jiathis_button_xiaoyou"></a> <a href="http://www.jiathis.com/share" class="jiathis jiathis_txt jtico jtico_jiathis" target="_blank"></a> <a class="jiathis_counter_style"></a> </div></div>' + 
                                     '<script type="text/javascript" src="http://v3.jiathis.com/code/jia.js?uid=1375626758367242" charset="utf-8"></script>' + 
                                     '</div>');

            $("#fm-section").append('<div id="fmx163-player">' + 
                                    '<audio id="fmx163-player-audio" type="audio/mpeg" controls></audio></div>' + 
                                    '<div id="fmx163-player-info">' +
                                        '<div id="fmx163-player-info-icon"><a target="_blank" href="javascript:void(0)" style="background: transparent" id="player-info">' +
                                        '<img src="' + icon_default_url + '" /></a></div> ' + 
                                        '<div id="fmx163-player-info-actions"><a href="javascript:void(0)" id="download_mp3_file">下载歌曲</a></div></div>' + 
                                    '<div id="fmx163-player-blocker"></div>');

            // Disable auto loop feature
            var elem_audio = $('#fmx163-player-audio')[0];
            elem_audio.addEventListener('ended', function(){
                this.src = '';
            }, false);
            elem_audio.addEventListener('error', function(){
                console.log('Error occurred when loading external source, play douban instead.');
                play_douban_music();
            }, false);

            $('#download_mp3_file').bind('click', function(){
                var href = $(this).data('href');
                if (href) {
                    alert('- 正在播放歌曲时文件不能正常下载，请在未播放时打开或者使用其他下载工具\n\n音乐文件地址:\n' + href);
                }
            });

            // Blink once and bind click function
            setTimeout(function(){
                $('.fmx163-volumn-tip').fadeOut(1000, function(){$(this).fadeIn()});
            }, 2000);
            $('.fmx163-volumn-tip a').bind('click', function(){$('.fmx163-volumn-tip').remove()});
            $('.fmx163-volumn-tip #dismiss_tip').bind('click', function(){
                $('.fmx163-volumn-tip').remove();
                config.update({'volumn_tip_dismissed': true});
            });
        });
    }

}); 
