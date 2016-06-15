//提示消息对话框
function notifyInfo(info) {
	alertify.set({ delay: 3000 });
	alertify.success(info);
}

$(document).ready(function($) {

	$("body").height($(document).height());

	$(".sig").signature({color: '#000',thickness: 4,guideline: true});

	$.ajax({  
      type: "get",  
      url: "user/getUser",  
      contentType: "application/json", //必须有
      dataType: "json", //表示返回值类型，不必须
      success: function(data){  	
			console.log(data);
			if (data.code==0) {
				$(".sig").signature('draw', data.data.jsonsign); 
				$("#oldPwd").val(data.data.password);
				$("#username").val(data.data.nickname);
			}else if (data.code==-1) {
				relogin();
			};
      }  
   });

	$("#menu-pwd").click(function(event) {
		$("#fm-pwd").show();
		$("#fm-info").hide();
		$("#fm-sig").hide();
	});

	$("#menu-info").click(function(event) {
		$("#fm-info").show();
		$("#fm-pwd").hide();
		$("#fm-sig").hide();
	});

	$("#menu-sig").click(function(event) {
		$("#fm-sig").show();
		$("#fm-pwd").hide();
		$("#fm-info").hide();
	});

	$("#btnClearSig").click(function() { 
    	$(".sig").signature('clear'); 
	}); 

	$("#btnSaveSig").click(function() { 
    	sigData = $(".sig").signature('toJSON'); 
    	console.log(sigData);

    	jsonData = JSON.stringify({'jsonsign':sigData});

		$.ajax({  
	         type: "post",  
	         url: "user/saveSignature",  
	         contentType: "application/json", //必须有
             dataType: "json", //表示返回值类型，不必须
			 data: jsonData, 
	         success: function(data){  	
					console.log(data);
					if (data.code==0) { 
						notifyInfo("保存数字签名成功！");
					}else if (data.code==-1) {
		     			relogin();
		     		} else {
						errorInfo(data.message);
					}
	         }  
	     });
	}); 

	

})
