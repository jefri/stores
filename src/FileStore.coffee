###
 FileStore
 https://github.com/DavidSouther/JEFRi

 Copyright (c) 2012 David Souther
 Licensed under the MIT license.
###

fs = require "fs"
ObjectStore = require('./ObjectStore')

class FileStore extends ObjectStore
	constructor: (options)->
		opts = 
			directory: "./.jefri"
		Object.assign opts, options
		super opts
		_checkDir @settings.directory
		@storage = @settings.directory

	_set: (key, value)->
		path = @_buildPath key
		fs.writeFileSync path, value

	_get: (key)->
		path = @_buildPath key
		try
			fs.readFileSync path
		catch e
			"{}"

	_buildPath: (key)->
		key = key.split '/'
		path = "#{@storage}/#{key[0]}"
		_checkDir path
		if key.length is 1 then key[1] = "list"
		path = "#{path}/#{key[1]}"
		path

	_checkDir = (directory)->
		try
			dir = fs.statSync directory
		catch e
			fs.mkdirSync directory
			dir = fs.statSync directory
		if not dir.isDirectory()
			throw "FileStorage target isn't a directory: #{directory}"

module.exports = FileStore
