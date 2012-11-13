var outcome = require("outcome"),
step = require("step"),
request = require("request"),
logger = require("winston").loggers.get("server"),
sprintf = require("sprintf");

exports.require = ["mongodb", "transport.core", "queryWatcher"];
exports.plugin = function(db, transports, queryWatcher, loader) {
	var Schema = db.base.Schema,
	Model = db.base.Model



	var Server = new Schema({

		/**
		 * the id tied to the given service
		 */

		"_id": { type: String, unique: { index: true }},

		/**
		 * the name of the server
		 */

		"name": String,

		/**
		 * instance type: micro, medium, large, etc.
		 */

		"type": String,

		/**
		 * the service hosting the server (ec2, gogrid, rackspace)
		 */

		"service": String,

		/**
		 * the image id for the server - used for cloning, and identifying what type this server is
		 */

		"imageId": String,

		/**
		 * the namespace for the server, or IP. used for communication
		 */

		"ns": String,

		/**
		 * server state: running, stopped, terminated
		 */

		"state": String,

		/**
		 * where is this server located?
		 */

		"zone": String,

		/**
		 * additional info about the server
		 */

		"tags": {},

		/**
		 */

		"createdAt": { type: Date, default: Date.now },

		/**
		 */

		"numConnections": { type: Number, default: 0 },

		/**
		 */

		"lastSelectedAt": { type: Date, default: Date.now },

		/**
		 * flag used to filter out a given server
		 */

		"busy": Boolean

	});

	Server.post("save", function() {
		queryWatcher.emit("update", this);
	});

	Server.post("remove", function() {
		queryWatcher.emit("remove", this);
	});

	Server.methods.init = function() {
		Model.prototype.init.apply(this, arguments);
		this._service = getService(this);
	}

	Server.method({
		clone: function(callback) {
			this._service.createServer({
				imageId: this.imageId,
				type: this.type
			}, callback);
		},
		ping: function(callback) {

			if(!this.ns) return callback(new Error("server is not running"));

			var ops = {
				url: ["http://" , loader.params("auth.user"), ":", loader.params("auth.pass"), "@", this.ns, "/server"],
				json: this.toObject()
			},
			self = this;

			request.post(ops, outcome.error(function(err) {
				if(self.state == "running") {
					// logger.info(sprintf("%d might have disconn, rebooting.", self._id));
					// self.reboot(); <- this seems like a really bad idea...
				}
				callback(err);
			}).success(function(response, body) {
				callback();
			}));
		},
		start: function(callback) {
			this._service.startServer(this, callback);
		},
		reboot: function(callback) {
			this._service.rebootServer(this, callback);
		},
		stop: function(callback) {
			this._service.stopServer(this, callback);
		},
		destroy: function(callback) {
			var self = this, on = outcome.error(callback);
			step(

				//destroy first
				function() {
					self._service.destroyServer(this, callback);
				},

				//then remove this instance
				on.success(function() {
					self.remove(this);
				}),

				//and complete
				callback
			);	
		}
	});

	function getService(server) {
		return transports.getService(server.service);
	}



	return {
		Server: db.model("servers", Server)
	};
}