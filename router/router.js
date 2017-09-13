(function() {
    window.Router = function() {
        var self = this;
        self.hashList = {}; /* 路由表 */
        self.index = null;
        self.key = '/';
        window.onhashchange = function() {
            self.reload();
        };       
    }; 
    /**
     * 添加路由,如果路由已经存在则会覆盖
     * @param addr: 地址
     * @param callback: 回调函数，调用回调函数的时候同时也会传入相应参数
     */
    Router.prototype.add = function(addr, callback) {
        var self = this;
        self.hashList[addr] = callback;
    };
    /**
     * 删除路由
     * @param addr: 地址
     */
    Router.prototype.remove = function(addr) {
        var self = this;
        delete self.hashList[addr];
    };
    /**
     * 设置主页地址
     * @param index: 主页地址
     */
    Router.prototype.setIndex = function(index) {
        var self = this;
        self.index = index;
    };
    /**
     * 跳转到指定地址
     * @param addr: 地址值
     */
    Router.prototype.go = function(addr) {
        var self = this;
        window.location.hash = '#' + self.key + addr;
    }; 
    /**
     * 重载页面
     */
    Router.prototype.reload = function() {
        var self = this;
       	//debugger;
        var hash = window.location.hash.replace('#' + self.key, '');
        var addr = hash.split('/')[0];
        var cb = getCb(addr, self.hashList);
        if(cb != false) {
            var arr = hash.split('/');
            arr.shift();
            cb.apply(self, arr);            
        } else {
            self.index && self.go(self.index);
        }
    };
    /**
     * 开始路由，实际上只是为了当直接访问路由路由地址的时候能够及时调用回调
     */
    Router.prototype.start = function() {
        var self = this;
        self.reload();
    }
    /**
     * 获取callback
     * @return false or callback
     */
    function getCb(addr, hashList) {
        for(var key in hashList) {
            if(key == addr) {
                return hashList[key]
            }
        }
        return false;
    }
})();

/*
 * selector css 选择器
 * url 请求地址
 * async 是否异步  
 * 前三项为必填
 * clear 是否清除
 * func 回掉函数
 */
function loadHtml(selector, url, async, clear, callback){
    var El = $(selector);
    if(!El,length){ return false; }
    var _clear = false;
    var _callback = callback;
    if(jQuery.isFunction(clear)){
        _callback = clear;
    }else if(typeof(clear) == "boolean"){
        _clear = clear;
    }else{
        _clear = true;
    }   
    // 请求数据
    jQuery.ajax({
        url: url,
        type: "GET",
        dataType: "html",
        contentType: "application/json;charset=utf-8", 
        async: async
    }).done(function(responseText){
        El.one("DOMNodeInserted", function(){
            var loading = El.find(".loading-gif");
            loading.is(':visible') && loading.hide();
        });
        _clear && El.find('.loading-gif').prevAll().remove();
        El.find(".loading-gif").show();
        if( jQuery.isFunction(_callback) ){
            func(responseText);
        }else{                          
            setTimeout(function(){                          
                $(responseText).insertBefore(selector +' .loading-gif');
            },300);                     
        }                   
    }).error(function(){
        console.log(url+"---加载失败");
    });         
}
// 导航栏跳转规则
function navChange(){   
    var hash = window.location.hash.replace('#/', '').split('?')[0] || 'index';
    $('#nav ul li > a[href^="#/"]').removeClass('active');
    $('a[href="#/'+ hash +'"]').addClass('active');             
    var href = {};
    var activeNav = window.location.hash.replace('#/', '').split('?')[0] || 'index';
    href.activeNav = activeNav;             
    href.href = window.location.href;
    href.pathname = window.location.pathname;
    href.hash = window.location.hash;
    href.search = window.location.search;               
    console.log("window.location.---");
    console.log(href);
    console.log("end.---");
}

window.onload = function() {
    // 初始化页面路由
    var router = new Router();
    router.add('index', function() {
        loadHtml("#bd", "html/flexslider.html", true, true);
        loadHtml("#bd", "html/main.html", true, false);
        navChange();
    });
    router.add('about', function() {
        loadHtml("#bd", "html/about.html", true, true);
        navChange();
    });
    router.add('about?target=about', function(){
        loadHtml("#bd", "html/about.html", true, true);
        navChange();
    });         
    var hash = window.location.hash.replace('#/', '').split('?')[0] || 'index';
    if(hash == 'index') { 
        router.setIndex( hash ); 
    }               
    router.start();
    // 初始化结束                
};
var hash = window.location.hash.replace('#/', '').split('?')[0] || 'index';
if(hash != 'index') {
    $('a[href^="#/"]').not('a[href="#/index"]').attr('target', '_self');
}