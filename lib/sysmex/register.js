var myreg = /^(((13[0-9]{1})|(14[0-9]{1})|(17[0]{1})|(15[0-3]{1})|(15[5-9]{1})|(18[0-9]{1}))+\d{8})$/;
var phoneFlag,pwdFlag,repwdFlag,usrFlag,smsFlag,hostFlag,handle;
var regTime = 60;

function showError(msg) {
	$("#loginTil").hide();
	$("#loginMsg").show();
	$("#error").text(msg);
}

function ToLoginPage() {
	location.href = "login.html";
}



$(document).ready(function($) {

	$(".row-reg").show();
	$(".row-info").hide();



	$("#phone").blur(function(event) {
		phoneFlag = false;
		phoneStr = $("#phone").val();
		if (phoneStr=="") {
			message = "手机号码不能为空！"; 
		}else if (phoneStr.length!=11) {
			message = "请输入有效的手机号码！"; 
		}else if (!myreg.test(phoneStr)) {
			message = "请输入有效的手机号码！"; 
		}else {
			phoneFlag = true;
		}

		if (!phoneFlag){
			$("#phoneErr").text(message).removeClass("noteOk").addClass('noteErr');
		}else {
			$("#phoneErr").html("&nbsp;").removeClass("noteErr").addClass('noteOk');
		}
		
	});

	$("#pwd").blur(function(event) {
		pwdFlag = false;
		pwdStr = $("#pwd").val();
		if (pwdStr=="") {
			message = "密码不能为空！"; 
		}else if ((pwdStr.length<6)||(pwdStr.length>30)) {
			message = "密码长度为6-30个字符！"; 
		}else {
			pwdFlag =true;
		}
		if (!pwdFlag){
			$("#pwdErr").text(message).removeClass("noteOk").addClass('noteErr');
		}else {
			$("#pwdErr").html("&nbsp;").removeClass("noteErr").addClass('noteOk');
		}
	});

	$("#repwd").blur(function(event) {
		repwdFlag = false;
		pwdStr = $("#pwd").val();
		repwdStr = $("#repwd").val();
		if (pwdStr=="") {
			message = "密码不能为空！"; 
		}else if (pwdStr!= repwdStr) {
			message = "两次输入的密码不同！"; 
		}else {
			repwdFlag =true;
		}
		if (!repwdFlag){
			$("#repwdErr").text(message).removeClass("noteOk").addClass('noteErr');
		}else {
			$("#repwdErr").html("&nbsp;").removeClass("noteErr").addClass('noteOk');
		}
	});

	$("#usrname").blur(function(event) {
		usrFlag = false;
		usrStr = $("#usrname").val();
		if (usrStr=="") {
			message = "名称不能为空！"; 
		}else{
			usrFlag =true;
		}
		if (!usrFlag){
			$("#nameErr").text(message).removeClass("noteOk").addClass('noteErr');
		}else {
			$("#nameErr").html("&nbsp;").removeClass("noteErr").addClass('noteOk');
		}
	});

	$("#hospital").blur(function(event) {
		hostFlag = false;
		hostStr = $("#hospital").val();
		if (hostStr=="") {
			message = "医院名称不能为空！"; 
		}else{
			hostFlag =true;
		}
		if (!hostFlag){
			$("#hostErr").text(message).removeClass("noteOk").addClass('noteErr');
		}else {
			$("#hostErr").html("&nbsp;").removeClass("noteErr").addClass('noteOk');
		}
	});

	$("#smscode").blur(function(event) {
		smsFlag = false;
		smsStr = $("#smscode").val();
		if (smsStr=="") {
			message = "验证码不能为空！"; 
		}else{
			smsFlag =true;
		}
		if (!smsFlag){
			$("#smsErr").text(message).removeClass("noteOk").addClass('noteErr');
		}else {
			$("#smsErr").html("&nbsp;").removeClass("noteErr").addClass('noteOk');
		}
	});

	$("#btnRegist").on('click', function(event) {

		phone = $("#phone").val();
		pwd = $("#pwd").val();
		name = $("#usrname").val();
		smscode = $("#smscode").val();
				
		if ((phoneFlag)&&(pwdFlag)&&(repwdFlag)&&(usrFlag)&&(smsFlag)&&(hostFlag)) {
			
			$.ajax({  
		         type: "POST",  
		         url: "user/save",
				 contentType: "application/json", //必须有
	             dataType: "json", //表示返回值类型，不必须
				 data: JSON.stringify({ 'phone': phone, 'password': pwd,'nickname':name,'smscode':smscode,'hospitalname':'迪安'}), 
		         success: function(data){  	
					console.log(data);
					code = data.code;
					if (code=="0") {
						$(".row-reg").hide();
						$(".row-info").show();
						$.cookie('phone', phone,{expires: 7});
						$.cookie('password', pwd,{expires: 7});
						setInterval(ToLoginPage, 3000); 
					}else if (code="99") {
						$("#phoneErr").text(data.message).removeClass("noteOk").addClass('noteErr');
					}else {
						errorInfo(data.message);
					}
		         }
		     }); 
		}
		
	});




	$("#btnCode").on('click', function(event) {
		
		phone = $("#phone").val();
		$("#btnCode").attr("disabled",true).addClass('input-disabled');

		$.ajax({  
	         type: "GET",  
	         url: "user/getSmscode?mobilephone="+phone,
	         success: function(data){  	
				vcode = data.code;
	         }
	     }); 

		handle = setInterval(function(){
			regTime--;
			$("#btnCode").val(regTime+"秒后重新获取验证码");
			if (regTime<=0) {
				clearInterval(handle);
				$("#btnCode").attr("disabled",false).removeClass('input-disabled').val("获取短信验证码");
				regTime = 60;
			}
		},1000);

		
		

		
	});



	


})


