/* -----CONFIG----- */
var CHAT_BACKGROUND_LIGHT = 'rgba(35, 35, 35, 1)';
var CHAT_BACKGROUND_DARK = 'rgba(0, 0, 0, 0.15)';
var USERLIST_COLORS = {
    /* usertype:
                 'owner' for admins
                 'op'    for mods
                 'guest' for unregistered accounts
                 ''      for normal users */
    'pokegaard': {usertype: 'owner', css: 'color: #00FF7F !important;'},
    'Amberainbow': {usertype: '', css: 'color: #FF69B4 !important;'},
};
/* -----CONFIG----- */

for (key in USERLIST_COLORS) {
    $('div.userlist_item span' + (USERLIST_COLORS[key].usertype ? '.userlist_' + USERLIST_COLORS[key].usertype : '') + ':contains("' + key + '")').css('cssText', USERLIST_COLORS[key].css);
}

var CHAT_BACKGROUND = typeof CHAT_BACKGROUND === 'undefined' ? false : CHAT_BACKGROUND;
if (typeof CHAT_INIT === 'undefined') {
    var CHAT_INIT = true;
    socket.on('chatMsg', function(obj) {
        var mb = document.getElementById('messagebuffer');
        if (mb && mb.lastChild && $(mb.lastChild).attr('class').indexOf('chat-msg-') === 0 && !obj.meta.shadow) {
            CHAT_BACKGROUND = !CHAT_BACKGROUND;
            $(mb.lastChild).attr('style', 'background-color:' + (CHAT_BACKGROUND ? CHAT_BACKGROUND_LIGHT : CHAT_BACKGROUND_DARK) + ';');
        }
        setTimeout(function() {
            var mb = document.getElementById('messagebuffer');
            if (mb !== null && mb.scrollHeight-(mb.clientHeight+mb.scrollTop) < 50) {
                mb.scrollTop = mb.scrollHeight-mb.clientHeight;
            };
        }, 250);
        emoteHoverAll();
        if (CLIENT.name && obj.username !== CLIENT.name && obj.msg.toLowerCase().indexOf(CLIENT.name.toLowerCase()) !== -1 && !obj.meta.shadow && obj.username !== '[server]') {
            audioFeedback();
        }
        if (/^!banmepls(?: .*)?$/i.test(obj.msg)) {
                      deleteMsgByUsername(obj.username);
        }
    });
    socket.on('addUser', function(obj) {
        if (USERLIST_COLORS[obj.name]) {
            $('div.userlist_item span' + (USERLIST_COLORS[obj.name].usertype ? '.userlist_' + USERLIST_COLORS[obj.name].usertype : '') + ':contains("' + obj.name + '")').css('cssText', USERLIST_COLORS[obj.name].css);
            /* not sure if DOM is guaranteed to be updated yet when emit occurs, so try again in 0.25 seconds for good measure */
            setTimeout(function() {
                $('div.userlist_item span' + (USERLIST_COLORS[obj.name].usertype ? '.userlist_' + USERLIST_COLORS[obj.name].usertype : '') + ':contains("' + obj.name + '")').css('cssText', USERLIST_COLORS[obj.name].css);
            }, 250);
        }
    });
    socket.on('newPoll', function(obj) {
        newPoll();
    });
    socket.on('pm', function(obj) {
        if (obj.username !== CLIENT.name) {
            audioFeedback();
        }
    });
    (function() {
        var mbDiv = $('#messagebuffer div');
        var line;
        for (var i=0; i<mbDiv.length; i++) {
            if (mbDiv && (line = $(mbDiv[i]))[0] && line.attr('class').indexOf('chat-msg-') === 0) {
                CHAT_BACKGROUND = !CHAT_BACKGROUND;
                $(mbDiv[i]).attr('style', 'background-color:' + (CHAT_BACKGROUND ? CHAT_BACKGROUND_LIGHT : CHAT_BACKGROUND_DARK) + ';');
            }
        }
    })();
    $("#guestlogin")[0].onclick=function(e) {
        e.target === document.querySelector('#guestlogin span') && socket.emit("login", {
            name: $("#guestname").val()
        })
    }
    document.querySelector('#guestlogin span').style = 'top:92%!important;left:84%!important;';
}

var CSS_RAW = '';
if (typeof CSS_INIT === 'undefined') {
    var CSS_INIT = true;
    $('head').append('<style id="chancss2" type="text/css">' + CSS_RAW + '</style>');
}
else {
    $('head #chancss2').html(CSS_RAW);
}

var TabCompletionRefresh = function() {
    emotes = window.CHANNEL.emotes;
    TabCompletionEmotes = [];
    for (var i=0; i<emotes.length; i++) {
        TabCompletionEmotes.push(emotes[i].name);
    }
    TabCompletionEmotes = TabCompletionEmotes.sort();
    TabCompletionEmotesLower = [];
    for (var i=0; i<TabCompletionEmotes.length; i++) {
        TabCompletionEmotesLower.push(TabCompletionEmotes[i].toLowerCase());
    }
};
if (typeof TabCompletionEmotes === 'undefined') {
    var TabCompletionEmotes;
    TabCompletionRefresh();
    socket.on('emoteList', TabCompletionRefresh);
    socket.on('updateEmote', TabCompletionRefresh);
    socket.on('removeEmote', TabCompletionRefresh);
    var TabCompletion = {
        last: '',
        matches: [],
    };
}
chatTabComplete = function() {
    var match = /(.*?) *$/.exec($("#chatline").val());
    if (match === null || match[1] === '') {
        return;
    }
    var chatline = match[1];
    var words = chatline.split(" ");
    var currentWithCap = words[words.length - 1];
    var current = currentWithCap.toLowerCase();
    if (!current.match(/^[\w-():]{1,20}:?$/)) {
        return;
    }
    var __slice = Array.prototype.slice;
    var usersWithCap = __slice.call($("#userlist").children()).map(function (elem) {
        return elem.children[1].innerHTML;
    });
    var users = __slice.call(usersWithCap).map(function (user) {
        return user.toLowerCase();
    }).filter(function (name) {
        return name.indexOf(current) === 0;
    });
    if (currentWithCap === TabCompletion.last) {
        TabCompletion.last = current = TabCompletion.matches[(TabCompletion.matches.indexOf(currentWithCap)+1)%TabCompletion.matches.length];
        current += ' ';
        words[words.length - 1] = current;
        $("#chatline").val(words.join(" "));
        return;
    }
    var matches = TabCompletionEmotes.filter(function (str) {return str.toLowerCase().indexOf(current) === 0;});
    matches = matches.concat(usersWithCap.filter(function (str) {return str.toLowerCase().indexOf(current) === 0;}).map(function (str) {return words.length === 1 ? str+':' : str;}));
    if (matches.length === 0) {
        return;
    }
    TabCompletion.matches = matches;
    TabCompletion.last = current = TabCompletion.matches[0];
    current += ' ';
    words[words.length - 1] = current;
    $("#chatline").val(words.join(" "));
    return;
};

if (typeof emoteHover === 'undefined') {
    var emoteHover = document.createElement('div');
    emoteHover.id = 'emote-hover';
    emoteHover.setAttribute('style', 'visibility: hidden; top: 0px;left: 0px;box-sizing: border-box;display: block;position: absolute;padding: 5px;margin: 0px;color: #D3D3D3;line-height: 60px;text-align: center;z-index: 9999;');
    emoteHover.innerHTML = '<div id="emote-hover-inner" style="box-sizing: border-box;background-color: #000;color: #fff;max-width: 200px;padding: 5px 8px 4px;margin: 0px;text-align: center;font-family: Helvetica Neue,Helvetica,sans-serif;font-size: 1.2rem;line-height: 2rem;"></div>';
    document.querySelector('body').appendChild(emoteHover);
    var emoteHoverInner = emoteHover.firstChild;
}
var xOffset = 0,
    yOffset = -23;
var setHover = function(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return;
    }
    obj.onmouseenter = function(e) {
        // emoteHoverInner.innerHTML = this.title;
        emoteHoverInner.innerHTML = this.getAttribute('hover') || this.title;
        emoteHover.style.visibility = 'visible';
        emoteHover.style.top = (e.pageY - yOffset) + "px";
        emoteHover.style.left = (e.pageX - xOffset) + "px";
    };
    obj.onmouseleave = function(e) {
        emoteHover.style.visibility = 'hidden';
    };
    obj.onmousemove = function(e) {
        emoteHover.style.top = (e.pageY - yOffset) + "px";
        emoteHover.style.left = (e.pageX - xOffset) + "px";
    };
};
var emoteHoverAll = function() {
    var emotes = document.querySelectorAll('img.channel-emote');
    for (var i=0; i<emotes.length; i++) {
        if (emotes[i].onmouseenter === null) {
            setHover(emotes[i]);
        }
              
    }
};
emoteHoverAll();

var newPoll = function() {
    $('#pollwrap div.well').draggable();
};
var newpollbtn = document.getElementById('newpollbtn');
newpollbtn !== null && (newpollbtn.onclick = newPoll);
$('#emotelist > div.modal-dialog > div.modal-content').draggable();

var togglesCSS_Compact = '#queue .queue_entry{padding: 0px;line-height: 10px;}#queue .queue_entry .btn-group button {padding-top: 0px;padding-bottom: 0px;line-height: 14px;}#rightcontrols button {padding-top: 0px;padding-bottom: 0px;}#mediaurl {padding: 0px 3px;height: 20px;}#addfromurl .input-group button {padding-top: 0px;padding-bottom: 0px;}#rightcontrols{margin-top: 0px !important;}#playlistmanagerwrap{margin-top: 0px;}#videowrap{margin-bottom: 0px !important;}#queuefail .vertical-spacer{margin-top: 0px;}#addfromurl .vertical-spacer{margin-top: 0px;}#addfromurl .checkbox{margin: 0px;}#mainpage{padding-top: 25px !important;}';
var togglesCSS_Title = '#currenttitle{display: block !important; font-size: 16px !important; margin-top: -30px !important; margin-bottom: -5px;}#mainpage{/*padding-top: 45px !important;*/}';
var togglesCSS_Timestamp = '#messagebuffer>div>span.timestamp{display:none;}';
var userlistToggle = document.querySelector('#userlisttoggle');
var userlistSizeToggleFn;
var userlistToggleFn = userlistSizeToggleFn = function() {
    $('#userlist').toggleClass('userlist-large', !!cookie.userlistLarge);
    $('#messagebuffer').toggleClass('userlist-hidden', !!cookie.userlistHidden || !!cookie.userlistLarge);
    $('#chatline').toggleClass('userlist-hidden', !!cookie.userlistHidden || !!cookie.userlistLarge);
    $('#leftcontrols').toggleClass('userlist-hidden', !!cookie.userlistHidden || !!cookie.userlistLarge);
    $('#videowrap').toggleClass('userlist-hidden', !!cookie.userlistHidden || !!cookie.userlistLarge);
    $('#rightcontrols').toggleClass('userlist-hidden', !!cookie.userlistHidden || !!cookie.userlistLarge);
    $('#rightpane').toggleClass('userlist-hidden', !!cookie.userlistHidden || !!cookie.userlistLarge);
    userlistSizeToggleInner.style.width = !!cookie.userlistLarge ? '100%' : '50%';
};
var cookie;
var cookieLoad = function() {
    var regex = /.*(?:(\{.*\})).*/.exec(document.cookie);
    var cookieJSON;
    if (regex && typeof regex !== null && regex[1] && regex[1] !== '') {
        try {
            cookieJSON = JSON.parse(regex[1]);
        }
        catch (e) {}
    }
    cookie = (cookieJSON && typeof cookieJSON === 'object') ? cookieJSON : {
        userlistHidden: userlist.style.display === 'none' ? true : false,
        userlistLarge: false,
        audioFeedback: false,
        playlistStyle: 0,
        compact: false,
        title: false,
        timestamp: false,
    };
    if (cookie.userlistLarge) {
        cookie.userlistHidden = true;
        cookieSave();
    }
    userlistSizeToggleFn();
    if (cookie.userlistHidden) {
        userlistToggleFn();
        cookie.userlistHidden = !cookie.userlistHidden;
        userlistToggle.click();
    }
    audioFeedbackToggleFn();
    cookie.playlistStyle = typeof cookie.playlistStyle === 'number' ? cookie.playlistStyle : 0;
    playlistStyleToggleFn();
    compactToggleFn();
    titleToggleFn();
};
var cookieSaveHooks = {};
var cookieSave = function() {
    document.cookie = JSON.stringify(cookie);
    for (key in cookieSaveHooks) {
        typeof cookieSaveHooks[key] === 'function' && cookieSaveHooks[key]();
    }
};
var cookieUserlistToggle = function() {
    cookie.userlistHidden = !cookie.userlistHidden;
    cookieSave();
    userlistToggleFn();
};
var cookieUserlistSizeToggle = function() {
    cookie.userlistLarge = !cookie.userlistLarge;
    if (!!cookie.userlistHidden) {
        userlistToggle.click();
    }
    cookieSave();
    userlistSizeToggleFn();
};
userlistToggle.onclick = cookieUserlistToggle;
var audioFeedbackSound = audioFeedbackSound || new Audio('https://cdn.betterttv.net/assets/sounds/ts-tink.ogg');
var audioFeedback = function() {
    if (cookie.audioFeedback) {
        audioFeedbackSound.pause();
        audioFeedbackSound.currentTime = 0;
        audioFeedbackSound.play();
    }
};
var audioFeedbackToggle = function() {
    cookie.audioFeedback = !cookie.audioFeedback;
    cookieSave();
    audioFeedbackToggleFn();
};
var audioFeedbackToggleFn = function() {
    $('#audiofeedbacktoggle').toggleClass('audio-feedback-on', !!cookie.audioFeedback);
};
var playlistStyleToggle = function() {
    cookie.playlistStyle = (cookie.playlistStyle + 1) % 3;
    cookieSave();
    playlistStyleToggleFn();
};
var compactToggle = function() {
    cookie.compact = !cookie.compact;
    cookieSave();
    compactToggleFn();
};
var compactToggleFn = function() {
    compactToggleBtn.style.backgroundColor = !!cookie.compact ? '#CCFFCC' : '#FFCCCC';
    compactToggleCSS.innerHTML = !!cookie.compact ? togglesCSS_Compact : '';
};
var titleToggle = function() {
    cookie.title = !cookie.title;
    cookieSave();
    titleToggleFn();
};
var mainpage = document.querySelector('#mainpage');
var titleToggleFn = function() {
    titleToggleBtn.style.backgroundColor = !!cookie.title ? '#CCFFCC' : '#FFCCCC';
    titleToggleCSS.innerHTML = !!cookie.title ? togglesCSS_Title : '';
    mainpage.setAttribute('style', !!cookie.title ? 'padding-top: 45px !important;' : '');
};
var playlistStyleToggleFn = function() {
    $('#queue').toggleClass('playlist-style-1', cookie.playlistStyle === 1);
    $('#queue').toggleClass('playlist-style-2', cookie.playlistStyle === 2);
    document.querySelector('#playliststyletoggle').innerHTML = cookie.playlistStyle || '';
};
var timestampToggle = function() {
    cookie.timestamp = !cookie.timestamp;
    cookieSave();
    timestampToggleFn();
};
var timestampToggleFn = function() {
    $('#timestamptoggle').toggleClass('timestamp-off', !!cookie.timestamp);
    timestampToggleCSS.innerHTML = !!cookie.timestamp ? togglesCSS_Timestamp : '';
};
if (typeof COOKIE_INIT === 'undefined') {
    var COOKIE_INIT = true;
    setHover(document.querySelector('#userlisttoggle'));
    var userlistSizeToggle=document.createElement('i');
    userlistSizeToggle.id='userlistsizetoggle';
    userlistSizeToggle.setAttribute('class', 'glyphicon pull-left pointer unselectable');
    userlistSizeToggle.setAttribute('title','Toggle Userlist Size');
    userlistSizeToggle.innerHTML='<div id="userlistsizetoggle-inner"></div>';
    document.querySelector('#usercount').parentNode.insertBefore(userlistSizeToggle, document.querySelector('#usercount'));
    userlistSizeToggle.onclick = cookieUserlistSizeToggle;
    setHover(userlistSizeToggle);
    var userlistSizeToggleInner = document.querySelector('#userlistsizetoggle-inner');
    var audioFeedbackToggleBtn=document.createElement('i');
    audioFeedbackToggleBtn.id='audiofeedbacktoggle';
    audioFeedbackToggleBtn.setAttribute('class', 'glyphicon pull-left pointer unselectable');
    audioFeedbackToggleBtn.setAttribute('title','Toggle Audio Feedback');
    audioFeedbackToggleBtn.innerHTML='\uD83D\uDCE2';
    document.querySelector('#usercount').parentNode.insertBefore(audioFeedbackToggleBtn, document.querySelector('#usercount'));
    audioFeedbackToggleBtn.onclick = audioFeedbackToggle;
    setHover(audioFeedbackToggleBtn);
    var playlistStyleToggleBtn=document.createElement('i');
    playlistStyleToggleBtn.id='playliststyletoggle';
    playlistStyleToggleBtn.setAttribute('class', 'glyphicon pull-right pointer unselectable');
    playlistStyleToggleBtn.setAttribute('title','Toggle Playlist Style');
    playlistStyleToggleBtn.innerHTML='';
    document.querySelector('#usercount').parentNode.insertBefore(playlistStyleToggleBtn, document.querySelector('#usercount'));
    playlistStyleToggleBtn.onclick = playlistStyleToggle;
    setHover(playlistStyleToggleBtn);
    var compactToggleBtn=document.createElement('i');
    compactToggleBtn.id='compacttoggle';
    compactToggleBtn.setAttribute('class', 'glyphicon pull-right pointer unselectable');
    compactToggleBtn.setAttribute('title','Toggle Compact Layout');
    compactToggleBtn.innerHTML='C';
    document.querySelector('#usercount').parentNode.insertBefore(compactToggleBtn, document.querySelector('#usercount'));
    compactToggleBtn.onclick = compactToggle;
    setHover(compactToggleBtn);
    var titleToggleBtn=document.createElement('i');
    titleToggleBtn.id='titletoggle';
    titleToggleBtn.setAttribute('class', 'glyphicon pull-right pointer unselectable');
    titleToggleBtn.setAttribute('title','Toggle Video Title');
    titleToggleBtn.innerHTML='T';
    document.querySelector('#usercount').parentNode.insertBefore(titleToggleBtn, document.querySelector('#usercount'));
    titleToggleBtn.onclick = titleToggle;
    setHover(titleToggleBtn);
    var timestampToggleBtn=document.createElement('i');
    timestampToggleBtn.id='timestamptoggle';
    timestampToggleBtn.setAttribute('class', 'glyphicon pull-right pointer unselectable');
    timestampToggleBtn.setAttribute('title','Toggle Timestamp');
    timestampToggleBtn.innerHTML='\uD83D\uDD51';
    document.querySelector('#usercount').parentNode.insertBefore(timestampToggleBtn, document.querySelector('#usercount'));
    timestampToggleBtn.onclick = timestampToggle;
    setHover(timestampToggleBtn);
    var compactToggleCSS=document.createElement('style');
    compactToggleCSS.id='togglescss-compact';
    compactToggleCSS.setAttribute('type', 'text/css');
    document.querySelector('head').appendChild(compactToggleCSS);
    var titleToggleCSS=document.createElement('style');
    titleToggleCSS.id='togglescss-title';
    titleToggleCSS.setAttribute('type', 'text/css');
    document.querySelector('head').appendChild(titleToggleCSS);
    var timestampToggleCSS=document.createElement('style');
    timestampToggleCSS.id='togglescss-timestamp';
    timestampToggleCSS.setAttribute('type', 'text/css');
    document.querySelector('head').appendChild(timestampToggleCSS);
    cookieLoad();
}

var messagebuffer = document.querySelector('#messagebuffer');
var deleteMsg = function(obj) {
    var offset = obj.children[1].firstChild.className === 'username' ? 0 : -1;
    if (!obj.children[3+offset]) {
        obj.children[2+offset].style.display = 'none';
        var newMsg=document.createElement('span');
        newMsg.setAttribute('style', 'color: #999;');
        newMsg.innerHTML='&lt;message deleted&gt;';
        obj.appendChild(newMsg);
        newMsg.onclick = function(e) {
            undeleteMsg(e.target);
        };
    }
};
var undeleteMsg = function(obj) {
    var scrollDown = messagebuffer.scrollHeight-(messagebuffer.clientHeight+messagebuffer.scrollTop) < 50;
    var offset = obj.parentElement.children[1].firstChild.className === 'username' ? 0 : -1;
    if (obj.parentElement.children[3+offset]) {
        obj.parentElement.children[2+offset].style.display = '';
        obj.parentElement.children[3+offset].style.display = 'none';
    }
    if (scrollDown) {
        messagebuffer.scrollTop = messagebuffer.scrollHeight-messagebuffer.clientHeight;
    }
};
var deleteMsgByUsername = function(username) {
    for (var i=0; i<messagebuffer.children.length; i++) {
        if (messagebuffer.children[i].classList[0] === 'chat-msg-' + username) {
            deleteMsg(messagebuffer.children[i]);
        }
    }
};

var MOTD_EVAL = function() {
    var motd = document.getElementById('motd');
    if (motd === null || motd.innerHTML.length === 0) {return false;}
    var MOTD_JS = decodeURIComponent(motd.innerHTML.replace('&amp;','&')); try {eval(MOTD_JS);} catch(e) {console.error(e);}
    return true;
};
if (!MOTD_EVAL()) {
    var MOTD_TIMER_START = Date.now();
    var MOTD_TIMER = setInterval(function() {(MOTD_EVAL() || Date.now() - MOTD_TIMER_START > 1 * 60 * 1000) && clearInterval(MOTD_TIMER);}, 250);
}
if (typeof MOTD_INIT === 'undefined') {
    var MOTD_INIT = true;
    socket.on('setMotd', function(str) {var MOTD_JS = decodeURIComponent(str); try {eval(MOTD_JS);} catch(e) {console.error(e);}});
}

window.onbeforeunload = function() {
    return false;
};

// Xaekai was here
$.getScript("https://resources.pink.horse/scripts/mjoc.requests.js")