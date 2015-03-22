chai = require "chai"
chai.should()
_ = require "underscore"
fs = require "fs"
path = require "path"
root = path.join __dirname, "..", ".."

JEFRi = require "jefri"
express = require "express"
FileStore = require("#{root}/src/index").FileStore

describe "FileStore", ->
	user = au = runtime = null
	loaded = done = false
	server = ->
	runtime = ->

	beforeEach (done) ->
		try fs.rmdirSync './.jefri'
		runtime = new JEFRi.Runtime "http://localhost:8000/context.json"
		runtime.ready
		.then (a)->
			user = runtime.build "User"
			au = user.authinfo
			done()
		.catch done

	afterEach (done)->
		try fs.rmdirSync './.jefri'
		done()

	it "saves", (done)->
		filestore = new FileStore runtime: runtime
		transaction = new JEFRi.Transaction [user, au]
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
		.catch done

	it "saves nothing", (done)->
		filestore = new FileStore runtime: runtime
		transaction = new JEFRi.Transaction []
		filestore.persist(transaction)
		.then (transaction)->
			transaction.should.have.property("entities").with.length 0
		.catch done
