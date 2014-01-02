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

#	debugger;
	describe "Basic Build, Persist and Getting.", ->
		it "builds and persists two entities", (done)->
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

		it "builds, persists and then gets an entity by id", (done)->
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
					transaction2 = new JEFRi.Transaction()
					transaction2.add {_type:"User", user_id:testId}
					store.get(transaction2)
					.then (transaction2)->
						transaction2.hasOwnProperty("entities").should.equal true
						transaction2.hasOwnProperty("attributes").should.equal true
						transaction2.entities.length.should.equal 1
						transaction2.entities[0].user_id.should.equal testId
						transaction2.entities[0].name.should.equal "southerd"#test this to make sure it didn't only send back your spec.
						done()

		it "builds, persists and then gets an entity by one of its properties", (done)->
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
					transaction2 = new JEFRi.Transaction()
					transaction2.add {_type:"User", name:"southerd"}
					store.get(transaction2)
					.then (transaction2)->
						transaction2.hasOwnProperty("entities").should.equal true
						transaction2.hasOwnProperty("attributes").should.equal true
						transaction2.entities.length.should.equal 1
						transaction2.entities[0].user_id.should.equal testId#test this to make sure it didn't only send back your spec.
						transaction2.entities[0].name.should.equal "southerd"
						done()


