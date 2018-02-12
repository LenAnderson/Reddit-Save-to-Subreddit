// ==UserScript==
// @name         Reddit - Save to Subreddit
// @namespace    https://github.com/LenAnderson/
// @downloadURL  https://github.com/LenAnderson/Reddit-Save-to-Subreddit/raw/master/reddit_save_to_subreddit.user.js
// @version      1.3
// @author       LenAnderson
// @match        https://www.reddit.com/*
// @match        https://www.reddit.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let sr = localStorage.getItem('reddit-save-to-subreddit');

    if (sr && location.href.search(new RegExp('^https:\/\/www\.reddit\.com\/r\/' + sr, 'i')) == 0) return;

    let get = (url) => {
        return new Promise(function(resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.addEventListener('load', () => {
                resolve(xhr.responseText);
            });
            xhr.addEventListener('error', () => {
                reject(xhr);
            });
            xhr.send();
        });
    };

    let post = (url, data, headers) => {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            if (headers) {
                Object.keys(headers).forEach(key => {
                    xhr.setRequestHeader(key, headers[key]);
                });
            }
            xhr.addEventListener('load', () => {
                resolve(xhr.responseText);
            });
            xhr.addEventListener('error', () => {
                reject(xhr);
            });
            xhr.send(data);
        });
    };

    let redditSubmit = (varsl) => {
        let vars = varsl.shift();
        return get('https://www.reddit.com/r/' + vars.sr + '/submit').then(uhSrc => {
            let uh = document.createElement('div');
            uh.innerHTML = uhSrc;
            return uh.querySelector('[name="uh"]').value;
        }).then(uh => {
            vars.uh = uh;
            return post('https://www.reddit.com/api/submit',
                        Object.keys(vars).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(vars[key])).join('&'),
                        {'Content-Type':'application/x-www-form-urlencoded', 'X-Requested-With':'XMLHttpRequest'}
                       );
        }).then(resp => {
            if (varsl.length > 0) {
                return redditSubmit(varsl);
            } else {
                return;
            }
        });
    };

    let addSaveButtons = () => {
        [].forEach.call(document.querySelectorAll('.thing:not([data-type="morechildren"]) > .entry .flat-list.buttons'), buttons => {
            if (buttons.hasAttribute('data-stsr'))
                return;
            buttons.setAttribute('data-stsr', '1');
            let li = document.createElement('li');
            let a = document.createElement('a');
            if (sr) {
                a.href = 'javascript:;';
                a.textContent = 'save to /r/' + sr;
                a.addEventListener('click', () => {
                    li.textContent = 'saving in /r/' + sr + ' ...';
                    let thing = buttons.closest('.thing');
                    let varsl = [];
                    let vars = {
                        sr: sr,
                        sendreplies: true,
                        id: '#newlink',
                        r: sr,
                        renderstyle: 'html'
                    };
                    switch (thing.getAttribute('data-type')) {
                        case 'link':
                            vars.kind = 'link';
                            vars.url = thing.getAttribute('data-url').replace(/^\//, 'https://www.redit.com/');
                            vars.title = '[' + thing.getAttribute('data-subreddit') + '] ' + thing.querySelector('.entry a.title').textContent.trim();
                            varsl.push(vars);
                            break;
                        case 'comment':
                            let opThing = document.querySelector('#siteTable > .thing');
                            let links = thing.querySelector('.usertext-body').querySelectorAll('a');
                            if (links.length > 0) {
                                vars.kind = 'link';
                                vars.title = '[' + opThing.getAttribute('data-subreddit') + '][comment-link]' + opThing.querySelector('.entry a.title').textContent.trim();
                                [].forEach.call(links, link => {
                                    vars = Object.assign({}, vars);
                                    vars.url = link.href;
                                    varsl.push(vars);
                                });
                            } else {
                                vars.kind = 'self';
                                vars.text = thing.querySelector('.usertext-body').textContent;
                                vars.title = '[' + opThing.getAttribute('data-subreddit') + '][comment] ' + opThing.querySelector('.entry a.title').textContent.trim();
                                varsl.push(vars);
                            }
                            break;
                        default:
                            alert('kind "' + thing.getAttribute('data-type') + '" not supported');
                    }
                    return redditSubmit(varsl).then(resp => {
                        li.textContent = 'saved in /r/' + sr;
                        thing.style.backgroundColor = '';
                    }).catch(xhr => {
                        li.textContent = '';
                        li.appendChild(a);
                        thing.style.backgroundColor = 'rgba(255,0,0,0.125)';
                        alert('Save to Subreddit failed!');
                    });
                });
            } else {
                a.href = '/prefs/save-to-subreddit/';
                a.textContent = 'CONFIGURE: save to subreddit';
            }
            li.appendChild(a);
            buttons.appendChild(li);
        });
    };

    let addPrefsLink = (title, href, selected) => {
        let ul = document.querySelector('.tabmenu');
        let li = document.createElement('li');
        if (selected) {
            li.classList.add('selected');
        }
        let a = document.createElement('a');
        a.classList.add('choice');
        a.href = href;
        a.textContent = title;
        li.appendChild(a);
        ul.appendChild(li);
    };

    let showPrefs = () => {
        let pagename = document.querySelector('.pagename.selected');
        pagename.textContent = 'preferences';
        let tabmenu = document.createElement('ul');
        tabmenu.classList.add('tabmenu');
        pagename.parentNode.appendChild(tabmenu);
        addPrefsLink('options', '/prefs/');
        addPrefsLink('apps', '/prefs/apps/');
        addPrefsLink('RSS feeds', '/prefs/feeds/');
        addPrefsLink('friends', '/prefs/friends/');
        addPrefsLink('blocked', '/prefs/blocked/');
        addPrefsLink('password/email', '/prefs/update/');
        addPrefsLink('deactivate', '/prefs/deactivate/');
        addPrefsLink('save to subreddit', '/prefs/save-to-subreddit/', true);

        document.querySelector('#classy-error').remove();
        let content = document.querySelector('.content[role="main"]'); {
            let h1 = document.createElement('h1'); {
                h1.textContent = 'save to subreddit';
                content.appendChild(h1);
            }
            let inpSr;
            // input: sr
            {
                let spacer = document.createElement('div'); {
                    spacer.classList.add('spacer');
                    let roundfield = document.createElement('div'); {
                        let title = document.createElement('span'); {
                            title.classList.add('title');
                            title.textContent = 'subreddit name';
                            roundfield.appendChild(title);
                        }
                        roundfield.appendChild(document.createTextNode(' '));
                        let descr = document.createElement('span'); {
                            descr.classList.add('little', 'gray', 'roundfield-description');
                            descr.textContent = '(required)';
                            roundfield.appendChild(descr);
                        }
                        let rcontent = document.createElement('div'); {
                            rcontent.classList.add('roundfield-content');
                            inpSr = document.createElement('input'); {
                                inpSr.type = 'text';
                                inpSr.value = sr;
                                rcontent.appendChild(inpSr);
                            }
                            roundfield.appendChild(rcontent);
                        }
                        spacer.appendChild(roundfield);
                    }
                    content.appendChild(spacer);
                }
            }
            // submit
            {
                let submit = document.createElement('button'); {
                    submit.classList.add('btn');
                    submit.textContent = 'save';
                    submit.addEventListener('click', () => {
                        localStorage.setItem('reddit-save-to-subreddit', inpSr.value);
                    });
                    content.appendChild(submit);
                }
            }
        }
    };

    if (location.href == 'https://www.reddit.com/prefs/save-to-subreddit/') {
        showPrefs();
    } else if (location.href.search('/prefs/') > -1) {
        addPrefsLink('save to subreddit', '/prefs/save-to-subreddit/');
    } else {
        addSaveButtons();
        var mo = new MutationObserver(function(muts) {
            addSaveButtons();
        });
        mo.observe(document.body, {childList: true, subtree: true});
    }
})();
