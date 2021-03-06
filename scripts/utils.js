chrome.extension.sendMessage({
    type: 'open'
}, function(result) {
    var n = setInterval(function() {
        "complete" === document.readyState && clearInterval(n);
    }, 10);
    client_id = result.client_id;
    access_token = result.access_token;
});

var htmlEnDeCode = (function() {
    var charToEntityRegex,
        entityToCharRegex,
        charToEntity,
        entityToChar;

    function resetCharacterEntities() {
        charToEntity = {};
        entityToChar = {};
        // add the default set
        addCharacterEntities({
            '&amp;': '&',
            '&gt;': '>',
            '&lt;': '<',
            '&quot;': '"',
            '&#39;': "'"
        });
    }

    function addCharacterEntities(newEntities) {
        var charKeys = [],
            entityKeys = [],
            key, echar;
        for (key in newEntities) {
            echar = newEntities[key];
            entityToChar[key] = echar;
            charToEntity[echar] = key;
            charKeys.push(echar);
            entityKeys.push(key);
        }
        charToEntityRegex = new RegExp('(' + charKeys.join('|') + ')', 'g');
        entityToCharRegex = new RegExp('(' + entityKeys.join('|') + '|&#[0-9]{1,5};' + ')', 'g');
    }

    function htmlEncode(value) {
        var htmlEncodeReplaceFn = function(match, capture) {
            return charToEntity[capture];
        };

        return (!value) ? value : String(value).replace(charToEntityRegex, htmlEncodeReplaceFn);
    }

    function htmlDecode(value) {
        var htmlDecodeReplaceFn = function(match, capture) {
            return (capture in entityToChar) ? entityToChar[capture] : String.fromCharCode(parseInt(capture.substr(2), 10));
        };

        return (!value) ? value : String(value).replace(entityToCharRegex, htmlDecodeReplaceFn);
    }

    resetCharacterEntities();

    return {
        htmlEncode: htmlEncode,
        htmlDecode: htmlDecode
    };
})();

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function send(url, headers, dataType, success_function, error_function) {
    $.ajax({
        url: url,
        type: 'GET',
        headers: headers,
        dataType: dataType,
        success: success_function,
        error: error_function
    });
}

//find audio link
function pA(u) {
    //setup xmlhttprequest
    var xhr = new XMLHttpRequest;
    if (xhr.open("GET", u, !1), xhr.send(null), 200 === xhr.status) {
        var rs = xhr.responseText;
        //do some stupid things
        rs = rs.toString().replace(/(\n|\r|\t|\s)+/g, '');
        rs = rs.replace(/'/g, '"');
        var info = AUDIO_REGX.exec(rs);

        //if find audio by regex fails
        if (!info) {
            var arr = rs.split('script');
            for (var i in arr) {
                if (arr[i].includes('jwplayer') && arr[i].includes('plugins')) {
                    info = AUDIO_REGX.exec(arr[i]);
                    break;
                }
            } //end for
            info || sS('parse audio fails');
        } //end if

        // got audio info
        if (info) {
            //convert info to JSON format
            try {
                var info_json = JSON.parse(info[1]);
            } catch (err) {
                sS(err);
            }

            if (info_json.playlist && info_json.playlist[0].sources) {
                var file = info_json.playlist[0].sources.file;
                return {
                    'url': decodeURIComponent(file),
                    'ext': 'mp3'
                };
            } //end if
        } //end if
    } //end if
}

//find video link
function pV(u) {
    //set up xmlhttprequest
    var xhr = new XMLHttpRequest();
    if (xhr.open("GET", u, !1), xhr.send(null), 200 === xhr.status) {
        var rs = xhr.responseText;
        //do some stupid things
        rs = rs.toString().replace(/(\n|\r|\t|\s)+/g, '');
        rs = rs.replace(/'/g, '"');

        //regex use to catch link 
        var reg = /<source([^>]*)\/>/g;

        //convert to json type
        var makeJson = function(s) {
            try {
                var src = s.substring(s.indexOf('src') + 5, s.indexOf('type') - 1);
                var type = s.substring(s.indexOf('type') + 12, s.indexOf('data-res') - 1);
                var res = s.substring(s.indexOf('data-res') + 10, s.length - 3);
            } catch (e) {
                sS('parse video fails');
                console.log(e);
            }
            return {
                src: src,
                type: type,
                res: res
            };
        };
        var info = [];
        var v = rs.match(reg);

        for (var i in v) {
            info.push(makeJson(v[i]));
        }
        //always choose best solution
        var i = info.pop()

        return {
            'url': htmlEnDeCode.htmlDecode(i.src),
            'ext': i.type
        }
    }
}

//find pdf link
function pP(u) {
    //setup xmlhttprequest
    var xhr = new XMLHttpRequest;
    if (xhr.open("GET", u, !1), xhr.send(null), 200 === xhr.status) {
        var rs = xhr.responseText;
        //do some stupid things
        rs = rs.toString().replace(/(\n|\r|\t|\s)+/g, '');
        rs = rs.replace(/'/g, '"');
        var info = PDF_REGX.exec(rs);

        //if find pdf by regex fails
        if (!info) {
            var arr = rs.split('script');
            for (var i in arr) {
                if (arr[i].includes('ebookviewer') && arr[i].includes('fileUrl')) {
                    info = PDF_REGX.exec(arr[i]);
                    break;
                }
            } //end for
            info || sS('parse pdf fails');
            console.log(info, rs);
        } //end if

        // got pdf info
        if (info) {
            var file = /fileUrl\:\"([\w\\\{\:\/\.\-\?\=\%\&\+\,\}\[\]\~\#]+)\"/.exec(info[1]);
            if (file) {
                return {
                    'url': decodeURIComponent(file[1]),
                    'ext': 'pdf'
                };
            } else {
                sS('parse pdf fails - step2');
            }
        } //end if
    } //end if
}

// get quiz
//pQ(r[i].id, chapter, chapter_no, quiz, quiz_no);
function pQ(id, ct, cn, qz, qzn) {
    /* 	request url sample: "https://www.udemy.com/api-2.0/quizzes/31948/assessments?page_size=250&fields[assessment]=@all"
	expected result: {count: n, next:null, previous:null, results:[]}
	element of results array: {	class:'assignment',
								id:1000, type:'multiple-choice',
								created:'yyyy-mm-ddThh:mm:ssZ',
								correct_response:[],
								prompt: {question: "this is question",
										answers:[],
										relatedLectureIds:[]},
								related_lectures:[],
								score: n,
								updated: "yyyy-mm-ddThh:mm:ssZ"}

	UPDATE 2015/28/07: if result.next != null -> continue fetching result.next to process
    */
    //content variable
    var c = '';
    // compose request url
    u = URL3.replace('{0}', id);
    //setup xmlhttprequest
    function srq(u) {
        var xhr = new XMLHttpRequest();
        if (xhr.open("GET", u, !1),
            xhr.setRequestHeader('Authorization', 'Bearer ' + access_token),
            xhr.setRequestHeader('X-Udemy-Authorization', 'Bearer ' + access_token),
            xhr.send(null), 200 === xhr.status) {
            var rs = JSON.parse(xhr.responseText);
            console.log(rs);

            for (var i = 0; i < rs.results.length; i++) {
                var q1 = '<br><h3>Question: </h3>' + rs.results[i].prompt.question + '\n';
                var q2 = rs.results[i].prompt.answers ? '<p>' + rs.results[i].prompt.answers.toString().replace(/,/g, '<br>') + '</p>' : '<br>';
                var a = rs.results[i].correct_response ? '<p>Answer: ' + rs.results[i].correct_response.toString() + '</p>' : '<br>';
                c = c.concat(q1, q2, a);
            }

            if (rs.next) {
                srq(rs.next);
            }
        }
    }

    //send request
    srq(u);

    list.push({
        chapter: ct,
        lecture: qz,
        fileUrl: c,
        lectureNo: qzn,
        chapterNo: cn,
        fileType: 'html',
        quiz: true
    });
}


//wrapper function of pV(), pP() and pA()
function wF(courseId, lectureId, chapter, chapter_no, lecture, lecture_no) {
    // send request to find lecture type (pdf, video, text, audio)
    var url = URL1.replace('{0}', courseId).replace('{1}', lectureId);

    //setup xmlhttprequest
    var xhr = new XMLHttpRequest;
    if (xhr.open("GET", url, !1),
        xhr.setRequestHeader('X-Udemy-Bearer-Token', access_token),
        xhr.setRequestHeader('X-Udemy-Client-Id', client_id),
        xhr.setRequestHeader('X-Udemy-Snail-Case', 'false'),
        xhr.send(null), 200 === xhr.status) {

        var r = JSON.parse(xhr.responseText);
        /*
			expected result in format:
			{
				class: "lecture",
				embed url: "/something/...",
				id: lecture id,
				asset {
					class: "asset",
					asset type: "video",
					id : ,
					title: "",
					download urls: {
						Video: []
					}
				}
			}
		*/
        // if get unexpected result
        if (!(r && r.type && r.html)) {}

        //get src="https://udemy.com/embeded/000000/"
        var s = (function(a) {
            var b = a.split('src=');
            if (b[1]) {
                var c = b[1].split('"');
                if (c[1]) {
                    return decodeURI(c[1]);
                }
            }
        })(r.html);

        //Video
        if (r['_class'] === 'lecture' &&
            r.asset &&
            r.asset['asset type'] == 'Video' &&
            r.asset['download urls'] &&
            r.asset['donwload urls']['Video']) {
            //
            //var o = pV(s);
            var o = {};
            for (var i in r.asset['donwload urls']['Video']) {
                if (r.asset['donwload urls']['Video']['label'] == '720') {
                    o.url = r.asset['donwload urls']['Video']['file'];
                    break;
                } else if (r.asset['donwload urls']['Video']['label'] == '360') {
                    o.url = r.asset['donwload urls']['Video']['file'];
                }
            }
            if (r.asset['title']) {
                o.ext = r.asset.title.substr(r.asset.title.length - 3, 3);
            }
        }
        // pdf
        else if (r.class == 'lecture' &&
            r.asset &&
            r.asset['asset type'] == 'E-Book' &&
            r.asset['download urls'] &&
            r.asset['donwload urls']['E-Book']) {
            //
            //var o = pP(s);
            var o = {};
            o.url = r.asset['donwload urls']['E-Book'][0]['file'];
            o.ext = 'pdf';
        }
        // audio
        else if (r.class == 'lecture' &&
            r.asset &&
            r.asset['asset type'] == 'Audio' &&
            r.asset['download urls'] &&
            r.asset['donwload urls']['Audio']) {
            //
            //var o = pA(s);
            var o = {};
            o.url = r.asset['donwload urls']['Audio'][0]['file'];
            o.ext = 'mp3';
        }
        // text file dont need link "src"
        else if (r.type == 'Article') {
            var o = {
                'url': r.html,
                'ext': 'html'
            };
        }


        // push to the list
        try {
            list.push({
                chapter: chapter,
                lecture: lecture,
                fileUrl: o.url,
                lectureNo: lecture_no,
                chapterNo: chapter_no,
                fileType: o.ext,
            });
        } catch (e) {
            console.log(r, s);
        }
    }
}

// download function for debugging
function download(strData, strFileName, strMimeType) {
    var D = document,
        A = arguments,
        a = D.createElement("a"),
        d = A[0],
        n = A[1],
        t = A[2] || "text/plain";

    //build download link:
    a.href = "data:" + strMimeType + "charset=utf-8," + escape(strData);


    if (window.MSBlobBuilder) { // IE10
        var bb = new MSBlobBuilder();
        bb.append(strData);
        return navigator.msSaveBlob(bb, strFileName);
    } /* end if(window.MSBlobBuilder) */



    if ('download' in a) { //FF20, CH19
        a.setAttribute("download", n);
        a.innerHTML = "downloading...";
        D.body.appendChild(a);
        setTimeout(function() {
            var e = D.createEvent("MouseEvents");
            e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            D.body.removeChild(a);
        }, 66);
        return true;
    }; /* end if('download' in a) */



    //do iframe dataURL download: (older W3)
    var f = D.createElement("iframe");
    D.body.appendChild(f);
    f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
    setTimeout(function() {
        D.body.removeChild(f);
    }, 333);
    return true;
}

//get course id
function getCourseID() {
    var a1, a2;
    a1 = getElementByXpath(XPATH1).getAttribute('data-course-id');
    a2 = getElementByXpath(XPATH2).getAttribute('data-courseid');
    if (a1 == a2) return a1;
}

//if errors detected, call this function
function sS(reason) {
    var msg = "[+] Udemy Downloader Error: \n" + reason;
    console.log(msg);
}


// var list = [];
// var access_token = undefined;
// var client_id = undefined;
// var course_info = {};
// var SELECTOR = '//*[@id="udemy"]/div[@data-course-id]';

// //get quizzes
// var URL3 = 'https://www.udemy.com/api-2.0/quizzes/{0}/assessments?fields[assessment]=@all';

// //get all information course - {0} -> course id
// var URL2 = 'https://www.udemy.com/api-1.1/courses/{0}/curriculum?fields[chapter]=@min,description&fields[lecture]=@min,completionRatio,progressStatus&fields[quiz]=@min,completionRatio';

// //get information of particular lecture - {0} -> course id - {1} -> lecture id
// var URL1 = 'https://www.udemy.com/api-2.0/users/me/subscribed-courses/{0}/lectures/{1}?video_only=0';

// //using APIv2, we dont need regex anymore
// var VIDEO_REGX = /jwplayer\(({[\w\\\{\:\"\/\.\-\?\=\%\&\+\,\}\[\]\~\#\…\;\(\)]+)\);\</gi;
// var PDF_REGX = /ebookviewer\(({[\w\\\{\:\"\/\.\-\?\=\%\&\+\,\}\[\]\~\#\…\;\(\)]+})\)\;\</g;
// var AUDIO_REGX = /jwplayer\(({[\w\\\{\:\"\/\.\-\?\=\%\&\+\,\}\[\]\~\#\…\;\(\)]+)\);\</gi;

// var XPATH1 = '//*[@id="course-taking-page"]';
// var XPATH2 = '//*[@id="tab-curriculum"]';



/*
PROBLEM-1: regex for for finding video and pdf got bug, i really dont know why 
-> i guess the bug caused by '…', when the link is long long, chrome automatically shorten it by character '…',
just add it to regex value, problem is fixed as well
*/

/*
IMPROVEMENT1: need better quiz format
*/