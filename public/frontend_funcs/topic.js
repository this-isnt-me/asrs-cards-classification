$(document).on('click', "#staticCont #topicsSection #generateTopics", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	let formData = {
		"method": $("#staticCont #topicsSection #topicType").val(),
		"topics": $("#staticCont #topicsSection #topicNumbers").val(),
		"keywords": $("#staticCont #topicsSection #keyWords").val()
	};
	$("#msgRow").removeClass( "veryHidden" )
	$("#staticCont #topicsSection #msg").text('Please Come Back to Review Topic Groupings - The process takes about 15 minutes')
	setTimeout(function(){ 
		$("#msgRow").addClass( "veryHidden" )
		$("#staticCont #topicsSection #msg").text('') 
	}, 5000);
	$.ajax({
		url : "/class/updatetopics",    
		processData: true,
		data : JSON.stringify(formData),
		type : "POST",
		contentType : "application/json"
	}).done( function(result){
		$("#staticCont #topicsSection #msg").text('')
	})
	.fail(function(err){
		console.log('Failure');
	});
})

$(document).ready(function() {
	// e.stopImmediatePropagation();
	// e.preventDefault();
	// e.stopPropagation();
	$.ajax({
		url : "/class/gettopics",    
		processData: true,
		type : "GET",
		contentType : "application/json"
	}).done( function(result){
		//alert("Success");
		$("#displaySection").empty().append(result);
	})
	.fail(function(err){
		console.log('Failure');
		console.log(err);	
	});
})
