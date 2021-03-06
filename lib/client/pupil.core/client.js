var structr = require("structr"),
request = require("request"),
EventEmitter = require("events").EventEmitter,
sprintf = require("sprintf").sprintf;

module.exports = structr(EventEmitter, {

	/**
	 */

	"__construct": function(options) {
		this._maestroHost = options.maestroHost;
		this._auth = options.auth;
		this._port = options.server.port;
		console.log("waiting for maestro before starting");
	},

	/**
	 */

	"setInfo": function(info) {
		this.info = info;
		console.log("setting server info id=%s", info._id);
		this.emit("ready");
	},

	/**
	 */

	"ready": function(callback) {
		if(this.info) return callback();
		this.once("ready", callback);
	},

	/**
	 */

	"update": function(data) {
		this.maestroRequest("put", "/servers/" + this.info._id, data, function(err) {
			if(err) console.error(err);
		})
	},

	/**
	 */

	"maestroRequest": function(method, path, data, callback) {
		var ops = {
			url: ["http://" , this._auth.user , ":" , this._auth.pass , "@", this._maestroHost , ":", this._port, path ].join(""),
			json: data
		};


		request[method](ops, function(err, response, body){
			if(err) return callback(err);

			if(body.errors) {
				callback(new Error(body.errors[0].message));
			} else {
				callback(null, body.result);
			}
		});
	}
});