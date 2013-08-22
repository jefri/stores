should = require "should"
fs = require "fs"
jefri = require "jefri"
stores = require "../../../../lib/jefri-stores"

describe "FileStore", ->
	user = au = runtime = null
	loaded = done = false

	beforeEach (done)->
		try fs.rmdirSync './.jefri'
		runtime = new jefri.Runtime "http://souther.co/EntityContext.json"
		runtime.ready.then (a)->
			user = runtime.build "User"
			au = user.authinfo
			done()

	afterEach ->
		try fs.rmdirSync './.jefri'

	it "saves", (done)->
		filestore = new jefri.Stores.FileStore runtime: runtime
		transaction = new jefri.Transaction [user, au]
		filestore.persist(transaction) .then (transaction)->
			should.exist transaction
			transaction.entities.length.should.equal 2
			# nkeys = _.keys(transaction.entities[0]);
			# expect nkeys.sort() .to ['_id', '_fields', '_relationships', '_modified', '_new', '_runtime', 'modified', 'persisted'].sort(), "Entity has expected keys.");
			done()
