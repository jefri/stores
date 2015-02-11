ok = (v)->
	should.exist v
	v.should.be.ok()

equal = (a, b)->
	a.should.equal(b)