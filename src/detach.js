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
        this.db = {}; // 存储消息总线数据
    };
    var _className = '';
    var _domClassName = '';

    function _resolveAbsolutePath(ref, source) {
        if(source.charAt(0) === '/') {
            return location.protocol + '//' + location.host + source;
        }

        var reg = /^\.\//ig,
            res = '',
            rArr = [],
            sArr = [],
            resArr = [],
            fArr = [],
            refAbsolute = false;

        if(ref.charAt(0) === '/') {
            refAbsolute = true;
        }

        ref = ref.replace(reg, '');
        source = source.replace(reg, '');

        rArr = ref.split('/');
        rArr.pop();

        sArr = source.split('/');
        sArr.forEach(function (item, idx) {
            if(item === '..') {
                rArr.pop();
                sArr[idx] = '';
            }
        });

        resArr = rArr.concat(sArr);
        resArr.forEach((function (item, idx) {
            if(item !== '') {
                fArr.push(item);
            }
        }));

        res = fArr.join('/').replace(/\/{2,}/ig, '/');
        return refAbsolute? ('/' + res) : res;
    }

    function _obj2Arr(obj) {
       return Array.prototype.slice.call(obj);
    }

    /*字符串转dom对象*/
    function parseDom(arg) {
        var dom = document.createElement('div');
        dom.innerHTML = arg;
        return _obj2Arr(dom.children);
    }

    /*由于script无法执行，因此额外进行转换*/
    function parseScript(domArr) {
        var resArr = [];
        var templatePath = Detach.tpl;
        domArr.forEach(function(item){
            var dom = document.createElement('script');
            var url = item.getAttribute('src');
            dom.type= 'text/javascript';
            if(url) {
                // dom.src = url;
                dom.src = _resolveAbsolutePath(templatePath, url);
                resArr.push(dom);
            }else {
                dom.innerHTML = item.innerHTML;
                resArr.push(dom);
            }
        });
        return resArr;
    }

    function filterCss(linkTpl) {
        var reg = /<link.*href=['|"]([^'"]*)['|"]/i;
        var url = linkTpl.match(reg)[1];
        var templatePath = Detach.tpl;
        var hrefUrl = _resolveAbsolutePath(templatePath, url);
        return linkTpl.replace(url, hrefUrl);
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
            fragDom = null,
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
                var reg = /(<link[\s\S]*?\/?>)/ig;
                var res = match;
                if (reg.test(match)) {
                    var res = filterCss(match);
                }
                cssArr.push(res);
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

            //
            // 渲染dom,css,js
            fragDom = document.createDocumentFragment();
            cssDom.forEach(function (item) {
                item.classList['add'](_className);
                fragDom.appendChild(item);
            });
            dHead.appendChild(fragDom);

            hideDom(domTree);
            fragDom = document.createDocumentFragment();
            domTree.forEach(function (item) {
                item.classList['add'](_domClassName);
                item.classList['add'](_className);
                fragDom.appendChild(item);
            });
            container.appendChild(fragDom);


            onReady();

            setTimeout(function () {
                fragDom = document.createDocumentFragment();
                parseScript(scriptDom).forEach(function (item) {
                    item.classList['add'](_className);
                    fragDom.appendChild(item);
                });
                dBody.appendChild(fragDom);
            });
        })
    }

    Detach.prototype.init = function (opt) {
        Detach.self = this;
        Detach.tpl = opt.tpl;
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
        delete this.cList[opt.name];
        delete this.dList[opt.name];
        delete this.tList[opt.name];
    };
    
    Detach.prototype.router = {
            push: function (opt) {
                var domName = Detach.self.dList[opt.name];
                if(!domName) {return;}
                var domArr = _obj2Arr(document.querySelectorAll('.' + domName));
                showDom(domArr);
                Detach.self.cList[opt.name]();
            },
            delete: function (opt) {
                var domName = Detach.self.dList[opt.name];
                if(!domName) {return;}
                var domArr = _obj2Arr(document.querySelectorAll('.' + domName));
                if(!domArr) {return;}
                hideDom(domArr);
            }
        };

    Detach.prototype.sub = function (name, cb) {
        this.db[name] = cb;
    };

    Detach.prototype.pub = function (name, data) {
        var cb = this.db[name];
        if(typeof cb !== 'undefined'){
            cb(data);
        }
    };
    return new Detach();
});
