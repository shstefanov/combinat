
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
    for(var i=0;i<this.objects.length;i++){
      var object = this.objects[i];
      object[method].apply(object, arguments);
    }
  }
}

var deleteProperty = function(string, target){ // remove - true/false
  var parts = string.split("."), t = target, last = parts.pop();
  for(var i=0;i<parts.length;i++) {
    t = t[parts[i]];
  }
  delete t[last];
}

var updateProperty = function(string, target, val){ // remove - true/false
  var parts = string.split("."), t = target, last = parts.pop();
  for(var i=0;i<parts.length;i++) {
    t = t[parts[i]];
  }
  t[last] = val;
}

Wrapper.prototype.setProperties = function(obj){
  for(var i=0;i<this.objects.length;i++){
    for(var key in obj){
      updateProperty(key, this.objects[i], obj[key]);
    }
  }
}

Wrapper.prototype.unsetProperties = function(obj_arr){
  if(typeof obj_arr === "string") obj_arr = [obj_arr];
  for(var i=0;i<this.objects.length;i++){
    for(var j=0;j<obj_arr.length;j++){
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
}

var orig_has = Object.prototype.hasOwnProperty;
function has(obj, prop){return orig_has.call(obj, prop);};
Combinator.prototype.addObjects = function(type, objects){
  for(var i=0;i<objects.length;i++) this.addObject(type, objects[i]);
}
Combinator.prototype.addObject = function(type){ // just object with types
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
  else{
    var args = Array.prototype.slice.call(arguments, 1);
    if(Array.isArray(args[0])){
      for(var i=0;i<args.length;i++) this.addObject.apply(this, [type].concat(args[i]));
      return;
    }
    var main_obj = args[0];
    if(!this._types[type]) throw new Error("Unknown type: "+type);
    var index = this._types[type].add.apply(this, args);
    if(typeof index==="number" || typeof index === "string"){
      var sheaf = this.store[index];
      if(!sheaf) {
        sheaf = this.store[index] = new Sheaf(this._types, {combinator: this});
        this.trigger("add", sheaf, index);
      }
      sheaf[type].addObject(main_obj);
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
      }
    }
    else{
      if(index){
        var sheaf = this.store[index];
        if(sheaf) sheaf[type].addObject(main_obj);
        else {
          sheaf = this.store[index] = new Sheaf(this._types, {combinator: this});
          this.trigger("add", sheaf, index);
          sheaf[type].addObject(main_obj);
        }
      }
    }
  }
  return this;
}

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

Combinator.prototype.onEmpty = function(){};
Combinator.prototype.onNew   = function(){};

Combinator.prototype.invoke = function(type, method, args){

}

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

