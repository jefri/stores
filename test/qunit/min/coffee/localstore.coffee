_jQuery(document).ready ->
	runtime = undefined
	users = undefined
	runtime = null
	module "Local Storage",
		setup: ->
			o = undefined
			for o of localStorage
				delete localStorage[o]
			runtime = new JEFRi.Runtime("/test/qunit/min/context/user.json")

	asyncTest "LocalStore minimal save", ->
		expect 3
		runtime.ready.done ->
			store = undefined
			transaction = undefined
			user = undefined
			authinfo = undefined
			store = new JEFRi.Stores.LocalStore(runtime: runtime)
			transaction = new JEFRi.Transaction()
			user = runtime.build("User",
				name: "southerd"
				address: "davidsouther@gmail.com"
			)
			user.authinfo = runtime.build("Authinfo", {})
			authinfo = user.authinfo
			transaction.add user, authinfo
			store.persist(transaction).then (transaction) ->
				nkeys = undefined
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
	asyncTest "LocalStore", ->
		expect 3
		runtime.ready.done ->
			store = undefined
			transaction = undefined
			i$ = undefined
			ref$ = undefined
			len$ = undefined
			u = undefined
			user = undefined
			authinfo = undefined
			store = new JEFRi.Stores.LocalStore(runtime: runtime)
			transaction = new JEFRi.Transaction()
			i$ = 0
			len$ = (ref$ = users).length

			while i$ < len$
				u = ref$[i$]
				user = runtime.build("User",
					name: u[0]
					address: u[1]
				)
				authinfo = runtime.build("Authinfo", _.extend(
					authinfo_id: user.id()
				, u[2]))
				user.authinfo = authinfo
				transaction.add user
				transaction.add authinfo
				++i$
			store.persist(transaction).then ->
				_.when(store.get(_type: "User").then((results) ->
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
				)).done ->
					start()





