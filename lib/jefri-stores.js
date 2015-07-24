/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Stores = {
		ObjectStore: __webpack_require__(1),
		CouchStore: __webpack_require__(2),
		PostStore: __webpack_require__(3),
		LocalStore: __webpack_require__(4)
	};
	window.JEFRi.Stores = module.exports = Stores;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var JEFRi, ObjectStore, jiffies,
	  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	  hasProp = {}.hasOwnProperty;

	jiffies = __webpack_require__(5);

	JEFRi = __webpack_require__(6);

	ObjectStore = (function(superClass) {
	  var _sieve, _transactify;

	  extend(ObjectStore, superClass);

	  function ObjectStore(options) {
	    this.settings = {
	      version: "1.0",
	      size: Math.pow(2, 16)
	    };
	    Object.assign(this.settings, options);
	    this._store = {};
	    if (!this.settings.runtime) {
	      throw {
	        message: "LocalStore instantiated without runtime to reference."
	      };
	    }
	  }

	  ObjectStore.prototype._set = function(key, value) {
	    return this._store[key] = value;
	  };

	  ObjectStore.prototype._get = function(key) {
	    return this._store[key] || '{}';
	  };

	  ObjectStore.prototype.execute = function(type, transaction) {
	    var d;
	    transaction = _transactify(transaction);
	    this.emit("sending", transaction);
	    this["do_" + type](transaction);
	    this.settings.runtime.expand(transaction);
	    d = jiffies.promise.defer();
	    d.resolve(transaction);
	    return d.promise;
	  };

	  ObjectStore.prototype.get = function(transaction) {
	    return this.execute('get', transaction);
	  };

	  ObjectStore.prototype.persist = function(transction) {
	    return this.execute('persist', transction);
	  };

	  ObjectStore.prototype.do_persist = function(transaction) {
	    var entity;
	    return transaction.entities = (function() {
	      var l, len, ref, results1;
	      ref = transaction.entities;
	      results1 = [];
	      for (l = 0, len = ref.length; l < len; l++) {
	        entity = ref[l];
	        results1.push(this._save(entity));
	      }
	      return results1;
	    }).call(this);
	  };

	  ObjectStore.prototype._save = function(entity) {
	    entity = Object.assign(this._find(entity), entity);
	    this._set(this._key(entity), JSON.stringify(entity));
	    this._type(entity._type, entity._id);
	    return entity;
	  };

	  ObjectStore.prototype.do_get = function(transaction) {
	    var entity, ents, found, k, l, len, ref, v, whittle;
	    ents = {};
	    ref = transaction.entities;
	    for (l = 0, len = ref.length; l < len; l++) {
	      entity = ref[l];
	      found = this._lookup(entity);
	      whittle = function(result) {
	        var e, id, len1, m, r, results1, results2;
	        if (result) {
	          if (result.hasOwnProperty("_type")) {
	            return ents[result._id] = result;
	          } else if (Array.isArray(result)) {
	            results1 = [];
	            for (m = 0, len1 = result.length; m < len1; m++) {
	              r = result[m];
	              results1.push(whittle(r));
	            }
	            return results1;
	          } else {
	            results2 = [];
	            for (id in result) {
	              e = result[id];
	              results2.push(whittle(e));
	            }
	            return results2;
	          }
	        }
	      };
	      whittle(found);
	    }
	    transaction.entities = (function() {
	      var results1;
	      results1 = [];
	      for (k in ents) {
	        v = ents[k];
	        results1.push(v);
	      }
	      return results1;
	    })();
	    return transaction;
	  };

	  ObjectStore.prototype._find = function(entity) {
	    return JSON.parse(this._get(this._key(entity)));
	  };

	  ObjectStore.prototype._lookup = function(spec) {
	    var def, end, entity, give, i, id, j, l, len, len1, len2, m, n, name, property, ref, ref1, ref2, related, relationship, results, take;
	    def = this.settings.runtime.definition(spec._type);
	    results = [];
	    ref = Object.keys(this._type(spec._type));
	    for (l = 0, len = ref.length; l < len; l++) {
	      id = ref[l];
	      results.push(JSON.parse(this._get(this._key(spec, id))));
	    }
	    if (results.length === 0) {
	      return;
	    }
	    if (def.key in spec) {
	      results = results.filter(function(e) {
	        return e._id === spec[def.key];
	      });
	    }
	    ref1 = def.properties;
	    for (name in ref1) {
	      property = ref1[name];
	      if (name in spec && name !== def.key) {
	        results = results.filter(_sieve(name, property, spec[name]));
	      }
	    }
	    ref2 = def.relationships;
	    for (name in ref2) {
	      relationship = ref2[name];
	      if (name in spec) {
	        give = [];
	        take = [];
	        for (m = 0, len1 = results.length; m < len1; m++) {
	          entity = results[m];
	          related = (function(_this) {
	            return function() {
	              var relspec;
	              if ("list" === def.properties[relationship.property].type) {
	                return entity[relationship.property].map(function(other) {
	                  var relspec;
	                  relspec = {
	                    _type: relationship.to.type
	                  };
	                  relspec[relationship.to.property] = other;
	                  return _this._lookup(relspec);
	                }).filter(function(_) {
	                  return _.length > 0;
	                }).reduce((function(_, __) {
	                  return _.concat(__);
	                }), []);
	              } else {
	                relspec = Object.assign({}, spec[name], {
	                  _type: relationship.to.type
	                });
	                relspec[relationship.to.property] = entity[relationship.property];
	                return _this._lookup(relspec);
	              }
	            };
	          })(this)();
	          if (related.length) {
	            give.push(related);
	          }
	        }
	        take.reverse();
	        for (n = 0, len2 = take.length; n < len2; n++) {
	          i = take[n];
	          j = i + 1;
	          end = results[j(til(results.length))];
	          results = results.slice(0, +i + 1 || 9e9);
	          [].push.apply(results, end);
	        }
	        [].push.apply(results, give);
	      }
	    }
	    return results;
	  };

	  ObjectStore.prototype._type = function(type, id) {
	    var list;
	    if (id == null) {
	      id = null;
	    }
	    list = JSON.parse(this._get(type) || "{}");
	    if (id) {
	      list[id] = "";
	      this._set(type, JSON.stringify(list));
	    }
	    return list;
	  };

	  ObjectStore.prototype._key = function(entity, id) {
	    var _type;
	    if (id == null) {
	      id = entity._id;
	    }
	    _type = entity._type;
	    return _type + "/" + id;
	  };

	  _sieve = function(name, property, spec) {
	    var i, s;
	    if (Object.isNumber(spec)) {
	      if (spec % 1 === 0) {
	        spec = ['=', spec];
	      } else {
	        spec = [spec, 8];
	      }
	    }
	    if (Object.isString(spec)) {
	      spec = ['REGEX', '.*' + spec + '.*'];
	    }
	    if (!spec) {
	      spec = ['=', void 0];
	    }
	    if (!Array.isArray(spec)) {
	      throw {
	        message: "Lookup specification is invalid (in LocalStore::_sieve).",
	        name: name,
	        property: property,
	        spec: spec
	      };
	    }
	    if (Object.isNumber(spec[0])) {
	      return function(entity) {
	        return Math.abs(entity[name] - spec[0]) < Math.pow(2, -spec[1]);
	      };
	    }
	    if (Array.isArray(spec[0])) {
	      spec[i] = (function() {
	        var l, len, results1;
	        results1 = [];
	        for (i = l = 0, len = spec.length; l < len; i = ++l) {
	          s = spec[i];
	          results1.push(_sieve(name, property, spec[i]));
	        }
	        return results1;
	      })();
	      return function(entity) {
	        var filter, l, len;
	        for (l = 0, len = spec.length; l < len; l++) {
	          filter = spec[l];
	          if (!filter(entity)) {
	            return false;
	          }
	        }
	        return true;
	      };
	    }
	    switch (spec[0]) {
	      case "=":
	        return function(entity) {
	          return entity[name] === spec[1];
	        };
	      case "<=":
	        return function(entity) {
	          return entity[name] <= spec[1];
	        };
	      case ">=":
	        return function(entity) {
	          return entity[name] >= spec[1];
	        };
	      case "<":
	        return function(entity) {
	          return entity[name] < spec[1];
	        };
	      case ">":
	        return function(entity) {
	          return entity[name] > spec[1];
	        };
	      case "REGEX":
	        return function(entity) {
	          return ("" + entity[name]).match(spec[1]);
	        };
	      default:
	        return function(entity) {
	          var field;
	          while (field = spec.shift) {
	            if (entity[name] === field) {
	              return true;
	            }
	          }
	          return false;
	        };
	    }
	  };

	  _transactify = function(transaction) {
	    if (!Function.isFunction(transaction.encode)) {
	      transaction = new JEFRi.Transaction(transaction);
	    }
	    return transaction.encode();
	  };

	  return ObjectStore;

	})(jiffies.Event);

	module.exports = ObjectStore;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var CouchStore, root;

	root = this;

	root.JEFRi = root.JEFRi ? root.JEFRi : {};

	CouchStore = (function() {
	  function CouchStore(options) {
	    this.settings = {
	      version: "1.0",
	      size: Math.pow(2, 16)
	    };
	    _.extend(this.settings, options);
	    if (!this.settings.runtime) {
	      throw {
	        message: "CouchStore instantiated without runtime to reference."
	      };
	    }
	  }

	  CouchStore.prototype.execute = function(type, transaction) {
	    var d, transactionEvent;
	    transactionEvent = JSON.parse(transaction.toString());
	    _(this).trigger('sending', [type, 'couchStorage:', transactionEvent, this]);
	    if (type === "persist") {
	      d = this.persist(transaction);
	    } else if (type === "get") {
	      d = this.get(transaction);
	    }
	    return d.resolve({}).promise();
	  };

	  CouchStore.prototype.persist = function(transaction) {
	    return _.Deferred();
	  };

	  CouchStore.prototype.get = function(transaction) {
	    return _.Deferred();
	  };

	  return CouchStore;

	})();

	root.JEFRi.CouchStore = CouchStore;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var PostStore, Promise, Request, jiffies,
	  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

	jiffies = __webpack_require__(5);

	Request = jiffies.request;

	Promise = jiffies.promise;

	module.exports = PostStore = (function() {
	  function PostStore(options) {
	    this._send = bind(this._send, this);
	    this.settings = {
	      version: "1.0",
	      size: Math.pow(2, 16)
	    };
	    Object.assign(this.settings, options);
	    if (!this.settings.runtime) {
	      throw {
	        message: "LocalStore instantiated without runtime to reference."
	      };
	    }
	    if (this.settings.remote) {
	      Object.assign(this, {
	        get: function(transaction) {
	          var url;
	          url = this.settings.remote + "get";
	          return this._send(url, transaction, 'getting', 'gotten');
	        },
	        persist: function(transaction) {
	          var url;
	          url = this.settings.remote + "persist";
	          return this._send(url, transaction, 'persisting', 'persisted');
	        }
	      });
	    } else {
	      this.get = this.persist = function(transaction) {
	        var promise;
	        transaction.entities = [];
	        promise = Promise();
	        promise(true, transaction);
	        return promise;
	      };
	    }
	  }

	  PostStore.prototype._send = function(url, transaction, pre, post) {
	    return Request.post(url, {
	      data: transaction.toString(),
	      dataType: "application/json"
	    }).then((function(_this) {
	      return function(data) {
	        if (Object.isString(data)) {
	          data = JSON.parse(data);
	        }
	        _this.settings.runtime.expand(data);
	        return data;
	      };
	    })(this));
	  };

	  return PostStore;

	})();

	Object.assign(PostStore.prototype, {
	  execute: function(type, transaction) {
	    return this[type](transaction);
	  }
	});


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var LocalStore, ObjectStore,
	  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	  hasProp = {}.hasOwnProperty;

	ObjectStore = __webpack_require__(1);

	LocalStore = (function(superClass) {
	  extend(LocalStore, superClass);

	  function LocalStore(options) {
	    LocalStore.__super__.constructor.call(this, options);
	  }

	  LocalStore.prototype._set = function(key, value) {
	    return localStorage[key] = value;
	  };

	  LocalStore.prototype._get = function(key) {
	    return localStorage[key] || '{}';
	  };

	  LocalStore.prototype._key = function(entity, id) {
	    if (id == null) {
	      id = entity._id;
	    }
	    return LocalStore.__super__._key.call(this, entity, id).replace('/', '.');
	  };

	  return LocalStore;

	})(ObjectStore);

	module.exports = LocalStore;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(7);

	module.exports = {
		Event: __webpack_require__(8),
		lock: __webpack_require__(9),
		promise: __webpack_require__(10),
		request: __webpack_require__(15),
		UUID: __webpack_require__(11)
	};

	if(typeof window == 'object' && window !== null){
		window.jiffies = module.exports;
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var JEFRi = __webpack_require__(12);
	JEFRi.Runtime = __webpack_require__(13);
	JEFRi.Transaction = __webpack_require__(14);

	module.exports = JEFRi;

	if(typeof window !== 'undefined' && window !== null){
		window.JEFRi = module.exports;
	}


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
	if (![].includes) {
		Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {'use strict';
			var O = Object(this);
			var len = parseInt(O.length) || 0;
			if (len === 0) {
				return false;
			}
			var n = parseInt(arguments[1]) || 0;
			var k;
			if (n >= 0) {
				k = n;
			} else {
				k = len + n;
				if (k < 0) {k = 0;}
			}
			var currentElement;
			while (k < len) {
				currentElement = O[k];
				if (searchElement === currentElement ||
					 (searchElement !== searchElement && currentElement !== currentElement)) {
					return true;
				}
				k++;
			}
			return false;
		};
	}

	if (!Object.assign) {
		Object.defineProperty(Object, 'assign', {
			enumerable: false,
			configurable: true,
			writable: true,
			value: function(target, firstSource) {
				'use strict';
				if (target === undefined || target === null) {
					throw new TypeError('Cannot convert first argument to object');
				}

				var to = Object(target);
				for (var i = 1; i < arguments.length; i++) {
					var nextSource = arguments[i];
					if (nextSource === undefined || nextSource === null) {
						continue;
					}

					var keysArray = Object.keys(Object(nextSource));
					for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
						var nextKey = keysArray[nextIndex];
						var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
						if (desc !== undefined && desc.enumerable) {
							to[nextKey] = nextSource[nextKey];
						}
					}
				}
				return to;
			}
		});
	}

	if (!Object.isString) {
		Object.isString = function(value){
			return typeof value == 'string';
		}
	}

	if (!Array.isArray) {
		Array.isArray = function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
	}

	if (!Function.isFunction) {
		Function.isFunction = function(obj) {
			return typeof obj === 'function';
		};
	}

	if (!Object.isObject) {
		Object.isObject =  function(obj) {
			return typeof obj == 'object' && obj !== null || false;
		}
	}

	if (!Object.isNumber) {
		Object.isNumber = function(n) {
		  return !isNaN(parseFloat(n)) && isFinite(n);
		};
	}


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(18).EventEmitter;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function( fn ) {
		return function(){
			var ret, ex;
			if(!fn.__locked){
				fn.__locked = true;
				try {
					ret = fn.apply(this, arguments);
				} catch (e){
					ex = e;
				}
			}
			fn.__locked = false;
			if(ex){
				throw ex;
			} else {
				return ret;
			}
		};
	};


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var Promise = __webpack_require__(19);
	Promise.prototype.finally = function(onFinished){
	  return this.then(onFinished, onFinished);
	};
	Promise.prototype.done = function(){
	  return;
	}
	Promise.defer = function(){
	  var resolve, reject, promise = new Promise(function(s, j){
	    resolve = s;
	    reject = j;
	  });

	  return {
	    promise: promise,
	    resolve: resolve,
	    reject: reject
	  };
	}

	module.exports = Promise;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var UUID = {};
	module.exports = UUID;

	UUID.rvalid = /^\{?[0-9a-f]{8}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{12}\}?$/i;

	var random = __webpack_require__(16);

	UUID.v4 = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = random(1)&0x0f, v = c === 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  EntityComparator: function(a, b) {
	    var cmp;
	    cmp = a && b && a._type() === b._type() && a.id() === b.id();
	    return cmp;
	  },
	  isEntity: function(obj) {
	    if (obj == null) {
	      obj = {};
	    }
	    return obj._type && obj.id && Function.isFunction(obj._type) && Function.isFunction(obj.id) || false;
	  }
	};


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var EntityArray, Eventer, JEFRi, Promise, UUID, jiffies, lock, pushResult,
	  slice = [].slice;

	JEFRi = __webpack_require__(12);

	jiffies = __webpack_require__(5);

	Eventer = jiffies.Event;

	Promise = jiffies.promise;

	UUID = jiffies.UUID;

	lock = jiffies.lock;

	EntityArray = __webpack_require__(17);

	module.exports = JEFRi.Runtime = function(contextUri, options, protos) {
	  var _build_constructor, _build_method, _build_mutacc, _build_prototype, _build_relationship, _default, _set_context, ec, ready, settings;
	  if (!this instanceof JEFRi.Runtime) {
	    return new JEFRi.Rutime(contextUri, options, protos);
	  }
	  ec = this;
	  if (!Object.isString(contextUri)) {
	    protos = options;
	    options = contextUri;
	    contextUri = '';
	  }
	  ready = Promise.defer();
	  settings = {
	    updateOnIntern: true
	  };
	  Object.assign(settings, options);
	  Object.assign(this, {
	    settings: settings,
	    ready: ready.promise,
	    _context: {
	      meta: {},
	      contexts: {},
	      entities: {},
	      attributes: {}
	    },
	    _instances: {}
	  });
	  _default = function(type) {
	    switch (type) {
	      case "list":
	        return [];
	      case "object":
	        return {};
	      case "boolean":
	        return false;
	      case "int" || "float":
	        return 0;
	      case "string":
	        return "";
	      default:
	        return "";
	    }
	  };
	  _set_context = (function(_this) {
	    return function(context, protos) {
	      var definition, ref, results1, type;
	      Object.assign(_this._context.attributes, context.attributes || {});
	      ref = context.entities;
	      results1 = [];
	      for (type in ref) {
	        definition = ref[type];
	        definition.type = type;
	        results1.push(_build_constructor(definition, type));
	      }
	      return results1;
	    };
	  })(this);
	  _build_constructor = (function(_this) {
	    return function(definition, type) {
	      _this._context.entities[type] = definition;
	      _this._instances[type] = {};
	      definition.Constructor = function(proto) {
	        var def, name, name1, property, ref;
	        Object.assign(this, {
	          _new: true,
	          _modified: {
	            _count: 0
	          },
	          _fields: {},
	          _relationships: {},
	          _runtime: ec
	        });
	        proto = proto || {};
	        proto[name1 = definition.key] || (proto[name1] = UUID.v4());
	        ref = definition.properties;
	        for (name in ref) {
	          property = ref[name];
	          def = proto[name] || _default(property.type);
	          this[name] = def;
	        }
	        this._id = this.id(true);
	        this.on("persisted", function() {
	          this._new = false;
	          return this._modified = {
	            _count: 0
	          };
	        });
	        return this;
	      };
	      definition.Constructor.name = type;
	      return _build_prototype(type, definition, protos && protos[type]);
	    };
	  })(this);
	  _build_prototype = (function(_this) {
	    return function(type, definition, proto) {
	      var field, func, method, property, ref, ref1, ref2, rel_name, relationship;
	      definition.Constructor.prototype = Object.create(Object.assign({}, Eventer.prototype, {
	        _type: function(full) {
	          full = full || false;
	          return type;
	        },
	        id: function(full) {
	          return "" + (full ? (this._type()) + "/" : "") + this[definition.key];
	        },
	        _status: function() {
	          if (this._new) {
	            return "NEW";
	          } else if (this._modified._count === 0) {
	            return "PERSISTED";
	          } else {
	            return "MODIFIED";
	          }
	        },
	        _definition: function() {
	          return definition;
	        },
	        _persist: function(transaction, callback) {
	          var deferred, top;
	          deferred = _.Deferred().then(callback);
	          top = !transaction;
	          transaction = top ? new JEFRi.Transaction() : transaction;
	          transaction.add(this);
	          this.emit("persisting", transaction);
	          if (top) {
	            return transaction.persist(callback);
	          }
	        },
	        _encode: function() {
	          var min, prop;
	          min = {
	            _type: this._type(),
	            _id: this.id()
	          };
	          for (prop in definition.properties) {
	            min[prop] = this[prop];
	          }
	          return min;
	        },
	        _destroy: lock(function() {
	          var name, ref, rel;
	          this.emit("destroying", {});
	          ref = definition.relationships;
	          for (name in ref) {
	            rel = ref[name];
	            if (rel.type === "has_many") {
	              this[name].remove(this);
	            } else {
	              this[name] = null;
	            }
	          }
	          ec.destroy(this);
	          this[definition.key] = 0;
	          return this.emit("destroyed", {});
	        }),
	        _compare: function(b) {
	          return JEFRi.EntityComparator(this, b);
	        }
	      }));
	      definition.Constructor.prototype.toJSON = definition.Constructor.prototype._encode;
	      ref = definition.properties;
	      for (field in ref) {
	        property = ref[field];
	        _build_mutacc(definition, field, property);
	      }
	      ref1 = definition.relationships;
	      for (rel_name in ref1) {
	        relationship = ref1[rel_name];
	        _build_relationship(definition, rel_name, relationship);
	      }
	      ref2 = definition.methods;
	      for (method in ref2) {
	        func = ref2[method];
	        _build_method(definition, method, func);
	      }
	      if (proto) {
	        return Object.assign(definition.Constructor.prototype, proto.prototype);
	      }
	    };
	  })(this);
	  _build_mutacc = (function(_this) {
	    return function(definition, field, property) {
	      return Object.defineProperty(definition.Constructor.prototype, field, {
	        set: function(value) {
	          if (value !== this._fields[field]) {
	            this._fields[field] = value;
	            if (!this._modified[field]) {
	              this._modified[field] = this._fields[field];
	              this._modified._count += 1;
	            } else {
	              if (this._modified[field] === value) {
	                delete this._modified[field];
	                this._modified._count -= 1;
	              }
	            }
	            return this.emit("modified", [field, value]);
	          }
	        },
	        get: function() {
	          return this._fields[field];
	        }
	      });
	    };
	  })(this);
	  _build_relationship = function(definition, field, relationship) {
	    var _has_many, _has_many_list, _has_one, access, ref, resolve_ids;
	    _has_one = function() {
	      return {
	        set: lock(function(related) {
	          var ref, ref1;
	          if (related === null) {
	            if ("is_a" !== relationship.type) {
	              try {
	                if ((ref = this._relationships[field]) != null) {
	                  ref[relationship.back].remove(this);
	                }
	              } catch (_error) {
	                if ((ref1 = this._relationships[field]) != null) {
	                  ref1[relationship.back] = null;
	                }
	              }
	            }
	            this._relationships[field] = null;
	            this[relationship.property] = null;
	          } else {
	            this._relationships[field] = related;
	            resolve_ids.call(this, related);
	            if ("is_a" !== relationship.type) {
	              if (relationship.back) {
	                if (related != null) {
	                  related[relationship.back] = this;
	                }
	              }
	            }
	          }
	          this._modified._count += 1;
	          this.emit("modified", [field, related]);
	          return this;
	        }),
	        get: function() {
	          var key;
	          if (this._relationships[field] === void 0) {
	            this._relationships[field] = ec._instances[relationship.to.type][this[relationship.property]];
	            if (this._relationships[field] === void 0) {
	              key = {};
	              key[relationship.to.property] = this[relationship.property];
	              this[field] = ec.build(relationship.to.type, key);
	            }
	          }
	          return this._relationships[field];
	        }
	      };
	    };
	    _has_many = function() {
	      return {
	        enumerable: true,
	        configurable: false,
	        get: function() {
	          var id, ref, type;
	          if (!(field in this._relationships)) {
	            this._relationships[field] = new EntityArray(this, field, relationship);
	            ref = ec._instances[relationship.to.type];
	            for (id in ref) {
	              type = ref[id];
	              if (type[relationship.to.property] === this[relationship.property]) {
	                this._relationships[field].add(type);
	              }
	            }
	          }
	          return this._relationships[field];
	        },
	        set: function() {
	          var entity, j, len, relations;
	          relations = 1 <= arguments.length ? slice.call(arguments, 0) : [];
	          relations = relations.reduce((function(a, b) {
	            return a.concat(b);
	          }), []);
	          this[field];
	          for (j = 0, len = relations.length; j < len; j++) {
	            entity = relations[j];
	            this._relationships[field].add(entity);
	          }
	          this._modified._count += 1;
	          this.emit("modified", [field, arguments]);
	          return this;
	        }
	      };
	    };
	    _has_many_list = function() {
	      return {
	        enumerable: true,
	        configurable: false,
	        get: function() {
	          var a, name1;
	          this[name1 = relationship.property] || (this[name1] = []);
	          if (!(field in this._relationships)) {
	            a = this;
	            this._relationships[field] = new EntityArray(this, field, relationship);
	            this[relationship.property].forEach(function(id) {
	              return a._relationships[field].add(ec._instances[relationship.to.type][id]);
	            });
	            this._relationships[field].on(EntityArray.ADD, function(e) {
	              return a[relationship.property].push(e.id());
	            });
	            this._relationships[field].on(EntityArray.REMOVE, function(e) {
	              var i;
	              i = a[relationship.property].indexOf(e.id);
	              return a[relationship.property].splice(i, 1);
	            });
	          }
	          return this._relationships[field];
	        },
	        set: function() {
	          var entity, j, len, relations;
	          relations = 1 <= arguments.length ? slice.call(arguments, 0) : [];
	          relations = relations.reduce((function(a, b) {
	            return a.concat(b);
	          }), []);
	          this[field];
	          for (j = 0, len = relations.length; j < len; j++) {
	            entity = relations[j];
	            this._relationships[field].add(entity);
	          }
	          this[relationship.property] = this._relationships[field].map(function(_) {
	            return _.id();
	          });
	          this._modified._count += 1;
	          this.emit("modified", [field, arguments]);
	          return this;
	        }
	      };
	    };
	    access = "has_many" === relationship.type ? "list" === ((ref = definition.properties[relationship.property]) != null ? ref.type : void 0) ? _has_many_list() : _has_many() : _has_one();
	    Object.defineProperty(definition.Constructor.prototype, field, access);
	    return resolve_ids = function(related) {
	      var id;
	      if (related === void 0) {
	        return this[relationship.property] = void 0;
	      } else if (definition.key === relationship.property) {
	        return related[relationship.to.property] = this[relationship.property];
	      } else if (related._definition().key === relationship.to.property) {
	        return this[relationship.property] = related[relationship.to.property];
	      } else {
	        if (this[relationship.property].match(UUID.rvalid)) {
	          return related[relationship.to.property] = this[relationship.property];
	        } else if (related[relationship.to.property].match(UUID.rvalid)) {
	          return this[relationship.property] = related[relationship.to.property];
	        } else {
	          id = UUID.v4();
	          this[relationship.property] = id;
	          return related[relationship.to.property] = id;
	        }
	      }
	    };
	  };
	  _build_method = function(definition, method, func) {
	    var body, fn, params;
	    func = {
	      definitions: func.definitions || {},
	      order: func.order || []
	    };
	    body = func.definitions.javascript || "";
	    params = func.order;
	    if (body && !body.match(/window/)) {
	      params.push(body);
	      fn = Function.apply(null, params);
	    } else {
	      fn = function() {};
	    }
	    return definition.Constructor.prototype[method] = fn;
	  };
	  this.load = function(contextUri, prototypes) {
	    return jiffies.request(contextUri).then(function(data) {
	      _set_context(JSON.parse(data), prototypes);
	      return ready.resolve();
	    })["catch"](function(e) {
	      console.error('Could not load context');
	      console.warn(e);
	      console.log(e.stack);
	      return ready.reject(e);
	    });
	  };
	  if (options && options.debug) {
	    _set_context(options.debug.context, protos);
	    ready.reject();
	  }
	  if (contextUri) {
	    this.load(contextUri, protos);
	  }
	  return this;
	};

	pushResult = function(entity) {
	  var type;
	  type = entity._type();
	  if (!this[type]) {
	    this[type] = [];
	  }
	  return this[type].push(entity);
	};

	JEFRi.Runtime.prototype = Object.create(Object.assign({}, Eventer, {
	  clear: function() {
	    this._instances = {};
	    return this;
	  },
	  definition: function(name) {
	    name = (typeof name._type === "function" ? name._type() : void 0) || name;
	    return this._context.entities[name];
	  },
	  extend: function(type, extend) {
	    if (this._context.entities[type]) {
	      Object.assign(this._context.entities[type].Constructor.prototype, extend.prototype);
	    }
	    return this;
	  },
	  intern: function(entity, updateOnIntern) {
	    var ent, entities, ret;
	    if (updateOnIntern == null) {
	      updateOnIntern = false;
	    }
	    updateOnIntern = updateOnIntern || this.settings.updateOnIntern;
	    if (entity.length && !entity._type) {
	      entities = (function() {
	        var j, len, results1;
	        results1 = [];
	        for (j = 0, len = entity.length; j < len; j++) {
	          ent = entity[j];
	          results1.push(this.intern(ent, updateOnIntern));
	        }
	        return results1;
	      }).call(this);
	      return entities;
	    }
	    if (updateOnIntern) {
	      ret = this._instances[entity._type()][entity.id()] || entity;
	      Object.assign(ret._fields, entity._fields);
	    } else {
	      ret = this._instances[entity._type()][entity.id()] || entity;
	    }
	    this._instances[entity._type()][entity.id()] = ret;
	    return ret;
	  },
	  build: function(type, obj) {
	    var def, demi, instance, r;
	    def = this.definition(type);
	    if (!def) {
	      throw "JEFRi::Runtime::build '" + type + "' is not a defined type in this context.";
	    }
	    obj = obj || {};
	    r = new def.Constructor(obj);
	    if (def.key in obj) {
	      demi = {
	        _type: type
	      };
	      demi[def.key] = obj[def.key];
	      instance = this.find(demi);
	      if (instance.length > 0) {
	        instance = instance[0];
	        Object.assign(instance._fields, r._fields);
	        return instance;
	      }
	    }
	    this._instances[type][r.id()] = r;
	    return r;
	  },
	  expand: function(transaction, action) {
	    var built, e, entity, j, k, len, len1, ref;
	    action = action || "persisted";
	    built = [];
	    ref = transaction.entities || [];
	    for (j = 0, len = ref.length; j < len; j++) {
	      entity = ref[j];
	      e = this.build(entity._type, entity);
	      e = this.intern(e, true);
	      built.push(e);
	    }
	    for (k = 0, len1 = built.length; k < len1; k++) {
	      e = built[k];
	      e.emit(action, true);
	    }
	    return transaction.entities = built;
	  },
	  destroy: function(entity) {
	    delete this._instances[entity._type()][entity.id()];
	    return this;
	  },
	  find: function(spec) {
	    var key, r, result, results, to_return;
	    if (typeof spec === "string") {
	      spec = {
	        _type: spec
	      };
	    }
	    to_return = [];
	    r = this.definition(spec._type);
	    results = this._instances[spec._type];
	    if (spec.hasOwnProperty(r.key) || spec.hasOwnProperty('_id')) {
	      key = spec[r.key] || spec._id;
	      if (results[key]) {
	        to_return.push(results[key]);
	      }
	    } else {
	      for (key in results) {
	        result = results[key];
	        to_return.push(result);
	      }
	    }
	    return to_return;
	  }
	}));


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var JEFRi, Transaction;

	JEFRi = __webpack_require__(12);

	Transaction = (function() {
	  function Transaction(spec, store) {
	    Object.assign(this, {
	      attributes: spec && spec.attributes ? spec.attributes : {},
	      store: store,
	      entities: spec instanceof Array ? spec : spec ? spec.entities ? spec.entities : [spec] : []
	    });
	  }

	  Transaction.prototype.encode = function() {
	    var entity, i, len, ref, transaction;
	    transaction = {
	      attributes: this.attributes,
	      entities: []
	    };
	    ref = this.entities;
	    for (i = 0, len = ref.length; i < len; i++) {
	      entity = ref[i];
	      transaction.entities.push(JEFRi.isEntity(entity) ? entity._encode() : entity);
	    }
	    return transaction;
	  };

	  Transaction.prototype.toString = function() {
	    return JSON.stringify(this.encode());
	  };

	  Transaction.prototype.get = function(store) {
	    if (store == null) {
	      store = this.store;
	    }
	    this.emit("getting", {});
	    store = store || this.store;
	    return store.execute('get', this).then(function() {
	      return resolve(this);
	    });
	  };

	  Transaction.prototype.persist = function(store) {
	    if (store == null) {
	      store = this.store;
	    }
	    this.emit("persisting", {});
	    return store.execute('persist', this).then((function(_this) {
	      return function(t) {
	        var entity, i, len, ref;
	        ref = t.entities;
	        for (i = 0, len = ref.length; i < len; i++) {
	          entity = ref[i];
	          entity.emit("persisted", {});
	        }
	        _this.emit("persisted", {});
	        return resolve(_this);
	      };
	    })(this));
	  };

	  Transaction.prototype.add = function(spec, force) {
	    var i, len, s;
	    if (force == null) {
	      force = false;
	    }
	    spec = Array.isArray(spec) ? spec : [].slice.call(arguments, 0);
	    for (i = 0, len = spec.length; i < len; i++) {
	      s = spec[i];
	      if (true) {
	        this.entities.push(s);
	      }
	    }
	    return this;
	  };

	  Transaction.prototype.attributes = function(attributes) {
	    Object.assign(this.attributes, c(attributes));
	    return this;
	  };

	  return Transaction;

	})();

	module.exports = Transaction;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var request;

	request = __webpack_require__(20);

	module.exports = function(uri) {
	  if (uri === "") {
	    return Promise()(true);
	  } else {
	    return request.get(uri);
	  }
	};

	module.exports.get = request.get;

	module.exports.post = request.post;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(size){
		var array = new Uint8Array(size);
		window.crypto.getRandomValues(array);
		return [].slice.call(array)[0];
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var EntityArray, Eventer, JEFRi, jiffies;

	jiffies = __webpack_require__(5);

	Eventer = jiffies.Event;

	JEFRi = __webpack_require__(12);

	module.exports = EntityArray = function(entity1, field, relationship) {
	  this.entity = entity1;
	  this.field = field;
	  this.relationship = relationship;
	};

	EntityArray.ADD = 'Add';

	EntityArray.REMOVE = 'Remove';

	EntityArray.prototype = Object.create(Array.prototype);

	Object.keys(Eventer.prototype).forEach(function(key) {
	  return EntityArray.prototype[key] = Eventer.prototype[key];
	});

	EntityArray.prototype.remove = function(entity) {
	  var e, i;
	  if (entity === null) {
	    return;
	  }
	  i = this.length - 1;
	  while (i >= 0) {
	    if (this[i]._compare(entity)) {
	      if (this.relationship.back) {
	        e = this[i];
	        try {
	          e[this.relationship.back].remove(this);
	        } catch (_error) {
	          e[this.relationship.back] = null;
	        }
	      }
	      this.splice(i, 1);
	    }
	    i--;
	  }
	  this.emit(EntityArray.REMOVE, entity);
	  return this;
	};

	EntityArray.prototype.add = function(entity) {
	  var found;
	  found = null;
	  this.entity._relationships[this.field].forEach(function(other) {
	    if (found != null) {
	      return;
	    }
	    if (JEFRi.EntityComparator(entity, other)) {
	      return found = other;
	    }
	  });
	  if (found == null) {
	    this.entity._relationships[this.field].push(entity);
	    if (this.relationship.back) {
	      entity[this.relationship.back] = this.entity;
	    }
	  }
	  this.emit(EntityArray.ADD, entity);
	  return this.entity;
	};


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        len = arguments.length;
	        args = new Array(len - 1);
	        for (i = 1; i < len; i++)
	          args[i - 1] = arguments[i];
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    len = arguments.length;
	    args = new Array(len - 1);
	    for (i = 1; i < len; i++)
	      args[i - 1] = arguments[i];

	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    var m;
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  var ret;
	  if (!emitter._events || !emitter._events[type])
	    ret = 0;
	  else if (isFunction(emitter._events[type]))
	    ret = 1;
	  else
	    ret = emitter._events[type].length;
	  return ret;
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate) {(function(root) {

		// Use polyfill for setImmediate for performance gains
		var asap = (typeof setImmediate === 'function' && setImmediate) ||
			function(fn) { setTimeout(fn, 1); };

		// Polyfill for Function.prototype.bind
		function bind(fn, thisArg) {
			return function() {
				fn.apply(thisArg, arguments);
			}
		}

		var isArray = Array.isArray || function(value) { return Object.prototype.toString.call(value) === "[object Array]" };

		function Promise(fn) {
			if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
			if (typeof fn !== 'function') throw new TypeError('not a function');
			this._state = null;
			this._value = null;
			this._deferreds = []

			doResolve(fn, bind(resolve, this), bind(reject, this))
		}

		function handle(deferred) {
			var me = this;
			if (this._state === null) {
				this._deferreds.push(deferred);
				return
			}
			asap(function() {
				var cb = me._state ? deferred.onFulfilled : deferred.onRejected
				if (cb === null) {
					(me._state ? deferred.resolve : deferred.reject)(me._value);
					return;
				}
				var ret;
				try {
					ret = cb(me._value);
				}
				catch (e) {
					deferred.reject(e);
					return;
				}
				deferred.resolve(ret);
			})
		}

		function resolve(newValue) {
			try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
				if (newValue === this) throw new TypeError('A promise cannot be resolved with itself.');
				if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
					var then = newValue.then;
					if (typeof then === 'function') {
						doResolve(bind(then, newValue), bind(resolve, this), bind(reject, this));
						return;
					}
				}
				this._state = true;
				this._value = newValue;
				finale.call(this);
			} catch (e) { reject.call(this, e); }
		}

		function reject(newValue) {
			this._state = false;
			this._value = newValue;
			finale.call(this);
		}

		function finale() {
			for (var i = 0, len = this._deferreds.length; i < len; i++) {
				handle.call(this, this._deferreds[i]);
			}
			this._deferreds = null;
		}

		function Handler(onFulfilled, onRejected, resolve, reject){
			this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
			this.onRejected = typeof onRejected === 'function' ? onRejected : null;
			this.resolve = resolve;
			this.reject = reject;
		}

		/**
		 * Take a potentially misbehaving resolver function and make sure
		 * onFulfilled and onRejected are only called once.
		 *
		 * Makes no guarantees about asynchrony.
		 */
		function doResolve(fn, onFulfilled, onRejected) {
			var done = false;
			try {
				fn(function (value) {
					if (done) return;
					done = true;
					onFulfilled(value);
				}, function (reason) {
					if (done) return;
					done = true;
					onRejected(reason);
				})
			} catch (ex) {
				if (done) return;
				done = true;
				onRejected(ex);
			}
		}

		Promise.prototype['catch'] = function (onRejected) {
			return this.then(null, onRejected);
		};

		Promise.prototype.then = function(onFulfilled, onRejected) {
			var me = this;
			return new Promise(function(resolve, reject) {
				handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject));
			})
		};

		Promise.all = function () {
			var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);

			return new Promise(function (resolve, reject) {
				if (args.length === 0) return resolve([]);
				var remaining = args.length;
				function res(i, val) {
					try {
						if (val && (typeof val === 'object' || typeof val === 'function')) {
							var then = val.then;
							if (typeof then === 'function') {
								then.call(val, function (val) { res(i, val) }, reject);
								return;
							}
						}
						args[i] = val;
						if (--remaining === 0) {
							resolve(args);
						}
					} catch (ex) {
						reject(ex);
					}
				}
				for (var i = 0; i < args.length; i++) {
					res(i, args[i]);
				}
			});
		};

		Promise.resolve = function (value) {
			if (value && typeof value === 'object' && value.constructor === Promise) {
				return value;
			}

			return new Promise(function (resolve) {
				resolve(value);
			});
		};

		Promise.reject = function (value) {
			return new Promise(function (resolve, reject) {
				reject(value);
			});
		};

		Promise.race = function (values) {
			return new Promise(function (resolve, reject) {
				for(var i = 0, len = values.length; i < len; i++) {
					values[i].then(resolve, reject);
				}
			});
		};

		/**
		 * Set the immediate function to execute callbacks
		 * @param fn {function} Function to execute
		 * @private
		 */
		Promise._setImmediateFn = function _setImmediateFn(fn) {
			asap = fn;
		};

		if (typeof module !== 'undefined' && module.exports) {
			module.exports = Promise;
		} else if (!root.Promise) {
			root.Promise = Promise;
		}

	})(this);
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(21).setImmediate))

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var Promise, ajax,
	  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	Promise = __webpack_require__(10);

	ajax = function(options) {
	  var XHR, promise, xhr;
	  XHR = window.ActiveXObject || XMLHttpRequest;
	  xhr = new XHR('Microsoft.XMLHTTP');
	  xhr.open(options.type || (options.data ? 'POST' : 'GET'), options.url, true);
	  if (indexOf.call(xhr, 'overrideMimeType') >= 0) {
	    xhr.overrideMimeType(options.dataType || 'text/plain');
	  }
	  promise = new Promise(function(resolve, reject) {
	    return xhr.onreadystatechange = function() {
	      var _ref, resolution;
	      if (xhr.readyState === 4) {
	        if ((_ref = xhr.status) === 0 || _ref === 200) {
	          resolution = xhr.responseText;
	          if (options.dataType === "application/json") {
	            resolution = JSON.parse(resolution);
	          }
	          resolve(resolution);
	        } else {
	          reject(new Error("Could not load " + options.url));
	        }
	      }
	    };
	  });
	  if (options.data) {
	    xhr.setRequestHeader("Content-type", options.dataType || "application/x-www-form-urlencoded");
	  }
	  xhr.send(options.data || null);
	  return promise;
	};

	module.exports = {
	  get: function(url, options) {
	    options = options || {};
	    options.url = url;
	    options.type = 'GET';
	    options.data = null;
	    return ajax(options);
	  },
	  post: function(url, options) {
	    options = options || {};
	    options.url = url;
	    options.type = 'POST';
	    return ajax(options);
	  }
	};


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(22).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

	  immediateIds[id] = true;

	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });

	  return id;
	};

	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(21).setImmediate, __webpack_require__(21).clearImmediate))

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    draining = true;
	    var currentQueue;
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        var i = -1;
	        while (++i < len) {
	            currentQueue[i]();
	        }
	        len = queue.length;
	    }
	    draining = false;
	}
	process.nextTick = function (fun) {
	    queue.push(fun);
	    if (!draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }
/******/ ]);