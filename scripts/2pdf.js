/*
	@duym
	- 14/11/2015: break big thing into small things

	Return: {url:null, ext:null}
 */

function findPDF(courseID, lectureID) {
    var URL = 'https://www.udemy.com/api-2.0/users/me/subscribed-courses/{0}/lectures/{1}?video_only=&auto_play=&fields%5Blecture%5D=asset%2Cembed_url&fields%5Basset%5D=asset_type%2Cdownload_urls%2Ctitle&instructorPreviewMode=True';
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
            console.log('[+][error] findPDF(): can\'t parse response');
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
            r.asset.download_urls.hasOwnProperty('E-Book'))) {

            console.log('[+][error] findPDF(): unexpected response');
            return {
                'url': null,
                'ext': null
            };
        }

        if (r._class === 'lecture' &&
            r.asset.asset_type === 'E-Book') {
        	o.ext = 'pdf';
            for (var i in r.asset.download_urls['E-Book']) {
                o.url = r.asset.download_urls['E-Book'][i].file;
            }
        } else {
        	//
        }
    }

}