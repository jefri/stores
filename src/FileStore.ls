/*
* FileStore
* https://github.com/DavidSouther/JEFRi
*
* Copyright (c) 2012 David Souther
* Licensed under the MIT license.
*/
FileStore = ->
	require! { fs }

	class FileStore extends JEFRi.Stores.ObjectStore
		(options) ->
			opts = 
				directory: "./.jefri"
			opts <<< options
			super opts
			_checkDir @settings.directory
			@storage = @settings.directory

		_set: !(key, value, cb)->
			path = @_buildPath key
			fs.writeFile path, value, (!->cb()), (!->cb())

		_get: (key, cb)->
			path = @_buildPath key
			fs.readFile path, (!-> cb(it)), (!-> cb("{}"))

		_buildPath: (key)->
			key = key.split '/'
			path = "#{@storage}/#{key[0]}"
			_checkDir path
			if key.length is 1 then key[1] = "list"
			path = "#{path}/#{key[1]}"
			path

		_checkDir = !(directory)->
			try
				dir = fs.statSync directory
			catch
				fs.mkdirSync directory
				dir = fs.statSync directory
			if not dir.isDirectory!
				throw "FileStorage target isn't a directory: #{directory}"

JEFRi.store \FileStore, FileStore
