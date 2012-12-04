var Sources = new Meteor.Collection("sources");
var Localizations = new Meteor.Collection("localizations");

if (Meteor.isClient) {
  ////////// Helpers for in-place editing //////////

  // https://github.com/meteor/meteor/blob/master/examples/todos/client/todos.js
  // Returns an event map that handles the "escape" and "return" keys and
  // "blur" events on a text input (given by selector) and interprets them
  // as "ok" or "cancel".
  var okCancelEvents = function (selector, callbacks) {
    var ok = callbacks.ok || function () {};
    var cancel = callbacks.cancel || function () {};

    var events = {};
    events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
      function (evt) {
        if (evt.type === "keydown" && evt.which === 27) {
          // escape = cancel
          cancel.call(this, evt);

        } else if (evt.type === "keyup" && evt.which === 13 
                                        && !evt.shiftKey ||
                   evt.type === "focusout") {
          // blur/return/enter = ok/submit if non-empty
          var value = String(evt.target.value || "");
          if (value)
            ok.call(this, value, evt);
          else
            cancel.call(this, evt);
        }
      };
    return events;
  };
  
  Session.set("locale", null);

  Template.moduleTable.strings = function() {
    var source = this;
    var locale = Session.get("locale");
    var strings = [];
    var localization = Localizations.findOne({
      locale: locale,
      id: source.id
    }) || {};
    Object.keys(source.root).forEach(function(key) {
      var help = "";
      if (source.metadata && key in source.metadata)
        help = source.metadata[key].help || "";
      strings.push({
        key: key,
        rootValue: source.root[key],
        localizedValue: localization[key] || "",
        help: help
      });
    });
    return strings;
  };

  Template.main.modules = function() {
    return Sources.find({}).fetch();
  };
  
  Template.main.locale = function() {
    return Session.get("locale");
  };
  
  var GhettoRouter = Backbone.Router.extend({
    routes: {
      ":locale": "locale",
      "": "home"
    },
    home: function() {
      Session.set("locale", null);
    },
    locale: function(locale) {
      locale = locale.toLowerCase();
      Session.set("locale", locale);
    }
  });
  
  var Router = new GhettoRouter();
  
  Meteor.startup(function() {
    Backbone.history.start({pushState: true});
    Meteor.subscribe("sources");
    Meteor.autosubscribe(function() {
      var locale = Session.get("locale");
      if (locale)
        Meteor.subscribe("locale", locale);
    });
    window.addEventListener("click", function(event) {
      if (event.target.nodeName == "A") {
        var href = event.target.getAttribute("href");
        if (href && href[0] == "/") {
          event.preventDefault();
          Router.navigate(href.slice(1), true);
        }
      }
    }, true);
  });
}

if (Meteor.isServer) {
  __meteor_bootstrap__.app.use(function(req, res, next) {
    if (req.method == "POST" && req.url == "/sources") {
      var data = [];
      req.setEncoding('utf8');
      req.on('data', function(chunk) {
        data.push(chunk);
      });
      req.on('end', function() {
        var sources = JSON.parse(data.join(''));
        Fiber(function() {
          Object.keys(sources).forEach(function(id) {
            // Really wish Meteor supported upsert right now.
            var item = Sources.findOne({id: id});
            sources[id].id = id;
            if (!item)
              Sources.insert(sources[id]);
            Sources.update({id: id}, sources[id]);
          });
          res.writeHead(200);
          res.end('thanks');
        }).run();
      });
      return;
    }
    next();
  });
  
  Meteor.publish("locale", function(locale) {
    return Localizations.find({locale: locale});
  });
  
  Meteor.publish("sources", function() {
    return Sources.find({});
  });
  
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
