chai = require "chai"
chai.should()
_ = require "underscore"
fs = require "fs"
path = require "path"
root = path.join __dirname, "..", "..", "..", ".."

JEFRi = require "jefri"
express = require "express"
Stores = require "../../../../lib/jefri-stores"

describe "FileStore", ->
	user = au = runtime = null
	loaded = done = false
	server = ->
	runtime = ->

	beforeEach(done) ->
		try fs.rmdirSync './.jefri'
		app =
			express()
				.get '/context.json', (req, res)->
					res.set "content-type", "application/json"
					res.sendfile path.join root, "context.json"
		server = app.listen 3030, ->
			runtime = new JEFRi.Runtime "http://localhost:3030/context.json"
			runtime.ready.then (a)->
				console.log("runtime", runtime)
				user = runtime.build "User"
				au = user.authinfo
				done()

	afterEach (done)->
		server.close()
		try fs.rmdirSync './.jefri'
		done()

	it "saves", (done)->
		filestore = new Stores.Stores.FileStore runtime: runtime
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
			entity.should.have.property key for key in keys
		.finally done

	it "saves nothing", (done)->
		filestore = new Stores.Stores.FileStore runtime: runtime
		transaction = new jefri.Transaction []
		filestore.persist(transaction)
		.then (transaction)->
			transaction.should.have.property("entities").with.length 0
		.finally done
