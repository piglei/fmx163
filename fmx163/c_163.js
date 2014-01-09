(function(){
    $(function(){
        top_location = top.location.href;
        if (top_location.indexOf('autoplay=1') != -1) {
            // $('div.m-info:first a:first')[0].click();
            // Wait for the search result comes out
            $('.srchsongst span:first').waitUntilExists(function(){
                $('span.ply')[0].click();
            });
            $('.n-nmusic').waitUntilExists(function(){
                var search = $('#m-search-input').val();
                chrome.runtime.sendMessage({
                    type: 'notify',
                    title: 'FMx163 提示',
                    message: '没有在网易云音乐中找到歌曲"' + search + '"'
                });
            });
        }
    });

})();
