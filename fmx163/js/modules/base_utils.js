define(function(){

return {
    // Clean up an string, make it lower case and remove white spaces
    clean_up_string: function(s) {
        result = s.toLowerCase().replace(/[\s'"']|\(.*\)|\[.*\]|\.\.\./g, '');
        return result;
    },
    fuzzy_equal:  function(s1, s2) {
        var self = this;
        s1 = self.clean_up_string(s1);
        s2 = self.clean_up_string(s2);
        if (s1 === s2) return true;
        if (s1.length > 3 && s2.indexOf(s1) !== -1) return true;
        if (s2.length > 3 && s1.indexOf(s2) !== -1) return true;
        return false;
    },
    str_to_bytes: function(str) {
        var bytes = [];
        for (var i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i)); 
        }
        return bytes;
    },
    bytes_to_str: function(bytes) {
        var str = '';
        for (var i = 0; i < bytes.length; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return str;
    }
}

});
