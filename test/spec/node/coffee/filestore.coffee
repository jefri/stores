chai = require "chai"
chai.should()
_ = require "underscore"
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

	afterEach (done)->
		try fs.rmdirSync './.jefri'
		done()

	it "saves", (done)->
		filestore = new jefri.Stores.FileStore runtime: runtime
		transaction = new jefri.Transaction [user, au]
		filestore.persist(transaction)
		.then (transaction)->
			transaction.should.have.property("entities").with.length 2
			entity = transaction.entities[0]
			keys = [
				'_id'
				'_fields'
				'_relationships'
				'_modified'
				'_new'
				'_runtime'
				'_listeners'
			]
			entity.should.have.proprety key for key in keys
		.finally done
