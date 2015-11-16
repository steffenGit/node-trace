var p = require('./index').trace;


p.init("profile");
p.C("sample", {cpu:"loadavg"});
p.C("mem", {
	heap: ["used_heap_size"]});
/*, {E: {
	heap: ["total_heap_size", "used_heap_size"]
}}
*/
console.log("start");
var t1 = setInterval(function() {
	p.B("interval 1");

	for(var i=0; i< 100; i+=10){p.C("i", null, {i:i})};
	p.E();
},3000)


setTimeout(function() {
	p.C("sample", {cpu:"loadavg"});
	p.C("mem", {
		heap: ["used_heap_size"]});	
	clearInterval(t1);
	p.write();
	process.exit();
},10000);