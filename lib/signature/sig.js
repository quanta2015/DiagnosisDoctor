var sigData;

$(document).ready(function($) {

	$(".sig").signature({color: '#000',thickness: 4,guideline: true});

	$("#clear").click(function() { 
    	$(".sig").signature('clear'); 
	}); 

	$("#save").click(function() { 
    	sigData = $(".sig").signature('toJSON'); 
    	console.log(sigData);
	}); 

	$("#restore").click(function() { 
    	sigData = $(".sig").signature('draw', sigData);  
	}); 

})