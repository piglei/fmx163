(function(){
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            // results = regex.exec(top.location.search);
            results = regex.exec(top.location.href);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    $(function(){
        top_location = top.location.href;
        if (top_location.indexOf('autoplay=1') != -1) {
            // $('div.m-info:first a:first')[0].click();
            // Wait for the search result comes out
            var requested_artist = getParameterByName('artist').toLowerCase().replace(/\s/g, '');
            $('.srchsongst span:first').waitUntilExists(function(){
                var played = false;
                $('.srchsongst div.item').each(function(i, item){
                    var artist = $(item).find('div.w1').text().toLowerCase().replace(/\s/g, '');
                    if (artist === requested_artist) {
                        $(this).find('.ply')[0].click();
                        played = true
                        return false;
                    }

                })
                // Play the first one if artist not match
                if (!played) {
                    $('.ply')[0].click();
                }
            });
            // No music found
            $('.n-nmusic').waitUntilExists(function(){
                var search = $('#m-search-input').val();
                chrome.runtime.sendMessage({
                    type: '163_no_music_found',
                    song: search
                });
            });
        }
    });

})();
