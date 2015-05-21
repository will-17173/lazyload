define(function(require, exports, module) {
  /**
   * Lazyload 延迟加载
   * 支持图片和脚本
   *
   * @module Lazyload
   */
  'use strict';

  var $ = require('$'),
    Widget = require('widget');

    var Lazyload = Widget.extend({
    	defaults: {
        /**
         * 需要延迟加载的外层元素
         * @attribute element
         * @type {String}
         */ 
        element: '',
        /**
         * 原始地址的属性名
         * @attribute dataAttr
         * @type {String}
         */ 
        dataAttr: '',
        /**
         * 触发加载的临界值
         * @attribute threshold
         * @type {Number}
         */ 
        threshold: 30
      }, 

      setup: function(){
        this.element = this.element ? this.element.get(0) : window;
        this.list = Array.prototype.slice.call(this.element.querySelectorAll('[data-' + this.option('dataAttr') + ']'));
        this.bindEvent.call(this);
        this.detect.call(this);
      },

      /**
       * 判断元素是否在视图中
       * @method inViewport
       * @param  {String} el 元素
       * @param  {Number} threshold 临界值
       */
      inViewport: function(el, threshold){
        var rect     = el.getBoundingClientRect();
        var viewport = {
          left : 0 - threshold,
          top : 0 - threshold,
          right : $(window).width() + threshold,
          bottom : $(window).height() + threshold
        }
        return !(rect.top >= viewport.bottom
                || rect.bottom <= viewport.top
                || rect.right <= viewport.left
                || rect.left >= viewport.right)
      },

      /**
       * 绑定事件
       * @method bindEvent
       */
      bindEvent: function(){
        var self = this;
        $(window).on('pageshow resize scroll load', function(){
          self.detect.call(self);
        });
      },

      /**
       * 执行延迟加载 
       * @method detect
       */
      detect: function(){
        var self = this,
          threshold = self.option('threshold');
        $(self.list).each(function(i, el){
          if(!self.inViewport(el, threshold)){ //不在指定范围内的话   不执行操作
            return;
          }
          var $el = $(el);
          var attr = 'data-' + self.option('dataAttr');
          var originalSrc = $el.attr(attr);
          var type = $el.attr('data-type') || 'img'; //类型 img script

          /**
           * 开始单个元素加载
           */
          self.trigger('startLoading', el);
          //删除加载属性
          $el.removeAttr(attr);
          //从列表中删除该节点 减少下一次的循环
          self.list = self.list.filter(function(dom){
            return dom != el;
          });

          if(type == 'img'){ //图片
            $('<img />').bind('load', function(){
              if($el.is('img')){
                $el.attr('src', originalSrc)
              }else{
                $el.css('background-image','url(' + originalSrc + ')');
              }
              /**
               * @event load
               * @property {object} event 单个资源加载完成
               */
              self.trigger('load', [el, originalSrc]);
            }).attr('src', originalSrc);
          } else if(type == 'script'){ //脚本
            var firstScript = document.getElementsByTagName('script')[0];
            var scriptHead = firstScript.parentNode;
            var re = /ded|co/;
            var onload = 'onload';
            var onreadystatechange = 'onreadystatechange'; 
            var readyState = 'readyState';
            var script = document.createElement('script');
            script[onload] = script[onreadystatechange] = function(){
              if(!this[readyState] || re.test(this[readyState])){
                script[onload] = script[onreadystatechange] = null;
                self.trigger('load', el);
                script = null;
              }
            };
            script.async = true;
            script.src = originalSrc;
            scriptHead.insertBefore(script, firstScript);
          }

        })
      },

      /**
       * 更新节点列表
       */
      updateList: function(){
        var self = this;
        self.list = Array.prototype.slice.call(this.element.querySelectorAll('[data-' + self.option('dataAttr') + ']'));
      }
	});

	module.exports = Lazyload;
});
