
var notie = require ("notie");
function Myalert (title,content) {
	notie.alert(title,content);
}

function cancel () {
	window.location.href = "#/businessTravel/Index";
}

function Myconfirm (title,yes,no) {
	notie.confirm(title,yes,no,cancel);
}
function messagebox_close () {
	$(".messagebox_fixed").hide();
}