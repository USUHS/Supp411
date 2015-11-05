var DKI;
if (!DKI) {DKI={};}
DKI.CompletionCertificate = function (contentAPI) {
	var nameSpan = document.getElementById("certificate_studentName");
	var courseSpan = document.getElementById("certificate_courseName");
	var dateSpan = document.getElementById("certificate_date");
	var printLink = document.getElementById("certificate_print");
	var setText = function (element, text) {		
		//try/catch because IE8 is retarded and in 1% of use cases cant seem to use innerHTML
		try {
			element.innerHTML = text;
		}
		catch(e){
			element.innerText = text;
		}
	};
	contentAPI.getStudentName(function (name) {
		setText(nameSpan, name);
		setText(courseSpan, contentAPI.getCourseName());
		setText(dateSpan, new Date().toLocaleDateString());
		$(printLink).on(settings.clickEvent, function (e) {
			contentAPI.printPage();
			return false;
		});
	});
	$(document).trigger(DKI.CompletionCertificate.events.ready);
};

var printPage = function () {print();};

DKI.CompletionCertificate.events = {
	ready: "COMPLETION_CERTIFICATE_READY"
};