should = require "should"
jefri = require "jefri"
stores = require "../../../../lib/jefri-stores"

describe "PostStore", ->
	it "smokes", ->
		should.exist jefri.Stores.PostStore
