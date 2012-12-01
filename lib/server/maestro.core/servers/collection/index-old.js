var structr = require("structr"),
_ = require("underscore"),
sift = require("sift"),
fiddle = require("fiddle"),
Server = require("./server"),
Cursor = require("./cursor"),
siftTester = require("./siftTest"),
Watcher = require("./watcher");


/**
 * A collection of servers
 */


module.exports = structr({

	/**
	 */

	"__construct": function(loader) {
		this._clientPort = loader.params("client.port");
		this._auth = loader.params("auth");
		this._servers = [];
		this._watcher = new Watcher();
	},

	/**
	 * inserts 
	 */

	"insertSync": function(info) {

		var server, watcher = this._watcher;

		//inserting multiple
		if(info instanceof Array) {

			var servers = [];

			for(var i = info.length; i--;) {
				if(server = this.insertSync(info[i])) {
					servers.push(server);
				}
			}

			return servers;
		}

		//make sure the server doesn't exist first
		var existing = _.find(this._servers, function(ex) {
			return ex.info._id == info._id;
		});

		//if it does, update it! 
		if(existing) {
			existing.updateSync({ $set: info });
			return existing;
		}

		//otherwise add it
		this._servers.push(server = new Server(info, this));

		return server;
	},

	/**
	 * removes all servers with the given context
	 */

	"removeSync": function(query) {
		var sifter = sift(query);

		this._servers = _.reject(this._servers, function(server) {

			if(sifter.test(server.info)) {
				server.dispose();
				return true;
			}

			return false;
		});
		return true;
	},

	/**
	 */

	"watch": function(query, type, on) {
		this._watcher.on.apply(this._watcher, arguments);
	},

	/**
	 */

	"countSync": function(search) {
		return this.findSync(search).execSync().length;
	},

	/**
	 */

	"allSync": function() {
		return this._servers.concat();
	},

	/**
	 * finds ONE server
	 */

	"findOneSync": function(query) {
		return _.find(this._servers, siftTester(query));
	},

	/**
	 * finds MANY servers
	 */

	"findSync": function(query) {
		// return this._servers.filter(this._siftTester(query));
		return new Cursor(this).query(query);
	},

	/**
	 * updates MANY servers
	 */

	"updateSync": function(query, update) {
		this.findSync(query).forEach(function(server) {
			server.updateSync(update);
		});
		return true;
	}
});

