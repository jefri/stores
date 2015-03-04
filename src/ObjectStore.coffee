#     JEFRi LocalStore.coffee 0.1.0
#     (c) 2011-2012 David Souther
#     JEFRi is freely distributable under the MIT license.
#     For full details and documentation:
#     http://jefri.org

jiffies = require('jefri-jiffies')

class ObjectStore extends jiffies.Event
	constructor: (options)->
		@settings = { version: "1.0", size: Math.pow(2, 16) }
		Object.assign @settings, options
		@_store = {}
		if not @settings.runtime
			throw {message: "LocalStore instantiated without runtime to reference."}

	# #### _set*(key, value)*
	# Generic key/value setter, should be overwritten by extending classes.
	_set: (key, value)->
		@_store[key] = value

	# #### _get*(key)*
	# Generic key/value getter, should be overwritten by extending classes.
	_get: (key)->
		@_store[key] || '{}'

	# ### execute*(type, transaction)*
	# Run the transaction.
	execute: (type, transaction) ->
		transaction = _transactify transaction
		@emit "sending", transaction

		@["do_#{type}"] transaction
		@settings.runtime.expand transaction

		promise = jiffies.promise()
		promise(true, transaction)
		promise

	# #### get*(transaction)*
	# Execute as a `get` transaction.
	get: (transaction)->
		@execute 'get', transaction

	# #### persist*(transaction)*
	# Execute as a `persist` transaction.
	persist: (transction)->
		@execute 'persist', transction

	# ### do_persist*(transction)*
	# Treat the transaction as a persistence call. Save the data.
	do_persist: (transaction) ->
		transaction.entities =
			for entity in transaction.entities
				@_save entity

	# #### _save*(entity)*
	# Save the data in the store's storage.
	_save: (entity) ->
		# Merge the new data over the old data.
		entity = Object.assign @_find(entity), entity
		# Store the JSON of the entity.
		@_set @_key(entity), JSON.stringify(entity)
		# Register the entity with the type map.
		@_type entity._type, entity._id
		# Return the bare encoded object.
		entity

	# ### do_get*(transaction)*
	# Treat the transaction as a lookup. Find all data matching the specs.
	do_get: (transaction) ->
		# Let _lookup handle the actual lookups.
		# _lookup can return an array, a single entity, or an object of id->entity kvs.
		# We lookup each spec and then add it to a keyed object to kill off duplicates as we go.
		ents = {}
		for entity in transaction.entities
			# Do the lookup for each spec
			found = @_lookup entity

			# Recursive function to handle the multitude of possible return values from _lookup.
			whittle = (result)->
				if result
					# Sometimes the result is undefined, or empty. We'll ignore those.
					if result.hasOwnProperty "_type"
						# We're going to assume that it is a real entity if it has _type.
						ents[result._id] = result
					else if Array.isArray result
						# We have an array, it could be entities, or more arrays! Who knows?
						whittle r for r in result
					else
						# Here we will assume we have an obj with IDs for keys.
						whittle e for id,e of result

			whittle found

		# Convert our k/v obj of results to an array for the transaction
		transaction.entities = (v for k, v of ents)
		#return the transaction
		transaction

	# #### _find*(entity)*
	# Return an entity directly, or pass a spec to _lookup.
	_find: (entity) ->
		JSON.parse @_get @_key entity

	# #### _lookup*(spec)*
	# Given a transaction spec, pull all entities (including relationships) that match.
	# See JEFRi Core documentation 5.1.1 Gory Get Details for rules.
	_lookup: (spec) ->
		# Need the key, properties, and relationships details
		def = @settings.runtime.definition spec._type
		# Get everything for this type
		results = []
		for id in Object.keys(@_type(spec._type))
			results.push JSON.parse @_get @_key spec, id

		# If we didn't find anything, don't return anything. Rule 0.
		if results.length is 0
			return

		# Start immediately with the key to pear down results quickly. Rule 1.
		# Otherwise get it to an array.
		if def.key of spec
			results = results.filter (e)-> e._id is spec[def.key]


		# Filter based on property specifications
		for name, property of def.properties
			if name of spec and name isnt def.key
				results = results.filter(_sieve(name, property, spec[name]))

		# Include relationships
		for name, relationship of def.relationships
			if name of spec
				# For all the entities found so far, include their relationships as well
				give = []
				take = []
				for i, entity of results
					related = do =>
						relspec = Object.assign {}, spec[name], {_type: relationship.to.type}
						relspec[relationship.to.property] = entity[relationship.property]
						# Just going to use
						@_lookup(relspec) || []

					# Giveth, or taketh away
					if  related.length
						give.push related
					# else
					# 	take.push i
				# Remove the indicies which didn't have a relation.
				take.reverse()
				#
				for i in take
					j = i+1
					end = results[j til results.length]
					results = results[0 .. i]
					[].push.apply results, end
				[].push.apply results, give

		# Return the filtered results.
		results

	# #### _type*(type[, id])*
	# Get a set of stored IDs for a particular type. If an ID is passed in, add it to the set.
	_type: (type, id=null) ->
		# Get the current set
		list = JSON.parse @_get(type) || "{}"
		if id
			# Indexed by ID, so just need an empty set.
			list[id] = ""
			# Restringify. Silly hashmaps being string -> string
			@_set type, JSON.stringify list
		# Return the list.
		list

	# #### _key*(entity)*
	# Return the full key type/id string for an entity, since this is the bare entity with no methods.
	_key: (entity, id = entity._id) ->
		_type = entity._type
		"#{_type}/#{id}"

	# ### _sieve*(name, property, spec)*
	# Return a function to use to filter on a particular spec field. These functions implement
	# the logic described in JEFRi Core docs 5.1.1
	_sieve = (name, property, spec) ->
		# Normalize rules 2 and 3 to operator array
		if Object.isNumber spec
			if spec % 1 is 0
				spec = ['=', spec]
			else
				spec = [spec, 8]

		# Rule 4, string behaves as SQL "Like"
		if Object.isString spec
			spec = ['REGEX', '.*' + spec + '.*']

		# Guard against bad specs
		if not spec
			spec = ['=', undefined]

		# Spec should be an array by now, if it isn't, there's a problem.
		if not Array.isArray spec
			throw { message: "Lookup specification is invalid (in LocalStore::_sieve).", name: name, property: property, spec: spec}

		# Rule 3, only floats are allowed in operator position
		if Object.isNumber spec[0]
			return (entity) ->
				Math.abs(entity[name] - spec[0]) < Math.pow 2, -spec[1]

		# Rule 8, AND specs.
		if Array.isArray spec[0]
			spec[i] = for s, i in spec
				_sieve name, property, spec[i]
			return (entity) ->
				for filter in spec
					if not filter entity
						return false
				return true

		# Rule 6, several valid operators.
		switch spec[0]
			when "="  then return (entity) -> entity[name] == spec[1]
			when "<=" then return (entity) -> entity[name] <= spec[1]
			when ">=" then return (entity) -> entity[name] >= spec[1]
			when "<"  then return (entity) -> entity[name] <  spec[1]
			when ">"  then return (entity) -> entity[name] >  spec[1]
			when "REGEX" then return (entity) -> ("" + entity[name]).match spec[1]
			# Rule 7, IN list
			else return (entity) ->
				while field = spec.shift
					if entity[name] is field
						return true
				return false

	_transactify = (transaction)->
		if not Function.isFunction(transaction.encode)
			transaction = new JEFRi.Transaction transaction
		transaction.encode()

module.exports =  ObjectStore
