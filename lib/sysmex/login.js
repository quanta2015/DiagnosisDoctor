function showError(msg) {

	//$("#loginMsg").style.visibility="visible";
	document.getElementById("loginMsg").style.visibility="visible";
	$("#error").text(msg);
}

$(document).ready(function($) {

	
	$(document).keyup(function(e){
    	if (e.keyCode == 13) 
    	{
        	$("#btnLogin").click();
    	}
	})

	$("#btnLogin").on('click', function(event) {
		usr = $("#username").val();
		pwd = $("#password").val();
		
		if (usr=="") {
			showError("请输入用户名");
			return;
		}
		if (pwd=="") {
			showError("请输入密码");
			return;
		}

		$.ajax({  
	         type: "POST",    
	         url: "userlogin",
			 	contentType: "application/json", //必须有
            dataType: "json", //表示返回值类型，不必须
			 	data: JSON.stringify({ 'userid': usr, 'password': pwd}), 
	         success: function(data){  	
					//console.log(data);
					code = data.code;
					if (code=="0") {
						$.cookie('userid', data.data.userid, {expires:30});
						$.cookie('password', data.data.password, {expires:30});
						$.cookie('username', data.data.username, {expires:30});
						$.cookie('role', data.data.role, {expires:30});
						location.href = "index.html";
					}else if (code="99") {
						showError(data.message);
					} else {
						errorInfo(data.message);
					}
	         }
	     }); 
		
	});
	translatePage(document, 'span');

})


