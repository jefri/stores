path = require "path"
root = path.join __dirname, "..", ".."
should = require "should"

JEFRi = require "jefri"
Stores = require "../../lib/jefri-stores"
Stores = Stores.Stores
express = require "express"

describe "ObjectStore", ->
	runtime = ->
	testId = ""
	before ->
		app =
			express()
				.get '/context.json', (req, res)->
					res.set "content-type", "application/json"
					res.sendfile path.join root, "src", "mocha", "context.json"
		app.listen 3030, ->
			runtime = new JEFRi.Runtime "http://localhost:3030/context.json"

	describe "Minimal Save", ->
		it "persists an entity", (done)->
			runtime.ready.done ->
				store = new Stores.ObjectStore runtime: runtime
				transaction = new JEFRi.Transaction()
				user = runtime.build "User",
					name: "southerd"
					address: "davidsouther@gmail.com"
				user.authinfo = runtime.build "Authinfo", {}
				authinfo = user.authinfo
				transaction.add user, authinfo
				testId = user.id()
				store.persist(transaction)
				.then (transaction)->
					transaction.hasOwnProperty("entities").should.equal true
					transaction.hasOwnProperty("attributes").should.equal true
					transaction.entities.length.should.equal 2
					done()

		it "gets a persisted entity", (done)->
			runtime.ready.done ->
				store = new Stores.ObjectStore runtime: runtime
				transaction = new JEFRi.Transaction()
				transaction.add {_type:"User", user_id:testId}
				store.get(transaction)
				.then (transaction)->
					transaction.hasOwnProperty("entities").should.equal true
					transaction.hasOwnProperty("attributes").should.equal true
					transaction.entities.length.should.equal 1
					done()


