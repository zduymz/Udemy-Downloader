/*
	@duym
	- 14/11/2015: break big thing into small things

	Return: {url:null, ext:null}
 */

function findQuiz(courseID, lectureID) {
    var URL1 = 'https://www.udemy.com/api-2.0/courses/{0}/quizzes/{1}?fields[quiz]=@default,object_index,num_assessments';
    var URL2 = 'https://www.udemy.com/api-2.0/quizzes/{1}/assessments?fields[assessment]=@all';
    //var url = URL1.replace('{0}', courseID).replace('{1}', lectureID);
    var url = URL2.replace('{1}', lectureID);
    var c = '';
    var sendReq = function(u) {
        var xhr = new XMLHttpRequest();
        if (xhr.open("GET", u, !1),
            xhr.setRequestHeader('X-Udemy-Authorization', 'Bearer ' + access_token),
            xhr.send(null), 200 === xhr.status) {
            var r = null;
            try {
                r = JSON.parse(xhr.responseText);
            } catch (err) {
                console.log('[+][error] findQuiz(): can\'t parse response');
                return {
                    'url': null,
                    'ext': null
                };
            }

            for (var i = 0; i < r.results.length; i++) {
                var q1 = '<br><h3>Question: </h3>' + r.results[i].prompt.question + '\n';
                var q2 = r.results[i].prompt.answer ? '<p>' + r.results[i].prompt.answers.toString().replace(/,/g, '<br>') + '</p>' : '<br>';
                var a = r.results[i].correct_response ? '<p>Answer: ' + r.results[i].correct_response.toString() + '</p>' : '<br>';
                c = c.concat(q1, q2, a);
            }

            if (r.next) {
                sendReq(r.next);
            }
        }
    };
    sendReq(url);
    return {
        'url': c,
        'ext': 'html'
    };
}