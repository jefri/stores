runtime = null

describe "PostStore", ->
	beforeEach ->
		runtime = new JEFRi.Runtime("http://localhost:8000/user.json")

	it "instantiates", ->
		store = new JEFRi.Stores.PostStore(runtime: runtime)
