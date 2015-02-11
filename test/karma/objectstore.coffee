
runtime = null
describe "Object Storage", ->
	beforeEach ->
		runtime = new JEFRi.Runtime("http://localhost:8000/user.json")

	it "ObjectStore minimal save", (done)->
		expect 3
		runtime.ready
		.then ->
			store = new JEFRi.Stores.ObjectStore runtime: runtime
			transaction = new JEFRi.Transaction()
			user = runtime.build "User",
				name: "southerd"
				address: "davidsouther@gmail.com"
			user.authinfo = runtime.build "Authinfo", {}
			authinfo = user.authinfo
			transaction.add user, authinfo
			store.persist(transaction)
			.then (transaction)->
				ok transaction.entities and transaction.attributes, "Transaction entities and attributes."
				equal transaction.entities.length, 2, "Transaction should only have 2 entities."
				nkeys = Object.keys(transaction.entities[0])
				nkeys.sort().should.deep.equal [
					"_id", "_fields", "_relationships", "_modified", "_new", "_runtime", "_listeners"
				].sort(), "Entity has expected keys."
				done()
			.catch done
		.catch done

	users = [["David Souther", "davidsouther@gmail.com",
		username: "southerd"
		activated: "true"
		created: new Date(2011, 1, 15, 15, 34, 5).toJSON()
		last_ip: "192.168.2.79"
	], ["JPorta", "jporta@example.com",
		username: "portaj"
		activated: "true"
		created: new Date(2012, 1, 15, 15, 34, 5).toJSON()
		last_ip: "192.168.2.80"
	], ["Niemants", "andrew@example.com",
		username: "andrew"
		activated: "false"
		created: new Date(2012, 1, 17, 15, 34, 5).toJSON()
		last_ip: "80.234.2.79"
	]]

	it "ObjectStore", (done)->
		runtime.ready
		.then ->
			store = new JEFRi.Stores.ObjectStore(runtime: runtime)
			transaction = new JEFRi.Transaction()

			for u in users
				user = runtime.build "User",
					name: u[0]
					address: u[1]
				authinfo = runtime.build "Authinfo",
					Object.assign {authinfo_id: user.id()}, u[2]
				user.authinfo = authinfo
				transaction.add user
				transaction.add authinfo

			store.persist(transaction)
			.then ->
				Q.when(
					store.get(_type: "User").then((results) ->
						equal results.entities.length, 3, "Find users."
					),
					store.get(
						_type: "Authinfo"
						username: "southerd"
					).then((results) ->
						equal results.entities.length, 1, "Find southerd."
					),
					store.get(
						_type: "User"
						authinfo: {}
					).then((results) ->
						equal results.entities.length, 6, "Included authinfo relations."
					)
				).then -> done()
			.catch done
		.catch done


	#Store info about a persisted entity so we can then get that entity.
	aUser = {
		"id":""
		"name":""
	}

	it "ObjectStore get previously persisted", (done)->
		runtime.ready
		.then ->
			store = new JEFRi.Stores.ObjectStore(runtime: runtime)
			transaction = new JEFRi.Transaction()

			for u in users
				user = runtime.build "User",
					name: u[0]
					address: u[1]
				authinfo = runtime.build "Authinfo",
					Object.assign {authinfo_id: user.id()}, u[2]
				user.authinfo = authinfo
				aUser.id = user.id
				aUser.name = user.name
				transaction.add user
				transaction.add authinfo

			store.persist(transaction)
			.then ->
				Q.when(
					store.get(_type: "User").then((results) ->
						equal results.entities.length, 3, "Find users."
					),
					store.get(
						_type: "Authinfo"
						username: "southerd"
					).then((results) ->
						equal results.entities.length, 1, "Find southerd."
					),
					store.get(
						_type: "User"
						user_id: aUser.id
					).then((results) ->
						equal results.entities.length, 1, "Found entity by id."
					),
					store.get(
						_type: "User"
						authinfo: {}
					).then((results) ->
						equal results.entities.length, 6, "Included authinfo relations."
					)
				).then -> done()
			.catch done
		.catch done


