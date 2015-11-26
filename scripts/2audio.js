/*
	@duym
	- 14/11/2015: break big thing into small things

	Return: {url:null, ext:null}
 */

function findAudio(courseID, lectureID) {
    var URL = 'https://www.udemy.com/api-2.0/users/me/subscribed-courses/{0}/lectures/{1}?video_only=0';
    var url = URL.replace('{0}', courseID).replace('{1}', lectureID);
    var xhr = new XMLHttpRequest();
    if (xhr.open("GET", url, !1),
        xhr.setRequestHeader('X-Udemy-Authorization', 'Bearer ' + access_token),
        xhr.send(null), 200 === xhr.status) {
        var r = null;
        var o = {};
        try {
            r = JSON.parse(xhr.responseText);
        } catch (err) {
            console.log('[+][error] findAudio(): can\'t parse response');
            return {
                'url': null,
                'ext': null
            };
        }

        // if get unexpected result
        if (!(r &&
            r.hasOwnProperty('_class') &&
            r.hasOwnProperty('asset') &&
            r.asset.hasOwnProperty('asset_type') &&
            r.asset.hasOwnProperty('download_urls') &&
            r.asset.download_urls.hasOwnProperty('Audio') &&
            r.asset.hasOwnProperty('title'))) {
            console.log('[+][error] findAudio(): unexpected response');
            return {
                'url': null,
                'ext': null
            };
        }

        if (r._class === 'lecture' &&
            r.asset.asset_type === 'Audio') {

            for (var i in r.asset.download_urls.Audio) {
                o.url = r.asset.download_urls.Audio[i].file;
            }
        } else {
            //
        }

    }
}