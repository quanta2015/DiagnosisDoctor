var statusClassArr = ['c_all','c_toprocess','c_topublish','c_unqualified','c_todiagnoise','c_return','c_diagnoised','c_finished','c_evaluated'];
var statusTxtArr = ['全部','待处理','待发布','不合格','待阅片','退回','已阅片','已完成','已评价'];

var statusArr = [
	{id:'0',cls:'c_all',txt:'全部'},
	{id:'1',cls:'c_toprocess',txt:'待处理'},
	{id:'2',cls:'c_topublish',txt:'待发布'},
	{id:'3',cls:'c_unqualified',txt:'不合格'},
	{id:'4',cls:'c_todiagnoise',txt:'待阅片'},
	{id:'5',cls:'c_return',txt:'退回'},
	{id:'6',cls:'c_diagnoised',txt:'已阅片'},
	{id:'7',cls:'c_finished',txt:'已完成'},
	{id:'8',cls:'c_evaluated',txt:'已评价'}
];


/*public static String DIAGNOSE_WAITED = "待处理";	
	public static String DIAGNOSE_PUBISHING = "待发布";
	public static String DIAGNOSE_UNQUALIFIED = "不合格";	
	public static String DIAGNOSE_READING = "待阅片";
	public static String DIAGNOSE_BACK = "退回";
	public static String DIAGNOSE_READED = "已阅片";
	public static String DIAGNOSE_FINISHED = "已完成";
	public static String DIAGNOSE_REVIEWED= "已评价";*/
	/*public static String DIAGNOSE_WAITED = "DIAGNOSE_WAITED";	
	public static String DIAGNOSE_PUBISHING = "DIAGNOSE_PUBISHING";
	public static String DIAGNOSE_UNQUALIFIED = "DIAGNOSE_UNQUALIFIED";	
	public static String DIAGNOSE_READING = "DIAGNOSE_READING";
	public static String DIAGNOSE_BACK = "DIAGNOSE_BACK";
	public static String DIAGNOSE_READED = "DIAGNOSE_READED";
	public static String DIAGNOSE_FINISHED = "DIAGNOSE_FINISHED";
	public static String DIAGNOSE_REVIEWED= "DIAGNOSE_REVIEWED";*/
	
	var DIAGNOSE_WAITED_I = 1;	
	var DIAGNOSE_PUBISHING_I = 2;
	var DIAGNOSE_UNQUALIFIED_I = 3;	
	var DIAGNOSE_READING_I = 4;
	var DIAGNOSE_BACK_I = 5;
	var DIAGNOSE_READED_I = 6;
	var DIAGNOSE_FINISHED_I = 7;
	var DIAGNOSE_REVIEWED_I = 8;
	
	

var rolesArr = ['用户','管理员','专家'];
var ROLES_USER   = 0;
var ROLES_ADMIN  = 1;
var ROLES_EXPERT = 2;

function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return unescape(r[2]); return null; //返回参数值
}

function relogin() {
	//$("#mainframe",parent.document.body).attr("src","login.html ");
	window.parent.location.href ='login.html'
}

function getCurDate() {
		var date = new Date();
		var year = date.getFullYear();
		var lastMonth = date.getMonth();
		var month = date.getMonth() + 1;
		if (month<10) month='0'+month;
		var day = date.getDate();
		if (day<10) day='0'+day;
		var lastDate = year + '-' + lastMonth + '-' + day;
		var curDate = year + '-' + month + '-' + day;
		return curDate;
	}