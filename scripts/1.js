/*
chrome.runtime.onMessage.addListener( function(message, sender, sendResponse) {
		console.log(message);
		course_name = message.coursename;
		data = message.datalist;
		addHeader();
		addTable();
		//chrome.runtime.onMessage.removeListener(f);
});

*/

var alreadyrun = false;
var data = [];
var course_name = '';
//var author = 'Simon Jack';
//addHeader();
//addTable();

function showup(msg){
	if (!alreadyrun){
		data = msg.data;
		course_name = msg.coursename;
		addHeader();
		addTable();
		alreadyrun = true;
		console.log(data);
	}
}


function addTable() {
    var myTableDiv = document.getElementById("content-generation");
    var table = document.createElement('table');

    var tableBody = document.createElement('tbody');
    table.appendChild(tableBody);

    var chapter_name = '';

	for (var i=0; i<data.length; i++) {
		if (data[i].chapter === chapter_name)  continue
		chapter_name = data[i].chapter;
		var txt = 'Section ' + data[i].chapterNo + ' : ' + chapter_name;
		var st = document.createElement('section');
		st.id = data[i].chapter;
		var h3 = document.createElement('h3');
		h3.appendChild(document.createTextNode(txt));
		st.appendChild(h3);
		myTableDiv.appendChild(st);
	}

	for (var i=0; i<data.length; i++) {
		var st = document.getElementById(data[i].chapter)
		var tr = document.createElement('tr');
		tableBody.appendChild(tr);
       
		//create checkbox
		var td = document.createElement('td');
		var chkbox = document.createElement('input');
		chkbox.type = 'checkbox';
		chkbox.id = i;
		td.appendChild(chkbox);
		tr.appendChild(td);

		//create lecture Name
		var td = document.createElement('td');
		if (data[i].quiz) {
			// deal with type quiz
			var txt = 'Quiz ' + data[i].lectureNo + ' : ' + data[i].lecture;
		} else {
			var txt = 'Lecture ' + data[i].lectureNo + ' : ' + data[i].lecture;
		}
		//add link hidden
		//var a = document.createElement('a');
		//a.href = data[i].fileUrl;
		//a.className = 'download';
		//a.download = data[i].lecture;
		//a.textContent = txt;
		//td.appendChild(a);
		td.appendChild(document.createTextNode(txt));

		tr.appendChild(td);
		st.appendChild(tr);
    }
    //myTableDiv.appendChild(table);
    
	var div = document.getElementById('button-generation');
	var st = document.createElement('section');
	div.appendChild(st);
	var tr = document.createElement('tr');
	var td = document.createElement('td');
	td.style.verticalAlign = "middle";
	// Add checkbox
	var cb = document.createElement('input');
	cb.type = 'checkbox';
	cb.id = '9999';
	cb.onclick = onCheckedBox;
	td.appendChild(cb);
	tr.appendChild(td);
	st.appendChild(tr);

	//Add text CheckALL
	var td = document.createElement('td');
	td.textContent = "Check All";
	td.style.verticalAlign = "middle";
	tr.appendChild(td);
	st.appendChild(tr);

	// Add download button        
	var button = document.createElement('button');
	button.type = 'button';
	button.innerHTML = 'Download';        
	button.onclick = onDownloadClick;
	button.style.width = '90px';
	var td = document.createElement('td');
	td.style.paddingLeft = '20px';
	td.appendChild(button);
	tr.appendChild(td);
	st.appendChild(tr);

	// Add download text file button
	var button = document.createElement('button');
	button.type = 'button';
	button.innerHTML = 'Get Link';        
	button.onclick = onGetLinkClick;
	button.style.width = '90px';
	var td = document.createElement('td');
	td.style.paddingLeft = '20px';
	td.appendChild(button);
	tr.appendChild(td);
	st.appendChild(tr);
}

function addHeader() {
	var h0 = document.getElementById("header-generation");
	var h = document.createElement('header');
	var h1 = document.createElement('h1');
	h1.className = "header";
	h1.textContent = course_name;
	h.appendChild(h1);
	h0.appendChild(h);
}

//for video, pdf
function subdownload1(e, t, n) { 
	{
		var a = document,
		o = arguments,
		i = a.createElement("a"),
		d = (o[0], o[1]);
		o[2] || "text/plain"
	}
	if (i.href = "data:" + n + "charset=utf-8," + escape(e), window.MSBlobBuilder) {
		var r = new MSBlobBuilder;
		return r.append(e),
		navigator.msSaveBlob(r, t)
	}
	if ("download" in i)
		return i.setAttribute("download", d), i.innerHTML = "downloading...", a.body.appendChild(i), setTimeout(function () {
			var e = a.createEvent("MouseEvents");
			e.initMouseEvent("click", !0, !1, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null),
			i.dispatchEvent(e),
			a.body.removeChild(i)
		}, 66), !0;
	var l = a.createElement("iframe");
	return a.body.appendChild(l),
	l.src = "data:" + (o[2] ? o[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(e),
	setTimeout(function () {
		a.body.removeChild(l)
	}, 333),
	!0
}

function downloadFile1(msg1, msg2){
	for (var i = 0; i < msg1.length; i++) {
		chrome.downloads.download({
			url: msg1[i],
			filename: msg2[i]
		});
	}
}

//for text/html file
function downloadFile2(msg1, msg2){
	for (var i=0; i<msg1.length; i++) {
		subdownload1(msg1[i], msg2[i], 'text/html')
	}
}

function onDownloadClick() {
	var a1 = new Array();
	var a2 = new Array();
	var b1 = new Array();
	var b2 = new Array();

	var c = document.getElementsByTagName('input');
	for (var i = 0; i < c.length; i++) {
		if (c[i].type == "checkbox" && c[i].id != "9999" && c[i].checked) {
			var j = parseInt(c[i].id);
			if (data[j].fileType === 'html' || data[j].fileType === 'youtube') {
				a2.push(data[j].fileUrl);
				b2.push(data[j].chapterNo + ' - ' + data[j].lectureNo + ' - ' + fixFileName(data[j].lecture) + '.' + data[j].fileType);
			} else {
				a1.push(data[j].fileUrl);
				b1.push(data[j].chapterNo + ' - ' + data[j].lectureNo + ' - ' + fixFileName(data[j].lecture) + '.' + data[j].fileType);
			}
		}
	}
	// Don't send message with empty list
	if (a1.length > 0) {
		downloadFile1(a1, b1);
	}
	if (a2.length > 0) {
		downloadFile2(a2, b2);
	}
}

function onGetLinkClick() {
	var c = '';
	for (var i=0; i<data.length; i++) {
		if (data[i].fileType === 'html') continue
		c = c.concat(data[i].fileUrl+'\n')
	}
	subdownload1(c,course_name+'.txt', 'text/html');
}

function onCheckedBox(){
	var c = document.getElementsByTagName('input');
	var f = document.getElementById('9999');
	if (f.checked) {
		for (var i = 0; i < c.length; i++) 
			c[i].checked = true;
	} else {
		for (var i = 0; i < c.length; i++) 
			c[i].checked = false;
	}
}

function fixFileName(s) {
	return s.replace(/[\\\/\?\:\*\"\|\>\<]/g,'');
}