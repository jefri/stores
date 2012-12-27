require! { jefri, stores: "../../../../lib/jefri-stores" }

describe "PostStore", !(a)->
	it "smokes", !->
		expect (jefri.Stores.PostStore) .toBeDefined!
