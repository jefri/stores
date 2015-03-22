var Stores = {
	ObjectStore: require('./ObjectStore'),
	CouchStore: require('./CouchStore'),
	PostStore: require('./PostStore'),
	LocalStore: require('./LocalStore')
};
window.JEFRi.Stores = module.exports = Stores;
