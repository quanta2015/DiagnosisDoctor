$(document).ready(function($) {
	//var h= $(document.body).height()-50;
	var h = $(document).height();
	$("iframe").height(h-50);

	roles = parseInt($.cookie('role'));
	username = $.cookie('username');

	$("#username").text(username);
	$("#roles").text(" [ "+rolesArr[roles]+" ]");
	 
	
	$("#menu-center").click(function(event) {
		$("#mainframe",parent.document.body).attr("src","userList.html");
	});

	$("#menu-logout").click(function(event) {
		//$("#mainframe",parent.document.body).attr("src","login.html ");
		location.href = "login.html";
	});
	
	$(".headerLogo").click(function(event) {
		$("#mainframe",parent.document.body).attr("src","caseList.html");
	});
	
	
	var barcode = GetQueryString("barcode");
	var sampleStatus = GetQueryString("sampleStatus");
	if (barcode!=null) {
		//$("#mainframe",parent.document.body).attr("src","caseDetail.html?barcode="+barcode+"&status="+sampleStatus);
		$("#mainframe").attr("src","caseDetail.html?barcode="+barcode+"&status="+sampleStatus + "&n="+Math.random());
		console.log($("#mainframe").attr('src'));
		//$('#mainframe').load("caseDetail.html?barcode="+barcode+"&status="+sampleStatus);
		$('#mainframe').attr('src', $('#mainframe').attr('src'));
		
		setTimeout(refreshFrame(),300);
		//$("#mainframe").contentWindow.location.reload(true);
		//location.reload()
		//改变浏览器的url
		barcode=null;
		var json={time:new Date().getTime()};  
		window.history.pushState(json,"","index.html");
	}
	
	function refreshFrame() {
		//console.log(document.getElementById('mainframe').contentWindow.location);
		document.getElementById('mainframe').contentWindow.location.reload(true);
		$('#mainframe').attr('src', $('#mainframe').attr('src'));
	}

	function GetQueryString(name) {
		 var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
		 var r = window.location.search.substr(1).match(reg);
		 if(r!=null)return  unescape(r[2]); return null;
	}

	translatePage(document, 'span');

});