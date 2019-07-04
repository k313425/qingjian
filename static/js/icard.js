'use strict';
var ICard = /** @class */ (function () {
    function ICard(params) {
        this._timestamp = null;
        this._appid = "wx8557b7376ee5f1cf";
        this._nonceStr = null;
        this.params = {
            lng: "25.17668",
            lat: "38.965962",
            wishUrl: "/invitation/wish",
            giftUrl: "/invitation/gift",
            giftShop: "/invitation/gift-shop",
            wishesName: $("#wishesName"),
            wishesText: $("#wishesText"),
            wishesArea: $("#wishesArea"),
            giftName: $("#giftName"),
            name: "黑光网友",
            text: "",
            autoplay: true,
            musicAutoplay: true,
            music: "",
            hash: null,
            music_root: "http://s0.heiguang.com/",
            bullet: 1,
            timer: null,
            desc:"",
            city:"",
            address:""
        };
        $.extend(this.params, params); //合并参数
        this.init();
    }
    ICard.prototype = {
        init: function () {
            var that = this;
            this.scaleHeight();
            new Swiper(".swiper-container", {
                direction: "vertical",
                effect: "fade", // cube/fade/coverflow/flip
                animate: true,
                autoplay: that.params.autoplay,
                allowTouchMove: true,
                observer: true,
                observeParents: true,
                observeSlideChildren: true,
                paginationClickable: true,
                spaceBetween: 30,
                on: {
                    slideChange: function () {
                        if (this.activeIndex === 0) {
                            $(".bullet_widget").hide();
                            $(".x-arrow-bottom").show();
                        } else {
                            $(".bullet_widget").show();
                            $(".x-arrow-bottom").hide();
                        }
                        swiperAnimate(this);
                    },
                    init: function () {
                        swiperAnimate(this); //初始化完成开始动画
                    },
                    slideChangeTransitionEnd: function () {
                        swiperAnimate(this);
                    }
                }
            });
            if ($('#map').length > 0) {
                // 百度地图API功能
                var map = new BMap.Map("map", {enableMapClick: false});
                var point = new BMap.Point(that.params.lng, that.params.lat);
                map.centerAndZoom(point, 18);
                map.enableScrollWheelZoom(false);
                map.disableDragging();
                map.disableDoubleClickZoom();
                map.disablePinchToZoom();
                var marker = new BMap.Marker(point);
                map.addOverlay(marker);
            }
            $(document).on("click","#map",function () {
                var geolocation = new BMap.Geolocation();
                geolocation.getCurrentPosition(function(r){
                    if(this.getStatus() === BMAP_STATUS_SUCCESS){
                        var latCurrent = r.point.lat;
                        var lngCurrent = r.point.lng;
                        window.location.href="http://api.map.baidu.com/direction?origin="+latCurrent+","+lngCurrent+"&destination="+that.params.lat+","+that.params.lng+"&mode=driving&region="+that.params.city+"&output=html";
                    } else {
                        alert("failed:"+this.getStatus());
                    }
                },{enableHighAccuracy: true});
                // layer.confirm(that.params.address, {
                //     btn: ['导航','关闭'] //按钮
                // }, function(){
                //     var geolocation = new BMap.Geolocation();
                //     geolocation.getCurrentPosition(function(r){
                //         if(this.getStatus() === BMAP_STATUS_SUCCESS){
                //             var latCurrent = r.point.lat;
                //             var lngCurrent = r.point.lng;
                //             window.location.href="http://api.map.baidu.com/direction?origin="+latCurrent+","+lngCurrent+"&destination="+that.params.lat+","+that.params.lng+"&mode=driving&region="+that.params.city+"&output=html";
                //         } else {
                //             alert("failed:"+this.getStatus());
                //         }
                //     },{enableHighAccuracy: true});
                // }, function(){
                //     layer.close();
                // });
            });
            that.load();
            that.load_gift();
            setInterval(that.ajax_gift, 3000);
            setInterval(that.ajax_wishes, 3000);
            this.musicUrl = this.params.music_root + this.params.music;
            this.context = null;
            this.play = false; //判断是否在播放
            if (this.params.musicAutoplay) { // 自动播放
                that.onLoad();
                document.addEventListener('WeixinJSBridgeReady', function () {
                    that.onLoad();
                });
                this.testAutoPlay().then(autoplay => {
                    //console.log(autoplay);
                    if (autoplay) {
                        // console.log("支持自动播放");
                        that.onLoad();
                    } else {
                        // console.log("不支持自动播放");
                        $('body').on('click touchstart', function () {
                            that.onLoad();
                        });
                    }
                });
            } else {
                $('.music').on('click', function () {
                    that.onLoad();
                });
            }

            // 支持用户点击声音图标自行播放
            $('.music i').on('click', function () {
                if (that.context) {
                    if (that.context.state !== 'suspended') { //暂停
                        that.pause();
                    } else { //播放
                        that.player();
                    }
                }
            });

            //兼容微信6.74 ios12版本
            $("input,textarea,select").blur(function(){
                setTimeout(function() {
                    var scrollHeight = document.documentElement.scrollTop || document.body.scrollTop || 0;
                    window.scrollTo(0, Math.max(scrollHeight - 1, 0));
                }, 50);
            });

            //兼容微信6.74 ios12版本
            var u = navigator.userAgent;
            var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
            if(isiOS){
                $("input,textarea,select").blur(function(){
                    setTimeout(function() {
                        var scrollHeight = document.documentElement.scrollTop || document.body.scrollTop || 0;
                        window.scrollTo(0, Math.max(scrollHeight - 1, 0));
                    }, 50);
                });
            }
        },
        load: function () { //如果用户点击弹幕 就停止滚动
            var that = this;
            that.params.wishesArea.on('touchstart', function () {
                scrollFlag = false;
                scrollTimer = false;
                that.stop_timer();//清空计数器
            });
            that.params.wishesArea.on('touchend', function () {
                var nScrollHight = $(this)[0].scrollHeight;
                var nScrollTop = $(this)[0].scrollTop;
                var nDivHight = $(this).height();
                if(nScrollTop + nDivHight >= nScrollHight) {
                    scrollFlag = true;
                }else {
                    that.start_timer();//计数器
                }
            });
            that.params.wishesArea.on('click', 'span', function () {
                var addItem = $(this).clone(true);
                $('.dialog-popup .center p').empty().append(addItem);
                $('.dialog-wrap').fadeToggle();
            });

            $(".dialog-popup").on("click",".close",function () {
                $(".dialog-wrap").fadeToggle();
            });

            $("#show_gift").on("click", "img", function () {
                that.show_gift();
            });
            $("#show_wishes").on("click", function () {
                that.show_wishes();
            });
            $("#giftForm").on("click", ".close", function () {
                that.close_gift();
            });
            $("#wishesForm").on("click", ".close", function () {
                that.close_wishes();
            });
            $(".wishes-overlay").on("click", function () {
                that.close_wishes();
            });
            $(".gift-overlay").on("click", function () {
                that.close_gift();
            });
            $(".dialog-overlay").on("click", function () {
                that.toogle_dialog();
            });
            $("#sendWish").click(function () {
                if (!that.params.wishesName.val()) {
                    layer.msg('请填写你的姓名!');
                    return false;
                } else if (!that.params.wishesText.val()) {
                    layer.msg('请写下你的祝福!');
                    return false;
                }
                that.wishes();
                return false;
            });
            $("#sendGift").click(function () {
                if (!that.params.giftName.val()) {
                    layer.msg("请填写你的名字!");
                    return false;
                }
                that.gift();
                return false;
            });
        },
        stop_timer: function () {
            var that = this;
            clearTimeout(that.params.timer);
        },
        start_timer: function () {
            this.params.timer = setTimeout(function () {
                scrollTimer = true;
            }, 5000);
        },
        gift: function () {
            var that = this;
            var currentGift = $('input[name=\'gift\']:checked');
            if (currentGift.length === 1) {
                var imgObj = currentGift.parent().find('img');
                var imgSrc = imgObj.attr("src");
                this.name = this.params.giftName.val();
                this.text = currentGift.val();
                var wishWord = imgObj.attr("alt");
                var id = imgObj.attr("data-id");
                var wisherAreaGift = $(".wishes-gift");
                var str = '<div class="sub">' +
                    '<img src="' + imgSrc +
                    '" width="60" alt="">' +
                    '<p id="gift">' + that.name + ' 送了 ' + that.text +
                    '</p>' +
                    '<p id="gift-wishes">祝：' + wishWord + '</p>' +
                    '</div>';
                var hash = $("#invitation-container").attr("data-hash");
                $.ajax({
                    url: that.params.giftUrl,
                    datatype: "json",
                    type: "post",
                    data: { // data ：发送给服务器的数据
                        type: "gift",
                        name: that.name,
                        val: that.text,
                        wishWord: wishWord,
                        id: id,
                        hash: hash
                    },
                    success: function () {
                        // alert('发送成功');
                        wisherAreaGift.empty().append(str);
                        that.params.giftName.val("");
                        that.close_gift();
                        // 函数体，数据发送成功时执行
                    },
                    error: function (e) {
                        console.log('错误: ' + e);
                        // 函数体，数据发送错误时执行
                    }
                });
                that.close_gift();
                wisherAreaGift.addClass('fadeOutInLeft');
                setTimeout(function () {
                    wisherAreaGift.empty().append(str);
                }, 500);
                setTimeout(function () {
                    wisherAreaGift.removeClass('fadeOutInLeft');
                }, 1000);
            } else {
                layer.msg("请选择要赠送的礼物");
            }
        },
        load_gift: function () {
            var that = this;
            $.ajax({
                url: that.params.giftShop,
                datatype: 'json',
                type: 'post',
                data: { // data ：发送给服务器的数据
                    type: 'gift',
                },
                success: function (rs) {
                    rs = JSON.parse(rs);
                    if (rs && rs.code === 200) {
                        $.each(rs.data, function (i, item) {
                            $("<li><label><input type=\"radio\" name=\"gift\" value=\"" + item.title + "\"><span><img src=\"/static/gift/" + item.id + ".png?v=0.1\" alt=\"" + item.wishWord + "\" data-id='" + item.id + "'></span></label>" + item.title + "</li>").appendTo("#gift-list");
                        });
                    } else if (rs.code === 400) {
                        layer.msg(rs.msg);
                    } else {
                        layer.msg("网络繁忙，请重试");
                    }
                },
                error: function (e) {
                    console.log('错误: ' + e);
                    // 函数体，数据发送错误时执行
                }
            });
        },
        ajax_gift: function () {
            var icardId = $("#invitation-container").attr("data-id");
            var wisherAreaGift = $(".wishes-gift");
            var last = wisherAreaGift.attr("data-id");
            $.ajax({
                url: "/invitation/gift-list",
                datatype: 'json',
                type: 'post',
                data: {
                    type: 'gift',
                    last: last,
                    icardId: icardId
                },
                success: function (res) {
                    var rs = JSON.parse(res);
                    if (rs instanceof Object) {
                        if (rs.code === 200) {
                            var item = rs.data;
                            if(item instanceof Object){
                                var str = '<div class="sub">' +
                                    '<img src="' + item.src +
                                    '" alt="">' +
                                    '<p id="gift">' + item.nickname + ' 送了 ' + item.gift +
                                    '</p>' +
                                    '<p id="gift-wishes">祝：' + item.word +
                                    '</p>' +
                                    '</div>';
                                wisherAreaGift.addClass("fadeOutInLeft");
                                wisherAreaGift.attr("data-id", item.id);
                                setTimeout(function () {
                                    wisherAreaGift.empty().append(str);
                                }, 500);
                                setTimeout(function () {
                                    wisherAreaGift.removeClass('fadeOutInLeft');
                                }, 1000);
                            }
                        } else if (rs.code === 400) {
                            layer.msg(rs.msg);
                        } else {
                            layer.msg("网络繁忙，请重试");
                        }
                    }
                },
                error: function (e) {
                    console.log('错误: ' + e);
                    // 函数体，数据发送错误时执行
                }
            });
        },
        wishes: function () {
            var that = this;
            this.name = this.params.wishesName.val();
            this.text = this.params.wishesText.val();
            this.hash = $('#invitation-container').attr("data-hash");
            var str = '<li><span>' + this.name + '：' + this.text + '</span></li>';
            this.params.wishesName.val("");
            this.params.wishesText.val("");
            $.ajax({
                url: that.params.wishUrl,
                datatype: 'json',
                type: 'post',
                data: { // data ：发送给服务器的数据
                    type: 'wishes',
                    name: that.name,
                    text: that.text,
                    hash: that.hash
                },
                success: function () {
                    //that.params.wishesArea.append(str);//use ajax get data
                    that.close_wishes();
                    // 函数体，数据发送成功时执行
                },
                error: function (e) {
                    console.log('错误: ' + e);
                    // 函数体，数据发送错误时执行
                }
            });
            wishesScroll();
        },
        ajax_wishes: function () {
            var icardId = $("#invitation-container").attr("data-id");
            var wishesArea = $("#wishesArea");
            var last = wishesArea.attr("data-id");
            $.ajax({
                url: "/invitation/wish-list",
                datatype: 'json',
                type: 'post',
                data: { // data ：发送给服务器的数据
                    type: 'wishes',
                    last: last,
                    icardId: icardId
                },
                success: function (res) {
                    var rs = JSON.parse(res);
                    // each循环 使用$.each方法遍历返回的数据date JSON.parse(res)
                    if (rs instanceof Object) {
                        if (rs.code === 200) {
                            var item = rs.data;
                            if(item instanceof Object){
                                var str = '<li><span>' + item.nickname + '：' + item.wish + '</span></li>';
                                wishesArea.append(str);
                                wishesArea.attr("data-id", item.id);
                                wishesScroll();
                            }
                        } else if (rs.code === 400) {
                            //layer.msg(rs.msg);
                        } else {
                            layer.msg("网络繁忙，请重试");
                        }
                    }
                },
                error: function (e) {
                    console.log('错误: ' + e);
                    // 函数体，数据发送错误时执行
                }
            });
        },
        show_gift: function () {
            $('.gift-wrap').fadeIn();
        },
        close_gift: function () {
            $('.gift-wrap').fadeOut();
        },
        show_wishes: function () {
            $('.wishes-wrap').fadeIn();
        },
        close_wishes: function () {
            $('.wishes-wrap').fadeOut();
        },
        toogle_dialog: function () {
            $('.dialog-wrap').fadeToggle();
        },
        onLoad: function () {
            var that = this;
            if (!that.context) {
                that.context = new (window.AudioContext || window.webkitAudioContext)();
                that.playAudio(that.context, that.musicUrl);
                // console.log(that.context);
            } else {
                if (!that.play) {
                    this.context.resume();
                }
            }
            setTimeout(function () {
                if (that.context.state === 'running') {
                    that.play = true;
                    $('.music i').addClass('animate-spin');
                }
            }, 200);
        },
        testAutoPlay: function () {
            // 返回一个promise以告诉调用者检测结果
            return new Promise(resolve => {
                var audio = document.createElement('audio');
                // require一个本地文件，会变成base64格式
                audio.src = "/static/test.mp3";
                document.body.appendChild(audio);
                var autoplay = true;
                // play返回的是一个promise
                audio.play().then(() => {
                    // 支持自动播放
                    autoplay = true;
                }).catch(err => {
                    // 不支持自动播放
                    autoplay = false;
                }).finally(() => {
                    audio.remove();
                    // 告诉调用者结果
                    resolve(autoplay);
                });
            });
        },
        pause: function () {
            this.context.suspend();
            $('.music i').removeClass('animate-spin');
        },
        player: function () {
            this.context.resume();
            $('.music i').addClass('animate-spin');
        },
        request: function (url) { // 请求音乐
            return new Promise(resolve => {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                // 这里需要设置xhr response的格式为arraybuffer
                // 否则默认是二进制的文本格式
                xhr.responseType = 'arraybuffer';
                xhr.onreadystatechange = function () {
                    // 请求完成，并且成功
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        resolve(xhr.response);
                    }
                };
                xhr.send();
            });
        },
        createSound: function (buffer) { // 播放音乐
            if (this.context.state === 'suspended') {
                console.log('重启context');
                this.context.resume();
            }
            //创建BufferSrouceNode
            var source = this.context.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            source.connect(this.context.destination);
            source.start(0);
            return source;
        },
        playAudio: async function (context, url) {
            var that = this;
            var audioMedia = await this.request(url);
            this.context.decodeAudioData(audioMedia, decoded => that.createSound(decoded));
        },
        
        browser:{
            versions: function () {
                var u = navigator.userAgent, app = navigator.appVersion;
                console.log(u);
                return { //移动终端浏览器版本信息
                    ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
                    android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或uc浏览器
                    iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
                    iPad: u.indexOf('iPad') > -1, //是否iPad,
                    wx: u.indexOf('MicroMessenger') > -1,
                };
            }(),
        },
        scaleHeight:function() {
            var browser = this.browser;
            var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
                h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
                clientWidth = document.documentElement.clientWidth,
                clientHeight = document.documentElement.clientHeight,
                offsetWidth = document.body.offsetWidth?document.body.offsetWidth:0,
                offsetHeight = document.body.offsetHeight?document.body.offsetHeight:0,
                scrollWidth = document.body.scrollWidth,
                scrollHeight = document.body.scrollHeight,
                innerWidth = window.innerWidth,
                innerHeight = window.innerHeight,
                outerWidth = window.outerWidth,
                outerHeight = window.outerHeight,
                ffscrollTop = document.body.scrollTop,
                iescrollTop = document.documentElement.scrollTop,
                scrollLeft = document.body.scrollLeft,
                scrollTop = window.screenTop,
                screenLeft = window.screenLeft,
                screenWidth = window.screen.width,
                screenHeight = window.screen.height,
                availHeight = window.screen.availHeight,
                availWidth = window.screen.availWidth;
            var height = outerHeight?outerHeight:availHeight;
            var phoneScale = parseInt(window.screen.width)/720;
            var scaleHeightPx = height/phoneScale;
            if (browser.versions.iPhone || browser.versions.iPad || browser.versions.ios) {
                if (!browser.versions.wx) {
                    alert(scaleHeightPx);
                    $('#invitation-container').css('height',scaleHeightPx+'px');
                    window.onload = function() {
                        setTimeout(function() {
                            window.scrollTo(0, 1)
                        }, 0);
                    };
                }
            }else if(browser.versions.android) {
                $('#invitation-container').css('height',scaleHeightPx+'px');
            }else{
                $('#invitation-container').css('height',scaleHeightPx+'px');
            }
        },
        share:function (params) {
            var defaults = {
                title: null,  //分享标题, [朋友圈, 朋友, QQ, weibo, Qzone]
                desc: null,   //分享描述, [朋友, QQ, weibo, Qzone]
                link: null,   //分享链接, [朋友圈, 朋友, QQ, weibo, Qzone]
                imgUrl: null, //分享图标, [朋友圈, 朋友, QQ, weibo, Qzone]
                type: null,   //分享类型, [朋友]    music/video/link 默认 link
                dataUrl: null,//数据链接  [朋友]    如果type是music或video，则要提供数据链接，默认空
                success: function () {
                },
                cancel: function () {

                },
                timeline: {
                    title: null,
                    link: null,
                    imgUrl: null,
                    success: null,
                    cancel: null
                },
                appmsg: {
                    title: null,
                    desc: null,
                    link: null,
                    imgUrl: null,
                    type: null,
                    dataUrl: null,
                    success: null,
                    cancel: null
                },
                qq: {
                    title: null,
                    desc: null,
                    link: null,
                    imgUrl: null,
                    success: null,
                    cancel: null
                },
                weibo: {
                    title: null,
                    desc: null,
                    link: null,
                    imgUrl: null,
                    success: null,
                    cancel: null
                },
                qzone: {
                    title: null,
                    desc: null,
                    link: null,
                    imgUrl: null,
                    success: null,
                    cancel: null
                },

                csrf: window.token,
                types: ['timeline', 'appmsg', 'qq', 'weibo', 'qzone']

            };
            params = $.extend(defaults, params);

            $.each(params.types, function (i, type) {
                run(type);
            });

            function run(type) {
                //不在数组内的模式,直接退出.
                if ($.inArray(type, ['timeline', 'appmsg', 'qq', 'weibo', 'qzone']) == -1) {
                    return;
                }
                //拼接各模式下的参数.
                var wxParams = {
                    title: params[type].title || params.title,
                    link: params[type].link || params.link,
                    imgUrl: params[type].imgUrl || params.imgUrl,
                    success: function () {
                        if (params[type].success) {
                            params[type].success();
                        } else {
                            params.success(params.csrf, type);
                        }
                    },
                    cancel: function () {
                        if (params[type].cancel) {
                            params[type].cancel();
                        } else {
                            params.cancel();
                        }
                    }
                };
                if ($.inArray(type, ['appmsg', 'qq', 'weibo', 'qzone']) >= 0) {
                    wxParams.desc = params[type].desc || params.desc;
                }
                if (type == 'appmsg') {
                    wxParams.type = params[type].type || params.type;
                    wxParams.dataUrl = params[type].dataUrl || params.dataUrl;
                }

                // console.log(wxParams);
                //执行
                switch (type) {
                    case 'timeline':
                        wx.onMenuShareTimeline(wxParams);
                        break;
                    case 'appmsg':
                        wx.onMenuShareAppMessage(wxParams);
                        break;
                    case 'qq':
                        wx.onMenuShareQQ(wxParams);
                        break;
                    case 'weibo':
                        wx.onMenuShareWeibo(wxParams);
                        break;
                    case 'qzone':
                        wx.onMenuShareQZone(wxParams);
                        break;
                }
            }
        }
    };
    return ICard;
}());

var scrollFlag = true;
var scrollTimer = true;

//想要加载页面自动到最底部
function wishesScroll() {
    var scrollDiv = $('#wishesArea');
    if (scrollFlag || scrollTimer) { //如果用户没有点击弹幕 就持续滚动
        scrollDiv.animate({scrollTop: scrollDiv[0].scrollHeight<100?10000:scrollDiv[0].scrollHeight}, 1000);
    }
}
