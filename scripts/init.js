chrome.extension.sendMessage({
    type: 'open'
}, function(result) {
    var n = setInterval(function() {
        "complete" === document.readyState && clearInterval(n);
    }, 10);
    client_id = result.client_id;
    access_token = result.access_token;
});

function getCourseID() {
    var a1, a2;
    a1 = getElementByXpath(XPATH1).getAttribute('data-course-id');
    a2 = getElementByXpath(XPATH2).getAttribute('data-courseid');
    if (a1 == a2) return a1;
}

function getLectureInfo(client_id, access_token) {
    var course_id = getCourseID() || console.log('[+][error] getCourseID()');

    var URL = 'https://www.udemy.com/api-2.0/courses/{0}/subscriber-curriculum-items?fields[asset]=@default&fields[chapter]=@default,object_index&fields[lecture]=@default,asset,content_summary,num_discussions,num_external_link_assets,num_notes,num_source_code_assets,object_index,url&fields[quiz]=@default,content_summary,object_index,url&page_size=9999';
    var course_info_url = URL.replace('{0}', course_id);
    var course_name = document.getElementsByClassName('course-title')[0].textContent.trim() || 'Unknown course';
    var headers = {
        'X-Udemy-Authorization': 'Bearer ' + access_token
    };
    send(encodeURI(course_info_url), headers, 'json', function(result) {
        console.log(result);
        var r = result.results;
        var chapter = '';
        var chapterNo = 0;
        var o;
        for (var i = 0; i < r.length; i++) {
            if (r[i].hasOwnProperty('_class') && r[i]._class === 'chapter') {
                chapter = r[i].title;
                chapterNo += 1;
                continue;
            }

            // Video
            else if (r[i].hasOwnProperty('_class') &&
                r[i]._class === 'lecture' &&
                r[i].hasOwnProperty('asset') &&
                r[i].asset.asset_type === 'Video') {
                o = findVideo(course_id, r[i].id);
            }

            // PDF
            else if (r[i].hasOwnProperty('_class') &&
                r[i]._class === 'lecture' &&
                r[i].hasOwnProperty('asset') &&
                r[i].asset.asset_type === 'E-Book') {
                o = findPDF(course_id, r[i].id);
            }

            // Audio
            else if (r[i].hasOwnProperty('_class') &&
                r[i]._class === 'lecture' &&
                r[i].hasOwnProperty('asset') &&
                r[i].asset.asset_type === 'Audio') {
                o = findAudio(course_id, r[i].id);
            }

            //Article - text file
            else if (r[i].hasOwnProperty('_class') &&
                r[i]._class === 'lecture' &&
                r[i].hasOwnProperty('asset') &&
                r[i].asset.asset_type === 'Article') {
                //
            }

            //Quiz
            else if (r[i].hasOwnProperty('_class') &&
                r[i]._class === 'quiz') {
                o = findQuiz(course_id, r[i].id);
                o.quiz = true;
            }

            //Worst thing come here
            else {
                console.log('[+][warning] getLectureInfo() miss', r[i]);
            }

            try {
                list.push({
                    chapter: chapter,
                    lecture: r[i].title,
                    fileUrl: o.url,
                    lectureNo: r[i].object_index,
                    chapterNo: chapterNo,
                    fileType: o.ext,
                    quiz: o.quiz
                });
                o={};
            } catch (err) { o={};}
        }

        console.log(list);
        chrome.extension.sendMessage({
            type: 'show',
            data: list,
            name: course_name
        }, function(r) {});
    }, function(r) {
        sS('We can not find Video Link') && console.log(r);
    });
}


function main() {
    //initialize empty list
    list = [];
    //check user login
    if (client_id && access_token) {
        getLectureInfo(client_id, access_token);
    } else {
        alert('You have not login \nPlease login and re-open new tab');
    }
}


var list = [];
var access_token;
var client_id;
var course_info = {};
var XPATH1 = '//*[@id="course-taking-page"]';
var XPATH2 = '//*[@id="tab-curriculum"]';