var sliceObj=function(sliceId,sliceDiag,sliceArr) {
	this.sliceId = sliceId;
	this.sliceDiag = sliceDiag;
	this.sliceArr = sliceArr;
}

var cropperObj=function(cropperId,imgpath, remark) {
	this.cropperId = cropperId;
	this.imgpath = imgpath;
	this.remark = remark;
}

var LayerObj=function(lat_p1,lng_p1,lat_p2,lng_p2,radius,layerType,layer) {
  this.lat_p1=lat_p1;
  this.lng_p1=lng_p1;
  this.lat_p2=lat_p2;
  this.lng_p2=lng_p2;
  this.radius=radius;
  this.diagStr = "";
  this.layerType = layerType;
  this.layer = layer;
  this.setDiag=function(diagStr) {
    this.diagStr = diagStr;
  };
};

var opts = {lines:13,length: 13, width: 6, radius: 18, scale: 1, corners: 1, color: '#000', opacity: 0.25, rotate: 0, direction: 1, speed: 1, trail: 60 , fps: 20, zIndex: 2e9, className: 'spinner', top: '50%', left: '50%', shadow: true, hwaccel: false, position: 'absolute'};
var spinner = new Spinner(opts);

var map;
var cropWidth,cropHeight,showList;
var curMap,initBound;
var sliceId,sliceDiag,displayId;
var _mouseX,_mouseY,_mouseX_end,_mouseY_end;
var curMarker,curCropId;
var _cropperX,_cropperY,_preW,preH;
var BODY_WIDTH,BODY_HEIGHT;
var cropBarHide,recordBarHide;
var LayerArr= new Array();
var saveArr = new Array();
var cropperArr = new Array();
var editType;
var curtips,isFullScreen;


//提示消息对话框
function notifyInfo(info) {
	alertify.set({ delay: 1000 });
	alertify.success(info);
}



function caluBounds(latlng,zoom) {
	var lat = latlng.lat;
	var lng = latlng.lng;
	x = initBound._northEast.lat - initBound._southWest.lat;
	y = initBound._northEast.lng - initBound._southWest.lng;
	x = x/ Math.pow(2,zoom)/2;
	y = y/ Math.pow(2,zoom)/2;
	var northEast = L.latLng(lat+x,lng+y);
	var southWest = L.latLng(lat-x,lng-y);
	return L.latLngBounds(northEast, southWest);
}

function caluCenter(bnd,zoom) {
	var lat = (bnd._northEast.lat + bnd._southWest.lat)/2;
	var lng = (bnd._northEast.lng + bnd._southWest.lng)/2;
	x = bnd._northEast.lat - bnd._southWest.lat;
	y = bnd._northEast.lng - bnd._southWest.lng;
	x = x/ Math.pow(2,zoom)/2;
	y = y/ Math.pow(2,zoom)/2;
	var northEast = L.latLng(lat+x,lng+y);
	var southWest = L.latLng(lat-x,lng-y);
	return L.latLngBounds(northEast, southWest);
}

function setMiniMapView(e) {
	var bound = caluBounds(e.latlng,map.getZoom());
	curMap.setBounds(bound);
	map.options.crs = L.CRS.Simple;
	map.setView([e.latlng.lat *2, e.latlng.lng*2]);
	map.options.crs = L.CRS.EPSG3857;
}

function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return unescape(r[2]); return null; //返回参数值
}

$(document).ready(function($) {

	isFullScreen = 0;
	isDrawCropper = 0;
	cropBarHide = 1;
	recordBarHide = 1;
	showList = 0;
	BODY_WIDTH = document.body.clientWidth;
	BODY_HEIGHT = document.body.clientHeight;
	$("#cropBar").width(BODY_WIDTH-2-10);
	$("#recordBar").width(BODY_WIDTH-2-10);
	$("#cropBar").css("left", -BODY_WIDTH);
	$("#recordBar").css("left",-BODY_WIDTH);
	$("#cropper" ).draggable();

	sliceDiag = "liyang";
	barcode = getUrlParam('barcode');
	isinternational = getUrlParam('isinternational');
	imgId = getUrlParam('imgId');
	sliceWidth = getUrlParam('width')/2;
	sliceHeight = getUrlParam('height')/2;
	maxzoom = getUrlParam('maxzoom');
	displayId = getUrlParam('display');
	var slicePath = "upload/"+barcode+'/'+imgId+'/{z}/{y}/{x}.jpg'; 
	if (isinternational==1) {
		slicePath = "uploadintl/"+barcode+'/'+imgId+'/{z}/{y}/{x}.jpg'; 
	}

	$("#mini").height(sliceHeight/2);
	$("#mini").width(sliceWidth/2);

	SetBtnDisplay();
	
	map = L.map('map',{zoomControl:false, crs: L.CRS.Simple}).setView([-sliceHeight, sliceWidth], 0);
	// map.setMaxBounds(map.getBounds());

	L.tileLayer(slicePath, {
	    minZoom: 0,
	    maxZoom: maxzoom,
	    tms: false,
	    noWrap:false,
	    reuseTiles:true,
	    continuousWorld:true,  
	}).addTo(map);

	
	miniMap = L.map('mini',{zoomControl:false, crs: L.CRS.Simple, dragging:false,doubleClickZoom:false}).setView([-sliceHeight/4, sliceWidth/4], 0);
	L.tileLayer(slicePath, {
	    minZoom: 0,
	    maxZoom: 0,
	    tms: false,
	    noWrap:true,
	    continuousWorld:true, 
	    tileSize:256,
	}).addTo(miniMap);

	
	initBound = miniMap.getBounds();
	curMap = L.rectangle(initBound, {color: "#ff0000", weight: 1, fillOpacity:0}).addTo(miniMap);

	var drawnItems = new L.FeatureGroup();
	map.addLayer(drawnItems);

	initLayers();
	initCroppers();

	map.options.crs = L.CRS.Simple;
	map.setView([-sliceHeight, sliceWidth]);
	


	// $("#mini").click(function(event) {
	// 	/* Act on the event */
	// 	// alert(event);
	// 	_x = event.clientX - $("#mini").offset().left;
	// 	_y = event.clientY - $("#mini").offset().top;
	// 	$("#miniLine").css("top",_y+"px");
	// 	$("#miniLine").css("left",_x+"px");
	// });

	miniMap.on('click', function(e) {
    	var bound = caluBounds(e.latlng,map.getZoom());
    	curMap.setBounds(bound);
    	map.options.crs = L.CRS.Simple;
    	map.setView([e.latlng.lat *4, e.latlng.lng*4]);
    	map.options.crs = L.CRS.EPSG3857;
	});
	
	map.on('click',function(e) {		
		var ll = e.latlng;
		console.log(map.latLngToLayerPoint(ll).x-map.latLngToLayerPoint(map.getCenter()).x);
		console.log(map.latLngToLayerPoint(map.getCenter()));
	
	});

	map.on('mouseup',function(e) {
		map.options.crs = L.CRS.Simple;
		var miniLatlng = L.latLng(map.getCenter().lat/4,map.getCenter().lng/4);
		var bound = caluBounds(miniLatlng,map.getZoom());
		curMap.setBounds(bound);
		map.options.crs = L.CRS.EPSG3857;
	});

	map.on('zoomend',function(e){

		// _x = $("#mini path").offset().left-$("#mini").offset().left;;

		map.options.crs = L.CRS.Simple;
		var miniLatlng = L.latLng(map.getCenter().lat/4,map.getCenter().lng/4);
		var bound = caluBounds(miniLatlng,map.getZoom());
		curMap.setBounds(bound);
		// map.options.crs = L.CRS.EPSG3857;
	});

	$("#map").mousedown(function(event) {
		/* Act on the event */
		_mouseX = event.clientX;
		_mouseY = event.clientY;
	});

	$("#map").mouseup(function(event) {
		/* Act on the event */
		_mouseX_end = event.clientX;
		_mouseY_end = event.clientY;
	});


	function SetBtnDisplay() {

		$(".funBtn").each(function(index,element){
			(displayId.substr(index,1)==0)?$(element).hide():$(element).show();				
		});

		$(".zoomBtn").each(function(index,element){
			if (parseInt($(this).attr("id"))>maxzoom) {
				$(this).hide();
			}
		});
	}

	//绘制标注对象
	function drawLayer(item) {
		var layerItem,tmpLayer;
		if (item.layerType == "circle") {
			layerItem = L.circle([item.lat_p1, item.lng_p1], item.radius);
			tmpLayer = new LayerObj(
			item.lat_p1,
			item.lng_p1,
			0,0,item.radius,item.layerType,layerItem);
		}else if (item.layerType == "rectangle") {
			layerItem = L.rectangle([[item.lat_p1, item.lng_p1], [item.lat_p2, item.lng_p2]]);
			tmpLayer = new LayerObj(
			item.lat_p1,item.lng_p1,item.lat_p2,item.lng_p2,
			0,item.layerType,layerItem);
		}else{
			layerItem = L.marker([item.lat_p1, item.lng_p1]);
			tmpLayer = new LayerObj(
			item.lat_p1,item.lng_p1,
			0,0,0,item.layerType,layerItem);
		}

		LayerArr.push(tmpLayer);
		drawnItems.addLayer(layerItem);
		addBarItem(item.layerType);
	}

	//绘制截图对象
	function drawCropper(item,index) {
		imgUrl = "clipimg/" + item.imgpath;
		cropperId = item.id;
		remark = item.remark;

    	$("#cropBar").append("<div class='cropperBtn'><img src='" + imgUrl + "'><i class='del'></i><i class='edit'></i><span class='fn-hide' id='"+ cropperId +"'></span></div>");

    	var cropItem = new cropperObj(cropperId,imgUrl,remark);
    	cropperArr.push(cropItem);

    	//鼠标悬停的删除编辑按钮
    	$(".cropperBtn").bind('mouseover', function(event) {
			$(this).children(".del").show();
			$(this).children(".edit").show();
		});
		$(".cropperBtn").bind('mouseout', function(event) {
			$(this).children(".del").hide();
			$(this).children(".edit").hide();
		});

		//鼠标悬停预览
		$(".cropperBtn:eq("+index +") img").bind('mouseenter', function(event) {
			$("<img class='imgshow' src='"+this.src+"'/>").appendTo("#map"); 
			var _x = $(this).offset().left;
			var _y = $(this).offset().top;
			var _h = $(".imgshow").height();
			$(".imgshow").css("top",_y-_h-10+"px").css("left",_x+"px"); 
    	});
    	$(".cropperBtn:eq("+index +") img").bind('mouseout', function(event) {
			$(".imgshow").remove();
    	});

    	//截图注释
		$(".cropperBtn:eq("+index +") .edit").bind('click', function(event) {

			curCropId = $(this).next().attr("id");
			editType = "CROP";
			layer.closeAll();

			for(i=0;i<cropperArr.length;i++) {
				if (cropperArr[i].cropperId==curCropId)
					remark = cropperArr[i].remark;
			}

			$("#noticeTxt").val(remark);
			layer.open({
			    type: 1,
			    shade: 0.3,
			    closeBtn:0,
			    title: false, //不显示标题
			    //area: ['520px', '220px'], //宽高
			    content: $('.layer_notice'), //捕获的元素
			    cancel: function(index){
			        layer.close(index);
			        this.content.show();
			    }
			});
		});


		$(".cropperBtn:eq("+index +") .del").bind('click', function(event) {

			curBtn = $(this).parent(".cropperBtn");
			i = curBtn.index();
			$(this).parent(".cropperBtn").remove();
			tmpurl = 'sliceinfo/deleteClipImage?experterid=0&imgId='+imgId + '&id=' + cropperArr[i].cropperId;
			cropperArr.splice(i,1);

			$.ajax({  
				type: "get",  
				url: tmpurl,  
				async: false,   
				contentType: "application/json; charset=utf-8",  
				dataType: "json",  
				success: function(data) {  
					if (data.code==0) {
						notifyInfo(data.message);
					}else if (data.code==-1) {
	        			relogin();
	        		} else {
						errorInfo(data.message);
					}
				}  
			});  

		});
	}

	//从数据库读取标注信息
	function initLayers() {

		map.options.crs = L.CRS.EPSG3857;
		$.ajax({  
			type: "get",  
			url: 'sliceinfo/getAllLayers?experterid=0&imgId='+imgId,  
			async: false,   
			contentType: "application/json; charset=utf-8",  
			dataType: "json",  
			success: function(result) {  
				if (result.code == 0) {
					$.each(result.data, function(i,item){
	            	drawLayer(item);
					});
				}else if (result.code==-1) {
	        		relogin();
	        	} else {
					errorInfo(data.message);
				}
				
			}  
		});  
	}

	//从数据库读取截图信息
	function initCroppers() {
		$.ajax({  
			type: "get",  
			url: 'sliceinfo/getClipImages?experterid=0&imgId='+imgId,  
			async: false,   
			contentType: "application/json; charset=utf-8",  
			dataType: "json",  
			success: function(result) {  
				if (result.code == 0) {
					$.each(result.data, function(i,item){
	            	drawCropper(item,i);
					});
				}else if (result.code==-1) {
	        		relogin();
	        	} else {
					errorInfo(data.message);
				}
				
			}  
		});  
	}

	//在创建标注图形后将对象保存到LayerArr数组
	map.on('draw:created', function (e) {
	
		var tmpLayer;
		var type = e.layerType;
		var layer = e.layer;

		map.options.crs = L.CRS.EPSG3857;
		drawnItems.addLayer(layer);

		if (type=="rectangle") {
			tmpLayer = new LayerObj(
			layer._latlngs[3].lat,
			layer._latlngs[3].lng,
			layer._latlngs[1].lat,
			layer._latlngs[1].lng,
			0,type,layer);
		}else if (type=="circle"){
			tmpLayer = new LayerObj(
			layer._latlng.lat,
			layer._latlng.lng,
			0,0,layer._mRadius,type,layer);
		}else if (type=="marker") {
			tmpLayer = new LayerObj(
			layer._latlng.lat,
			layer._latlng.lng,
			0,0,0,type,layer);
		}

		LayerArr.push(tmpLayer);
		addBarItem(type);
		$("#mask").toggle();	

		notifyInfo(langText['mark_ok']);
	});


	$(".zoomBtn").click(function() {
    	var zoom = $(this).attr('id');
    	map.setZoom(zoom);

    	var bound = caluCenter(initBound,zoom);
    	curMap.setBounds(bound);
	})

	$("#rectangleBtn").click(function() {

		MaskToggle();
		map.options.crs = L.CRS.EPSG3857;
    	new L.Draw.Rectangle(map).enable();
	})

	$("#circleBtn").click(function() {
		MaskToggle();
    	map.options.crs = L.CRS.EPSG3857;
    	new L.Draw.Circle(map).enable();
	})

	$("#diagBtn").click(function() {
    	
    	$("#diagId").text(sliceId);
    	$.ajax({  
         type: "GET",  
         url: "sliceinfo/getDiagnoseInfo?experterid=0&barcode="+barcode,
         success: function(result){  	
				if (result.code==0) {
					$("#diagId").text(result.data.samplenum);
					$("#patientname").text(result.data.patientname);
					$("#certificateno").text(result.data.certificateno);
					$("#diagAgeSex").text(result.data.patientage + "/"+result.data.patientsex);
					$("#patientphone").text(result.data.patientphone);
					$("#hospname").text(result.data.hospname);
					$("#hospcontacts").text(result.data.hospcontacts);
					$("#hospphone").text(result.data.hospphone);
					$("#clinicaldiagnosis").text(result.data.clinicaldiagnosis);
					$("#sickpart").text(result.data.sickpart);
					$("#operationfindings").text(result.data.operationfindings);
					$("#macroscopicdesc").text(result.data.macroscopicdesc);
					$("#lastdiagnoseinfo").text(result.data.lastdiagnoseinfo);
					$("#diagInfo").text(result.data.diag);
					$("#diagRemark").text(result.data.remark);
					$("#diagTxt").val(result.data.expertdiagnose);
					
					//附件清单
				   tmpList = "";
				   for (i = 0; i < result.data.otherList.length; i++) {
						tmpList = '<div class="row row-info">'
								+ '<div class="col-md-2 title">'
								+ '<span>'+ result.data.otherList[i].pictype+'：</span>'
								+ '</div><div class="col-md-10 content" style="margin-top:10px">'
								+ '<a  href="'+result.data.otherList[i].picurl +'" target="_Blank">'+ result.data.otherList[i].filename +'</a>'
								+ '</div></div>';
						$(".row-micro").before(tmpList);
				   }
					//translatePage(document, 'span');
				}else if (result.code==-1) {
	        		relogin();
	        	} else {
					errorInfo(data.message);
				}
         }
      }); 
    	$(".layer_diag").show();
	})

	$(".layer_diag #cancel").click(function() {
    	$(".layer_diag").hide();
	})

	$(".layer_diag #notice").click(function() {
    	$(".layer_diag").hide();
    	diagnose = $("#diagTxt").val();

    	$.ajax({  
	         type: "POST",  
	         url: "sliceinfo/saveDiagnoseInfo",
			 contentType: "application/json", //必须有
             dataType: "json", //表示返回值类型，不必须
			 data: JSON.stringify({ 'barcode': barcode, 'diagnoseinfo': diagnose}), 
	         success: function(data){  	
					if (data.code==0) {
						notifyInfo(data.message);
					}else if (data.code==-1) {
		        		relogin();
		        	} else {
						errorInfo(data.message);
					}
	         }
	     }); 
	})
	

	$(".diag").click(function() {
    	location.href = "map.html";
	})


	$("#saveBtn").click(function() {
    	for(var i=0;i<LayerArr.length;i++) {
    		saveArr[i]=LayerArr[i];
    		saveArr[i].layer="";
    	}	

    	var postData = JSON.stringify(saveArr);
		$.ajax({  
			type: "post",  
			url: 'sliceinfo/saveLayers?experterid=0&imgId='+imgId + '&sliceDiag=' + sliceDiag,  
			async: false,  
			data: postData,  
			contentType: "application/json; charset=utf-8",  
			dataType: "json",  
			success: function(data) {  
				if (data.code == 0) {
					notifyInfo(data.message);
				}else if (data.code==-1) {
	        		relogin();
	        	} else {
					errorInfo(data.message);
				}
				
			}  
		});  
	})

	$("#fullSreenBtn").click(function() {
	
		if (isFullScreen == 0) {
			var docElm = document.documentElement;
			if (docElm.requestFullscreen) {  
			    docElm.requestFullscreen();//W3C    
			}else if (docElm.mozRequestFullScreen) {  
			    docElm.mozRequestFullScreen();//FireFox 
			}else if (docElm.webkitRequestFullScreen) {  
			    docElm.webkitRequestFullScreen();//Chrome等    
			}else if (elem.msRequestFullscreen) {
			  elem.msRequestFullscreen();//IE11
			}
		}else{
			if (document.exitFullscreen) {  
			    document.exitFullscreen();  
			}  
			else if (document.mozCancelFullScreen) {  
			    document.mozCancelFullScreen();  
			}  
			else if (document.webkitCancelFullScreen) {  
			    document.webkitCancelFullScreen();  
			}
			else if (document.msExitFullscreen) {
			      document.msExitFullscreen();
			}
		}
		isFullScreen = !isFullScreen;
	})

		//提示层
	$(".funBtn").mouseover(function() {
		ToggleTips(this,1);
	}).mouseout(function(event) {
		layer.close(curtips);
	})

	$(".tapBar").mouseover(function(event) {
		ToggleTips(this,2);
	}).mouseout(function(event) {
		layer.close(curtips);
	})

	$("#minidisplay").mouseover(function(event) {
		ToggleTips(this,1);
	}).mouseout(function(event) {
		layer.close(curtips);
	})
	

	function ToggleTips(item,type) {
		tipsStr = $(item).attr("name");
		tipsId  = $(item).attr("id");
		curtips = layer.tips(tipsStr, "#"+tipsId,{tips: [type, '#3595CC']});
	}

	$("#sliceBtn").click(function() {
		if (showList == 0) {
			$.ajax({
	         type: "GET",
	         url: "sampleinfo/getSampleInfo?barcode=" + barcode,
	         success: function(data) {
	            if (data.code == 0) {
	               item = data.data.microscopeList;

	               imgSrc = "<div id='sliceList'>";
	               for (i = 0; i < item.length; i++) {

	               	imgSrc +=  "<a href='slice.html?display=11111111&barcode=" + item[i].barcode + "&isinternational=" + data.data.isinternational+"&imgId=" + item[i].id + "&width=" + item[i].width +"&height="+ item[i].height+ "&maxzoom="+ item[i].maxzoom+ "'><img src='" + item[i].picurl.replace("preview.jpg","macro.jpeg") + "'></a>";
	               };
	               imgSrc += "</div>";
	               $(".tools").append(imgSrc);
	               
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
		}else{
			$("#sliceList").remove();

		}
		showList = !showList;
    	
   })


	$("#exitBtn").click(function() {
    	location.href = "index.html?barcode="+barcode+"&status="+0;
	})

	$("#markerBtn").click(function() {
		MaskToggle();
		new L.Draw.Marker(map).enable();
	})

	$("#cropBarTap").click(function(event) {
		_left = cropBarHide? 10:-BODY_WIDTH
		$("#cropBar").animate({"left":_left}, 100);
		cropBarHide = !cropBarHide;
	});

	$("#recordBarTap").click(function(event) {
		_left = recordBarHide? 10:-BODY_WIDTH;
		$("#recordBar").animate({"left":_left}, 100);
		recordBarHide = !recordBarHide;
	});

	$("#cropperBtn").click(function() {

		$("#mask").toggle();	
		map.scrollWheelZoom.disable();
		map.doubleClickZoom.disable();

		$("#cropper").height();
		$("#cropper").width();
		$("#cropper").show();
		$("#cropper").css("top",($("#map").height()-200)/2+"px");
		$("#cropper").css("left",($("#map").width()-300)/2+"px");
	})

	$("#minidisplay").click(function(event) {
		/* Act on the event */
		$("#mini").toggle();
		isDisplay = $("#mini").is(":hidden");
		isDisplay?$("#minidisplay").addClass('miniHide').removeClass('miniShow'):$("#minidisplay").addClass('miniShow').removeClass('miniHide');
	});

	$(document).keyup(function(e){
    	if (e.keyCode == 27) 
    	{
        	$("#cropper").hide();
        	$("#mask").hide();
        	map.options.crs = L.CRS.EPSG3857;
			map.scrollWheelZoom.enable();
			map.doubleClickZoom.enable();
    	}
	})

	$("#cropper").mouseover(function(event) {
		$(this).children(".crop").show();
	});

	$("#cropper").mouseout(function(event) {
		$(this).children(".crop").hide();
	});

	$("#cropper").mousemove(function(event) {
		_cropperY = $(this).position().top; 
		_cropperX = $(this).position().left;
		console.log(_cropperX+ "," + _cropperY); 
	});

	function doImage(err, canvas) {

	    var temp_ctx, temp_canvas;
    	temp_canvas = document.createElement('canvas');
    	temp_ctx = temp_canvas.getContext('2d');
    	temp_canvas.width = cropWidth;
    	temp_canvas.height = cropHeight;
    	temp_ctx.drawImage(canvas, _cropperX, _cropperY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    	var vData = temp_canvas.toDataURL();

    	vData=vData.split(',')[1];
		vData=window.atob(vData);
		var ia = new Uint8Array(vData.length);
		for (var i = 0; i < vData.length; i++) {
		    ia[i] = vData.charCodeAt(i);
		};
		var blob=new Blob([ia], {type:"image/png"});

		var fd=new FormData();
		fd.append('file',blob);
		$.ajax({
			type:"POST",
		    url:"sliceinfo/uploadClipImg?experterid=0&imgId="+imgId,
		    data:fd,
		    async: true,  
			processData: false,
			contentType: false,
		    success:function(result){ 
				if (result.code != 0) {
					if (result.code==-1) {
				        relogin();
				    } else {
						spinner.spin();
						$("#mask").toggle();
						errorInfo(result.message);
						return;
					}
				} 
		    	//隐藏进度条
		    	spinner.spin();
		    	notifyInfo(result.message);
		    	$("#mask").toggle();

		    	imgUrl = "clipimg/" + result.data.imgpath;
		    	$("#cropBar").append("<div class='cropperBtn'><img src='" + imgUrl + "'><i class='del'></i><i class='edit'></i><span class='fn-hide' id='"+ result.data.id +"'></span></div>");
		    	//$(".cropperBtn").unbind();
				//$(".cropperBtn .del").unbind();
				//$(".cropperBtn .edit").unbind();

		    	var cropItem = new cropperObj(result.data.id,imgUrl,"");
		    	cropperArr.push(cropItem);
		    	index = cropperArr.length-1;

		    	$(".cropperBtn:eq("+index +")").bind('mouseover', function(event) {
					$(this).children(".del").show();
					$(this).children(".edit").show();
				});
				$(".cropperBtn:eq("+index +")").bind('mouseout', function(event) {
					$(this).children(".del").hide();
					$(this).children(".edit").hide();
				});

				//鼠标悬停预览
				$(".cropperBtn:eq("+index +") img").bind('mouseenter', function(event) {
					$("<img class='imgshow' src='"+this.src+"'/>").appendTo("#map"); 
					var _x = $(this).offset().left;
					var _y = $(this).offset().top;
					var _h = $(".imgshow").height();
					$(".imgshow").css("top",_y-_h-10+"px").css("left",_x+"px"); 
		    	});
		    	$(".cropperBtn:eq("+index +") img").bind('mouseout', function(event) {
					$(".imgshow").remove();
		    	});

		    	//截图注释
				$(".cropperBtn:eq("+index +") .edit").bind('click', function(event) {

					curCropId = $(this).next().attr("id");
					editType = "CROP";


					for(i=0;i<cropperArr.length;i++) {
						if (cropperArr[i].cropperId==curCropId)
							remark = cropperArr[i].remark;
					}
					$("#noticeTxt").val(remark);

					layer.open({
					    type: 1,
					    shade: 0.3,
					    closeBtn:0,
					    title: false, //不显示标题
					    //area: ['520px', '220px'], //宽高
					    content: $('.layer_notice'), //捕获的元素
					    cancel: function(index){
					        layer.close(index);
					        this.content.show();
					    }
					});
				});

		    	//删除截图
				$(".cropperBtn:eq("+index +") .del").bind('click', function(event) {

					curBtn = $(this).parent(".cropperBtn");
					i = curBtn.index();
					$(this).parent(".cropperBtn").remove();
					tmpurl = 'sliceinfo/deleteClipImage?experterid=0&imgId='+imgId + '&id=' + cropperArr[i].cropperId;
					cropperArr.splice(i,1);

					$.ajax({  
						type: "get",  
						url: tmpurl,  
						async: false,   
						contentType: "application/json; charset=utf-8",  
						dataType: "json",  
						success: function(result) {  
							if (result.code == 0) {
								notifyInfo("删除成功！");
							}else if (result.code==-1) {
				        		relogin();
				        	} else {
								errorInfo(data.message);
							}
							
						}  
					});  

				});
		    }
		 }); 

    	//$("#cropBar").append("<img src='" + vData + "'/>");

	}



	$("#cropper .crop").click(function(event) {
		//显示进度条
		var target = document.getElementById('map');
        spinner.spin(target);  

		leafletImage(map, doImage); 
		$("#cropper").hide();
		map.scrollWheelZoom.enable();
		map.doubleClickZoom.enable();
	});


	$("#cancel").click(function() {
    	layer.closeAll();
	})

	$("#notice").click(function() {
		remarkStr = $("#noticeTxt").val();
		$("#noticeTxt").val("");

		if (editType=="CROP") {

			$.ajax({  
				type:"POST",
			    url:"sliceinfo/uploadClipImgRemark",
			    async:false,
			    data:JSON.stringify({                    
		            id: curCropId,  
		            remark: remarkStr,
		            experterid:0,
		        }),  
		        contentType: "application/json; charset=utf-8",  
		        dataType: "json", 
				success: function(data) {  
					if (data.code == 0) {
						notifyInfo("保存截图注释成功！");
					}else if (data.code==-1) {
		        		relogin();
		        	}else {
						errorInfo(data.message);
					}
					
				}  
			});  
			for(i=0;i<cropperArr.length;i++) {
				if (cropperArr[i].cropperId==curCropId)
					cropperArr[i].remark = remarkStr;
			}
			layer.closeAll();
		}else{
			LayerArr[curMarker].layer.bindLabel(remarkStr);
			LayerArr[curMarker].diagStr = remarkStr;
	    	layer.closeAll();
		}
	})



	function addBarItem(_type) {

		if (_type=="circle") {
			typeClass = "fa-circle";
		}else if(_type=="rectangle") {
			typeClass = "fa-rectangle";
		}else {
			typeClass = "fa-marker";
		}

		$("#recordBar").append('<div class="markerBtn"><i class="del"></i><i class="move"></i><i class="edit"></i><i id="'+ typeClass +'"></i></div>');
		$(".markerBtn").unbind();
		$(".markerBtn .del").unbind();
		$(".markerBtn .edit").unbind();

		$(".markerBtn").bind('mouseover', function(event) {
			$(this).children(".del").show();
			$(this).children(".edit").show();
		});
		$(".markerBtn").bind('mouseout', function(event) {
			$(this).children(".del").hide();
			$(this).children(".edit").hide();
		});

		$(".markerBtn").bind('click', function(event) {
			map.options.crs = L.CRS.EPSG3857;
			i = $(this).index();
			map.setView(L.latLng(LayerArr[i].lat_p1, LayerArr[i].lng_p1));
		});

		//编辑标注
		$(".markerBtn .edit").bind('click', function(event) {

			curMarker = $(this).parent(".markerBtn").index();
			editType = "MARK";

			$("#noticeTxt").val(LayerArr[curMarker].diagStr);
			layer.open({
			    type: 1,
			    shade: 0.3,
			    closeBtn:0,
			    title: false, //不显示标题
			    //area: ['520px', '220px'], //宽高
			    content: $('.layer_notice'), //捕获的元素
			    cancel: function(index){
			        layer.close(index);
			        this.content.show();
			    }
			});
		});

		//删除标注
		$(".markerBtn .del").bind('click', function(event) {

			curBtn = $(this).parent(".markerBtn");
			i = curBtn.index();
			$(this).parent(".markerBtn").remove();
			drawnItems.removeLayer(LayerArr[i].layer);
			LayerArr.splice(i,1);
		});

	}//end of addBarItem

	function MaskToggle() {
		$("#mask").toggle();			
	}


	$(document).bind("keydown",function(e){ 
	  var e=window.event||e; 
	  if(e.keyCode==112){ 
	   e.keyCode = 0; 
	   $("#diagTxt").val("NEUT%=\nLYMPH%=\nMONO%=\nEO%=\nBASO%=\n");
	   return false; 
	  } 
	})
	
	translatePage(document, 'span');

});
