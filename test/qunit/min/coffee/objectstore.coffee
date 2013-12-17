_jQuery(document).ready ->
	runtime = null
	module "Object Storage",
		setup: ->
			runtime = new JEFRi.Runtime("/test/qunit/min/context/user.json")

	asyncTest "ObjectStore minimal save", ->
		expect 3
		runtime.ready.done ->
			store = new JEFRi.Stores.ObjectStore runtime: runtime
			transaction = new JEFRi.Transaction()
			user = runtime.build "User",
				name: "southerd"
				address: "davidsouther@gmail.com"
			user.authinfo = runtime.build "Authinfo", {}
			authinfo = user.authinfo
			transaction.add user, authinfo
			store.persist(transaction).then (transaction)->
				ok transaction.entities and transaction.attributes, "Transaction entities and attributes."
				equal transaction.entities.length, 2, "Transaction should only have 2 entities."
				nkeys = _.keys(transaction.entities[0])
				deepEqual nkeys.sort(), ["_id", "_fields", "_relationships", "_modified", "_new", "_runtime", "_listeners"].sort(), "Entity has expected keys."
				start()

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

	asyncTest "ObjectStore", ->
		expect 3
		runtime.ready.done ->
			store = new JEFRi.Stores.ObjectStore(runtime: runtime)
			transaction = new JEFRi.Transaction()

			for u in users
				user = runtime.build "User",
					name: u[0]
					address: u[1]
				authinfo = runtime.build "Authinfo",
					_.extend {authinfo_id: user.id()}, u[2]
				user.authinfo = authinfo
				transaction.add user
				transaction.add authinfo
			store.persist(transaction).then ->
				Q.when(store.get(_type: "User").then((results) ->
					equal results.entities.length, 3, "Find users."
				), store.get(
					_type: "Authinfo"
					username: "southerd"
				).then((results) ->
					equal results.entities.length, 1, "Find southerd."
				), store.get(
					_type: "User"
					authinfo: {}
				).then((results) ->
					equal results.entities.length, 6, "Included authinfo relations."
				)).done -> start()


	#Store info about a persisted entity so we can then get that entity.
	aUser = {
		"id":""
		"name":""
	}

	asyncTest "ObjectStore get previously persisted", ->
		expect 4
		runtime.ready.done ->
			store = new JEFRi.Stores.ObjectStore(runtime: runtime)
			transaction = new JEFRi.Transaction()

			for u in users
				user = runtime.build "User",
					name: u[0]
					address: u[1]
				authinfo = runtime.build "Authinfo",
					_.extend {authinfo_id: user.id()}, u[2]
				user.authinfo = authinfo
				aUser.id = user.id
				aUser.name = user.name
				transaction.add user
				transaction.add authinfo
			store.persist(transaction).then ->
				Q.when(store.get(_type: "User").then((results) ->
					equal results.entities.length, 3, "Find users."
				), store.get(
					_type: "Authinfo"
					username: "southerd"
				).then((results) ->
					equal results.entities.length, 1, "Find southerd."
				), store.get(
					_type: "User"
					user_id: aUser.id
				).then((results) ->
					equal results.entities.length, 1, "Found entity by id."
				), store.get(
					_type: "User"
					authinfo: {}
				).then((results) ->
					equal results.entities.length, 6, "Included authinfo relations."
				)).done -> start()



