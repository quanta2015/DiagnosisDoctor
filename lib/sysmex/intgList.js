var barcode,roles,diagStr="";

//提示消息对话框
function notifyInfo(info) {
	alertify.set({ delay: 1000 });
	alertify.success(info);
}

$(initPage); // 抑或 $(document).ready(initPage);

function initDiagnosisData() {
	$.ajax({  
		type: "get",  
		url: 'sampleinfo/getDiagnosisList?barcode='+barcode,  
		success: function(result) {  
			if (result.code==0) {

				$.each(result.data, function(index,item){
					diagObj = item.experter;
					diagObj.diagResult = item.diagnoseInfo;

					cropList = item.clipInfos;
					cropStr = "";
					for(i=0;i<cropList.length;i++) {
						cropStr += '<li> <div class="imgThumb" href=clipimg/'+ cropList[i].imgpath +'><img src="clipimg/'+ cropList[i].imgpath +'" ></div><span>'+cropList[i].remark+'</span><input type="checkbox" value="" id="'+cropList[i].id+'"></li>';
					}
					diagObj.cropStr = cropStr;

					idx = index+1;
					diagStr += idx +". " + item.diagnoseInfo + "\n";

		         $(".result").prepend($("#expertTmpl").render(diagObj));

		         //生产图片放大预览
               $(".imgThumb").fancybox({
                  helpers: { overlay: { css: {'background': 'rgba(0, 0, 0, 0.5)'}}}
               });
				});

				$("#diagTxt").val(diagStr);
			}else if (result.code==-1) {
     			relogin();
     		} else {
				notifyInfo(data.message);
			}
		}  
	});  
}

function mergeDiadnosis() {
		
	diagStr = $("#diagTxt").val();
	cropIdStr = "";
	$("input[type='checkbox']:checked").each(function(i,item) {
		cropIdStr += $(this).attr("id") + ",";
	})
	console.log("cropId:" + cropIdStr + " diagresult:"+diagStr);

	$.ajax({  
		type: "POST",  
		url: "sampleinfo/setMergeFinished",  
		contentType: "application/json", //必须有
      dataType: "json", //表示返回值类型，不必须
	 	data: JSON.stringify({ 'barcode': barcode, 'diagresult': diagStr, 'clipImageIds': cropIdStr}),
		success: function(data){  	
			if (data.code ==0) {
				$("#confirm").hide();
				notifyInfo("综合诊断成功");
			}else if (data.code==-1) {
     			relogin();
     		}else {
				notifyInfo(data.message);
			}
		}//end of success
	})//end of ajax

}

function returnToList() {
	location.href = "caseList.html";
}

function initPage(){

   roles = parseInt($.cookie('role'));
   barcode = getUrlParam('barcode');
	console.log('roles:' + roles + ',barcode:' + barcode);

	initDiagnosisData();

	$("#confirm").click(mergeDiadnosis);
	$("#cancel").click(returnToList);
}


