if you are using browserify you need to import the module
```
import Router from 'frontend-router';
```
if you are not, window.Router will contain the module.
Lets construct a Router
```
var session = {};

var policies = {
  isLoggedIn: function(req) {
    if (session.user) {
      return Promise.resolve();
    } else {
      return Promise.reject("Not logged in.");
    }
  }
};

var controllers = {
  UserController: {
    details: function (req) {
      return new Promise(resolve => {
        setTimeout(function () {
          req.sync({
            model: {
              id: 'synced-mock',
              firstName: 'synced-mock'
            }
          });
        }, 2000);

        resolve({
          model: {
            id: 'mock',
            firstName: 'mock'
          }
        });
      });
    },
    list: function (req) {
      return new Promise(resolve => {
        setTimeout(function () {
          req.sync({
            collection: [{
              id: 'synced-mock',
              firstName: 'synced-mock'
            }]
          });
        }, 2000);

        resolve({
          collection: [{
            id: 'mock',
            firstName: 'mock'
          }]
        })
      });
    }
  }
};

var routes = {
  '/users': {
    controller: 'UserController.list'
  },
  '/user/:id': {
    policies: ['isLoggedIn'],
    controller: 'UserController.details'
  },
};

var router = Router({
  pushState: false,

  routes: routes,
  controllers: controllers,
  policies: policies,

  success: function (route, data) {
    // executed after a succesful route
    // route is the route (object) that was executed
    // data is the data retrieved from the controller
    // here you would render a view
    console.log('success', route, data);
  },

  fail: function (route, data) {
    // executed after a failed route
    // route is the route (object) that was executed
    // data contains two properties
    //   1. 'reason', either 'controller' or 'policy', the thing that caused the failure
    //   2. 'data', the data the controller / policy failed with
    console.log('fail', route, data);
  },

  sync: function (route, data) {
    // executed after a failed route
    // route is the route this req.sync is part of
    // data is the argument req.sync was called with
    // here you would propagate changes to your view
    console.log('sync', route, data);
  }

});
```

if you specify any properties that are not part of the spec, they become available under the options property.
When putting extra properties on routes they are available on the route object itself, for example:
```
var router = Router({
  ...
  routes: {
    '/users': {
      ...
      view: 'someView'
      ...
    },
  },
  ...
  succes: function (route, data) {
    route.view; // 'someView' if routing to '/users'
  }
});
```