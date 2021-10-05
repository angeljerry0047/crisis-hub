$("#file").on("change", function(e) {
	let { target } = e;
	checkMaxAllowedSize(target);
});

$("#video").on("change", function(e) {
	let { target } = e;
	checkMaxAllowedSize(target);
});

function checkMaxAllowedSize(target) {
	if(target.files && target.files[0]) {
		
		let maxAllowedSize = 100 * 1024 * 1024;
		let files = Object.values(target.files);
		let totalFileSize = files.reduce((a, b) => { 
			a += b.size;
			return a;
		}, 0);

		console.log("File Size:", totalFileSize);

		if (totalFileSize > maxAllowedSize) {
			alert("File too big");
			
			console.log("File Size:", totalFileSize);
			target.value = ""
		}
	}
}


$("#description").on("keyup", function(e) {
	var maxlen = $(this).attr('maxlength');
  
	var length = $(this).val().length;
	console.log($(this).text())
	console.log(length);

	if(length <= maxlen) {
		let remaining = maxlen - length;
		$('#textarea_message').text(`${remaining} chars left`);

		return;
	}

	// if(length > maxlen) {
	// 	$('#textarea_message').text('Description too long.')
	// } else {
    //   $('#textarea_message').text('');
    // }

});