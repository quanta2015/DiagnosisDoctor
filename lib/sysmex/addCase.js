var barcode;
var shardSize = 2 * 1024 * 1024;
var curAddBtn,curStep,typeIndex,extname;
var uploading = 0;
var MD5_SIGN;
var slicenumberArr;
var fileArr;
var slicenumberDivArr; //
var curFileIndex;
var uploadImgId;
var sampleInfoId=-1;
var sbarcode = null;

$(init);

function init() {

	$("#pgBar").progressbar({value: 0});
	$("#pgBar").progressbar("option", "max", 100);

	$("#f_testdate").datepicker({
        monthNames: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],  
		monthNamesShort: ['一','二','三','四','五','六', '七','八','九','十','十 一','十二'],
        dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],   
        dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'], 
        dayNamesMin: ['日','一','二','三','四','五','六'],   //日期名称简称
        dateFormat: 'yy-mm-dd',   //选中日期后，已这个格式显示
        changeMonth: true,     //可以选择月份
        changeYear: true,     //可以选择年份
        firstDay: 1,         //0为已周日作为一周开始，1为周一作为一周开始，默认是0
        isRTL: false         //是否从右到左排列 
    });
	$("#f_testdate").val(getCurDate());

	for (i = 1; i <= 110; i++) {
		$("#nage").append("<option value=" + i + "岁>" + i + "岁</option>");
	}

	initPartInfo();

	$("#toStep2").click(doToStep2);
	$("#toStep3").click(doToStep3);
	$("#backStep").click(doBackStep);
	
	$("#saveBtn").click(doSave);
	$("#cancel").click(doCancel);
	$(".add-button").click(doAdd);
	$("#upload").click(doUpload);
	$("#uploadFile").change(doSelectFile);
	
	$("#addSlicenumber").click(addSlicenumberNoparam);
	
	//判断有没有barcode参数，如果有barcode参数,就初始化
	sbarcode = GetQueryString("barcode");
	if (sbarcode!=null) {
		getSampleInfo(sbarcode);
	}
}
function addSlicenumberNoparam() {
	addSlicenumber('',1);
}

/**
添加切片号div
**/
function addSlicenumber(val,i) {
	/*$(".basic").append('<div class="row row-info">'
		+ '<div class="col-md-2 desc">'
        + '<span>病理编号：</span>'
        + '</div><div class="col-md-6 input">'
		+ '<i><input type="text" name="f_slicenumber" class="textbox fn-lwide" placeholder="请输入病理编号"></i>'
        + '</div></div>');*/
	str = '<div class="row row-info">'
			+ '<div class="col-md-2 desc">'
			+ '<span>病理编号：</span>' 
			+ '</div><div class="col-md-6 input">'
			+ '<i><input type="text" name="f_slicenumber" class="textbox fn-lwide" value="'+val+'" placeholder="请输入病理编号"></i>'
			+ '</div>';
	if(i==0) {
		str+='<div class="col-md-4">'
			+ '<button type="button" class="btn btn-primary" id="addSlicenumber">添加病理编号</button>'         
			+ '</div>';
	}
	str+='</div>';
	$(".basic").append(str);
}
//第3步，动态生成切片上传栏
function addSlicenumberuploadBtn(slicenumber,index) {
	$(".scan").append('<div class="row row-scan">'
        + '<div class="col-md-4 f_content" id="slicenumber' +index+ '" >'
        + '<span name="fileToUploadTitle" class="f_content">'+slicenumber+'</span>'
        + '</div>'
        + '<div class="col-md-4 fileupload">'
		+ '<input type="file" name="filendpiToUpload" accept="image/ndpi" />'		
        + '</div>'
		+ '</div>');
}

function initPartInfo() {
	$.ajax({
		type: "GET",
		async: false,
		url: "sampleinfo/getAllSamplingPart",
		success: function(result) {
			if (result.code == 0) {
				partArr = result.data;
				for (i = 0; i < partArr.length; i++) {
					$("#f_sickpart").append("<option value=" + partArr[i].name + ">" + partArr[i].name + "</option>");
				}
			} else if (result.code == -1) {
				relogin();
			} else if (result.code == 99) {
				errorInfo(result.message);
			}

		}
	});
}

function CaluMD5() {
	if (curFileIndex >= fileArr.length) {		
		uploadFinish();
		notifyInfo('上传图片完成！');
		return;
	}
	refreshUploadList();

	var file = fileArr[curFileIndex];
	if (file==null) {
		curFileIndex++;
		CaluMD5();
		return;
	}
	var fileReader = new FileReader();
	var blobSlice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice;
	var chunkSize = 2097152;
	var chunks = Math.ceil(file.size / chunkSize);
	var currentChunk = 0;
	var spark = new SparkMD5();

	$("#pgBar").progressbar("option", "value", 0);
	$("#pgBar").progressbar("option", "max", chunks);
	$("#pgInfo").text('文件扫描中......');

	fileReader.onload = function(e) {

		spark.appendBinary(e.target.result);
		currentChunk += 5;
		percent = (currentChunk / chunks * 100 > 100) ? 100 : (currentChunk / chunks * 100);
		$("#pgBar").progressbar("option", "value", currentChunk);
		$("#pgInfo").text('正在计算MD5数据 ' + percent.toFixed(2) + '%......');
		if (currentChunk < chunks) {
			loadNext();
		} else {
			MD5_SIGN = spark.end();

			uploadProcess();
		}
	};

	function loadNext() {
		var start = currentChunk * chunkSize,
			end = start + chunkSize >= file.size ? file.size : start + chunkSize;
		fileReader.readAsBinaryString(blobSlice.call(file, start, end));
	}
	loadNext();
};

function uploadProcess() {

	var file = fileArr[curFileIndex];
	var start = 0;
	var size = file.size;
	var shardCount = Math.ceil(size / shardSize);
	$("#pgBar").progressbar("option", "value", 0);
	$("#pgBar").progressbar("option", "max", 100);

	$.ajax({
		type: "GET",
		async: false,
		url: "getUploadfileinfo?barcode=" + barcode,
		data: {
			filename: file.name,
			fileSize: shardCount,
			md5sign: MD5_SIGN
		},
		success: function(result) {
			if (result.code == 0) {
				start = result.total / shardSize;
				sliceDesc = result.message;
				
				postFile(file, start, shardCount, MD5_SIGN, slicenumberArr[curFileIndex]);

			} else if (result.code == -1) {
				relogin();
			} else if (result.code == 99) {

				$("#mask").hide();
				layer.closeAll();
				errorInfo(result.message);
			} else if (result.code == 10) {
				//这个文件已经上传，继续下一个
				errorInfo(result.message);
				curFileIndex++;
				CaluMD5();
			}

		}
	});
}



function postFile(file, i, shardCount, md5sign,slicenumber) {

	var name = file.name;
	var size = file.size;
	if (i >= shardCount) {
		return;
	}
	var start = i * shardSize,
		end = Math.min(size, start + shardSize);
	var form = new FormData();
	form.append("sliceDesc", '');
	form.append("barcode", encodeURI(barcode));
	form.append("name", encodeURI(name));
	form.append("slicenumber",encodeURI(slicenumber));
	form.append("chunk", i);
	form.append("chunks", shardCount); //shardCount);  
	form.append("md5sign", md5sign);
	form.append("file", file.slice(start, end));



	$.ajax({
		url: "uploadfile",
		type: "POST",
		data: form,
		async: true,      
		processData: false, 
		contentType: false, 
		success: function(data) {

			dataArr = new Array;
			dataArr = data.split(";");
			i = parseInt(dataArr[0]) + 1;

			if (i < shardCount) {
				var curPerc = Math.ceil(i * 100 / shardCount);
				$("#pgBar").progressbar("option", "value", curPerc);
				$("#pgInfo").text('正在上传切片 ' + curPerc + '%......');
				uploadImgId = dataArr[1];
				console.log(uploadImgId);
				postFile(file, i, shardCount, md5sign,slicenumber);
			} else { //上传完毕
				
				if (data == "") {
					getThumbImg(uploadImgId);
				} else {
					getThumbImg(dataArr[1]);
				}
			}
		},
		error: function(e) {
			uploadFinish();
			errorInfo('上传失败.');
		} //end of success
	}); //end of ajax plupload
} //end of function postFile

function getThumbImg(imgid) {
	//移走上传按钮
	//$("[id='slicenumber"+curFileIndex+"']:parent").remove(".fileupload");
	console.log(slicenumberDivArr[curFileIndex].parent());
	//slicenumberDivArr[curFileIndex].parent().remove(".fileupload");
	slicenumberDivArr[curFileIndex].parent().children(".fileupload").remove();
	$.ajax({
		type: "GET",
		async: false,
		url: "getThumbImg?id=" + imgid,
		success: function(result) {

			if (typeof(result.code) == "undefined") {
				setTimeout(function() {
					getThumbImg(imgid)
				}, 500);
			}
			if (result.code == 0) {
				slicenumberIndex = curFileIndex;
				setTimeout(function() {					
					addThumbSlice(result.data,slicenumberIndex);
				}, 2000);
				
				//设置input file 为空
					
				curFileIndex++;

				if (curFileIndex < fileArr.length) {
					CaluMD5();
				} else {
					uploadFinish();
					notifyInfo('上传病理切片成功！');
				}
			} else {
				setTimeout(function() {
					getThumbImg(imgid)
				}, 500);
			}
		},
		error: function(e) {
			console.log(e);
			setTimeout(function() {
				getThumbImg(imgid)
			}, 500);
		}
	});
}

function refreshUploadList() {
	if (fileArr[curFileIndex]==null) return;
	listHtml = "<li class='uploading'>" + fileArr[curFileIndex].name + " 正在上传中...</li>";
	for (i = curFileIndex + 1; i < fileArr.length; i++) {
		if (fileArr[i]==null) continue;
		listHtml += "<li>" + fileArr[i].name + " 等待上传中... </li>";
	}
	$(".pgList").empty();
	$(".pgList").append(listHtml);
}


function addThumbSlice(data, slicenumberIndex) {
	itemArr = data.split(";");
	ThumbCode = '<li class="imgThumb col-md-2" style="margin-right:30px;padding-left:0px"><img src="' + itemArr[2] + '" id="' + itemArr[1] + '"/><i class="del"></i></li>';
	//console.log($("[id='slicenumber"+slicenumberIndex+"']"));
	//$("[name='fileToUploadTitle']")[slicenumberIndex].parent().after(ThumbCode);
	slicenumberDivArr[slicenumberIndex].after(ThumbCode);
	//$("[id='slicenumber"+slicenumberIndex+"']").after(ThumbCode);
	//$("[id='slicenumber"+slicenumberIndex+"']").before(ThumbCode);
	//curAddBtn.before(ThumbCode);
	slicenumberDivArr[slicenumberIndex].next().bind('mouseover', function(event) {
	//$("[id='slicenumber"+slicenumberIndex+"']").next().bind('mouseover', function(event) {
		$(this).children(".del").show();
	}).bind('mouseout', function(event) {
		$(this).children(".del").hide();
	}).children('.del').bind('click', function(event) {
		
		thumbId = $(this).prev().attr("id")
		thumbItem = $(this).parent();
		urtStr = "sampleinfo/deleteSampleBigImg?id=" + thumbId;
		$.ajax({
			type: "GET",
			url: urtStr,
			success: function(data) {
				if (data.code == 0) {
					//删除图片后，增加上传按钮
					slicenumberDivArr[slicenumberIndex].parent().append('<div class="col-md-4 fileupload">'
					//$("[id='slicenumber"+slicenumberIndex+"']:parent").append('<div class="col-md-4 fileupload">'
									+ '<input type="file" name="filendpiToUpload" accept="image/ndpi" />'		
									+ '</div>');
					
					notifyInfo('图片删除成功！');
					thumbItem.remove();
				} else if (data.code == -1) {
					relogin();
				} else {
					notifyInfo(data.message);
				}
			},
			error: function(e) {
				errorInfo('图片删除失败！');
			}
		});
	});
}

function uploadFinish() {
	$("#upload").hide();
	$(".row-progress").hide();
	$("#pgBar").progressbar("option", "value", 0);
	$("#fileName").text("");
	layer.closeAll();
	$("#mask").hide();
	uploading = 0;
	//如果自动提交，那就提交
	if($("#autocommit")[0].checked==true) {
		doSave();
	} 
}

function toStep2() {
	curStep = 2;	
	$("#backStep").removeClass('fn-hide');
	$("#toStep2").addClass('fn-hide');
	$("#toStep3").removeClass('fn-hide');
	$(".step .row div:eq(1)").addClass('step-cur');
	$(".step .row div:eq(0)").removeClass('step-cur');
	$(".test").removeClass('fn-hide');
	$(".basic").addClass('fn-hide');
}
function doBackStep() {
	if (curStep==3) {
		returnToStep2();
	} else if(curStep==2) {
		returnToStep1();
	}
}
function returnToStep1() {
	curStep = 1;
	$("#backStep").addClass('fn-hide');
	$("#toStep3").addClass('fn-hide');
	$("#toStep2").removeClass('fn-hide');
	$(".step .row div:eq(0)").addClass('step-cur');
	$(".step .row div:eq(1)").removeClass('step-cur');
	$(".basic").removeClass('fn-hide');
	$(".test").addClass('fn-hide');
}

function toStep3() {
	curStep = 3;
	$("#toStep3").addClass('fn-hide');
	$("#saveBtn").removeClass('fn-hide');
	$(".step .row div:eq(2)").addClass('step-cur');
	$(".step .row div:eq(1)").removeClass('step-cur');
	$(".scan").removeClass('fn-hide');
	$(".test").addClass('fn-hide');
	$("#autocommitdiv").removeClass('fn-hide');	
	$(".row-infotype").addClass('fn-hide');
}

function returnToStep2() {
	curStep = 2;
	$("#saveBtn").addClass('fn-hide');
	$("#toStep3").removeClass('fn-hide');
	$(".step .row div:eq(1)").addClass('step-cur');
	$(".step .row div:eq(2)").removeClass('step-cur');
	$(".test").removeClass('fn-hide');
	$(".scan").addClass('fn-hide');
	$("#autocommitdiv").addClass('fn-hide');
	$(".row-infotype").removeClass('fn-hide');
}

function doToStep3() {
	toStep3();
}

function doToStep2() {

	samplenum = $("#f_samplenum").val();
	testdate = $("#f_testdate").val();
	patientsex = $("input[name='radioSex']:checked").val();
	patientage = $("#nage").val();
	patientname = $("#f_patientname").val();
	certificateno = $("#f_certificateno").val();
	patientphone = $("#f_patientphone").val();
	clinicaldiagnosis = $("#f_clinicaldiagnosis").val();
	hospname = $("#f_hospname").val();
	hospcontacts = $("#f_hospcontacts").val();
	hospphone = $("#f_hospphone").val();
	sickpart = $("#f_sickpart").val();
	operationfindings = $("#f_operationfindings").val();
	macroscopicdesc = $("#f_macroscopicdesc").val();
	lastdiagnoseinfo = $("#f_lastdiagnoseinfo").val();
	diag = $("#f_diag").val();
	remark = $("#f_remark").val();
	//console($("#f_slicenumber").val());:input[name='keleyi']
	slicenumbers='';
	$(":input[name='f_slicenumber']").each(function(index, element) {
		slicenumbers+=$(this).val()+','
	});
	
	//是否国际阅片
	if($("#f_internation")[0].checked==true) {
		isinternational = 1;
	} else {
		isinternational = 0;
	}
	
	if(sbarcode==null)  {
		jsonData = JSON.stringify({
			'samplenum': samplenum,
			'testdate': testdate,
			'certificateno':certificateno,
			'patientsex': patientsex,
			'patientage': patientage,
			'patientname': patientname,
			'patientphone':patientphone,
			'clinicaldiagnosis':clinicaldiagnosis,
			'hospname': hospname,
			'hospcontacts': hospcontacts,
			'hospphone': hospphone,
			'sickpart': sickpart,
			'operationfindings':operationfindings,
			'macroscopicdesc':macroscopicdesc,
			'lastdiagnoseinfo':lastdiagnoseinfo,
			'diag': diag,
			'remark': remark,
			'slicenumbers':slicenumbers,
			'isinternational':isinternational
		});
	} else {
		jsonData = JSON.stringify({
			'barcode': sbarcode,
			'samplenum': samplenum,
			'testdate': testdate,
			'certificateno':certificateno,
			'patientsex': patientsex,
			'patientage': patientage,
			'patientname': patientname,
			'patientphone':patientphone,
			'clinicaldiagnosis':clinicaldiagnosis,
			'hospname': hospname,
			'hospcontacts': hospcontacts,
			'hospphone': hospphone,
			'sickpart': sickpart,
			'operationfindings':operationfindings,
			'macroscopicdesc':macroscopicdesc,
			'lastdiagnoseinfo':lastdiagnoseinfo,
			'diag': diag,
			'remark': remark,
			'slicenumbers':slicenumbers
		});
	}
	$.ajax({
		type: "POST",
		url: "sampleinfo/saveSampleInfo",
		contentType: "application/json", //必须有
		dataType: "json", //表示返回值类型，不必须
		data: jsonData,
		success: function(data) {

			if (data.code == 0) {
				barcode = data.data.barcode;
				sbarcode = data.data.barcode;
				si = data.data;
				var strs=si.slicenumbers.split(",");   
				
				//第二步内容
				//显示已经上传的图片
				// li
				$(".imgThumbLg").each(function(index, element) {
					this.remove();
				});
				for (i=0;i<si.otherList.length;i++) {
					addUploadfile(si.otherList[i].id,si.otherList[i].picurl,si.otherList[i].pictype);
				}
				//第三步内容
				$(".scan").html('');
				si = data.data;
				for (i=0;i<si.microscopeList.length;i++) {	
					//console.log(si.microscopeList[i].picurl);
					addSlicenumberuploadDiv(si.microscopeList[i].slicenumber,
						i, si.microscopeList[i].picurl, si.microscopeList[i].id);
				}				
				//for (i=0;i<strs.length ;i++ )  { 
				//	addSlicenumberuploadBtn(strs[i],i);   
				//} 
				$(".scan").append('<button type="button" class="btn btn-primary" style="margin:5px" onclick="doMultiUpload()" >上传病理切片</button>');
				toStep2();
			} else if (data.code == -1) {
				relogin();
			} else {				
				errorInfo(data.message);
			}
		}
	});

}

function doAdd() {

	typeIndex = $(".add-button").index($(this));
	curAddBtn = $(this);

	layer.open({
		type: 1,
		shade: 0.3,
		closeBtn: 0,
		title: false, //不显示标题
		area: ['600px'], //宽高
		content: $('#layer_upload'), //捕获的元素
		cancel: function(index) {
			layer.close(index);
			this.content.show();
		}
	});
}

function doSelectFile() {
	var path = $("#uploadFile").val().replace(/\\/g, '/');
	filename = path.substring(path.lastIndexOf("/") + 1, path.length);
	filetype = path.substring(path.lastIndexOf("."), path.length);


	if ((filetype != '.ndpi')&&(curStep == 3)) {
		$("#fileName").text("请选择滨松格式的切片文件！");
	} else {
		$("#fileName").text(filename);
		$("#upload").show();
	}
}
String.prototype.endWith=function(str){ 
	var reg=new RegExp(str+"$"); 
	return reg.test(this); 
} 
//第三步上传
function doMultiUpload() {
	var nondpi = false;
	$("[name='filendpiToUpload']").each(function(index, element) {
		if ($(this)[0].files.length>0) {			
			if (!$(this)[0].files[0].name.endWith('.ndpi')) {
				errorInfo("需要选择ndpi文件。");
				nondpi = true;
				return false;
			}
			//比较文件名
			console.log($(this).parent().parent());
			console.log($(this).parent().parent().children());
			console.log($(this).parent().parent().children().eq(0).children().eq(0).html());
			if ($(this)[0].files[0].name!= $(this).parent().parent().children().eq(0).children().eq(0).html() +'.ndpi') {
				errorInfo("病理切片编号和ndpi文件名需要一致。");
				nondpi = true;
				return false;
			}
			//console.log($(this)[0].files[0]);
		} 
	});
//fileToUpload
	if (nondpi) return;
	layer.closeAll();
	$("#mask").show();
	uploading = 1;

	if (curStep==2) {
		$("#pgBar").progressbar("option", "value", 0);
		$("#pgBar").progressbar("option", "max", 100);
		var file = $("#uploadFile")[0].files[0]; 
		var shardCount = Math.ceil(file.size / shardSize); 
		postImgFile(file,0,shardCount,-1);
	}else if(curStep==3){
		curFileIndex = 0;
		//设置fileArr, slicenumberArr
		slicenumberArr = new Array();
		fileArr = new Array();
		//统计有效文件数量
		var uploadfilecount=0;
		slicenumberDivArr = new Array();
		$("[name='filendpiToUpload']").each(function(index, element) {
			if ($(this)[0].files.length>0) {
				fileArr[index]=$(this)[0].files[0];	
				//找到parent下面的fileToUploadTitle
				uploadfilecount++;
				if (!fileArr[index].name.endWith('.ndpi')) {
					errorInfo("需要选择ndpi文件。");
					return;
				}
				//console.log($(this)[0].files[0]);
			} else {
				fileArr[index] = null;
			}
			
			slicenumberDivArr[index]=$(this).parent().parent().children().eq(0);
			slicenumberArr[index]=$(this).parent().parent().children().eq(0).children().eq(0).html();
			//slicenumberArr[index]=$(this).html();
		});
		/*$("[name='fileToUploadTitle']").each(function(index, element) {
			
			console.log($(this).html());
		});*/
		//如果没有选择文件，退出
		if (uploadfilecount==0) {
			$("#mask").hide();
			layer.closeAll();
			errorInfo("请选择上传文件");
			return;
		}
		
		CaluMD5();
	}
}

function doUpload() {
	layer.closeAll();
	$("#mask").show();
	uploading = 1;

	if (typeIndex==0) {
		$("#pgBar").progressbar("option", "value", 0);
		$("#pgBar").progressbar("option", "max", 100);
		var file = $("#uploadFile")[0].files[0]; 
		var shardCount = Math.ceil(file.size / shardSize); 
		postImgFile(file,0,shardCount,-1);
	}else{
	
	
		curFileIndex = 0;
		//uploadFile 这个不要了
		fileArr = $("#uploadFile")[0].files;
		CaluMD5();
	}
	
}

function doCancel() {
	layer.closeAll();
	$("#upload").hide();
}


function doSave() {
	$.ajax({
		type: "GET",
		url: "sampleinfo/finishInputSampleStatus?barcode=" + barcode,
		success: function(data) {
			if (data.code == 0) {
				location.href = "caseList.html";
			} else if (data.code == -1) {
				relogin();
			} else {
				errorInfo(data.message);
			}
		}
	});
}


function postImgFile(file,i,shardCount, imgid){  

	if(i >= shardCount)	return;          
	var name = file.name;   
	var size = file.size;   
	var start = i * shardSize,     
	end = Math.min(size, start + shardSize); 
	var form = new FormData();  
	form.append("file", file.slice(start,end)); 	
	var isLast= ((i+1)==shardCount)?1:0;

	imgType = $("#infoType").val();

	urlStr = "sampleinfo/uploadimage?id="+imgid+"&barcode="+barcode+ "&type="+imgType+ "&filename=" +filename + "&isLast=" + isLast ;
	$.ajax({      
		url: urlStr,     
		type: "POST", 
		data: form,	
		async: true,        
		processData: false, 
		contentType: false,     
		success: function(data){  
			if (data.code == -1) {
				relogin();
			} else if (data.code != 0) {
				errorInfo(data.message); 
				return;
			}
			console.log("return:"+data);
			imgid=data.data.id; 		
			i++;
			var curPerc = Math.ceil(i*100 / shardCount);
			$("#pgBar").progressbar("option", "value", curPerc);
			$("#pgInfo").text('正在上传资料图片 ' + curPerc + '%......');

			if (i<shardCount) {
				postImgFile(file,i,shardCount,imgid);  
			}else{
				ThumbCode = '<li class="imgThumbLg"><img src="'+ data.data.picurl+ '" id="' + data.data.id + '"/><i class="del"></i><em class="t-type">'+data.data.pictype+'</em></li>';
				
 				curAddBtn.before(ThumbCode);
 				curAddBtn.prev().bind('mouseover', function(event) {
					$(this).children(".del").show();
				}).bind('mouseout', function(event) {
					$(this).children(".del").hide();
				}).children('.del').bind('click', function(event) {
					thumbId = $(this).prev().attr("id")
					thumbItem = $(this).parent();

					urtStr = "sampleinfo/deleteSampleInfoImg?id="+thumbId;
					
					$.ajax({  
			      	type: "GET",  
			      	url: urtStr,  
			      	success: function(data){  	
			      		if (data.code ==0) {
			      			notifyInfo('图片删除成功！');
			      			thumbItem.remove();
			      		}else if (data.code==-1) {
			        			relogin();
			        	} else {
							errorInfo(data.message);
						}
			      	},
			      	error: function(e) { 
			      		errorInfo('图片删除失败！');
			      	}  
			    	});
				});

				uploadFinish();
 				notifyInfo('上传图片成功！');
			}    
		},
		error: function(e) { 
			uploadFinish();
			errorInfo('上传失败.'); 
		}//end of success
	});//end 	

}

function  getSampleInfo(barcode) {
	$.ajax({
		type: "GET",
		url: "sampleinfo/getSampleInfo?barcode=" + barcode,
		success: function(data) {
			if (data.code == 0) {
				si = data.data;
				//第一步内容
				$("#f_samplenum").val(si.samplenum);
				$("#f_testdate").val(si.testdateStr);
				$("#f_samplenum").val(si.samplenum); 
				$("input[name='radioSex']:checked").val(si.patientsex);
				
				$("#nage").val(si.patientage);
				$("#f_patientname").val(si.patientname);
				$("#f_certificateno").val(si.certificateno);
				
				$("#f_patientphone").val(si.patientphone);
				$("#f_hospname").val(si.hospname);
				$("#f_hospcontacts").val(si.hospcontacts);
				$("#f_hospphone").val(si.hospphone);
				$("#f_clinicaldiagnosis").val(si.clinicaldiagnosis);
				$("#f_sickpart").val(si.sickpart);
				$("#f_operationfindings").val(si.operationfindings);
				$("#f_macroscopicdesc").val(si.macroscopicdesc);
			
				$("#f_lastdiagnoseinfo").val(si.lastdiagnoseinfo);
				$("#f_diag").val(si.diag);
				$("#f_remark").val(si.remark);
				//console($("#f_slicenumber").val());:input[name='keleyi']
				
				snArr = si.slicenumbers.split(",");
				
				$("#divslicenumber").remove();	
				for (i=0;i<si.microscopeList.length;i++) {	
					addSlicenumber(si.microscopeList[i].slicenumber,i);
				}
				//第二步
				curAddBtn = $(".test .add-button");
				for (i=0;i<si.otherList.length;i++) {					
					addUploadfile(si.otherList[i].id,si.otherList[i].picurl,si.otherList[i].pictype);
				}
				
				//第三步内容
				$(".scan").html('');
				for (i=0;i<si.microscopeList.length;i++) {	
					console.log(si.microscopeList[i].picurl);
					addSlicenumberuploadDiv(si.microscopeList[i].slicenumber,
						i, si.microscopeList[i].picurl, si.microscopeList[i].id);
				}
				if (si.microscopeList.length==0){
					addSlicenumber('',0);
				}
				//如果没有切片图，那么要加一个空的
				$("#addSlicenumber").click(addSlicenumberNoparam);
				
			} else if (data.code == -1) {
				relogin();
			} else {
				errorInfo(data.message);
			}
		}
	});
}

function addUploadfile(id,picurl,pictype) {
	thumbCode = '<li class="imgThumbLg"><img src="'+ picurl+ '" id="' + id + '"/><i class="del"></i><em class="t-type">'+pictype+'</em></li>';
	//ThumbCode = '<li class="imgThumbLg"><img src="'+ data.data.picurl+ '" id="' + data.data.id + '"/><i class="del"></i><em class="t-type">'+data.data.pictype+'</em></li>';
	curAddBtn.before(thumbCode);
	curAddBtn.prev().bind('mouseover', function(event) {
		$(this).children(".del").show();
	}).bind('mouseout', function(event) {
		$(this).children(".del").hide();
	}).children('.del').bind('click', function(event) {
		thumbId = $(this).prev().attr("id")
		thumbItem = $(this).parent();
		urtStr = "sampleinfo/deleteSampleInfoImg?id="+thumbId;
		
		$.ajax({  
		type: "GET",  
		url: urtStr,  
		success: function(data){  	
			if (data.code ==0) {
				notifyInfo('图片删除成功！');
				thumbItem.remove();
			}else if (data.code==-1) {
					relogin();
			}else {
				errorInfo(data.message);
			}
		},
		error: function(e) { 
			errorInfo('图片删除失败！');
		}  
		});
	});
}
//

function addSlicenumberuploadDiv(slicenumber,index,thumbPath, id) {	
	
//如果没有图片
	strHtml = '<div class="row row-scan">'
			+ '<div class="col-md-4 f_content" id="slicenumber' +index+ '" >'
			+ '<span name="fileToUploadTitle" class="f_content">'+slicenumber+'</span>'
			+ '</div>';
	if (thumbPath==null || thumbPath.length==0) {
		strHtml += '<div class="col-md-4 fileupload">'
			+ '<input type="file" name="filendpiToUpload" accept="image/ndpi" />'		
			+ '</div>';	
		strHtml+='</div>';
		$(".scan").append(strHtml);			
	} else {
		//如果有图片
		imgThumbId = 'imgThumbId'+slicenumber;
		strHtml += '<li id="'+imgThumbId+'" class="imgThumb col-md-2" style="margin-right:30px;padding-left:0px"><img src="'
			+ thumbPath.replace(/preview/gm,'thumb') + '" id="' + id
			+ '"/><i class="del"></i></li>';	
		strHtml+='</div>';
		$(".scan").append(strHtml);

		$("#"+imgThumbId).bind('mouseover', function(event) {
		//$("[id='slicenumber"+slicenumberIndex+"']").next().bind('mouseover', function(event) {
			$(this).children(".del").show();
		}).bind('mouseout', function(event) {
			$(this).children(".del").hide();
		}).children('.del').bind('click', function(event) {
			
			thumbId = $(this).prev().attr("id")
			thumbItem = $(this).parent();
			urtStr = "sampleinfo/deleteSampleBigImg?id=" + thumbId;
			$.ajax({
				type: "GET",
				url: urtStr,
				success: function(data) {
					if (data.code == 0) {
						//删除图片后，增加上传按钮
						$("#"+imgThumbId).after('<div class="col-md-4 fileupload">'
						//$("[id='slicenumber"+slicenumberIndex+"']:parent").append('<div class="col-md-4 fileupload">'
										+ '<input type="file" name="filendpiToUpload" accept="image/ndpi" />'		
										+ '</div>');
						
						notifyInfo('图片删除成功！');
						thumbItem.remove();
					} else if (data.code == -1) {
						relogin();
					} else {
						errorInfo(data.message);
					}
				},
				error: function(e) {
					errorInfo('图片删除失败！');
				}
			});
		});		
		
				
	}
	
	
	//TODO 还需要加上图片删除按钮
	
}

function GetQueryString(name) {
	 var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
	 var r = window.location.search.substr(1).match(reg);
	 if(r!=null)return  unescape(r[2]); return null;
}
