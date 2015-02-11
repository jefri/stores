#     JEFRi LocalStore.coffee 0.1.0
#     (c) 2011-2012 David Souther
#     JEFRi is freely distributable under the MIT license.
#     For full details and documentation:
#     http://jefri.org

ObjectStore = require('./ObjectStore')

class LocalStore extends ObjectStore
	constructor: (options)->
		super options

	_set: (key, value)->
		localStorage[key] = value

	_get: (key)->
		localStorage[key] || '{}'

	_key: (entity, id = entity._id)->
		super(entity, id).replace '/', '.'

module.exports = LocalStore