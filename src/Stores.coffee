JEFRi.Stores = {}
_(JEFRi).extend
	store: (name, factory)->
		try
			store = factory()
			_(store::).extend JEFRi.EventDispatcher::
			JEFRi.Stores[name] = store
