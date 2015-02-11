jiffies = require('jefri-jiffies')

storeList = []

module.exports = (JEFRi)->
	JEFRi.Stores = {}
	Object.assign JEFRI,
		store: (name, factory)->
			try
				store = factory()
				Object.assign(store::, jiffies.Event::)
				JEFRi.Stores[name] = store
			catch e
				console.warn "Could not build #{name}: #{e}"

module.exports.addStore
