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

	
	JEFRi.Stores = module.exports = {
		ObjectStore: __webpack_require__(1),
		CouchStore: __webpack_require__(2),
		PostStore: __webpack_require__(3),
		LocalStore: __webpack_require__(4)
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var ObjectStore, jiffies,
	  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	  hasProp = {}.hasOwnProperty;

	jiffies = __webpack_require__(5);

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
	    var promise;
	    transaction = _transactify(transaction);
	    this.emit("sending", transaction);
	    this["do_" + type](transaction);
	    this.settings.runtime.expand(transaction);
	    promise = jiffies.promise();
	    promise(true, transaction);
	    return promise;
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
	    var def, end, entity, give, i, id, j, l, len, len1, m, name, property, ref, ref1, ref2, related, relationship, results, take;
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
	        for (i in results) {
	          entity = results[i];
	          related = (function(_this) {
	            return function() {
	              var relspec;
	              relspec = Object.assign({}, spec[name], {
	                _type: relationship.to.type
	              });
	              relspec[relationship.to.property] = entity[relationship.property];
	              return _this._lookup(relspec) || [];
	            };
	          })(this)();
	          if (related.length) {
	            give.push(related);
	          }
	        }
	        take.reverse();
	        for (m = 0, len1 = take.length; m < len1; m++) {
	          i = take[m];
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

	__webpack_require__(6);

	module.exports = {
		Event: __webpack_require__(10),
		lock: __webpack_require__(7),
		promise: __webpack_require__(8),
		request: __webpack_require__(11),
		UUID: __webpack_require__(9)
	};

	if(typeof window == 'object' && window !== null){
		window.jiffies = module.exports;
	}

/***/ },
/* 6 */
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
/* 7 */
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
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module, setImmediate, process) {(function(target) {
		var undef;

		function defer(callback) {
			if (typeof setImmediate != 'undefined')
				setImmediate(callback);
			else if (typeof process != 'undefined' && process['nextTick'])
				process['nextTick'](callback);
			else
				setTimeout(callback, 0);
		}

		target[0][target[1]] = function pinkySwear(extend) {
			var state;			// undefined/null = pending, true = fulfilled, false = rejected
			var values = [];	// an array of values as arguments for the then() handlers
			var deferred = [];	// functions to call when set() is invoked

			var set = function(newState, newValues) {
				if (state == null && newState != null) {
					state = newState;
					if(Array.isArray(newValues)){
						values = newValues;
					} else {
						values = [newValues];
					}
					if (deferred.length){
						defer(function() {
							for (var i = 0; i < deferred.length; i++)
								deferred[i]();
						});
					}
				}
				return state;
			};

			set['then'] = function (onFulfilled, onRejected) {
				var promise2 = pinkySwear(extend);
				var callCallbacks = function() {
					try {
						var f = (state ? onFulfilled : onRejected);
						if (Function.isFunction(f)) {
							resolve(f.apply(undef, values || []));
						} else {
							promise2(state, values);
						}
					} catch (e) {
						promise2(false, [e]);
					}
				};
				if (state != null) {
					defer(callCallbacks);
				} else {
					deferred.push(callCallbacks);
				}
				return promise2;

				function resolve(x) {
					var then, cbCalled = 0;
					try {
						if (x && Function.isFunction(then = x['then'])) {
							if (x === promise2){
								throw new TypeError();
							}
							then['call'](x, pass, fail);
						} else {
							promise2(true, arguments);
						}
					} catch(e) {
						if (!cbCalled++) {
							promise2(false, [e]);
						}
					}
					function pass(){ if (!cbCalled++) resolve.apply(undef, arguments); }
					function fail(value){ if (!cbCalled++) promise2(false, [value]); }
				}
			};

			set['catch'] = function (onRejected){
				return set['then'](function(){}, onRejected);
			};

			set['finally'] = function(afterPromise){
				return set['catch'](function(){return null;})['then'](afterPromise);
			};

			set['done'] = function(afterPromise, onRejected){
				return null;
			};

			if(extend){
				set = extend(set);
			}
			return set;
		};
	})(false ? [window, 'promise'] : [module, 'exports']);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(16)(module), __webpack_require__(13).setImmediate, __webpack_require__(15)))

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var UUID = {};
	module.exports = UUID;

	UUID.rvalid = /^\{?[0-9a-f]{8}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{12}\}?$/i;

	var random = __webpack_require__(12);

	UUID.v4 = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = random(1)&0x0f, v = c === 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	};


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var EventDispatcher;

	module.exports = EventDispatcher = function() {};

	EventDispatcher.prototype = {
	  on: function(event, fn) {
	    var listeners;
	    if (this._listeners == null) {
	      this._listeners = {};
	    }
	    listeners = this._listeners;
	    if (listeners[event] == null) {
	      listeners[event] = [];
	    }
	    if (!listeners[event].includes(fn)) {
	      return listeners[event].push(fn);
	    }
	  },
	  off: function(event, fn) {
	    var index, listeners;
	    if (this._listeners == null) {
	      return;
	    }
	    listeners = this._listeners;
	    index = listeners[event].indexOf(fn);
	    if (index !== -1) {
	      return listeners[event].splice(index, 1);
	    }
	  },
	  emit: function(event, args) {
	    var i, len, listener, listenerArray, listeners, results;
	    if (this._listeners == null) {
	      return;
	    }
	    listeners = this._listeners;
	    listenerArray = listeners[event];
	    if (listenerArray != null) {
	      event.target = this;
	      results = [];
	      for (i = 0, len = listenerArray.length; i < len; i++) {
	        listener = listenerArray[i];
	        results.push(listener.call(this, event));
	      }
	      return results;
	    }
	  }
	};


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var request;

	request = __webpack_require__(14);

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
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(size){
		var array = new Uint8Array(size);
		window.crypto.getRandomValues(array);
		return [].slice.call(array)[0];
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(15).nextTick;
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
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13).setImmediate, __webpack_require__(13).clearImmediate))

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var Promise, ajax,
	  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	Promise = __webpack_require__(8);

	ajax = function(options) {
	  var XHR, promise, xhr;
	  promise = Promise();
	  XHR = window.ActiveXObject || XMLHttpRequest;
	  xhr = new XHR('Microsoft.XMLHTTP');
	  xhr.open(options.type || (options.data ? 'POST' : 'GET'), options.url, true);
	  if (indexOf.call(xhr, 'overrideMimeType') >= 0) {
	    xhr.overrideMimeType(options.dataType || 'text/plain');
	  }
	  xhr.onreadystatechange = function() {
	    var _ref, resolution;
	    if (xhr.readyState === 4) {
	      if ((_ref = xhr.status) === 0 || _ref === 200) {
	        resolution = xhr.responseText;
	        if (options.dataType === "application/json") {
	          resolution = JSON.parse(resolution);
	        }
	        promise(true, resolution);
	      } else {
	        promise(false, new Error("Could not load " + options.url));
	      }
	    }
	  };
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
/* 15 */
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


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ }
/******/ ]);