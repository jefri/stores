JEFRi.Stores = {}
_(JEFRi).extend
	store: (name, factory)->
		try
			store = factory()
			_(store::).extend JEFRi.EventDispatcher::
			JEFRi.Stores[name] = store
		catch e
			console.warn "Could not build #{name}: #{e}"
