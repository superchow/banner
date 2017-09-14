/*
 * author: superchow
 * date: 2017-9-5
 */
(function(window, document, $) {
    
    var _prefix = (function(temp) { //获取浏览器前缀，考虑浏览器的兼容性
        var arr = ["webkit", "Moz", "o", "ms"]
        props = ""
        for (var i in arr) {
            props = arr[i] + "Transition"
            if (temp.style[props] !== undefined) {
                return "-" + arr[i].toLowerCase() + "-";
            }
        }       
        return false;
    })(document.createElement(PageSwitch));

    var PageSwitch = function (element, options) {       
        this.element = element;
        this.defaults = {
	        selectors: { //可以修改页面上的各块的class名
	            sections: ".sections",
	            section: ".section",
	            page: ".pages",
	            btns: ".btnControl",
	            active: ".active"
	        },
	        index: 3, //分页起始页码
	        easing: "ease", //分页动画的曲线 cubic-bezier(0.5, 0.5, 1.0, 1.0)
	        duration: 700, // 分页动画时间
	        delay: 700, // 延迟切换时间
	        loop: false, // 代表页面是否可以循环播放
	        pagination: true, //代表页面是否分页
	        controlStyle: "button", // 是否显示控制器以及样式 ,默认样式："defult" || 按钮样式 ："button" || 全部显示："both"
	        mousewheel: true, //是否触发滚轮
	        keyboard: true, //是否能触发键盘事件,
	        resize: true,
	        direction: "vertical", //分页的方向，默认竖屏 "vertical"，横屏：“horizontal”
	        movement: "", // 当前的移动方向  prev && next && stop
	        callback: "" //翻页完成后的回调函数
	    }
        this.settings = $.extend(true, this.defaults, options || {});
        this.init(); //初始化插件
        
        return PageSwitch; //返回PageSwitch对象，重要！！！   
    };
      
	PageSwitch.prototype = { //定义插件共有方法
        //初始化的方法
        // 实现初始化dom结构，布局，分页及绑定事件
        init: function() {
            var me = this;
            me.selectors = me.settings.selectors;
            me.sections = me.element.children(me.selectors.sections)
            me.section = me.sections.children(me.selectors.section);
			me.sections.addClass( me.settings.direction );
			
            me.canScroll = true; // 是否可以滚动
			me.unlocking = null; // 是否正在开启滚动 定时任务
			
            me.direction = me.settings.direction == "vertical" ? true : false;
            me.pagesCount = me.pagesCount();
            me.index = (me.settings.index >= 0 && me.settings.index < me.pagesCount) ? me.settings.index : 0;
			
            if (!me.direction) {
                me._initLayout()
            }

            if (me.settings.pagination) {
                me._initPaging()
            }
            
			if (me.settings.callback && $.type(me.settings.callback) == "function") {
                me.settings.callback(me.element[0], me.index);//进入就执行一次回调
            }
            me._initEvent();
        },
        //获取滑动页面的数量
        pagesCount: function() {
            return this.section.length;
        },
        //获取滑动的宽度（横屏）或高度（竖屏）
        SwitchLength: function() {
            return this.direction ? this.element.height() : this.element.width();
        },
        /*fixIndex: function(){
        	var me = this,
        		currentIndex = me.sections.children(me.settings.selectors.section).index(me.settings.selectors.active);
            if(currentIndex != -1 && ( me.index != currentIndex )){
            	me.index = currentIndex;
            }
            console.log(me.sections.children(me.settings.selectors.section));
            
            console.log(currentIndex);
            return me.index;
        },*/
        //向前滑动,上一页 
        prev: function() {
            var me = this;
//          me.fixIndex();
            if (me.index > 0) {
                me.index--;
            } else if (me.settings.loop) {
                me.index = me.pagesCount - 1;
            }
            me.movement = 'prev';
            me._scrollPage();
        },
        //向后滑动，向后一页
        next: function() {
            var me = this;
//          me.fixIndex();
            if (me.index < me.pagesCount - 1) {
                me.index++;
            } else if (me.settings.loop) {
                me.index = 0;
            }
            me.movement = 'next';
            me._scrollPage();
        },
        // 开启滑动 定时开启
        unLock: function() {
        	var me = this;
        	if( !me.canScroll && !me.unlocking){
        		me.unlocking = setTimeout(function(){
                	me.canScroll = true;
                	me.unlocking = null;
                }, me.settings.delay || 800);
        	} else if( me.canScroll && me.unlocking){
        		me.unlocking = null;
        	} else{
        		
        	}
        },
        // 强行开启
        forceUnLock: function() {
        	var me = this;
        	me.unlocking = null; // 清理定时任务
			!me.canScroll && ( me.canScroll = true );
        },
		// 关闭滚动
		lock: function() {
			var me = this;
			me.unlocking = null; // 清理定时任务
			me.canScroll && ( me.canScroll = false );
		},
        //主要针对横屏情况进行页面布局
        _initLayout: function() {
            var me = this; //this指向pageSwitch对象
            var wid = me.SwitchLength();            
            var width = me.pagesCount * 100 + "%",
                cellWidth = wid;               
            me.sections.width(width);
            me.section.width(cellWidth).css("float", "left");
        },
        //实现分页的dom结构及css样式
        _initPaging: function() {
            var me = this,
                pageClass = me.selectors.page.substring(1),
                btnsClass = me.selectors.btns.substring(1);
            me.element.css("position", "relative");
            me.activeClass = me.selectors.active.substring(1);
            me.section.eq(me.index).addClass(me.activeClass);
            var creatUl = function(){
            	if( me.pagesCount <= 1 || (me.pageItem && me.pageItem.length) ){ return false; }
            	var pageHtml = "<ul class='" + pageClass + " " + ( me.direction ? "vertical" : "horizontal" ) + "'>";
                for (var i = 0; i < me.pagesCount; i++) {
                    pageHtml += "<li></li>"
                }
                pageHtml += "</ul>";
                me.element.append(pageHtml);
                me.pageItem = me.element.children("ul" + me.selectors.page).find("li");
                me.pageItem.eq(me.index).addClass(me.activeClass);               
            }
            var creatBtn = function(){
            	if( me.pagesCount <= 1 || ( me.btns && me.btns.length ) ){ return false; }
            	var btnControl = "<div class='"+ btnsClass +"'>"
                			    + 	"<div class='btn-left'>"
                			    +    	"<a data-click='left' class='iconfont icon-arrowleft' href='javascript:void(0);'></a>"
                			    + 	"</div>"
                	 			+ 	"<div class='btn-right'>"
                	 			+    	"<a data-click='right' class='iconfont icon-arrowright' href='javascript:void(0);'></a>"
                	 			+ 	"</div>"
                	 			+ "</div>"; // 需要fontClass支持
                me.element.append(btnControl);   
                
                var btnC = me.element.children( me.selectors.btns );
                me.btns = btnC.find("div > a[data-click]");
                if (me.direction) {
                    btnC.addClass("vertical");                    
                } else {
                    btnC.addClass("horizontal");                   
                }
            }
            
            if(me.settings.controlStyle == "button"){
            	creatBtn && creatBtn();
            }else if(me.settings.controlStyle == "both"){
            	creatBtn && creatBtn();
            	creatUl && creatUl();
            }else{
            	creatUl && creatUl();
            }                             
        },
        //初始化插件事件
        _initEvent: function() {
            var me = this;
            // 初始化开始页面
            me._scrollPage();
            var btnclick= function(){
            	me.element.children(me.selectors.btns).on("click", "a", function(){
            		var dir = $(this).attr("data-click");
            		if(dir == "left"){
            			me.prev() //上一页
            		}else{
            			me.next() //下一页
            		}
            	});
            }
            // 页面的点击事件
            if(me.settings.controlStyle != "button"){
            	me.element.children("ul" + me.selectors.page).on("click", "li", function() {
                    me.index = $(this).index();
                    me._scrollPage();
                });
                if(me.settings.controlStyle == "both"){
                	btnclick && btnclick();
                }
            }else{
            	btnclick && btnclick();
            }
            				
            //鼠标的滚轮事件
            if(me.settings.mousewheel){
            	me.element.on("mousewheel DOMMouseScroll", function(e) {
                    if (me.canScroll) {
                        var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
                        if (delta > 0 && (me.index && !me.settings.loop || me.settings.loop)) {
                            me.prev() //上一页
                        } else if (delta < 0 && (me.index < (me.pagesCount - 1) && !me.settings.loop || me.settings.loop)) {
                            me.next() //下一页
                        }
                    }{
                    	me.unLock();
                    }
                });
            }
            
            //键盘事件
            if (me.settings.keyboard) {
            	
                $(window).on("keydown", function(e) {
                    var keyCode = e.keyCode;
                    if (keyCode == 37 || keyCode == 38) {
                        me.prev();
                    } else if (keyCode == 39 || keyCode == 40) {
                        me.next();
                    }
                });
               
            }
            
            //浏览器窗口变化事件            
        	$(window).resize(function() {
        		if (!me.direction) { me._initLayout() }
        		if(me.settings.resize){
        			var currentLength = me.SwitchLength(),
                        offset = me.settings.direction ? me.section.eq(me.index).offset().top : me.section.eq(me.index).offset().left;
                    if (Math.abs(offset) > currentLength / 2 && me.index < (me.pagesCount - 1)) {
                        me.index++;
                    }
                    if (me.index) {		                    
                        me._scrollPage();
                    }
        		}                   
           });
            
                        
            // 分屏完成后的执行动画, 执行回调   ---- 执行回调的地方
            me.sections.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend", function(event) {                  
                if (me.settings.callback && $.type(me.settings.callback) == "function") {
                    me.settings.callback(me.element[0], me.index, me.movement);
                }
                event.stopPropagation();
            });           
        },

        _scrollPage: function() {
            var me = this,
                dest = me.section.eq(me.index).position(),
                switchLegth = me.SwitchLength() * me.index;
            if (!dest) return;
            me.forceUnLock(); 
            
            if (_prefix) {
                me.sections.css(_prefix + "transition", "all " + me.settings.duration + "ms " + me.settings.easing);
                var translateY = me.direction ? "-" + switchLegth + "px" : "0px";
                var translateX = me.direction ? "0px" : "-"+ switchLegth + "px";                                      
                me.sections.css(_prefix + "transform", "translate3d("+ translateX +", "+ translateY +", 0px)");
            } else {
                var animateCss = me.direction ? { top: -switchLegth } : { left: -switchLegth };
                me.sections.animate(animateCss, me.settings.duration, function() {                       
                    if (me.settings.callback && $.type(me.settings.callback) === "function") {
                        me.settings.callback(me.element[0], me.index, me.movement);
                    }                                              
                });
            }
			me.lock();        
            if ( me.settings.pagination ) {
            	if(me.settings.controlStyle !="button"){
            		me.pageItem.eq(me.index).addClass(me.activeClass).siblings("li").removeClass(me.activeClass);
            	}                               	
                me.section.eq(me.index).addClass(me.activeClass).siblings(me.selectors.section).removeClass(me.activeClass);                
            }
        }
    }
	// 挂载jquery对象里
    $.fn.PageSwitch = function(options) { //单例模式
        return this.each(function() {
            var me = $(this),
                instance = me.data("PageSwitch")
            if (!instance) {
                instance = new PageSwitch(me, options);
                me.data("PageSwitch", instance);
            }
            //判断传递参数options的类型，如果是字符串，用户就可以直接调用
            //pageSwitch.prototype内的方法
            if ($.type(options) === "string") return instance[options]();
        });
    }

    
    /*$(function() { jquery 单例模式
        $("[data-PageSwitch]").PageSwitch(); //初始化pageSwitch插件
    })
	new PageSwitch($("#homePage"), { 对象 多例方式
		'callback': switchCallback // 自定义的回调函数
	});*/
	window.PageSwitch = PageSwitch; // 暴露全局
})(window, document, jQuery);
//if (!!window.ActiveXObject || "ActiveXObject" in window){ // 判断IE
//	window.document.body.focus();
//	console.log(true);
//}