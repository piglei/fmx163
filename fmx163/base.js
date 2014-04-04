var SKEY_CONFIG = 'fmx163_config_v2';
var DEFAULT_CONFIG = {
    'sources': ['163', 'baidu'],
    'enabled': true,
    'volumn_tip_dismissed': false
};

var config_utils = {
    'load_config': function(callback){
        chrome.storage.local.get(SKEY_CONFIG, function(result){
            result = result[SKEY_CONFIG];
            if (!result) {
                var data = {}
                data[SKEY_CONFIG] = JSON.stringify(DEFAULT_CONFIG);
                chrome.storage.local.set(data);
                result = DEFAULT_CONFIG;
            } else {
                result = JSON.parse(result);
            }
            callback(result);
        });
    },
    'save_config': function(config) {
        var data = {}
        data[SKEY_CONFIG] = JSON.stringify(config);
        chrome.storage.local.set(data);
    },
    'update': function(config) {
        var self = this;
        self.load_config(function(result){
            result = $.extend(result, config);
            self.save_config(result);
        });
    },
}
