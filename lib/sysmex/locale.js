var wn=window.navigator;
var href=location.href;
var isZh=1;
if (wn.systemLanguage=="zh-cn" || wn.language=="zh-CN") { 
	document.write("<script src='lib/sysmex/zh.js'><\/script>"); 
	
	isZh=1;	
} else {
	document.write("<script src='lib/sysmex/en.js'><\/script>"); 
	isZh=0;
}



function translatePage(domObj, sTag) {
  var e = domObj.getElementsByTagName(sTag);
  //var currentLangText = sapLang.getCurrentLangText();
  var E,s;
  for (var i = 0; i < e.length; i++) {
    if (E = e[i].getAttribute('localeString')) {
      if (langText[E]) {
        e[i].innerHTML = langText[E];
      }
    }
  }
}