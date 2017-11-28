/**
 * Created by reamd on 2016/10/26.
 */
;(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // AMD
        define('Detach', [], function () {
            return factory();
        });
    } else if (typeof exports === 'object') {
        // Node.js
        module.exports.Detach = factory();

    } else {
        // Browser globals
        root.Detach = factory();
    }
})(typeof window !== "undefined" ? window : this, function () {
    var Detach = function() {
        this.cList = {}; // controller list
        this.dList = []; // dom list
        this.tList = {}; // template list
    };
    var _className = '';
    var _domClassName = '';

    function _obj2Arr(obj) {
       return Array.prototype.slice.call(obj);
    }

    /*字符串转dom对象*/
    function parseDom(arg) {
        var dom = document.createElement('div');
        dom.innerHTML = arg;
        return _obj2Arr(dom.children);
    }

    function ajax(url, cb) {
        var xhr = XMLHttpRequest? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        xhr.open("GET", url + ('?' + new Date().getTime()), true);
        xhr.onload = function () {
            if(xhr.status === 200 || xhr.status === 206 || xhr.status === 304) {
                cb(xhr.responseText);
            }else {
                throw new Error('load template error');
            }
        };
        xhr.onerror = function () {
            throw new Error('ajax error');
        };
        xhr.send();
    }

    function showDom(dom) {
        var domArr = _obj2Arr(dom);
        domArr.forEach(function (item) {
            item.style.removeProperty('display', 'none');
        });
    }

    function hideDom(dom) {
        var domArr = null;
        domArr = (Object.prototype.toString.call(dom) === '[object Array]'
                    ? _obj2Arr(dom)
                    : dom);
        domArr.forEach(function (item) {
            item.style.setProperty('display', 'none');
        });
    }

    function parseTpl(opt) {
        // 分解步骤 => link template-data script
        var tpl = opt.tpl,
            container = opt.container || document.body,
            data = opt.data || {},
            onReady = opt.onReady || function () {};

        ajax(tpl, function (res) {
            var regCss = /((<link[\s\S]*?\/?>)|(<style[\s\S]*?>[\s\S]*?<\/style>))/ig,
            regScript = /(<script[\s\S]*?>[\s\S]*?<\/script>)/ig,
            regDom = /\{\{([\s\S]*?)\}\}/ig,
            fRes,
            domTree = null,
            cssDom = null,
            scriptDom = null,
            dHead = document.documentElement.querySelector('head'),
            dBody = document.body,
            cssArr = [],
            scriptArr = [];

            // css标签
            fRes = res.replace(regCss, function (match, variable) {
                cssArr.push(match);
                return '';
            });
            // script标签
            fRes = fRes.replace(regScript, function (match) {
                scriptArr.push(match);
                return '';
            });
            // dom标签
            fRes = fRes.replace(regDom, function (match, variable) {
                return (typeof data[variable] === 'undefined'? '': data[variable]);
            });

            // 解析dom,css,js
            domTree = parseDom(fRes);
            cssDom = parseDom(cssArr.join(''));
            scriptDom = parseDom(scriptArr.join(''));

            // 渲染dom,css,js
            cssDom.forEach(function (item) {
                item.classList['add'](_className);
                dHead.appendChild(item);
            });

            hideDom(domTree);
            domTree.forEach(function (item) {
                item.classList['add'](_domClassName);
                item.classList['add'](_className);
                container.appendChild(item);
            });
            onReady();

            setTimeout(function () {
                scriptDom.forEach(function (item) {
                    item.classList['add'](_className);
                    dBody.appendChild(item);
                });
            });
        })
    }

    Detach.prototype.init = function (opt) {
        Detach.self = this;
        var sortClass = new Date().getTime();
        this.cList[opt.name] = typeof opt.controller === 'undefined'
            ? function(){}
            : opt.controller;
        this.tList[opt.name] = _className = 'detach_' + sortClass;
        this.dList[opt.name] = _domClassName = 'dom_' + sortClass;
        parseTpl(opt);
    };

    Detach.prototype.destroy = function (opt) {
        var domArr = _obj2Arr(document.querySelectorAll('.' + this.tList[opt.name]));
        domArr.forEach(function (item) {
            item.parentNode.removeChild(item);
        });
    };
    
    Detach.prototype.router = {
            push: function (opt) {
                var domArr = _obj2Arr(document.querySelectorAll('.' + Detach.self.dList[opt.name]));
                showDom(domArr);
                Detach.self.cList[opt.name]();
            },
            delete: function (opt) {
                var domArr = _obj2Arr(document.querySelectorAll('.' + Detach.self.dList[opt.name]));
                hideDom(domArr);
            }
        };

    return new Detach();
});
