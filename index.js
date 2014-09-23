
function amap(arr, iterator, cb){
  if(arr.length===0) return cb(null, arr);
  var results = new Array(arr.length), counter = arr.length, error;
  arr.forEach(function(el, idx, arr){
    setTimeout(function(){
      iterator(el, function(err, result){
        if(error === true) return;
        if(err){error = true; return cb(err);}
        results[idx] = result;
        counter--;
        if(counter===0) cb(null, results);
      });
    }, 0);
  });
}

var Events = {
  on: function(event, handler){
    if(this.events[event]) this.events[event].push(handler);
    else this.events[event] = [handler];
  },

  once: function(event, handler){
    var self = this;
    var once = function(){
      setTimeout(function(){
        for(var i=0;i<self.events[event].length;i++){
          if(self.events[event][i]===once){
            self.events[event].splice(i,1);
            return;
          }
        }
      }, 0);
      handler.apply(self, arguments);
    };
    if(this.events[event]) this.events[event].push(once);
    else this.events[event] = [once];
  },

  off: function(event, handler){
    if(!handler) delete this.events[event];
    else{
      for(var i=0;i<this.events[events].length;i++){
        if(this.events[events][i]===hanfler) {
          this.events[event].splice(i,1);
          return this;
        }
      }
    }
  },

  trigger: function(event){
    var args = Array.prototype.slice.call(arguments, 1);
    if(this.events[event]){
      for(var i=0;i<this.events[event].length;i++){
        (function(i, self){
          setTimeout(function(){ self.events[event][i].apply(self, args); }, 0);
        })(i, this);
      }
    }
  }
}





var hasCallback = function(args){
  for(var i=0;i<args.length;i++){
    if(typeof args[i]==="function" && typeof args[i].combinat_callback === "function"){
      return true;
    }
  }
  return false;
}


function Wrapper(type){
  this.objects = [];
  this.attributes = {};
  this.createMethods(type.methods || []);
}

Wrapper.prototype.createMethods = function(methods){
  for(var i=0; i<methods.length; i++)
    this.createMethod(methods[i]);
}

Wrapper.prototype.createMethod = function(method){
  this[method] = function(){
    var args;
    if(hasCallback(arguments)) args = replaceCallback(arguments);
    for(var i=0;i<this.objects.length;i++){
      var object = this.objects[i];
      object[method].apply(object, args || arguments);
    }
  }
}

Wrapper.prototype.amap = function(iterator, cb){
  amap(this.objects, iterator, cb);
}

Wrapper.prototype.amapMethod = function(){
  var args = Array.prototype.slice.call(arguments);
  var cb = args.pop();
  var method = args.shift();
  amap(this.objects, function(obj, cb){
    obj[method].apply(obj, args.concat([cb]));
  }, cb);
}


var deleteProperty = function(string, target){
  var parts = string.split("."), t = target, last = parts.pop();
  for(var i=0;i<parts.length;i++) {
    t = t[parts[i]];
  }
  delete t[last];
}

var deletePropertySafe = function(string, target){ // remove - true/false
  var parts = string.split("."), t = target, last = parts.pop();
  for(var i=0;i<parts.length;i++) {
    if(!t[parts[i]]) return;
    t = t[parts[i]];
  }
  delete t[last];
}

var updatePropertySafe = function(string, target, val){ // remove - true/false
  var parts = string.split("."), t = target, last = parts.pop();
  for(var i=0;i<parts.length;i++) {
    if(!t[parts[i]]) t[parts[i]] = {};
    t = t[parts[i]];
  }
  t[last] = val;
}

var updateProperty = function(string, target, val){ // remove - true/false
  var parts = string.split("."), t = target, last = parts.pop();
  for(var i=0;i<parts.length;i++) {
    t = t[parts[i]];
  }
  t[last] = val;
}

Wrapper.prototype.setProperties = function(obj){
  for(var key in obj){
    updatePropertySafe(key, this.attributes, obj[key]);
    for(var i=0;i<this.objects.length;i++){
      updateProperty(key, this.objects[i], obj[key]);
    }
  }
}

Wrapper.prototype.unsetProperties = function(obj_arr){
  if(typeof obj_arr === "string") obj_arr = [obj_arr];
  for(var j=0;j<obj_arr.length;j++){
    deletePropertySafe(obj_arr[j], this.attributes);
    for(var i=0;i<this.objects.length;i++){
      deleteProperty(obj_arr[j], this.objects[i]);
    }
  }
}

Wrapper.prototype.addObject = function(obj){ this.objects.push(obj); }

Wrapper.prototype.removeObject = function(obj){ 
  for (var i = 0; i < this.objects.length; i++) {
    if(this.objects[i] === obj) {
      this.objects.splice(i,1);
      return this;
    }
  }
}






function Sheaf(types){
  for(var key in types) this[key] = new Wrapper(types[key]);
  this.events = {};
}

Sheaf.prototype.addObject = function(type, obj){
  if(this[type]) this.type.add(obj);
}

Sheaf.prototype.on      = Events.on;
Sheaf.prototype.once    = Events.once;
Sheaf.prototype.off     = Events.off;
Sheaf.prototype.trigger = Events.trigger;




function Combinator(types, options){
  for(var key in types) this[key] = new Wrapper(types[key]);
  this._types = types;
  this.store = {}; // Stored by id
  this.events = {};
  if(options && options.ready) this.checkReady = options.ready;
}

var orig_has = Object.prototype.hasOwnProperty;
function has(obj, prop){return orig_has.call(obj, prop);};
Combinator.prototype.addObjects = function(type, objects){
  if(Array.isArray(type)) {
    for(var i=0;i<types.length;i++) this.addObject(type[i]);
    return this;
  }
  else if(typeof type === "object") {
    for(var key in type) {
      if(Array.isArray(type[key])) this.addObjects(key, type[key]);
      else this.addObject(key, type[key]);
    }
    return this;
  }
  else if(Array.isArray(objects)){
    if(Array.isArray(objects[0]))
      for(var i=0;i<objects.length;i++) this.addObject.apply(this, [type].concat(objects[i]));
    else
      for(var i=0;i<objects.length;i++) this.addObject(type, objects[i]);
  }
}

Combinator.prototype.addObject = function(type){ // just object with types
  
  var args = Array.prototype.slice.call(arguments, 1);
  var main_obj = args[0];
  if(!this._types[type]) throw new Error("Unknown type: "+type);
  var index = this._types[type].add.apply(this, args);
  var init  = this._types[type].initialize;
  var ready = this.checkReady;
  if(typeof index==="number" || typeof index === "string"){
    var sheaf = this.store[index];
    if(!sheaf) {
      sheaf = this.store[index] = new Sheaf(this._types, {combinator: this});
      this.trigger("add", sheaf, index);
    }
    sheaf[type].addObject(main_obj);
    init && init.call(main_obj, main_obj, sheaf);
    if(ready && !sheaf.ready){
      if(ready(sheaf)){
        this.trigger("ready", sheaf)
        sheaf.ready = true;
      }
    }
  }
  else if(Array.isArray(index)){
    for(var i=0;i<index.length;i++){
      var ind = index[i];
      var sheaf = this.store[ind];
      if(sheaf) sheaf[type].addObject(main_obj);
      else {
        sheaf = this.store[ind] = new Sheaf(this._types, {combinator: this});
        this.trigger("add", sheaf, ind);
        sheaf[type].addObject(main_obj);
      }
      init && init.call(main_obj, main_obj, sheaf);
      if(ready && !sheaf.ready){
        if(ready(sheaf)){
          this.trigger("ready", sheaf)
          sheaf.ready = true;
        }
      }
    }
  }
}

// !! Should be static method !!
Combinator.prototype.createArray = function(list){
  return Array.prototype.slice.call(list);
}

Combinator.prototype.remove = function(id){
  var sheaf = this.store[id];
  if(sheaf){
    delete this.store[id];
    this.trigger("remove", sheaf, id);
  }
}

Combinator.prototype.on      = Events.on;
Combinator.prototype.once    = Events.once;
Combinator.prototype.off     = Events.off;
Combinator.prototype.trigger = Events.trigger;

Combinator.prototype.fire = function(event){
  for(var key in this.store){
    (function(sheaf){
      setTimeout(function(){ sheaf.trigger.apply(sheaf, arguments); }, 0);
    })(this.store[key]);
  }
}

Combinator.prototype.get = function(id){
  return this.store[id];
};


Combinator.prototype.createCallback = function(fn){
  fn.combinat_callback = function(){
    this.counter--;
    if(this.counter===0){
      delete this.counter;
      fn.apply(this, arguments);
    }

  }
}

.combinat_callback === true

Combinator.prototype.invokeAsync = function(type, method, args, cb){

}


try{
  module.exports = Combinator;
}
catch(err){
  try{
    window.Combinator = Combinator;
  }
  catch(error){
    setTimeout(function(){
      throw error;
    }, 0);
    throw err;
  }
}

