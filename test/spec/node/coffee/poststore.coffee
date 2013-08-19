jefri = require "jefri"
stores = require "../../../../lib/jefri-stores"

describe "PostStore", (a)->
	it "smokes", ->
		expect(jefri.Stores.PostStore) .toBeDefined()
