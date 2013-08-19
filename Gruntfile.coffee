module.exports = (grunt) ->
	coffees = (cwd, dest)->
		expand: true
		cwd: cwd
		src: "*.coffee"
		dest: dest
		ext: ".js"

	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'
		meta:
			banner: 
				"// <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today(\"yyyy-mm-dd\") %>\n
				<%= pkg.homepage ? \"// \" + pkg.homepage + \"\n\" : \"\" %>
				// Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.author.name %>;
				Licensed <%= _.pluck(pkg.licenses, \"type\").join(\", \") %>"

		clean:
			app:
				src: ["dist", "docs"]

		coffee:
			app:
				files:
					"dist/compiled/Stores.js": [
						"src/Stores.coffee"
						"src/ObjectStore.coffee"
						"src/LocalStore.coffee"
						"src/PostStore.coffee"
						"src/FileStore.coffee"
					]
				options:
					bare: true

			qunit:
				files: [
					coffees "test/qunit/min/coffee/", "test/qunit/min/coffee/compiled/"
				]
				options:
					bare: true

			jasmine:
				files:[
					coffees "test/spec/node/coffee/", "test/spec/node/spec/"
				]
		concat:
			node:
				src: ["<banner:meta.banner>", "src/node/pre.js", "src/PostStore.js", "dist/compiled/Stores.js", "src/node/post.js"]
				dest: "lib/<%= pkg.name %>.js"

			min:
				src: ["<banner:meta.banner>", "src/min/pre.js", "src/PostStore.js", "dist/compiled/Stores.js", "src/min/post.js"]
				dest: "lib/<%= pkg.name %>.min.js"

			qunitMin:
				src: ["test/qunit/min/js/*.js", "test/qunit/min/coffee/tests.js"]
				dest: "test/qunit/min/tests.js"

		connect:
			testing:
				root: '.'
				port: 8000

		jasmine_node:
			projectRoot: "test/spec/node"
			specFolderName: "spec"
			match: ""
			matchall: true

		qunit:
			min:
				options:
					urls: ["http://localhost:8000/test/qunit/min/qunit.html"]

		uglify:
			dist:
				src: ["<banner:meta.banner>", "<config:concat.dist.dest>"]
				dest: "lib/<%= pkg.name %>.min.js"

		watch:
			app:
				files: ["src/*coffee", "test/**/*"]
				tasks: ["default"]



	grunt.loadNpmTasks "grunt-jasmine-node"
	grunt.loadNpmTasks "grunt-contrib-watch"
	grunt.loadNpmTasks "grunt-contrib-qunit"
	grunt.loadNpmTasks "grunt-contrib-nodeunit"
	grunt.loadNpmTasks "grunt-contrib-uglify"
	grunt.loadNpmTasks "grunt-contrib-coffee"
	grunt.loadNpmTasks "grunt-contrib-connect"
	grunt.loadNpmTasks "grunt-contrib-concat"
	grunt.loadNpmTasks "grunt-contrib-clean"

	grunt.registerTask "jasmineTests", ["coffee:jasmine", "jasmine_node"]
	grunt.registerTask "qunitTests", ["coffee:qunit", "qunit:min"]
	grunt.registerTask "tests", ["connect:testing", "qunitTests", "jasmineTests"]
	grunt.registerTask "default", ["clean", "coffee:app", "concat:node", "concat:min", "tests"]
