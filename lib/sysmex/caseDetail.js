var barcode;
var sampleItem;


$(document).ready(function($) {

   roles = parseInt($.cookie('role'));
   barcode = getUrlParam('barcode');
   sampleStatus = getUrlParam('status');
   if ((roles == ROLES_ADMIN) && (sampleStatus == 1)) {
      $("#unqualifyBtn").show();
      $("#qualifyBtn").show();
   }

   GetSampleDetail();

   function GetSampleDetail() {
      $.ajax({
         type: "GET",
         url: "sampleinfo/getSampleInfo?barcode=" + barcode,
         success: function(data) {
            if (data.code == 0) {
               sampleItem = data.data;
			   //editBtn 看用户能不能编辑
			   if (sampleItem.editable) {
				   if(item.diagnosestatus==1 || item.diagnosestatus==3) {
						$("#editBtn").removeClass('fn-hide');
				   }
			   }
               //sampleItem.diagnosestatus = statusTxtArr[sampleItem.diagnosestatus];
			   sampleItem.diagnosestatus = "专家："+ sampleItem.readExperters+ "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+sampleItem.diagnosestatusStr;

               tmpList = "";
               /*for (i = 0; i < sampleItem.machineList.length; i++) {
                  tmpList = tmpList + '<li class="imgThumb" href="' + sampleItem.machineList[i].picurl + '"><img src="' + sampleItem.machineList[i].picurl + '"></li>';
               }
               sampleItem.machineList = tmpList;

               tmpList = "";
               for (i = 0; i < sampleItem.graphList.length; i++) {
                  tmpList = tmpList + '<li class="imgThumb" href="' + sampleItem.graphList[i].picurl + '"><img src="' + sampleItem.graphList[i].picurl + '"></li>';
               }
               sampleItem.graphList = tmpList;

               tmpList = "";
               for (i = 0; i < sampleItem.alertList.length; i++) {
                  tmpList = tmpList + '<li class="imgThumb" href="' + sampleItem.alertList[i].picurl + '"><img src="' + sampleItem.alertList[i].picurl + '"></li>';
               }
               sampleItem.alertList = tmpList;

               tmpList = "";
               for (i = 0; i < sampleItem.historyList.length; i++) {
                  tmpList = tmpList + '<li class="imgThumb" href="' + sampleItem.historyList[i].picurl + '"><img src="' + sampleItem.historyList[i].picurl + '"></li>';
               }
               sampleItem.historyList = tmpList;*/

               
               //sampleItem.otherList = tmpList;

               /*先注释掉，一行行显示，右边显示切片编号
			   tmpList = "";
               for (i = 0; i < sampleItem.microscopeList.length; i++) {

                  item = sampleItem.microscopeList[i];

                  if (roles == ROLES_USER) {
                     tmpList = tmpList + '<li class="imgThumbLg"><img src="' + item.thumburl + '" id="' + item.id + '"/><i class="del"></i></li>';
                  } else {
                     tmpList = tmpList + '<a href="slice.html?display=11111111&barcode=' + item.barcode + '&imgId=' + item.id + "&width=" + item.width +"&height="+ item.height+ "&maxzoom="+ item.maxzoom + '" target="_top"><li class="imgThumbLg"><img src="' + item.thumburl + '" id="' + item.id + '"/><i class="del"></i></li></a>';
                  }

               }
               sampleItem.microscopeList = tmpList;*/
			   diagresult = '';
			   for (i = 0; i<sampleItem.expertReadList.length; i++) {
				   if (sampleItem.expertReadList[i].diagnosestatus==6) {
						diagresult += sampleItem.expertReadList[i].expertName + ': '+sampleItem.expertReadList[i].diagnosestatus + '\n';
				   }
			   }
			   sampleItem.diagresult = diagresult;
               $(".content").prepend($("#trTmpl").render(sampleItem));
			   
			   //附件清单
			   tmpList = "";
			   for (i = 0; i < sampleItem.otherList.length; i++) {
					tmpList = '<div class="row row-info">'
					        + '<div class="col-md-2 title">'
							+ '<span>'+ sampleItem.otherList[i].pictype+'：</span>'
							+ '</div><div class="col-md-10 content" style="margin-top:10px">'
							+ '<a  href="'+sampleItem.otherList[i].picurl +'" target="_Blank">'+ sampleItem.otherList[i].filename +'</a>'
							+ '</div></div>';
					$(".row-micro").before(tmpList);
					//console.log($("#appendfile").text());
               }
			   //ndpi预览图清单
			   tmpList = "";
			   for (i = 0; i < sampleItem.microscopeList.length; i++) {
					item = sampleItem.microscopeList[i];

					if (roles == ROLES_USER) {
						tmpList = '<li class="imgThumbLg"><img src="' + item.thumburl + '" id="' + item.id + '"/></li>';
					} else {
						tmpList = '<a href="slice.html?display=11111111&barcode=' + item.barcode + '&isinternational=' + sampleItem.isinternational+'&imgId=' + item.id + "&width=" + item.width +"&height="+ item.height+ "&maxzoom="+ item.maxzoom + '" target="_top"><li class="imgThumbLg"><img src="' + item.thumburl + '" id="' + item.id + '"/><i class="del"></i></li></a>';
					}	
					
					tmpList = '<div class="row row-info">'
							+ '<div class="col-md-2 title">'
							+ '<span>病理切片：</span>'
							+ '</div>'
							+ '<div class="col-md-2 content">'
							+ tmpList
							+ '</div>'
							+ '<h4 class="col-md-3 content">'
							+ item.slicenumber
							+ '</h4>'
							+ '<li class="col-md-2" ><img style="height:80px" src="' + item.thumburl.replace("thumb.jpg","macro.jpeg") + '"/></li>'
							+ '</div>';
					$(".row-micro").before(tmpList);
					//console.log($("#appendfile").text());
               }

               //生产图片放大预览
               $(".imgThumb").fancybox({
                  helpers: { overlay: { css: {'background': 'rgba(0, 0, 0, 0.5)'}}}
               });
			   
			   
			   translatePage(document, 'span');

            }else if (data.code==-1) {
               relogin();
            } else {
				errorInfo(data.message);
			}
         },
         error: function(e) {
            errorInfo('连接服务器失败！');
         }
      });
   }

   $("#returnBtn").click(function(event) {
      /* Act on the event */
      //location.href = "caseList.html";		
		parent.window.opener = null;
		window.parent.close();
   });
   
   $("#editBtn").click(function(event) {
      /* Act on the event */
      location.href = "addCase.html?barcode="+barcode;
   });

   $("#unqualifyBtn").click(function(event) {
      layer.prompt({
         title: '请输入切片不符合要求的原因:',
         formType: 2
      }, function(result) {
         SampleQualify("不合格", barcode, result);
      });
   });

   $("#qualifyBtn").click(function(event) {

      SampleQualify("合格", barcode, "");
   });

   function SampleQualify(typeStr, barcode, res) {

      (typeStr == "不合格") ? status = 0 : status = 1;
      $.ajax({
         type: "POST",
         url: "sampleinfo/setQualify?status=" + status,
         contentType: "application/json", //必须有
         dataType: "json", //表示返回值类型，不必须
         data: JSON.stringify({
            'barcode': barcode,
            'unqualifyreason': res
         }),
         success: function(data) {
            if (data.code == 0) {
               layer.closeAll();
               $("#unqualifyBtn").hide();
               $("#qualifyBtn").hide();
            }else if (data.code==-1) {
               relogin();
            } else {
				errorInfo(data.message);
			}
         },
         error: function(e) {
            errorInfo('连接服务器失败！');
         }
      })

   }
   
   translatePage(document, 'span');

})