'use strict';
var jsc = require('jsverify'),
    jsdom = require('jsdom-global'),
    cleanup = jsdom(),

    a2zString = ['a','b','c','d','e','f','g','h','i','j','k','l','m',
                 'n','o','p','q','r','s','t','u','v','w','x','y','z'],
    alnumString = a2zString.concat(['0','1','2','3','4','5','6','7','8','9']),
    queryString = alnumString.concat(['+','%','&','.','*','-','_']),
    base64String = alnumString.concat(['+','/','=']).concat(
        a2zString.map(function(c) {
            return c.toUpperCase();
        })
    ),
    // schemas supported by the whatwg-url library
    schemas = ['ftp','gopher','http','https','ws','wss'],
    supportedLanguages = ['de', 'es', 'fr', 'it', 'no', 'pl', 'pt', 'oc', 'ru', 'sl', 'zh'],

    /**
     * character to HTML entity lookup table
     *
     * @see    {@link https://github.com/janl/mustache.js/blob/master/mustache.js#L60}
     */
    entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    },
    logFile = require('fs').createWriteStream('test.log');

global.$ = global.jQuery = require('./jquery-3.1.1');
global.sjcl = require('./sjcl-1.0.6');
global.Base64 = require('./base64-2.1.9').Base64;
global.RawDeflate = require('./rawdeflate-0.5').RawDeflate;
global.RawDeflate.inflate = require('./rawinflate-0.3').RawDeflate.inflate;
require('./prettify');
global.prettyPrint = window.PR.prettyPrint;
global.prettyPrintOne = window.PR.prettyPrintOne;
global.showdown = require('./showdown-1.6.1');
global.DOMPurify = require('./purify.min');
require('./bootstrap-3.3.7');
require('./privatebin');

// redirect console messages to log file
console.info = console.warn = console.error = function () {
    logFile.write(Array.prototype.slice.call(arguments).join('') + '\n');
}

/**
 * convert all applicable characters to HTML entities
 *
 * @see    {@link https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content}
 * @name   htmlEntities
 * @function
 * @param  {string} str
 * @return {string} escaped HTML
 */
function htmlEntities(str) {
    return String(str).replace(
        /[&<>"'`=\/]/g, function(s) {
            return entityMap[s];
        });
}

describe('Helper', function () {
    describe('secondsToHuman', function () {
        after(function () {
            cleanup();
        });

        jsc.property('returns an array with a number and a word', 'integer', function (number) {
            var result = $.PrivateBin.Helper.secondsToHuman(number);
            return Array.isArray(result) &&
                result.length === 2 &&
                result[0] === parseInt(result[0], 10) &&
                typeof result[1] === 'string';
        });
        jsc.property('returns seconds on the first array position', 'integer 59', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[0] === number;
        });
        jsc.property('returns seconds on the second array position', 'integer 59', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[1] === 'second';
        });
        jsc.property('returns minutes on the first array position', 'integer 60 3599', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[0] === Math.floor(number / 60);
        });
        jsc.property('returns minutes on the second array position', 'integer 60 3599', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[1] === 'minute';
        });
        jsc.property('returns hours on the first array position', 'integer 3600 86399', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[0] === Math.floor(number / (60 * 60));
        });
        jsc.property('returns hours on the second array position', 'integer 3600 86399', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[1] === 'hour';
        });
        jsc.property('returns days on the first array position', 'integer 86400 5184000', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[0] === Math.floor(number / (60 * 60 * 24));
        });
        jsc.property('returns days on the second array position', 'integer 86400 5184000', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[1] === 'day';
        });
        // max safe integer as per http://ecma262-5.com/ELS5_HTML.htm#Section_8.5
        jsc.property('returns months on the first array position', 'integer 5184000 9007199254740991', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[0] === Math.floor(number / (60 * 60 * 24 * 30));
        });
        jsc.property('returns months on the second array position', 'integer 5184000 9007199254740991', function (number) {
            return $.PrivateBin.Helper.secondsToHuman(number)[1] === 'month';
        });
    });

    // this test is not yet meaningful using jsdom, as it does not contain getSelection support.
    // TODO: This needs to be tested using a browser.
    describe('selectText', function () {
        this.timeout(30000);
        jsc.property(
            'selection contains content of given ID',
            jsc.nearray(jsc.nearray(jsc.elements(alnumString))),
            'nearray string',
            function (ids, contents) {
                var html = '',
                    result = true;
                ids.forEach(function(item, i) {
                    html += '<div id="' + item.join('') + '">' + htmlEntities(contents[i] || contents[0]) + '</div>';
                });
                var clean = jsdom(html);
                ids.forEach(function(item, i) {
                    $.PrivateBin.Helper.selectText(item.join(''));
                    // TODO: As per https://github.com/tmpvar/jsdom/issues/321 there is no getSelection in jsdom, yet.
                    // Once there is one, uncomment the line below to actually check the result.
                    //result *= (contents[i] || contents[0]) === window.getSelection().toString();
                });
                clean();
                return Boolean(result);
            }
        );
    });

    describe('urls2links', function () {
        after(function () {
            cleanup();
        });

        jsc.property(
            'ignores non-URL content',
            'string',
            function (content) {
                return content === $.PrivateBin.Helper.urls2links(content);
            }
        );
        jsc.property(
            'replaces URLs with anchors',
            'string',
            jsc.elements(['http', 'https', 'ftp']),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            jsc.array(jsc.elements(queryString)),
            'string',
            function (prefix, schema, address, query, fragment, postfix) {
                var query = query.join(''),
                    fragment = fragment.join(''),
                    url = schema + '://' + address.join('') + '/?' + query + '#' + fragment,
                    prefix = htmlEntities(prefix),
                    postfix = ' ' + htmlEntities(postfix);

                // special cases: When the query string and fragment imply the beginning of an HTML entity, eg. &#0 or &#x
                if (
                    query.slice(-1) === '&' &&
                    (parseInt(fragment.substring(0, 1), 10) >= 0 || fragment.charAt(0) === 'x' )
                )
                {
                    url = schema + '://' + address.join('') + '/?' + query.substring(0, query.length - 1);
                    postfix = '';
                }

                return prefix + '<a href="' + url + '" rel="nofollow">' + url + '</a>' + postfix === $.PrivateBin.Helper.urls2links(prefix + url + postfix);
            }
        );
        jsc.property(
            'replaces magnet links with anchors',
            'string',
            jsc.array(jsc.elements(queryString)),
            'string',
            function (prefix, query, postfix) {
                var url = 'magnet:?' + query.join('').replace(/^&+|&+$/gm,''),
                    prefix = htmlEntities(prefix),
                    postfix = htmlEntities(postfix);
                return prefix + '<a href="' + url + '" rel="nofollow">' + url + '</a> ' + postfix === $.PrivateBin.Helper.urls2links(prefix + url + ' ' + postfix);
            }
        );
    });

    describe('sprintf', function () {
        after(function () {
            cleanup();
        });

        jsc.property(
            'replaces %s in strings with first given parameter',
            'string',
            '(small nearray) string',
            'string',
            function (prefix, params, postfix) {
                prefix    =    prefix.replace(/%(s|d)/g, '%%');
                params[0] = params[0].replace(/%(s|d)/g, '%%');
                postfix   =   postfix.replace(/%(s|d)/g, '%%');
                var result = prefix + params[0] + postfix;
                params.unshift(prefix + '%s' + postfix);
                return result === $.PrivateBin.Helper.sprintf.apply(this, params);
            }
        );
        jsc.property(
            'replaces %d in strings with first given parameter',
            'string',
            '(small nearray) nat',
            'string',
            function (prefix, params, postfix) {
                prefix  =  prefix.replace(/%(s|d)/g, '%%');
                postfix = postfix.replace(/%(s|d)/g, '%%');
                var result = prefix + params[0] + postfix;
                params.unshift(prefix + '%d' + postfix);
                return result === $.PrivateBin.Helper.sprintf.apply(this, params);
            }
        );
        jsc.property(
            'replaces %d in strings with 0 if first parameter is not a number',
            'string',
            '(small nearray) falsy',
            'string',
            function (prefix, params, postfix) {
                prefix  =  prefix.replace(/%(s|d)/g, '%%');
                postfix = postfix.replace(/%(s|d)/g, '%%');
                var result = prefix + '0' + postfix;
                params.unshift(prefix + '%d' + postfix);
                return result === $.PrivateBin.Helper.sprintf.apply(this, params)
            }
        );
        jsc.property(
            'replaces %d and %s in strings in order',
            'string',
            'nat',
            'string',
            'string',
            'string',
            function (prefix, uint, middle, string, postfix) {
                prefix  =  prefix.replace(/%(s|d)/g, '%%');
                middle  =  middle.replace(/%(s|d)/g, '%%');
                postfix = postfix.replace(/%(s|d)/g, '%%');
                var params = [prefix + '%d' + middle + '%s' + postfix, uint, string],
                    result = prefix + uint + middle + string + postfix;
                return result === $.PrivateBin.Helper.sprintf.apply(this, params);
            }
        );
        jsc.property(
            'replaces %d and %s in strings in reverse order',
            'string',
            'nat',
            'string',
            'string',
            'string',
            function (prefix, uint, middle, string, postfix) {
                prefix  =  prefix.replace(/%(s|d)/g, '%%');
                middle  =  middle.replace(/%(s|d)/g, '%%');
                postfix = postfix.replace(/%(s|d)/g, '%%');
                var params = [prefix + '%s' + middle + '%d' + postfix, string, uint],
                    result = prefix + string + middle + uint + postfix;
                return result === $.PrivateBin.Helper.sprintf.apply(this, params);
            }
        );
    });

    describe('getCookie', function () {
        this.timeout(30000);
        jsc.property(
            'returns the requested cookie',
            'nearray asciinestring',
            'nearray asciistring',
            function (labels, values) {
                var selectedKey = '', selectedValue = '',
                    cookieArray = [],
                    count = 0;
                labels.forEach(function(item, i) {
                    // deliberatly using a non-ascii key for replacing invalid characters
                    var key = item.replace(/[\s;,=]/g, Array(i+2).join('£')),
                        value = (values[i] || values[0]).replace(/[\s;,=]/g, '');
                    cookieArray.push(key + '=' + value);
                    if (Math.random() < 1 / i || selectedKey === key)
                    {
                        selectedKey = key;
                        selectedValue = value;
                    }
                });
                var clean = jsdom('', {cookie: cookieArray}),
                    result = $.PrivateBin.Helper.getCookie(selectedKey);
                clean();
                return result === selectedValue;
            }
        );
    });

    describe('baseUri', function () {
        this.timeout(30000);
        before(function () {
            $.PrivateBin.Helper.reset();
        });

        jsc.property(
            'returns the URL without query & fragment',
            jsc.elements(schemas),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            'string',
            function (schema, address, query, fragment) {
                var expected = schema + '://' + address.join('') + '/',
                    clean = jsdom('', {url: expected + '?' + query.join('') + '#' + fragment}),
                    result = $.PrivateBin.Helper.baseUri();
                $.PrivateBin.Helper.reset();
                clean();
                return expected === result;
            }
        );
    });

    describe('htmlEntities', function () {
        after(function () {
            cleanup();
        });

        jsc.property(
            'removes all HTML entities from any given string',
            'string',
            function (string) {
                var result = htmlEntities(string);
                return !(/[<>"'`=\/]/.test(result)) && !(string.indexOf('&') > -1 && !(/&amp;/.test(result)));
            }
        );
    });
});

describe('I18n', function () {
    describe('translate', function () {
        before(function () {
            $.PrivateBin.I18n.reset();
        });

        jsc.property(
            'returns message ID unchanged if no translation found',
            'string',
            function (messageId) {
                messageId   = messageId.replace(/%(s|d)/g, '%%');
                var plurals = [messageId, messageId + 's'],
                    fake    = [messageId],
                    result  = $.PrivateBin.I18n.translate(messageId);
                $.PrivateBin.I18n.reset();

                var alias = $.PrivateBin.I18n._(messageId);
                $.PrivateBin.I18n.reset();

                var p_result = $.PrivateBin.I18n.translate(plurals);
                $.PrivateBin.I18n.reset();

                var p_alias = $.PrivateBin.I18n._(plurals);
                $.PrivateBin.I18n.reset();

                var f_result = $.PrivateBin.I18n.translate(fake);
                $.PrivateBin.I18n.reset();

                var f_alias = $.PrivateBin.I18n._(fake);
                $.PrivateBin.I18n.reset();

                return messageId === result && messageId === alias &&
                    messageId === p_result && messageId === p_alias &&
                    messageId === f_result && messageId === f_alias;
            }
        );
        jsc.property(
            'replaces %s in strings with first given parameter',
            'string',
            '(small nearray) string',
            'string',
            function (prefix, params, postfix) {
                prefix    =    prefix.replace(/%(s|d)/g, '%%');
                params[0] = params[0].replace(/%(s|d)/g, '%%');
                postfix   =   postfix.replace(/%(s|d)/g, '%%');
                var translation = prefix + params[0] + postfix;
                params.unshift(prefix + '%s' + postfix);
                var result = $.PrivateBin.I18n.translate.apply(this, params);
                $.PrivateBin.I18n.reset();
                var alias = $.PrivateBin.I18n._.apply(this, params);
                $.PrivateBin.I18n.reset();
                return translation === result && translation === alias;
            }
        );
    });

    describe('getPluralForm', function () {
        before(function () {
            $.PrivateBin.I18n.reset();
        });

        jsc.property(
            'returns valid key for plural form',
            jsc.elements(supportedLanguages),
            'integer',
            function(language, n) {
                $.PrivateBin.I18n.reset(language);
                var result = $.PrivateBin.I18n.getPluralForm(n);
                // arabic seems to have the highest plural count with 6 forms
                return result >= 0 && result <= 5;
            }
        );
    });

    // loading of JSON via AJAX needs to be tested in the browser, this just mocks it
    // TODO: This needs to be tested using a browser.
    describe('loadTranslations', function () {
        this.timeout(30000);
        before(function () {
            $.PrivateBin.I18n.reset();
        });

        jsc.property(
            'downloads and handles any supported language',
            jsc.elements(supportedLanguages),
            function(language) {
                var clean = jsdom('', {url: 'https://privatebin.net/', cookie: ['lang=' + language]});

                $.PrivateBin.I18n.reset('en');
                $.PrivateBin.I18n.loadTranslations();
                $.PrivateBin.I18n.reset(language, require('../i18n/' + language + '.json'));
                var result = $.PrivateBin.I18n.translate('en'),
                    alias  = $.PrivateBin.I18n._('en');

                clean();
                return language === result && language === alias;
            }
        );
    });
});

describe('CryptTool', function () {
    describe('cipher & decipher', function () {
        this.timeout(30000);
        it('can en- and decrypt any message', function () {
            jsc.check(jsc.forall(
                'string',
                'string',
                'string',
                function (key, password, message) {
                    return message === $.PrivateBin.CryptTool.decipher(
                        key,
                        password,
                        $.PrivateBin.CryptTool.cipher(key, password, message)
                    );
                }
            ),
            // reducing amount of checks as running 100 takes about 5 minutes
            {tests: 5, quiet: true});
        });

        // The below static unit tests are included to ensure deciphering of "classic"
        // SJCL based pastes still works
        it(
            'supports PrivateBin v1 ciphertext (SJCL & Base64 2.1.9)',
            function () {
                // Of course you can easily decipher the following texts, if you like.
                // Bonus points for finding their sources and hidden meanings.
                var paste1 = $.PrivateBin.CryptTool.decipher(
                    '6t2qsmLyfXIokNCL+3/yl15rfTUBQvm5SOnFPvNE7Q8=',
                    // -- "That's amazing. I've got the same combination on my luggage."
                    Array.apply(0, Array(6)).map(function(_,b) { return b + 1; }).join(''),
                    '{"iv":"4HNFIl7eYbCh6HuShctTIA==","v":1,"iter":10000,"ks":256,"ts":128,"mode":"gcm","adata":"","cipher":"aes","salt":"u0lQvePq6L0=","ct":"fGPUVrDyaVr1ZDGb+kqQ3CPEW8x4YKGfzHDmA0Vjkh250aWNe7Cnigkps9aaFVMX9AaerrTp3yZbojJtNqVGMfLdUTu+53xmZHqRKxCCqSfDNSNoW4Oxk5OVgAtRyuG4bXHDsWTXDNz2xceqzVFqhkwTwlUchrV7uuFK/XUKTNjPFM744moivIcBbfM2FOeKlIFs8RYPYuvqQhp2rMLlNGwwKh//4kykQsHMQDeSDuJl8stMQzgWR/btUBZuwNZEydkMH6IPpTdf5WTSrZ+wC2OK0GutCm4UaEe6txzaTMfu+WRVu4PN6q+N+2zljWJ1XdpVcN/i0Sv4QVMym0Xa6y0eccEhj/69o47PmExmMMeEwExImPalMNT9JUSiZdOZJ/GdzwrwoIuq1mdQR6vSH+XJ/8jXJQ7bjjJVJYXTcT0Di5jixArI2Kpp1GGlGVFbLgPugwU1wczg+byqeDOAECXRRnQcogeaJtVcRwXwfy4j3ORFcblYMilxyHqKBewcYPRVBGtBs50cVjSIkAfR84rnc1nfvnxK/Gmm+4VBNHI6ODWNpRolVMCzXjbKYnV3Are5AgSpsTqaGl41VJGpcco6cAwi4K0Bys1seKR+bLSdUgqRrkEqSRSdu3/VTu9HhEk8an0rjTE4CBB5/LMn16p0TGLoOb32odKFIEtpanVvLjeyiVMvSxcgYLNnTi/5FiaAC4pJxRD+AZHedU1FICUeEXxIcac/4E5qjkHjX9SpQtLl80QLIVnjNliZm7QLB/nKu7W8Jb0+/CiTdV3Q9LhxlH4ciprnX+W0B00BKYFHnL9jRVzKdXhf1EHydbXMAfpCjHAXIVCkFakJinQBDIIw/SC6Yig0u0ddEID2B7LYAP1iE4RZwzTrxCB+ke2jQr8c20Jj6u6ShFOPC9DCw9XupZ4HAalVG00kSgjus+b8zrVji3/LKEhb4EBzp1ctBJCFTeXwej8ZETLoXTylev5dlwZSYAbuBPPcbFR/xAIPx3uDabd1E1gTqUc68ICIGhd197Mb2eRWiSvHr5SPsASerMxId6XA6+iQlRiI+NDR+TGVNmCnfxSlyPFMOHGTmslXOGIqGfBR8l4ft8YVZ70lCwmwTuViGc75ULSf9mM57/LmRzQFMYQtvI8IFK9JaQEMY5xz0HLtR4iyQUUdwR9e0ytBNdWF2a2WPDEnJuY/QJo4GzTlgv4QUxMXI5htsn2rf0HxCFu7Po8DNYLxTS+67hYjDIYWYaEIc8LXWMLyDm9C5fARPJ4F2BIWgzgzkNj+dVjusft2XnziamWdbS5u3kuRlVuz5LQj+R5imnqQAincdZTkTT1nYx+DatlOLllCYIHffpI="}'
                ),
                paste2 = $.PrivateBin.CryptTool.decipher(
                    's9pmKZKOBN7EVvHpTA8jjLFH3Xlz/0l8lB4+ONPACrM=',
                    '', // no password
                    '{"iv":"WA42mdxIVXUwBqZu7JYNiw==","v":1,"iter":10000,"ks":256,"ts":128,"mode":"gcm","adata":"","cipher":"aes","salt":"jN6CjbQMJCM=","ct":"kYYMo5DFG1+w0UHiYXT5pdV0IUuXxzOlslkW/c3DRCbGFROCVkAskHce7HoRczee1N9c5MhHjVMJUIZE02qIS8UyHdJ/GqcPVidTUcj9rnDNWsTXkjVv8jCwHS/cwmAjDTWpwp5ThECN+ov/wNp/NdtTj8Qj7f/T3rfZIOCWfwLH9s4Des35UNcUidfPTNQ1l0Gm0X+r98CCUSYZjQxkZc6hRZBLPQ8EaNVooUwd5eP4GiYlmSDNA0wOSA+5isPYxomVCt+kFf58VBlNhpfNi7BLYAUTPpXT4SfH5drR9+C7NTeZ+tTCYjbU94PzYItOpu8vgnB1/a6BAM5h3m9w+giUb0df4hgTWeZnZxLjo5BN8WV+kdTXMj3/Vv0gw0DQrDcCuX/cBAjpy3lQGwlAN1vXoOIyZJUjMpQRrOLdKvLB+zcmVNtGDbgnfP2IYBzk9NtodpUa27ne0T0ZpwOPlVwevsIVZO224WLa+iQmmHOWDFFpVDlS0t0fLfOk7Hcb2xFsTxiCIiyKMho/IME1Du3X4e6BVa3hobSSZv0rRtNgY1KcyYPrUPW2fxZ+oik3y9SgGvb7XpjVIta8DWlDWRfZ9kzoweWEYqz9IA8Xd373RefpyuWI25zlHoX3nwljzsZU6dC//h/Dt2DNr+IAvKO3+u23cWoB9kgcZJ2FJuqjLvVfCF+OWcig7zs2pTYJW6Rg6lqbBCxiUUlae6xJrjfv0pzD2VYCLY7v1bVTagppwKzNI3WaluCOrdDYUCxUSe56yd1oAoLPRVbYvomRboUO6cjQhEknERyvt45og2kORJOEJayHW+jZgR0Y0jM3Nk17ubpij2gHxNx9kiLDOiCGSV5mn9mV7qd3HHcOMSykiBgbyzjobi96LT2dIGLeDXTIdPOog8wyobO4jWq0GGs0vBB8oSYXhHvixZLcSjX2KQuHmEoWzmJcr3DavdoXZmAurGWLKjzEdJc5dSD/eNr99gjHX7wphJ6umKMM+fn6PcbYJkhDh2GlJL5COXjXfm/5aj/vuyaRRWZMZtmnYpGAtAPg7AUG"}'
                );

                if (!paste1.includes('securely packed in iron') || !paste2.includes('Sol is right')) {
                    throw Error('v1 (SJCL based) pastes could not be deciphered');
                }
            }
        );

        it(
            'supports ZeroBin ciphertext (SJCL & Base64 1.7)',
            function () {
                var newBase64 = global.Base64;
                global.Base64 = require('./base64-1.7').Base64;
                jsdom();
                delete require.cache[require.resolve('./privatebin')];
                require('./privatebin');

                // Of course you can easily decipher the following texts, if you like.
                // Bonus points for finding their sources and hidden meanings.
                var paste1 = $.PrivateBin.CryptTool.decipher(
                    '6t2qsmLyfXIokNCL+3/yl15rfTUBQvm5SOnFPvNE7Q8=',
                    // -- "That's amazing. I've got the same combination on my luggage."
                    Array.apply(0, Array(6)).map(function(_,b) { return b + 1; }).join(''),
                    '{"iv":"aTnR2qBL1CAmLX8FdWe3VA==","v":1,"iter":10000,"ks":256,"ts":128,"mode":"gcm","adata":"","cipher":"aes","salt":"u0lQvePq6L0=","ct":"A3nBTvICZtYy6xqbIJE0c8Veored5lMJUGgGUm4581wjrPFlU0Q0tUZSf+RUUoZj2jqDa4kiyyZ5YNMe30hNMV0oVSalNhRgD9svVMnPuF162IbyhVCwr7ULjT981CHxVlGNqGqmIU6L/XixgdArxAA8x1GCrfAkBWWGeq8Qw5vJPG/RCHpwR4Wy3azrluqeyERBzmaOQjO/kM35TiI6IrLYFyYyL7upYlxAaxS0XBMZvN8QU8Lnerwvh5JVC6OkkKrhogajTJIKozCF79yI78c50LUh7tTuI3Yoh7+fXxhoODvQdYFmoiUlrutN7Y5ZMRdITvVu8fTYtX9c7Fiufmcq5icEimiHp2g1bvfpOaGOsFT+XNFgC9215jcp5mpBdN852xs7bUtw+nDrf+LsDEX6iRpRZ+PYgLDN5xQT1ByEtYbeP+tO38pnx72oZdIB3cj8UkOxnxdNiZM5YB5egn4jUj1fHot1I69WoTiUJipZ5PIATv7ScymRB+AYzjxjurQ9lVfX9QtAbEH2dhdmoUo3IDRSXpWNCe9RC1aUIyWfZO7oI7FEohNscHNTLEcT+wFnFUPByLlXmjNZ7FKeNpvUm3jTY4t4sbZH8o2dUl624PAw1INcJ6FKqWGWwoFT2j1MYC+YV/LkLTdjuWfayvwLMh27G/FfKCRbW36vqinegqpPDylsx9+3oFkEw3y5Z8+44oN91rE/4Md7JhPJeRVlFC9TNCj4dA+EVhbbQqscvSnIH2uHkMw7mNNo7xba/YT9KoPDaniqnYqb+q2pX1WNWE7dLS2wfroMAS3kh8P22DAV37AeiNoD2PcI6ZcHbRdPa+XRrRcJhSPPW7UQ0z4OvBfjdu/w390QxAxSxvZewoh49fKKB6hTsRnZb4tpHkjlww=="}'
                ),
                paste2 = $.PrivateBin.CryptTool.decipher(
                    's9pmKZKOBN7EVvHpTA8jjLFH3Xlz/0l8lB4+ONPACrM=',
                    '', // no password
                    '{"iv":"Z7lAZQbkrqGMvruxoSm6Pw==","v":1,"iter":10000,"ks":256,"ts":128,"mode":"gcm","adata":"","cipher":"aes","salt":"jN6CjbQMJCM=","ct":"PuOPWB3i2FPcreSrLYeQf84LdE8RHjsc+MGtiOr4b7doNyWKYtkNorbRadxaPnEee2/Utrp1MIIfY5juJSy8RGwEPX5ciWcYe6EzsXWznsnvhmpKNj9B7eIIrfSbxfy8E2e/g7xav1nive+ljToka3WT1DZ8ILQd/NbnJeHWaoSEOfvz8+d8QJPb1tNZvs7zEY95DumQwbyOsIMKAvcZHJ9OJNpujXzdMyt6DpcFcqlldWBZ/8q5rAUTw0HNx/rCgbhAxRYfNoTLIcMM4L0cXbPSgCjwf5FuO3EdE13mgEDhcClW79m0QvcnIh8xgzYoxLbp0+AwvC/MbZM8savN/0ieWr2EKkZ04ggiOIEyvfCUuNprQBYO+y8kKduNEN6by0Yf4LRCPfmwN+GezDLuzTnZIMhPbGqUAdgV6ExqK2ULEEIrQEMoOuQIxfoMhqLlzG79vXGt2O+BY+4IiYfvmuRLks4UXfyHqxPXTJg48IYbGs0j4TtJPUgp3523EyYLwEGyVTAuWhYAmVIwd/hoV7d7tmfcF73w9dufDFI3LNca2KxzBnWNPYvIZKBwWbq8ncxkb191dP6mjEi7NnhqVk5A6vIBbu4AC5PZf76l6yep4xsoy/QtdDxCMocCXeAML9MQ9uPQbuspOKrBvMfN5igA1kBqasnxI472KBNXsdZnaDddSVUuvhTcETM="}'
                );

                global.Base64 = newBase64;
                jsdom();
                delete require.cache[require.resolve('./privatebin')];
                require('./privatebin');
                if (!paste1.includes('securely packed in iron') || !paste2.includes('Sol is right')) {
                    throw Error('v1 (SJCL based) pastes could not be deciphered');
                }
            }
        );
    });

    describe('isEntropyReady & addEntropySeedListener', function () {
        it(
            'lets us know that enough entropy is collected or make us wait for it',
            function(done) {
                if ($.PrivateBin.CryptTool.isEntropyReady()) {
                    done();
                } else {
                    $.PrivateBin.CryptTool.addEntropySeedListener(function() {
                        done();
                    });
                }
            }
        );
    });

    describe('getSymmetricKey', function () {
        var keys = [];

        // the parameter is used to ensure the test is run more then one time
        jsc.property(
            'returns random, non-empty keys',
            'nat',
            function(n) {
                var key = $.PrivateBin.CryptTool.getSymmetricKey(),
                    result = (key !== '' && keys.indexOf(key) === -1);
                keys.push(key);
                return result;
            }
        );
    });

    describe('Base64.js vs SJCL.js vs abab.js', function () {
        jsc.property(
            'these all return the same base64 string',
            'string',
            function(string) {
                var base64 = Base64.toBase64(string),
                    sjcl = global.sjcl.codec.base64.fromBits(global.sjcl.codec.utf8String.toBits(string)),
                    abab = window.btoa(Base64.utob(string));
                return base64 === sjcl && sjcl === abab;
            }
        );
    });
});

describe('Model', function () {
    describe('getExpirationDefault', function () {
        before(function () {
            $.PrivateBin.Model.reset();
            cleanup();
        });

        jsc.property(
            'returns the contents of the element with id "pasteExpiration"',
            'array asciinestring',
            'string',
            'small nat',
            function (keys, value, key) {
                keys = keys.map(htmlEntities);
                value = htmlEntities(value);
                var content = keys.length > key ? keys[key] : (keys.length > 0 ? keys[0] : 'null'),
                    contents = '<select id="pasteExpiration" name="pasteExpiration">';
                keys.forEach(function(item) {
                    contents += '<option value="' + item + '"';
                    if (item === content) {
                        contents += ' selected="selected"';
                    }
                    contents += '>' + value + '</option>';
                });
                contents += '</select>';
                $('body').html(contents);
                var result = htmlEntities(
                    $.PrivateBin.Model.getExpirationDefault()
                );
                $.PrivateBin.Model.reset();
                return content === result;
            }
        );
    });

    describe('getFormatDefault', function () {
        before(function () {
            $.PrivateBin.Model.reset();
            cleanup();
        });

        jsc.property(
            'returns the contents of the element with id "pasteFormatter"',
            'array asciinestring',
            'string',
            'small nat',
            function (keys, value, key) {
                keys = keys.map(htmlEntities);
                value = htmlEntities(value);
                var content = keys.length > key ? keys[key] : (keys.length > 0 ? keys[0] : 'null'),
                    contents = '<select id="pasteFormatter" name="pasteFormatter">';
                keys.forEach(function(item) {
                    contents += '<option value="' + item + '"';
                    if (item === content) {
                        contents += ' selected="selected"';
                    }
                    contents += '>' + value + '</option>';
                });
                contents += '</select>';
                $('body').html(contents);
                var result = htmlEntities(
                    $.PrivateBin.Model.getFormatDefault()
                );
                $.PrivateBin.Model.reset();
                return content === result;
            }
        );
    });

    describe('hasCipherData', function () {
        before(function () {
            $.PrivateBin.Model.reset();
            cleanup();
        });

        jsc.property(
            'checks if the element with id "cipherdata" contains any data',
            'asciistring',
            function (value) {
                value = htmlEntities(value).trim();
                $('body').html('<div id="cipherdata">' + value + '</div>');
                $.PrivateBin.Model.init();
                var result = $.PrivateBin.Model.hasCipherData();
                $.PrivateBin.Model.reset();
                return (value.length > 0) === result;
            }
        );
    });

    describe('getCipherData', function () {
        before(function () {
            $.PrivateBin.Model.reset();
            cleanup();
        });

        jsc.property(
            'returns the contents of the element with id "cipherdata"',
            'asciistring',
            function (value) {
                value = htmlEntities(value).trim();
                $('body').html('<div id="cipherdata">' + value + '</div>');
                $.PrivateBin.Model.init();
                var result = htmlEntities(
                    $.PrivateBin.Model.getCipherData()
                );
                $.PrivateBin.Model.reset();
                return value === result;
            }
        );
    });

    describe('getPasteId', function () {
        this.timeout(30000);
        before(function () {
            $.PrivateBin.Model.reset();
            cleanup();
        });

        jsc.property(
            'returns the query string without separator, if any',
            jsc.nearray(jsc.elements(a2zString)),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.nearray(jsc.elements(queryString)),
            'string',
            function (schema, address, query, fragment) {
                var queryString = query.join(''),
                    clean = jsdom('', {
                        url: schema.join('') + '://' + address.join('') +
                             '/?' + queryString + '#' + fragment
                    }),
                    result = $.PrivateBin.Model.getPasteId();
                $.PrivateBin.Model.reset();
                clean();
                return queryString === result;
            }
        );
        jsc.property(
            'throws exception on empty query string',
            jsc.nearray(jsc.elements(a2zString)),
            jsc.nearray(jsc.elements(a2zString)),
            'string',
            function (schema, address, fragment) {
                var clean = jsdom('', {
                        url: schema.join('') + '://' + address.join('') +
                             '/#' + fragment
                    }),
                    result = false;
                try {
                    $.PrivateBin.Model.getPasteId();
                }
                catch(err) {
                    result = true;
                }
                $.PrivateBin.Model.reset();
                clean();
                return result;
            }
        );
    });

    describe('getPasteKey', function () {
        this.timeout(30000);
        jsc.property(
            'returns the fragment of the URL',
            jsc.nearray(jsc.elements(a2zString)),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            jsc.nearray(jsc.elements(base64String)),
            function (schema, address, query, fragment) {
                var fragmentString = fragment.join(''),
                    clean = jsdom('', {
                        url: schema.join('') + '://' + address.join('') +
                             '/?' + query.join('') + '#' + fragmentString
                    }),
                    result = $.PrivateBin.Model.getPasteKey();
                $.PrivateBin.Model.reset();
                clean();
                return fragmentString === result;
            }
        );
        jsc.property(
            'returns the fragment stripped of trailing query parts',
            jsc.nearray(jsc.elements(a2zString)),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            jsc.nearray(jsc.elements(base64String)),
            jsc.array(jsc.elements(queryString)),
            function (schema, address, query, fragment, trail) {
                var fragmentString = fragment.join(''),
                    clean = jsdom('', {
                        url: schema.join('') + '://' + address.join('') + '/?' +
                             query.join('') + '#' + fragmentString + '&' + trail.join('')
                    }),
                    result = $.PrivateBin.Model.getPasteKey();
                $.PrivateBin.Model.reset();
                clean();
                return fragmentString === result;
            }
        );
        jsc.property(
            'throws exception on empty fragment of the URL',
            jsc.nearray(jsc.elements(a2zString)),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            function (schema, address, query) {
                var clean = jsdom('', {
                        url: schema.join('') + '://' + address.join('') +
                             '/?' + query.join('')
                    }),
                    result = false;
                try {
                    $.PrivateBin.Model.getPasteKey();
                }
                catch(err) {
                    result = true;
                }
                $.PrivateBin.Model.reset();
                clean();
                return result;
            }
        );
    });

    describe('getTemplate', function () {
        before(function () {
            $.PrivateBin.Model.reset();
            cleanup();
        });

        jsc.property(
            'returns the contents of the element with id "[name]template"',
            jsc.nearray(jsc.elements(alnumString)),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.nearray(jsc.elements(alnumString)),
            function (id, element, value) {
                id = id.join('');
                element = element.join('');
                value = value.join('').trim();

                // <br>, <hr>, <img> and <wbr> tags can't contain strings,
                // table tags can't be alone, so test with a <p> instead
                if (['br', 'col', 'hr', 'img', 'tr', 'td', 'th', 'wbr'].indexOf(element) >= 0) {
                    element = 'p';
                }

                $('body').html(
                    '<div id="templates"><' + element + ' id="' + id +
                    'template">' + value + '</' + element + '></div>'
                );
                $.PrivateBin.Model.init();
                var template = '<' + element + ' id="' + id + '">' + value +
                    '</' + element + '>',
                    result = $.PrivateBin.Model.getTemplate(id).wrap('<p/>').parent().html();
                $.PrivateBin.Model.reset();
                return template === result;
            }
        );
    });
});

describe('UiHelper', function () {
    // TODO: As per https://github.com/tmpvar/jsdom/issues/1565 there is no navigation support in jsdom, yet.
    // for now we use a mock function to trigger the event
    describe('historyChange', function () {
        this.timeout(30000);
        before(function () {
            $.PrivateBin.Helper.reset();
        });

        jsc.property(
            'redirects to home, when the state is null',
            jsc.elements(schemas),
            jsc.nearray(jsc.elements(a2zString)),
            function (schema, address) {
                var expected = schema + '://' + address.join('') + '/',
                    clean = jsdom('', {url: expected});

                // make window.location.href writable
                Object.defineProperty(window.location, 'href', {
                    writable: true,
                    value: window.location.href
                });
                $.PrivateBin.UiHelper.mockHistoryChange();
                $.PrivateBin.Helper.reset();
                var result = window.location.href;
                clean();
                return expected === result;
            }
        );

        jsc.property(
            'does not redirect to home, when a new paste is created',
            jsc.elements(schemas),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            jsc.nearray(jsc.elements(base64String)),
            function (schema, address, query, fragment) {
                var expected = schema + '://' + address.join('') + '/' + '?' +
                               query.join('') + '#' + fragment.join(''),
                    clean = jsdom('', {url: expected});

                // make window.location.href writable
                Object.defineProperty(window.location, 'href', {
                    writable: true,
                    value: window.location.href
                });
                $.PrivateBin.UiHelper.mockHistoryChange([
                    {type: 'newpaste'}, '', expected
                ]);
                $.PrivateBin.Helper.reset();
                var result = window.location.href;
                clean();
                return expected === result;
            }
        );
    });

    describe('reloadHome', function () {
        this.timeout(30000);
        before(function () {
            $.PrivateBin.Helper.reset();
        });

        jsc.property(
            'redirects to home',
            jsc.elements(schemas),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            jsc.nearray(jsc.elements(base64String)),
            function (schema, address, query, fragment) {
                var expected = schema + '://' + address.join('') + '/',
                    clean = jsdom('', {
                        url: expected + '?' + query.join('') + '#' + fragment.join('')
                    });

                // make window.location.href writable
                Object.defineProperty(window.location, 'href', {
                    writable: true,
                    value: window.location.href
                });
                $.PrivateBin.UiHelper.reloadHome();
                $.PrivateBin.Helper.reset();
                var result = window.location.href;
                clean();
                return expected === result;
            }
        );
    });

    describe('isVisible', function () {
        // TODO As per https://github.com/tmpvar/jsdom/issues/1048 there is no layout support in jsdom, yet.
        // once it is supported or a workaround is found, uncomment the section below
        /*
        before(function () {
            $.PrivateBin.Helper.reset();
        });

        jsc.property(
            'detect visible elements',
            jsc.nearray(jsc.elements(alnumString)),
            jsc.nearray(jsc.elements(a2zString)),
            function (id, element) {
                id = id.join('');
                element = element.join('');
                var clean = jsdom(
                    '<' + element + ' id="' + id + '"></' + element + '>'
                );
                var result = $.PrivateBin.UiHelper.isVisible($('#' + id));
                clean();
                return result;
            }
        );
        */
    });

    describe('scrollTo', function () {
        // TODO Did not find a way to test that, see isVisible test above
    });
});

describe('Alert', function () {
    describe('showStatus', function () {
        before(function () {
            cleanup();
        });

        jsc.property(
            'shows a status message',
            jsc.array(jsc.elements(alnumString)),
            jsc.array(jsc.elements(alnumString)),
            function (icon, message) {
                icon = icon.join('');
                message = message.join('');
                var expected = '<div id="status" role="alert" ' +
                    'class="statusmessage alert alert-info"><span ' +
                    'class="glyphicon glyphicon-' + icon +
                    '" aria-hidden="true"></span> ' + message + '</div>';
                $('body').html(
                    '<div id="status" role="alert" class="statusmessage ' +
                    'alert alert-info hidden"><span class="glyphicon ' +
                    'glyphicon-info-sign" aria-hidden="true"></span> </div>'
                );
                $.PrivateBin.Alert.init();
                $.PrivateBin.Alert.showStatus(message, icon);
                var result = $('body').html();
                return expected === result;
            }
        );
    });

    describe('showError', function () {
        before(function () {
            cleanup();
        });

        jsc.property(
            'shows an error message',
            jsc.array(jsc.elements(alnumString)),
            jsc.array(jsc.elements(alnumString)),
            function (icon, message) {
                icon = icon.join('');
                message = message.join('');
                var expected = '<div id="errormessage" role="alert" ' +
                    'class="statusmessage alert alert-danger"><span ' +
                    'class="glyphicon glyphicon-' + icon +
                    '" aria-hidden="true"></span> ' + message + '</div>';
                $('body').html(
                    '<div id="errormessage" role="alert" class="statusmessage ' +
                    'alert alert-danger hidden"><span class="glyphicon ' +
                    'glyphicon-alert" aria-hidden="true"></span> </div>'
                );
                $.PrivateBin.Alert.init();
                $.PrivateBin.Alert.showError(message, icon);
                var result = $('body').html();
                return expected === result;
            }
        );
    });

    describe('showRemaining', function () {
        before(function () {
            cleanup();
        });

        jsc.property(
            'shows remaining time',
            jsc.array(jsc.elements(alnumString)),
            jsc.array(jsc.elements(alnumString)),
            'integer',
            function (message, string, number) {
                message = message.join('');
                string = string.join('');
                var expected = '<div id="remainingtime" role="alert" ' +
                    'class="alert alert-info"><span ' +
                    'class="glyphicon glyphicon-fire" aria-hidden="true">' +
                    '</span> ' + string + message + number + '</div>';
                $('body').html(
                    '<div id="remainingtime" role="alert" class="hidden ' +
                    'alert alert-info"><span class="glyphicon ' +
                    'glyphicon-fire" aria-hidden="true"></span> </div>'
                );
                $.PrivateBin.Alert.init();
                $.PrivateBin.Alert.showRemaining(['%s' + message + '%d', string, number]);
                var result = $('body').html();
                return expected === result;
            }
        );
    });

    describe('showLoading', function () {
        before(function () {
            cleanup();
        });

        jsc.property(
            'shows a loading message',
            jsc.array(jsc.elements(alnumString)),
            jsc.array(jsc.elements(alnumString)),
            'integer',
            function (icon, message, number) {
                icon = icon.join('');
                message = message.join('');
                var default_message = 'Loading…';
                if (message.length == 0) {
                    message = default_message;
                }
                var expected = '<ul class="nav navbar-nav"><li ' +
                    'id="loadingindicator" class="navbar-text"><span ' +
                    'class="glyphicon glyphicon-' + icon +
                    '" aria-hidden="true"></span> ' + message + '</li></ul>';
                $('body').html(
                    '<ul class="nav navbar-nav"><li id="loadingindicator" ' +
                    'class="navbar-text hidden"><span class="glyphicon ' +
                    'glyphicon-time" aria-hidden="true"></span> ' +
                    default_message + '</li></ul>'
                );
                $.PrivateBin.Alert.init();
                $.PrivateBin.Alert.showLoading(message, number, icon);
                var result = $('body').html();
                return expected === result;
            }
        );
    });

    describe('hideLoading', function () {
        before(function () {
            cleanup();
        });

        it(
            'hides the loading message',
            function() {
                $('body').html(
                    '<ul class="nav navbar-nav"><li id="loadingindicator" ' +
                    'class="navbar-text"><span class="glyphicon ' +
                    'glyphicon-time" aria-hidden="true"></span> ' +
                    'Loading…</li></ul>'
                );
                $('body').addClass('loading');
                $.PrivateBin.Alert.init();
                $.PrivateBin.Alert.hideLoading();
                return !$('body').hasClass('loading') &&
                    $('#loadingindicator').hasClass('hidden');
            }
        );
    });

    describe('hideMessages', function () {
        before(function () {
            cleanup();
        });

        it(
            'hides all messages',
            function() {
                $('body').html(
                    '<div id="status" role="alert" class="statusmessage ' +
                    'alert alert-info"><span class="glyphicon ' +
                    'glyphicon-info-sign" aria-hidden="true"></span> </div>' +
                    '<div id="errormessage" role="alert" class="statusmessage ' +
                    'alert alert-danger"><span class="glyphicon ' +
                    'glyphicon-alert" aria-hidden="true"></span> </div>'
                );
                $.PrivateBin.Alert.init();
                $.PrivateBin.Alert.hideMessages();
                return $('#statusmessage').hasClass('hidden') &&
                    $('#errormessage').hasClass('hidden');
            }
        );
    });

    describe('setCustomHandler', function () {
        before(function () {
            cleanup();
        });

        jsc.property(
            'calls a given handler function',
            'nat 3',
            jsc.array(jsc.elements(alnumString)),
            function (trigger, message) {
                message = message.join('');
                var handlerCalled = false,
                    default_message = 'Loading…',
                    functions = [
                        $.PrivateBin.Alert.showStatus,
                        $.PrivateBin.Alert.showError,
                        $.PrivateBin.Alert.showRemaining,
                        $.PrivateBin.Alert.showLoading
                    ];
                if (message.length == 0) {
                    message = default_message;
                }
                $('body').html(
                    '<ul class="nav navbar-nav"><li id="loadingindicator" ' +
                    'class="navbar-text hidden"><span class="glyphicon ' +
                    'glyphicon-time" aria-hidden="true"></span> ' +
                    default_message + '</li></ul>' +
                    '<div id="remainingtime" role="alert" class="hidden ' +
                    'alert alert-info"><span class="glyphicon ' +
                    'glyphicon-fire" aria-hidden="true"></span> </div>' +
                    '<div id="status" role="alert" class="statusmessage ' +
                    'alert alert-info"><span class="glyphicon ' +
                    'glyphicon-info-sign" aria-hidden="true"></span> </div>' +
                    '<div id="errormessage" role="alert" class="statusmessage ' +
                    'alert alert-danger"><span class="glyphicon ' +
                    'glyphicon-alert" aria-hidden="true"></span> </div>'
                );
                $.PrivateBin.Alert.init();
                $.PrivateBin.Alert.setCustomHandler(function(id, $element) {
                    handlerCalled = true;
                    return jsc.random(0, 1) ? true : $element;
                });
                functions[trigger](message);
                return handlerCalled;
            }
        );
    });
});

describe('PasteStatus', function () {
    describe('createPasteNotification', function () {
        this.timeout(30000);
        before(function () {
            cleanup();
        });

        jsc.property(
            'creates a notification after a successfull paste upload',
            jsc.elements(schemas),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            'string',
            jsc.elements(schemas),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            function (
                schema1, address1, query1, fragment1,
                schema2, address2, query2
            ) {
                var expected1 = schema1 + '://' + address1.join('') + '/?' +
                    encodeURI(query1.join('').replace(/^&+|&+$/gm,'') + '#' + fragment1),
                    expected2 = schema2 + '://' + address2.join('') + '/?' +
                    encodeURI(query2.join('')),
                    clean = jsdom();
                $('body').html('<div><div id="deletelink"></div><div id="pastelink"></div></div>');
                $.PrivateBin.PasteStatus.init();
                $.PrivateBin.PasteStatus.createPasteNotification(expected1, expected2);
                var result1 = $('#pasteurl')[0].href,
                    result2 = $('#deletelink a')[0].href;
                clean();
                return result1 == expected1 && result2 == expected2;
            }
        );
    });

    describe('showRemainingTime', function () {
        this.timeout(30000);
        before(function () {
            cleanup();
        });

        jsc.property(
            'shows burn after reading message or remaining time',
            'bool',
            'nat',
            jsc.nearray(jsc.elements(a2zString)),
            jsc.nearray(jsc.elements(a2zString)),
            jsc.array(jsc.elements(queryString)),
            'string',
            function (
                burnafterreading, remaining_time,
                schema, address, query, fragment
            ) {
                var clean = jsdom('', {
                        url: schema.join('') + '://' + address.join('') +
                             '/?' + queryString + '#' + fragment
                    });
                $('body').html('<div id="remainingtime" class="hidden"></div>');
                $.PrivateBin.PasteStatus.init();
                $.PrivateBin.PasteStatus.showRemainingTime({
                    'burnafterreading': burnafterreading,
                    'remaining_time': remaining_time,
                    'expire_date': remaining_time ? ((new Date()).getTime() / 1000) + remaining_time : 0
                });
                if (burnafterreading) {
                    var result = $('#remainingtime').hasClass('foryoureyesonly') &&
                                !$('#remainingtime').hasClass('hidden');
                } else if (remaining_time) {
                    var result =!$('#remainingtime').hasClass('foryoureyesonly') &&
                                !$('#remainingtime').hasClass('hidden');
                } else {
                    var result = $('#remainingtime').hasClass('hidden') &&
                                !$('#remainingtime').hasClass('foryoureyesonly');
                }
                clean();
                return result;
            }
        );
    });

    describe('hideMessages', function () {
        before(function () {
            cleanup();
        });

        it(
            'hides all messages',
            function() {
                $('body').html(
                    '<div id="remainingtime"></div><div id="pastesuccess"></div>'
                );
                $.PrivateBin.PasteStatus.init();
                $.PrivateBin.PasteStatus.hideMessages();
                return $('#remainingtime').hasClass('hidden') &&
                    $('#pastesuccess').hasClass('hidden');
            }
        );
    });
});

describe('Prompt', function () {
    // TODO: this does not test the prompt() fallback, since that isn't available
    //       in nodejs -> replace the prompt in the "page" template with a modal
    describe('requestPassword & getPassword', function () {
        this.timeout(30000);
        before(function () {
            cleanup();
        });

        jsc.property(
            'returns the password fed into the dialog',
            'string',
            function (password) {
                password = password.replace(/\r+/g, '');
                var clean = jsdom('', {url: 'ftp://example.com/#0'});
                $('body').html(
                    '<div id="passwordmodal" class="modal fade" role="dialog">' +
                    '<div class="modal-dialog"><div class="modal-content">' +
                    '<div class="modal-body"><form id="passwordform" role="form">' +
                    '<div class="form-group"><input id="passworddecrypt" ' +
                    'type="password" class="form-control" placeholder="Enter ' +
                    'password"></div><button type="submit">Decrypt</button>' +
                    '</form></div></div></div></div><div id="cipherdata">{}</div>'
                );
                $.PrivateBin.Model.init();
                $.PrivateBin.Prompt.init();
                $.PrivateBin.Prompt.requestPassword();
                $('#passworddecrypt').val(password);
                $('#passwordform').submit();
                var result = $.PrivateBin.Prompt.getPassword();
                clean();
                return result == password;
            }
        );
    });
});

describe('Editor', function () {
    describe('show, hide, getText, setText & isPreview', function () {
        this.timeout(30000);
        before(function () {
            cleanup();
        });

        jsc.property(
            'returns text fed into the textarea, handles editor tabs',
            'string',
            function (text) {
                var clean = jsdom(),
                    results = [];
                $('body').html(
                    '<ul id="editorTabs" class="nav nav-tabs hidden"><li ' +
                    'role="presentation" class="active"><a id="messageedit" ' +
                    'href="#">Editor</a></li><li role="presentation"><a ' +
                    'id="messagepreview" href="#">Preview</a></li></ul><div ' +
                    'id="placeholder" class="hidden">+++ no paste text +++</div>' +
                    '<div id="prettymessage" class="hidden"><pre id="prettyprint" ' +
                    'class="prettyprint linenums:1"></pre></div><div ' +
                    'id="plaintext" class="hidden"></div><p><textarea ' +
                    'id="message" name="message" cols="80" rows="25" ' +
                    'class="form-control hidden"></textarea></p>'
                );
                $.PrivateBin.Editor.init();
                results.push(
                    $('#editorTabs').hasClass('hidden') &&
                    $('#message').hasClass('hidden')
                );
                $.PrivateBin.Editor.show();
                results.push(
                    !$('#editorTabs').hasClass('hidden') &&
                    !$('#message').hasClass('hidden')
                );
                $.PrivateBin.Editor.hide();
                results.push(
                    $('#editorTabs').hasClass('hidden') &&
                    $('#message').hasClass('hidden')
                );
                $.PrivateBin.Editor.show();
                $.PrivateBin.Editor.focusInput();
                results.push(
                    $.PrivateBin.Editor.getText().length == 0
                );
                $.PrivateBin.Editor.setText(text);
                results.push(
                    $.PrivateBin.Editor.getText() == $('#message').val()
                );
                $.PrivateBin.Editor.setText();
                results.push(
                    !$.PrivateBin.Editor.isPreview() &&
                    !$('#message').hasClass('hidden')
                );
                $('#messagepreview').click();
                results.push(
                    $.PrivateBin.Editor.isPreview() &&
                    $('#message').hasClass('hidden')
                );
                $('#messageedit').click();
                results.push(
                    !$.PrivateBin.Editor.isPreview() &&
                    !$('#message').hasClass('hidden')
                );
                clean();
                return results.every(element => element);
            }
        );
    });
});

describe('PasteViewer', function () {
    describe('run, hide, getText, setText, getFormat, setFormat & isPrettyPrinted', function () {
        this.timeout(30000);
        before(function () {
            cleanup();
        });

        jsc.property(
            'displays text according to format',
            jsc.elements(['plaintext', 'markdown', 'syntaxhighlighting']),
            'nestring',
            function (format, text) {
                var clean = jsdom(),
                    results = [];
                $('body').html(
                    '<div id="placeholder" class="hidden">+++ no paste text ' +
                    '+++</div><div id="prettymessage" class="hidden"><pre ' +
                    'id="prettyprint" class="prettyprint linenums:1"></pre>' +
                    '</div><div id="plaintext" class="hidden"></div>'
                );
                $.PrivateBin.PasteViewer.init();
                $.PrivateBin.PasteViewer.setFormat(format);
                $.PrivateBin.PasteViewer.setText('');
                results.push(
                    $('#placeholder').hasClass('hidden') &&
                    $('#prettymessage').hasClass('hidden') &&
                    $('#plaintext').hasClass('hidden') &&
                    $.PrivateBin.PasteViewer.getFormat() == format &&
                    $.PrivateBin.PasteViewer.getText() == ''
                );
                $.PrivateBin.PasteViewer.run();
                results.push(
                    !$('#placeholder').hasClass('hidden') &&
                    $('#prettymessage').hasClass('hidden') &&
                    $('#plaintext').hasClass('hidden')
                );
                $.PrivateBin.PasteViewer.hide();
                results.push(
                    $('#placeholder').hasClass('hidden') &&
                    $('#prettymessage').hasClass('hidden') &&
                    $('#plaintext').hasClass('hidden')
                );
                $.PrivateBin.PasteViewer.setText(text);
                $.PrivateBin.PasteViewer.run();
                results.push(
                    $('#placeholder').hasClass('hidden') &&
                    !$.PrivateBin.PasteViewer.isPrettyPrinted() &&
                    $.PrivateBin.PasteViewer.getText() == text
                );
                if (format == 'markdown') {
                    results.push(
                        $('#prettymessage').hasClass('hidden') &&
                        !$('#plaintext').hasClass('hidden')
                    );
                } else {
                    results.push(
                        !$('#prettymessage').hasClass('hidden') &&
                        $('#plaintext').hasClass('hidden')
                    );
                }
                clean();
                return results.every(element => element);
            }
        );

        jsc.property(
            'sanitizes XSS',
            jsc.elements(['plaintext', 'markdown', 'syntaxhighlighting']),
            'string',
            // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
            jsc.elements([
                '<PLAINTEXT>',
                '></SCRIPT>">\'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>',
                '\'\';!--"<XSS>=&{()}',
                '<SCRIPT SRC=http://example.com/xss.js></SCRIPT>',
                '\'">><marquee><img src=x onerror=confirm(1)></marquee>"></plaintext\\></|\\><plaintext/onmouseover=prompt(1)><script>prompt(1)</script>@gmail.com<isindex formaction=javascript:alert(/XSS/) type=submit>\'-->"></script><script>alert(document.cookie)</script>"><img/id="confirm&lpar;1)"/alt="/"src="/"onerror=eval(id)>\'">',
                '<IMG SRC="javascript:alert(\'XSS\');">',
                '<IMG SRC=javascript:alert(\'XSS\')>',
                '<IMG SRC=JaVaScRiPt:alert(\'XSS\')>',
                '<IMG SRC=javascript:alert(&quot;XSS&quot;)>',
                '<IMG SRC=`javascript:alert("RSnake says, \'XSS\'")`>',
                '<a onmouseover="alert(document.cookie)">xxs link</a>',
                '<a onmouseover=alert(document.cookie)>xxs link</a>',
                '<IMG """><SCRIPT>alert("XSS")</SCRIPT>">',
                '<IMG SRC=javascript:alert(String.fromCharCode(88,83,83))>',
                '<IMG STYLE="xss:expr/*XSS*/ession(alert(\'XSS\'))">',
                '<FRAMESET><FRAME SRC="javascript:alert(\'XSS\');"></FRAMESET>',
                '<TABLE BACKGROUND="javascript:alert(\'XSS\')">',
                '<TABLE><TD BACKGROUND="javascript:alert(\'XSS\')">',
                '<SCRIPT>document.write("<SCRI");</SCRIPT>PT SRC="httx://xss.rocks/xss.js"></SCRIPT>'
            ]),
            'string',
            function (format, prefix, xss, suffix) {
                var clean = jsdom(),
                    text = prefix + xss + suffix;
                $('body').html(
                    '<div id="placeholder" class="hidden">+++ no paste text ' +
                    '+++</div><div id="prettymessage" class="hidden"><pre ' +
                    'id="prettyprint" class="prettyprint linenums:1"></pre>' +
                    '</div><div id="plaintext" class="hidden"></div>'
                );
                $.PrivateBin.PasteViewer.init();
                $.PrivateBin.PasteViewer.setFormat(format);
                $.PrivateBin.PasteViewer.setText(text);
                $.PrivateBin.PasteViewer.run();
                var result = $('body').html().indexOf(xss) === -1;
                clean();
                return result;
            }
        );
    });
});
