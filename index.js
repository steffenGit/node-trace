/*******************************
 * Simple profiling lib for nodejs.
 * 
 * refer to README.md for usage information.
 * 
 * @author: Steffen Peleikis <steffen.peleikis@web.de>
 * @version: 0.0.1
 * @repository: https://github.com/steffenGit/njs-chrome-trace
 * 
 *******************************/
 
 
var fs = require('fs');
var process = require('process');
var v8 = require('v8');
var os = require('os');

/*********************************
 * 			TRACE
 *********************************/
var trace = {
	/**
	 * Call this function before starting any logging.
	 * 
	 * @param trace:	name of this trace. will form the filename <trace>.trace.json .
	 * @param profile: jsonobject describing logging behavior of systemstats.
	 */
	init: function (trace, profile) {
		this.trace = trace;
		this.name = '';
		this.cat = '';
		this.tid = 1;
		this.path = process.cwd() + '/' + trace + '.trace.json';
		this.sTime = process.hrtime();
		this.stack = [];
		this.pid = process.title + ": " + trace + ", pid:" + process.pid;
		this.profile = profile || {};
	},
	/**
	 * Duration Event.
	 * Call this at the beginning of the function to be profiled.
	 * @param methodName: name of th method/function.
	 * @param tid: [optional] thread (or other identifiers) id. defaults to 1.
	 */
	B: function (methodName, tid) {
		this.name = methodName;

		this.tid = tid || 1;
		this.stack.push({
			name: this.name,
			cat: this.cat,
			ph: "B",
			ts: hrTime2uSec(process.hrtime(this.sTime)),
			pid: this.pid,
			tid: this.tid
		});
	},
	/**
	 * Duration Event.
	 * Call this at the beginning of the function to be profiled.
	 * @param args: [optional] JSON-object with arbitrary data to be added.
	 * @param profile: [optional] JSONObject. will override global profile.
	 */
	E: function (args, profile) {
		args = args || {};
		args = applyProfile2Args(args, profile || this.profile.E);
		this.stack.push({
			name: this.name,
			cat: this.cat,
			ph: "E",
			ts: hrTime2uSec(process.hrtime(this.sTime)),
			pid: this.pid,
			tid: this.tid,
			args: args
		});
	},
	/**
	 * Instant Event.
	 * @param name: name of the event.
	 * @param scope: scope of the event. possiblre options: g,p,t (global, process, thread).
	 * @param profile: [optional] JSONObject. will override global profile.
	 * @param args: [optional] JSON-object with arbitrary data to be added.
	 * @param tid: [optional] thread (or other identifiers) id. defaults to 1.
	 */
	I: function (name, profile, scope, args, tid) {

		if (!scope.match(/[gpt]/)) {
			scope = scope || 'g';
		}
		args = args || {};
		args = applyProfile2Args(args, profile || this.profile.I);
		this.stack.push({
			name: name,
			cat: this.cat,
			ph: "I",
			ts: hrTime2uSec(process.hrtime(this.sTime)),
			pid: this.pid,
			tid: tid || 1,
			args: args,
			s: scope
		});
	},
	/**
	 * Counter Event.
	 * @param name: name of the event.
	 * @param profile: [optional] JSONObject. will override global profile.
	 * @param args: [optional] JSON-object with arbitrary data to be added.
	 * @param tid: [optional] thread (or other identifiers) id. defaults to 1.
	 */	
	C: function (name, profile, args, tid) {

		args = args || {};
		args = applyProfile2Args(args, profile || this.profile.C);
		this.stack.push({
			name: name,
			cat: this.cat,
			ph: "C",
			ts: hrTime2uSec(process.hrtime(this.sTime)),
			pid: this.pid,
			tid: tid || 1,
			args: args,
		});
	},
	/**
	 * Sample Event.
	 * @param name: name of the event.
	 * @param profile: [optional] JSONObject. will override global profile.
	 * @param args: [optional] JSON-object with arbitrary data to be added.
	 * @param tid: [optional] thread (or other identifiers) id. defaults to 1.
	 */	
	P: function (name, profile, args, tid) {

		args = args || {};
		args = applyProfile2Args(args, profile || this.profile.P);
		this.stack.push({
			name: name,
			cat: this.cat,
			ph: "P",
			ts: hrTime2uSec(process.hrtime(this.sTime)),
			pid: this.pid,
			tid: tid || 1,
			args: args,
		});
	},
	/**
	 * Call this function at the end of any logging.
	 * Writes changes to the disc.
	 * Gets called automatically on SIGTERM
	 */	
	write: function () {
		fs.writeFileSync(this.path, JSON.stringify(this.stack));
		console.log("logged %j traces", this.stack.length)
	},
}

/*********************************
 * 			Shutdown
 *********************************/

process.on('SIGTERM', function () {
  trace.write();
});
/*********************************
 * 			Helpers
 *********************************/
function hrTime2uSec(hrtime) {
	var s = hrtime[0] * 1000000;
	var us = hrtime[1] / 1000;
	return '' + (s + us);
}

function applyProfile2Args(args, profile) {
	if (profile !== undefined) {
		if (profile.heap !== undefined) {
			for (var e of profile.heap) {
				args[e] = v8.getHeapStatistics()[e];
			}
		}
		if (profile.cpu !== undefined) {
			if (profile.cpu === "loadavg") {
				var load = os.loadavg();
				args["1 min load average: "] = load[0];
				args["5 min load average: "] = load[1];
				args["15 min load average: "] = load[2];
			}
		}
		if (profile.mem !== undefined) {
			args["total Memory"] = os.totalmem();
			args["used Memory"] = os.totalmem() - os.freemem();
		}
	}
	return args;
}


/*********************************
 * 			Export
 *********************************/
module.exports = {
	trace: trace,

};