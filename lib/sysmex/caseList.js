$.fn.pagination.defaults = {
    pageSize: 10,
    pageBtnCount: 9,
    showFirstLastBtn: true,
    loadFirstPage: true,
    showJump: true,
    jumpBtnText: 'Go',
    showPageSizes: false,
    pageSizeItems: null,
    firstBtnText: '首页',
    lastBtnText: '尾页',
    prevBtnText: '上一页',
    nextBtnText: '下一页',
    jumpBtnText:'跳转',
};


var shardSize = 10 * 1024 * 1024;
var curBarcode,curType=-1;
var roles = ROLES_USER;
var datalist;
var pageIndex = 0;


//提示消息对话框
function notifyInfo(info) {
	alertify.set({ delay: 1000 });
	alertify.success(info);
}

$(document).ready(function($) {

	roles = parseInt($.cookie('role'));
	console.log(roles);

	$("#fromdate").datepicker({dateFormat: "yy-mm-dd"});
	//$("#todate").datepicker({dateFormat: "yy-mm-dd"});
	//$("#diagdate").datepicker({dateFormat: "yy-mm-dd"});
	if(isZh==1) {
		$("#fromdate").datepicker({
			monthNames: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],  
			monthNamesShort: ['一','二','三','四','五','六', '七','八','九','十','十 一','十二'],
			dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],   
			dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'], 
			dayNamesMin: ['日','一','二','三','四','五','六'],   //日期名称简称
			dateFormat: 'yy-mm-dd',   //选中日期后，已这个格式显示        
			firstDay: 1,         //0为已周日作为一周开始，1为周一作为一周开始，默认是0
			isRTL: false         //是否从右到左排列 
		});
		$("#todate").datepicker({
			monthNames: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],  
			monthNamesShort: ['一','二','三','四','五','六', '七','八','九','十','十 一','十二'],
			dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],   
			dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'], 
			dayNamesMin: ['日','一','二','三','四','五','六'],   //日期名称简称
			dateFormat: 'yy-mm-dd',   //选中日期后，已这个格式显示        
			firstDay: 1,         //0为已周日作为一周开始，1为周一作为一周开始，默认是0
			isRTL: false         //是否从右到左排列 
		});
		$("#diagdate").datepicker({
			monthNames: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],  
			monthNamesShort: ['一','二','三','四','五','六', '七','八','九','十','十 一','十二'],
			dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],   
			dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'], 
			dayNamesMin: ['日','一','二','三','四','五','六'],   //日期名称简称
			dateFormat: 'yy-mm-dd',   //选中日期后，已这个格式显示        
			firstDay: 1,         //0为已周日作为一周开始，1为周一作为一周开始，默认是0
			isRTL: false         //是否从右到左排列 
		});
	}
	setCurDate();


	GetUploadFilesByType(curType);
	getStatusList();

	//根据角色设置按钮
	RenderBtnByRoles();
   
	//设置多行选择模式
	$( "#selectable" ).bind("mousedown", function(e) {
  		e.metaKey = true;
	}).selectable();

	$("#selectable .row-content").click(function(event) {
		$("#selectable .row-content").children('.col-md-2').removeClass('ui-selected');
		$("#selectable .row-content").children('.col-md-3').removeClass('ui-selected');
	});

	$(".m_type").click(function(event) {
		/* Act on the event */
		type = $(this).attr("id");
		curType = type;
		//$(".m_type em").addClass("fn-hide");
		//$(this).children('em').removeClass("fn-hide");
		$(".m_type em").addClass("fn-invisibility");
		$(this).children('em').removeClass("fn-invisibility");
		
		
		
		RefreshPage();
	});
	
	/**取各种状态sampleinfo的数量,返回的顺序就是从1到9的数组
	所以用type-1取
	**/
	function getStatusList() {
		fromdate = $("#fromdate").val();
		todate = $("#todate").val();		
		keyword = $("#searchTxt").val();
		urlStr = 'sampleinfo/getStatusList?fromdate=' + fromdate + '&todate=' + todate + '&keyword=' +keyword ;
		
		$.ajax({  
			type: "GET",  
			url: urlStr,  
			success: function(result){  	
				if (result.code ==0) {
					$(".m_type").each(function(index, element) {
						if(index>0) {
							if(result.data[$(this).attr("id")-1]!=0) {
								$(this).children("span").eq(1).html(''+result.data[$(this).attr("id")-1]);
								$(this).children("span").eq(1).show();
							}	else {
								$(this).children("span").eq(1).hide();
							}
						} 
					});					
				}else if (result.code==-1) {
        			relogin();
        		};
			}//end of success
		})//end of ajax
	}

	function setCurDate() {
		var date = new Date();
		var year = date.getFullYear();
		var lastMonth = date.getMonth();
		var month = date.getMonth() + 1;
		if (lastMonth<10) lastMonth='0'+lastMonth;
		if (month<10) month='0'+month;
		var day = date.getDate();
		if (day<10) day='0'+day;
		var lastDate = year + '-' + lastMonth + '-' + day;
		var curDate = year + '-' + month + '-' + day;
		$("#fromdate").val(lastDate);
		$("#todate").val(curDate);
		$("#diagdate").val(curDate);
	}

	function ProcessFunctionByRoles(typeStr,barcode) {

		curBarcode = barcode;

		if (typeStr == "不合格") {
			layer.prompt({
				title: '请输入不符合要求的原因:',
				formType: 2 
			}, function(result){
			   SampleQualify(typeStr,barcode,result); 
			});
		}else if(typeStr == "合格") {
			SampleQualify(typeStr,barcode,""); 
		}else if (typeStr== "分配专家") {
			ChooseExperts(typeStr,barcode);
		}else if (typeStr== "退回") {
			layer.prompt({
				title: '请输入退回的原因:',
				formType: 2 
			}, function(result){
			   SampleReturn(typeStr,barcode,result);
			});
		}else if (typeStr== "阅片完成") {
			SampleFinish(typeStr,barcode);
		}else if (typeStr== "综合处理") {
			SampleMerge(typeStr,barcode);
		}else if (typeStr== "评价") {
			SampleCommit(typeStr,barcode);
		}else if (typeStr== "退回发布") {
			SamplePublishing(typeStr,barcode);
		}else if (typeStr== "诊断建议 ") {
			SampleDiagPdf(typeStr,barcode);
		}else if (typeStr== "补充发布") {
			SamplePublishing(typeStr,barcode);
		}else if (typeStr== "查看原因") {
			SampleUnqualifyReason(typeStr,barcode);
		}else if (typeStr== "退回原因") {
			SampleBackReason(typeStr,barcode);
		}else if (typeStr== "用户评价") {
			SampleUserComment(typeStr,barcode);
		}else if (typeStr== "错误原因") {
			SampleUnQualifyReason(typeStr,barcode);
		}
	}

	function SampleUnQualifyReason(typeStr,barcode) {
		$.ajax({  
			type: "GET",  
			url: "sampleinfo/getUnQualifyReason?barcode="+barcode,  
			success: function(result){  	
				if (result.code ==0) {
					layer.alert(result.data)
				}else if (result.code==-1) {
        			relogin();
        		};
			}//end of success
		})//end of ajax
	}

	function SampleUserComment(typeStr,barcode) {
		$.ajax({  
			type: "GET",  
			url: "sampleinfo/getUserComment?barcode="+barcode,  
			success: function(result){  	
				if (result.code ==0) {
					layer.alert(result.data)
				}else if (result.code==-1) {
        			relogin();
        		};
			}//end of success
		})//end of ajax
	}

	function SampleBackReason(typeStr,barcode) {
		$.ajax({  
			type: "GET",  
			url: "sampleinfo/getBackReason?barcode="+barcode,  
			success: function(result){  	
				if (result.code ==0) {

					reasonTxt = "";
					reasonArr = result.data;
					for(i=0;i<reasonArr.length;i++) {
						reasonTxt += (i+1) + ". " + reasonArr[i].backReason + "["+ reasonArr[i].experter + "]<br>";
					}
					layer.alert(reasonTxt)
				}else if (result.code==-1) {
        			relogin();
        		};
			}//end of success
		})//end of ajax
	}

	function SampleUnqualifyReason(typeStr,barcode) {
		$.ajax({  
			type: "GET",  
			url: "sampleinfo/getUnQualifyReason?barcode="+barcode,  
			success: function(result){  	
				if (result.code ==0) {
					layer.alert(result.data)
				}else if (result.code==-1) {
        			relogin();
        		};
			}//end of success
		})//end of ajax
	}

	function SampleDiagPdf(typeStr,barcode) { 
		window.open('sampleinfo/printpdf?barcode='+barcode);
	}
	
	function SamplePublishing(typeStr,barcode) {
		$.ajax({  
			type: "GET",  
			url: "sampleinfo/setPublishing?barcode="+barcode,  
			success: function(result){  	
				if (result.code ==0) {						
					$.each(datalist, function(i,item){
						//console.log(item.samplenum);
						if (barcode==item.barcode) {							
							//item.diagnosestatus = result.data.diagnosestatus;
							replaceItemByRoles(datalist.length - i -1,result.data);
							getStatusList();
							return false;
						}
			            
					});
					//RefreshPage();
				}else if (result.code==-1) {
        			relogin();
        		};
			}//end of success
		})//end of ajax
	}

	function SampleCommit(typeStr,barcode) {
		layer.prompt({
			title: '请填写您对此次诊断的评价',
			formType: 2 
		}, function(result){

			layer.closeAll();
			$.ajax({  
				type: "POST",  
				url: "sampleinfo/setComment",  
				contentType: "application/json", //必须有
	         dataType: "json", //表示返回值类型，不必须
			 	data: JSON.stringify({ 'barcode': barcode,'comment':result}),
				success: function(data){  	
					if (data.code ==0) {
						$.each(datalist, function(i,item){
							//console.log(item.samplenum);
							if (barcode==item.barcode) {							
								//item.diagnosestatus = data.data.diagnosestatus;
								replaceItemByRoles(datalist.length - i -1,data.data);
								getStatusList();
								return false;
							}
							
						});
						//RefreshPage();
					}else if (data.code==-1) {
	        			relogin();
	        		} else {
						notifyInfo(data.message);
					}

				}//end of success
			})//end of ajax

		});
		
	}

	function SampleDoMerge(typeStr,barcode) {
		$.ajax({  
			type: "POST",  
			url: "sampleinfo/setMergeFinished",  
			contentType: "application/json", //必须有
         dataType: "json", //表示返回值类型，不必须
		 	data: JSON.stringify({ 'barcode': barcode}),
			success: function(data){  	
				if (data.code ==0) {
					$.each(datalist, function(i,item){
						//console.log(item.samplenum);
						if (barcode==item.barcode) {							
							//item.diagnosestatus = data.data.diagnosestatus;
							replaceItemByRoles(datalist.length - i -1,data.data);
							getStatusList();
							return false;
						}
			            
					});
					//RefreshPage();
				}else if (data.code==-1) {
        			relogin();
        		}else {
					notifyInfo(data.message);
				}

			}//end of success
		})//end of ajax
	}

	function SampleMerge(typeStr,barcode) {
		location.href = "intgList.html?barcode="+barcode;
	}

	function SampleFinish(typeStr,barcode) {
		$.ajax({  
			type: "GET", 
			url: "sampleinfo/setReadedFinished?barcode="+barcode,  
			success: function(data){  	
				if (data.code ==0) {
					$.each(datalist, function(i,item){
						//console.log(item.samplenum);
						if (barcode==item.barcode) {							
							//item.diagnosestatus = data.data.diagnosestatus;
							replaceItemByRoles(datalist.length - i -1,data.data);
							getStatusList();
							return false;
						}
			            
					});
					//RefreshPage();
				}else if (data.code==-1) {
        			relogin();
        		}else {
					notifyInfo(data.message);
				}
			}//end of success
		})//end of ajax
	}

	function SampleReturn(typeStr,barcode,res) {
		layer.closeAll();
		$.ajax({  
			type: "POST",  
			url: "sampleinfo/setBack",  
			contentType: "application/json", //必须有
         dataType: "json", //表示返回值类型，不必须
		 	data: JSON.stringify({ 'barcode': barcode,'unqualifyreason':res}),
			success: function(data){  	
				if (data.code ==0) {
					$.each(datalist, function(i,item){
						//console.log(item.samplenum);
						if (barcode==item.barcode) {							
							//item.diagnosestatus = data.data.diagnosestatus;
							replaceItemByRoles(datalist.length - i -1,data.data);
							getStatusList();
							return false;
						}
			            
					});
					//RefreshPage();
				}else if (data.code==-1) {
        			relogin();
        		}else {
					notifyInfo(data.message);
				}
			}//end of success
		})//end of ajax
	}

	function ChooseExperts(typeStr,barcode) {

		$.ajax({  
			type: "GET",  
			url: "user/getExperters?barcode="+barcode,  
			success: function(data){  	
				if (data.code ==0) {

					$("#selectable .row").remove();
					data.data.reverse();
					$.each(data.data, function(i,item){
						$("#selectable").prepend($("#expertTmpl").render(item));
					});
					RemoveSelected();
					
					layer.open({
						type: 1,
						shade: 0.3,
						title: false, //不显示标题
						area: '800px', //宽高
						content: $('#layer_expert'), //捕获的元素
						cancel: function(index){
						  layer.close(index);
						}
					});//end of openlayer 

				}else if (data.code==-1) {
        			relogin();
        		} else {
					notifyInfo(data.message);
				}
			}//end of success
		})//end of ajax
	}

	function SampleQualify(typeStr,barcode,res) {

		(typeStr=="不合格")?status=0:status=1;
		$.ajax({  
			type: "POST",  
			url: "sampleinfo/setQualify?status="+status+"&uc="+res,  
			contentType: "application/json", //必须有
         dataType: "json", //表示返回值类型，不必须
		 	data: JSON.stringify({ 'barcode': barcode,'unqualifyreason':res}),
			success: function(data){  	
				if (data.code ==0) {
					layer.closeAll();
					$.each(datalist, function(i,item){
						//console.log(item.samplenum);
						if (barcode==item.barcode) {							
							//item.diagnosestatus = data.data.diagnosestatus;
							replaceItemByRoles(datalist.length - i -1,data.data);
							getStatusList();
							return false;
						}
			            
					});
					//RefreshPage();
				}else if (data.code==-1) {
        			relogin();
        		} else {
					notifyInfo(data.message);
				}
			},
			error: function(e) { 
				errorInfo('连接服务器失败！');
			}
		})

	}

	function RenderBtnByRoles() {
		(roles == ROLES_USER)?$("#addCaseBtn").show():$("#addCaseBtn").hide();
		if (roles == ROLES_EXPERT) {
			$("#1").hide();
			$("#2").hide();
			$("#3").hide();
		}
	}

	function replaceItemByRoles(i,item) {
		item = createItemByRoles(i,item);
		$(".content").children().eq(i).before($("#trTmpl").render(item));
		$(".content").children().eq(i+1).detach();
		$(".row_content").unbind('click');
		$(".row_content").click(function(event) {
			/* Act on the event */	
			($(this).children('.col-md-1').children().text()=="待处理")?sampleStatus = 1:sampleStatus = 0;
			barcode = $(this).children('.col-md-2').children('.barcode').text();
			window.open("index.html?barcode="+barcode+"&status="+sampleStatus);
			//location.href = "caseDetail.html?barcode="+barcode+"&status="+sampleStatus;
		});
		$(".processBtn").unbind('click');
		$(".processBtn").bind('click',function(event) {							
			event.stopPropagation();
			typeStr = $(this).attr('name');
			barcode =  $(this).parent().prevAll().children('.barcode').text();
			ProcessFunctionByRoles(typeStr,barcode);	
		});
	}
	
	function RenderItemByRoles(i,item) {
		item = createItemByRoles(i,item);
		$(".content").prepend($("#trTmpl").render(item));
	}
	
	function createItemByRoles(i,item) {
		//格式化日期字符串
		item.createtimeStr = item.createtimeStr.substring(0,10);
		//设置按钮的Class
		item.statusClass = statusArr[item.diagnosestatus].cls;
   	
		switch(roles)
		{
			case ROLES_USER:
				RenderUserItem(i,item);
				break;
			case ROLES_ADMIN:
				RenderAdminItem(i,item);
				break;
			case ROLES_EXPERT:
				RenderExpertItem(i,item);
				break;
		};
		return item;
	}

	function RenderUserItem(i,item) {
		if (item.diagnosestatus ==7) {
			//item.btnList = '<a name="评价" class="processBtn">评价</a><a name="诊断建议 " class="processBtn">诊断建议 </a>';
			item.btnList = '<a name="评价" class="processBtn">'+ langText["btn_feedback"]+'</a><a name="诊断建议 " class="processBtn">'+langText["btn_diagnose"]+'</a>';
			
		}else if(item.diagnosestatus ==3) {
			//item.btnList = '<a name="查看原因" class="processBtn">查看原因</a>';
			item.btnList = '<a name="查看原因" class="processBtn">'+langText["btn_checkreason"]+ '</a>';
		}else if(item.diagnosestatus ==8) {
			//item.btnList = '<a name="诊断建议 " class="processBtn">诊断建议 </a>';
			item.btnList = '<a name="诊断建议 " class="processBtn">'+langText["btn_diagnose"]+ '</a>';
		}else if(item.diagnosestatus == 3) {
			//item.btnList = '<a name="错误原因" class="processBtn">错误原因</a>';
			item.btnList = '<a name="错误原因" class="processBtn">'+langText["btn_errorreason"]+ '</a>';
		} else if(item.diagnosestatus == 5) {//专家退回
			//item.btnList = '<a name="退回原因" class="processBtn">退回原因</a>';
			item.btnList = '<a name="退回原因" class="processBtn">'+langText["btn_backreason"]+ '</a>';
		}
	}

	function RenderAdminItem(i,item) {
		switch(item.diagnosestatus)
		{
		case 1://待处理
			//item.btnList = '<a name="不合格" class="processBtn">不合格</a><a name="合格" class="processBtn">合格</a>';
			item.btnList = '<a name="不合格" class="processBtn">'+langText["btn_unqualified"]+'</a><a name="合格" class="processBtn">'+langText["btn_qualified"]+'</a>';
			break;
		case 2://待发布
			//item.btnList = '<a name="分配专家" class="processBtn">分配专家</a>';
			item.btnList = '<a name="分配专家" class="processBtn">'+langText["btn_setexperter"]+'</a>';
			break;
		case 3://不合格
			//item.btnList = '<a name="错误原因" class="processBtn">错误原因</a>';
			item.btnList = '<a name="错误原因" class="processBtn">'+langText["btn_errorreason"]+'</a>';
			break;
		case 5://专家退回
			//item.btnList = '<a name="退回原因" class="processBtn">退回原因</a>';
			item.btnList = '<a name="退回原因" class="processBtn">'+langText["btn_backreason"]+'</a>';
			break;
		case 4://待阅片
			//item.btnList = '<a name="补充发布" class="processBtn">补充发布</a>';
			item.btnList = '<a name="补充发布" class="processBtn">'+langText["btn_reassign"]+'</a>';
			break;
		case 6://已阅片
			//item.btnList = '<a name="退回发布" class="processBtn">退回发布</a><a name="综合处理" class="processBtn">综合处理</a>';
			item.btnList = '<a name="退回发布" class="processBtn">'+langText["btn_backassign"]+'</a><a name="综合处理" class="processBtn">'+langText["btn_summary"]+'</a>';
			break;
		case 7://综合分析
			//item.btnList = '<a name="诊断建议 " class="processBtn">诊断建议 </a>';
			item.btnList = '<a name="诊断建议 " class="processBtn">'+langText["btn_diagnose"]+' </a>';
			break;
		case 8://已评价
			//item.btnList = '<a name="诊断建议 " class="processBtn">诊断建议 </a><a name="用户评价" class="processBtn">用户评价</a>';
			item.btnList = '<a name="诊断建议 " class="processBtn">'+langText["btn_diagnose"]+' </a><a name="用户评价" class="processBtn">'+langText["btn_userfeedback"]+'</a>';
		};
	}

	function RenderExpertItem(i,item) {
		if (item.diagnosestatus ==4) {
			//item.btnList = '<a name="退回" class="processBtn">退回</a><a name="阅片完成" class="processBtn">阅片完成</a>';
			item.btnList = '<a name="退回" class="processBtn">'+langText["btn_back"]+'</a><a name="阅片完成" class="processBtn">'+langText["btn_readfinished"]+'</a>';
		}
	}

	
	function GetUploadFilesByType(option) {
		
		fromdate = $("#fromdate").val();
		todate = $("#todate").val();
		keyword = $("#searchTxt").val();		
	

		urlStr = 'sampleinfo/getSampleInfoList?type='+option+'&fromdate=' + fromdate + '&todate=' + todate + '&keyword=' +keyword ;
		
		$("#page").pagination({
		    remote: {
		        url: urlStr, 
		        success: function (result, pageIndex) {
		            $(".content").children('.row_content').remove();

		            if (result.code==0) {
						datalist = result.data;
		            	result.data.reverse(); 						
			            $.each(result.data, function(i,item){
							if (1==item.isinternational) {
							//	item.samplenum = "(国际)" + item.samplenum;
							}
			            	RenderItemByRoles(i,item);
						});
						

						$(".row_content").click(function(event) {
							/* Act on the event */	
							($(this).children('.col-md-1').children().text()=="待处理")?sampleStatus = 1:sampleStatus = 0;
							barcode = $(this).children('.col-md-2').children('.barcode').text();
							window.open("index.html?barcode="+barcode+"&status="+sampleStatus);
							//location.href = "caseDetail.html?barcode="+barcode+"&status="+sampleStatus;
						});

					   $(".processBtn").bind('click',function(event) {
							
							event.stopPropagation();
							typeStr = $(this).attr('name');
							barcode =  $(this).parent().prevAll().children('.barcode').text();
							ProcessFunctionByRoles(typeStr,barcode);	
						});
					}else if (result.code==-1) {
						relogin();
					} else {
						notifyInfo(result.message);
					}

		    	},
		        totalName: 'total',        //指定返回数据的总数据量的字段名
		    }
		});
	}

	function RefreshPage() {
		$(".content").children('.row_content').remove();
		$("#page").remove();
		$(".content").append("<div id='page' class='m-pagination'></div>");
		GetUploadFilesByType(curType);
		//console.log(getStatusList());
		getStatusList();
	}

	function RemoveSelected() {
		$("#selectable .row-content").click(function(event) {
			$("#selectable .row-content").children('.col-md-2').removeClass('ui-selected');
			$("#selectable .row-content").children('.col-md-3').removeClass('ui-selected');
		});
	}


	$("#addCaseBtn").click(function(event) {
		/* Act on the event */
		location.href = "addCase.html";
	});

	$("#searchBtn").click(function(event) {
		/* Act on the event */
		$("#page").remove();
		$(".pat").remove();
		$(".content").append("<div id='page' class='m-pagination'></div>");
		GetUploadFilesByType(curType);
		getStatusList();
	});

	/*
	$(".row_content").click(function(event) {

		($(this).children('.col-md-1').children().text()=="待处理")?sampleStatus = 1:sampleStatus = 0;
		barcode = $(this).children('.col-md-2').children('.barcode').text();
		location.href = "caseDetail.html?barcode="+barcode+"&status="+sampleStatus;
	});
	*/

	$("#cancel").click(function(event) {
		/* Act on the event */
		layer.closeAll();
	});

	$("#confim").click(function(event) {
		/* Act on the event */
		expertList = "";
		endDate = $("#diagdate").val();
		selectedList = $(".ui-selected");
		if (selectedList.length==0) return;
		$.each(selectedList, function(i,item){
			eid = $(item).children('#colId').children('#eid').text();
			expertList += eid + ",";
		});

	   urlStr = "sampleinfo/setExperter?barcode="+curBarcode+"&expertIds="+expertList+"&enddate="+endDate;

	   $.ajax({  
			type: "GET",  
			url: urlStr,  
			success: function(data){  	
				if (data.code ==0) {
					$.each(datalist, function(i,item){
						//console.log(item.samplenum);
						if (barcode==item.barcode) {							
							//item.diagnosestatus = result.data.diagnosestatus;
							replaceItemByRoles(datalist.length - i -1,data.data);
							getStatusList();
							return false;
						}
			            
					});
					//RefreshPage();
				}else if (data.code==-1) {
        			relogin();
        		} else {
					notifyInfo(data.message);
				}
				layer.closeAll();
			}//end of success
		})//end of ajax
		
		
	});
	
	
	
	
	translatePage(document, 'span');


})
