
var Sync = require("./sync"),
Collection = require("./collection");


exports.require = ["transport.core"];
exports.plugin = function(services, loader) {

	//the collection of all servers 
	var collection = new Collection(loader);

	//glues the maestro server collection with all servers under each service from Linode, EC2, rackspace, gogrid, etc.
	var sync = new Sync(collection, services);


	return {
		sync: sync,
		collection: collection
	}
}