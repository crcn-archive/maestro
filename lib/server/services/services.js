var structr = require("structr"),
pkgcloud    = require("pkgcloud"),
_ = require("underscore"),
async = require("async"),
LocalClient = require("./local"),
outcome = require("outcome");




var ServiceFactory = new (structr({


	/**
	 */

	"getClient": function(serviceName, params) {
		return pkgcloud.compute.createClient(_.extend({
			provider: serviceName
		}, params));
	},

	/**
	 */

	"getClients": function(params) {
		var clients = [];
		for(var serviceName in params) {

			//used for debugging
			if(serviceName == "local") {
				clients.push(new LocalClient(params[serviceName]));
				continue;
			}

			clients.push(this.getClient(serviceName, params[serviceName]));
		}

		return clients;
	}
}));

module.exports = structr({

	/**
	 */

	"__construct": function(params) {
		this._services = ServiceFactory.getClients(params);
	},

	/**
	 */

	"getServices": function() {
		return this._services;
	},

	/**
	 */

	"getService": function(name) {
		return _.find(this._services, function(service) {
			return service.provider == name;
		});
	},

	/**
	 */

	"getAllServers": function(callback) {
		async.map(this._services, function(service, next) {
			console.log("fetching servers from %s", service.provider);
			service.getServers(function(err, servers) {
				if(!servers) return next(err);
				next(null, servers);
			});
		}, outcome.e(callback).s(function(servers) {
			callback(null, Array.prototype.concat.apply([], servers));
		}));
	},


});