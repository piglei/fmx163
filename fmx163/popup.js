(function(){
    var current_config;
    config_utils.load_config(function(config){
        $.each(config.sources, function(i, item){
            $('input[value="' + item + '"]').attr('checked', 'true');
        });
        if (config.enabled) {
            $('select[name="enabled"]').val('on');
        } else {
            $('select[name="enabled"]').val('off');
        }
        current_config = config;
    });

    // Bind change event to save config
    $('input[name="source"]').bind('change', function(){
        var sources = [];
        $('input[name="source"]:checked').each(function(i, elem){
            sources.push($(elem).val());
        });
        current_config['sources'] = sources;
        config_utils.save_config(current_config);
    });
    $('select[name="enabled"]').bind('change', function(){
        var enabled = true;
        if ($('select[name="enabled"]').val() === 'off') enabled = false;
        current_config['enabled'] = enabled;
        config_utils.save_config(current_config);
    });
})(); 

