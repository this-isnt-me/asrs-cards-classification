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
			url : "/upload/coderequest",    
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
		url : "/upload/codereset",    
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
		url : "/upload/codeconfirm",    
		processData: true,
		data : JSON.stringify(formData),
		type : "POST",
		contentType : "application/json"
	}).done( function(result){
		$("#masterCont").empty().append(result);
		$('html, body').animate({scrollTop:0}, 'slow');
	})
	.fail(function(err){
		console.log('Not a valid code. Either it is Incorrect or Expired')
		$("#masterCont #accessSection #msg").text('Not a valid code. Either it is Incorrect or Expired');
		setTimeout(function() {
			$("div#masterCont #accessSection #msg").empty();
			$("div#masterCont #accessSection #accessCode").val("");
		}, 3000);	
	});
})

$(document).on('click', "#masterCont #accessSection #csvUploadBtn", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	Papa.parse(document.getElementById('csvUpload').files[0],{
		download:true,
		header:true,
		complete: function(results){
			console.log(typeof(results.data));
			console.log(results.data);
			let formData = {
				"cardData": results.data
			};
			$.ajax({
				url : "/upload/cardupload",    
				processData: true,
				data : JSON.stringify(formData),
				type : "POST",
				contentType : "application/json"
			}).done( function(result){
				$("#masterCont #accessSection #msg").text('Cards Successfully Uploaded');
				setTimeout(function() {
					$("#masterCont #accessSection #msg").empty();
					$("#masterCont #accessSection #csvUpload").val(null);
				}, 3000);
			})
			.fail(function(err){
				$("#masterCont #accessSection #msg").text('There has been an error uploading the cards. Please try again.');
				setTimeout(function() {
					$("#masterCont #accessSection #msg").empty();
					$("#masterCont #accessSection #csvUpload").val(null);
				}, 3000);	
			});
		}
	});
});

const notValidEmail = () =>{
	$("#masterCont #codeSection #msg").text('Not a valid Email Address. Please Try Again');
	setTimeout(function() {
		$("#masterCont #codeSection #msg").empty();
		$("#masterCont #codeSection #emailAddress").val("");
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
