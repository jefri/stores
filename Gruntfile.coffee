module.exports = (grunt) ->
	coffees = (cwd, dest)->
		expand: true
		cwd: cwd
		src: "*.coffee"
		dest: dest
		ext: ".js"

	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'
		# meta:
		# 	banner:
		# 		"// <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today(\"yyyy-mm-dd\") %>\n
		# 		<%= pkg.homepage ? \"// \" + pkg.homepage + \"\n\" : \"\" %>
		# 		// Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.author.name %>;
		# 		Licensed <%= _.pluck(pkg.licenses, \"type\").join(\", \") %>"

		clean:
			app:
				src: ["dist", "docs"]

		mochaTest:
			spec:
				options:
					reporter: 'spec'
				src: ["test/node/**/*.coffee"]

		uglify:
			dist:
				src: ['<banner:meta.banner>', './lib/<%= pkg.name %>.js']
				dest: 'lib/<%= pkg.name %>.min.js'

		webpack:
			stores:
				entry: './src/browser.js'
				output:
					filename: './lib/<%= pkg.name %>.js'
				resolve:
					extensions: ['', ".js", ".coffee"]
				module:
					loaders: [
						{ test: /\.coffee$/, loader: 'coffee-loader' }
					]

		karma:
			options:
				browsers: do ->
					# butt - Browser Under Test Tools
					butt = []
					unless process.env.DEBUG
						if process.env.BAMBOO
							butt.push 'PhantomJS'
						else if process.env.TRAVIS
							butt.push 'Firefox'
						else
							butt.push 'Chrome'
					butt
				frameworks: [ 'mocha', 'sinon-chai' ]
				reporters: [ 'spec', 'junit', 'coverage' ]
				singleRun: true,
				logLevel: 'INFO'
				preprocessors:
					'test/**/*.coffee': [ 'coffee' ]
				junitReporter:
					outputFile: 'build/reports/karma.xml'
				coverageReporter:
					type: 'lcov'
					dir: 'build/reports/coverage/'
			client:
				options:
					files: [
						'node_modules/jefri/lib/jefri.min.js',
						'node_modules/q/q.js',
						'lib/<%= pkg.name %>.js',
						'test/karma/**/*.coffee'
					]
			min:
				options:
					files: [
						'node_modules/jefri/lib/jefri.min.js',
						'node_modules/q/q.js',
						'lib/<%= pkg.name %>.min.js',
						'test/karma/**/*.coffee'
					]

	grunt.registerTask "connect", (grunt)->
		mount = require('st')({ path: __dirname + '/test/contexts', url: '/' })
		require('http').createServer (req, res)->
			res.setHeader 'Access-Control-Allow-Origin', '*'
			res.setHeader 'Access-Control-Allow-Credentials', true
			res.setHeader 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'
			res.setHeader 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS'
			if (mount(req, res))
				return
			else
				res.end('this is not a static file')
		.listen(8000)

	grunt.loadNpmTasks "grunt-mocha-test"
	grunt.loadNpmTasks "grunt-contrib-watch"
	grunt.loadNpmTasks "grunt-contrib-uglify"
	grunt.loadNpmTasks "grunt-contrib-concat"
	grunt.loadNpmTasks "grunt-contrib-clean"
	grunt.loadNpmTasks "grunt-jsonlint"
	grunt.loadNpmTasks "grunt-webpack"
	grunt.loadNpmTasks "grunt-karma"
	grunt.loadNpmTasks "grunt-release"

	grunt.registerTask "lint", []
	grunt.registerTask "default", ["clean", "lint", "connect", "mochaTest", "webpack", "karma:client", "uglify", "karma:min"]
