let cardQuality, cardTone, cardClass, cardId;

$(document).on('click', "#masterCont #codeSection #requestCode", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	let email = $("#masterCont #codeSection #emailAddress").val();
	let emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
	let test = false
	email = email.toLowerCase();
	if (email.match(emailRegex) && email.includes("@taqa") === true) {
		let formData = {
			"email": email
		};
		$.ajax({
			url : "/coderequest",    
			processData: true,
			data : JSON.stringify(formData),
			type : "POST",
			contentType : "application/json"
		}).done( function(result){
			$("#masterCont").empty().append(result);
		})
		.fail(function(err){
			notValidEmail();	
		});	
  	} else {
		notValidEmail();
	}		
});

$(document).on('click', "#masterCont #accessSection #resetCode", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	$.ajax({
		url : "/codereset",    
		processData: true,
		type : "GET",
		contentType : "application/json"
	}).done( function(result){
		$("#masterCont").empty().append(result);
	})
	.fail(function(err){});
})

$(document).on('click', "#masterCont #accessSection #clearCode", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	$("#masterCont #accessSection #accessCode").val("");
})

$(document).on('click', "#masterCont #accessSection #submitCode", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	let formData = {
		"accesscode": $("#masterCont #accessSection #accessCode").val()
	};
	$.ajax({
		url : "/codeconfirm",    
		processData: true,
		data : JSON.stringify(formData),
		type : "POST",
		contentType : "application/json"
	}).done( function(result){
		$("#masterCont").empty().append(result);
		cardId = $("#masterCont #codeSection #cardId").val();
		$("#masterCont #codeSection #cardId").remove();
		$('html, body').animate({scrollTop:0}, 'slow');
		cardQuality = undefined;
		cardTone = undefined;
		cardClass = undefined;
	})
	.fail(function(err){
		$("#mainCont #accessSection #msg").text('Not a valid code. Either it is incorrect or Expired');
		setTimeout(function() {
			$("#mainCont #accessSection #msg").empty();
			$("#mainCont #accessSection #accessCode").val("");
		}, 3000);
		console.log("failure")	
	});
})

$(document).on('click', "#ruleimg8, #ruleimg7, #ruleimg6, #ruleimg5, #ruleimg4, #ruleimg3, #ruleimg2, #ruleimg1, #ruleimg0", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	let value = $(this).attr('value');
	cardClass = value;
	$("#ruleimg" + value).addClass('ruleBorder');
	singleCheckOnly(parseInt(value),'rule', 9);
});

$(document).on('click', "#sentimg2, #sentimg1, #sentimg0", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	let value = $(this).attr('value');
	cardTone = value;
	$("#sentimg" + value).toggleClass('ruleBorder');
	singleCheckOnly(parseInt(value),'sent', 3);
});

$(document).on('click', "#qualityimg4, #qualityimg3, #qualityimg2, #qualityimg1, #qualityimg0", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	let value = $(this).attr('value');
	cardQuality = value;
	$("#qualityimg" + value).addClass('ruleBorder');
	singleCheckOnly(parseInt(value),'quality', 5);
});

$(document).on('click', "#opinionBtn", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	if (cardQuality === undefined){
		notCompleteForm('No Quality Selected. Please make sure you have completely filled in the form');
	} else if (cardTone === undefined){
		notCompleteForm('No Tone Selected. Please make sure you have completely filled in the form');
	} else if (cardClass === undefined){
		notCompleteForm('No Rule Selected. Please make sure you have completely filled in the form');
	} else {
		let formData = {
			'cardQuality' : cardQuality,
			'cardTone' : cardTone,
			'cardClass' : cardClass,
			'cardId': cardId
		};
		$.ajax({
			url : "/classifycard",    
			processData: true,
			data : JSON.stringify(formData),
			type : "POST",
			contentType : "application/json"
		}).done( function(result){
			$("#masterCont").empty().append(result);
			cardId = $("#masterCont #codeSection #cardId").val();
			$("#masterCont #codeSection #cardId").remove();
			$('html, body').animate({scrollTop:0}, 'slow');
			cardQuality = undefined;
			cardTone = undefined;
			cardClass = undefined;
		})
		.fail(function(err){
			notCompleteForm('Submission Failed');
		});
	}
});

const notValidEmail = () =>{
	$("#masterCont #codeSection #msg").text('Not a valid Email Address. Please Try Again');
	setTimeout(function() {
		$("#masterCont #codeSection #msg").empty();
		$("#masterCont #codeSection #emailAddress").val("");
	}, 3000);
}

const notCompleteForm = (text) =>{
	$("#masterCont #codeSection #msg").text(text);
	setTimeout(function() {
		$("#masterCont #codeSection #msg").empty();
	}, 3000);
}

const singleCheckOnly = (value,string, len) =>{
	for (i = 0; i < len; i++) {
		if (i === value) { continue; }
		let hasClass = $("#" + string + "img" + i).hasClass('ruleBorder');
		if (hasClass === true){
			$("#" + string + "img" + i).removeClass('ruleBorder');
		}
	}
	
}
