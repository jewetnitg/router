/**
 * @author rik
 */
import _ from 'lodash';
import Grapnel from 'grapnel';

import securityMiddlewareFactory from './middleware/security';
import successMiddlewareFactory from './middleware/success';
import dataMiddlewareFactory from './middleware/data';
import RouterValidator from '../validators/Router';
import View from 'frontend-view';
import MiddlewareRunner from './MiddlewareRunner';
import DataResponseFactoryFactory from './DataResponseFactory';
import StaticView from './StaticView';

/**
 * The Router factory / class, responsible for creating a Router.
 *
 * @class Router
 *
 * @param options {Object}
 *
 * @property middleware {Object<Object<Function>>} Hashmap containing security and data middleware
 * @property routes {Object<Object>} Hashmap containing routes
 * @property success {Function} Function that gets executed when a route has successfully executed
 * @property fail {Function} Function that gets executed when a route has failed to execute successfully
 * @property sync {Function} Function that gets executed when a controller syncs
 * @property {String} [anchorSelector='a[href^="/"]:not([href^="//"])'] - jQuery selector that represents all anchors that should be event.preventDefault()'ed and use the router to navigate instead
 * @property error {String} Reference to a route, route that should be shown when an error has occurred
 * @property unauthorized {String} Reference to a route, route that should be shown when security for a route failed
 *
 * @property pushState {Boolean} Grapnel pushState option
 * @property root {Boolean} Grapnel root option
 * @property env {Boolean} Grapnel env option
 * @property mode {Boolean} Grapnel mode option
 * @property hashBang {Boolean} Grapnel hashBang option
 *
 * @todo implement static views
 *
 * @example
 * const router = Router({
 *   pushState: true,
 *   views: {},
 *   routes: {
 *     '/testReject': {
 *       controller: 'test.test'
 *     }
 *   },
 *   '/onlyIfLoggedIn': {
 *       security: ['user.isLoggedIn'],
 *       data: ['user.ensure']
 *     }
 *   },
 *   middleware: {
 *     security: {
 *       user: {
 *         isLoggedIn: function(req) {
 *           return req.session.user ? Promise.resolve() : Promise.reject();
 *         }
 *       }
 *     },
 *     data: {
 *       user: {
 *         ensure: function (req, res) {
 *           res.user = res.user || {
 *             name: 'bob'
 *           };
 *         }
 *       }
 *     }
 *   }
 * });
 *
 */
function Router(options = {}) {
  _.merge(options, Router.defaults, options);

  RouterValidator.construct(options);

  const props = {
    /**
     * The options as passed into the factory
     *
     * @name options
     * @memberof Router
     * @instance
     * @type Object
     */
    options: {
      value: options
    },
    views: {
      value: {}
    },
    staticViews: {
      value: {}
    },
    unauthorized: {
      value: options.unauthorized
    },
    error: {
      value: options.error
    }
  };

  const router = Object.create(Router.prototype, props);
  router.middleware = MiddlewareRunner({
    security: {
      middleware: options.middleware.security
    },
    data: {
      res: true,
      resFactory: DataResponseFactoryFactory(router),
      middleware: options.middleware.data
    }
  });

  // @todo research if this is necessary
  makeAnchorDOMElementsUseRouterNavigate(router, options.anchorSelector);

  /**
   * An instance of the Grapnel router, responsible for actual routing
   *
   * @name grapnel
   * @memberof Router
   * @instance
   * @type Object
   */
  router.grapnel = constructGrapnelRouter(options, router);
  constructStaticViews.call(router);
  return router;
}

/**
 * Default properties for objects passed into the Router factory,
 * gets merged (deeply) with the options passed in.
 *
 * @name defaults
 * @memberof Router
 * @static
 * @type Object
 * @property {Object<Function>} [middleware={}] Middleware specified as a hashmap
 */
Router.defaults = {
  middleware: {}
};

/**
 * {@link View} factory
 * @type Function
 * @param options {Object} properties for a {@link View}, see the {@link View} documentation.
 */
Router.View = View;

// @todo implement
Router.StaticView = StaticView;

/**
 * Default properties for route objects, gets merged (deeply) with the routes.
 *
 * @name routeDefaults
 * @memberof Router
 * @static
 * @type Object
 * @default {}
 */
Router.routeDefaults = {};

Router.prototype = {

  success(route, data = {}) {
    const view = ensureViewForRoute.call(this, route);

    if (this.currentView && this.currentView !== view) {
      this.currentView.hide();
    }

    this.currentRoute = route;
    this.currentView = view;

    view.render(data);
    renderStaticViews.call(this, route.staticViews, data);

    // for render server
    if (window._onRouterReady) {
      window._onRouterReady();
      delete window._onRouterReady;
    }
  },

  sync(data = {}) {
    if (!this.currentRoute) {
      throw new Error(`Can't sync data, no current route.`);
    }

    if (!this.currentView) {
      throw new Error(`Can't sync data, no current route.`);
    }

    this.currentView.sync(data);
    renderStaticViews.call(this, this.currentRoute.staticViews, data);
  },

  fail(route, data) {
    switch (data.reason) {
      case 'security':
        console.log('security failed for route', route, data);
        break;
      case 'data':
        console.log('data failed for route', route, data);
        break;
    }
  },

  /**
   * Navigates to a url
   *
   * @method navigate
   * @memberof Router
   * @instance
   *
   * @param url {String} Url to navigate to
   * @param {Object} [options] - Object containing the properties listed below
   *
   * @property [trigger=true] {Boolean} - Indicates a route event should be triggered, so the route gets executed
   * @property [replace=false] {Boolean} - Indicates the history item should be replaced
   *
   * @todo add a data param so that urls can contains splats that will be filled with the data, use Router#makeUrl
   * @example
   * // regular navigate
   * router.navigate('/user/3');
   * // replace the history item
   * router.navigate('/user/6', {
   *   replace: true
   * });
   * // dont trigger event, route won't be handled
   * router.navigate('/user/6', {
   *   trigger: false
   * });
   */
  navigate(url, options = {}) {
    _.defaults(options, {
      trigger: true,
      replace: false
    });

    if (!options.trigger) {
      if (options.replace) {
        replaceNavigate(this.grapnel, url);
      } else {
        this.grapnel.show(url);
      }
    } else {
      if (options.replace) {
        replaceNavigate(this.grapnel, url);
        this.reload();
      } else {
        this.grapnel.navigate(url);
      }
    }
  },

  /**
   * Reloads the current page without actually reloading
   *
   * @method reload
   * @memberof Router
   * @instance
   * @example
   * route.reload();
   */
  reload() {
    const event = this.grapnel.options.mode === 'pushState' ? 'navigate' : 'hashchange';
    this.grapnel.trigger(event);
  },

  /**
   * Redirects to a url, replaces the current history item.
   *
   * @method redirect
   * @memberof Router
   * @instance
   *
   * @param url {String} Url to redirect to
   *
   * @todo add a data param so that urls an contains splats that will be filled with the data, use Router#makeUrl
   * @example
   * router.redirect('/user/5');
   */
  redirect(url) {
    this.navigate(url, {
      replace: true
    });
  },

  /**
   * Fills a routes splats with the data provided
   *
   * @param route {String} The route to fill with data, /user/:id for example
   * @param data {Object} The data to fill the route with, {id: 3} for example
   *
   * @returns String
   *
   * @todo implement
   *
   * @example
   * < router.makeUrl('/user/:id', { id: 3 });
   * > "/user/3";
   */
  makeUrl(route, data) {
    throw new Error(`makeUrl is not implemented yet`);
  },

  /**
   * Runs one or more security middleware with data.
   *
   * @param middleware {String|Array<String>} Middleware(s) to execute
   * @param {Object} [data={}] - Data to pass to the middleware as parameters
   *
   * @returns {Promise} Promise that resolves if the middleware executed successfully, and rejects if it doesn't
   * @example
   * router.security('user.isLoggedIn')
   *   .then(
   *     () => {...}, // logged in
   *     () => {...} // NOT logged in
   *   );
   */
  security(middleware = [], data = {}) {
    return this.middleware.security.run(middleware, data);
  },

  /**
   * Runs one or more data middleware with data.
   *
   * @param middleware {String|Array<String>} Middleware(s) to execute
   * @param {Object} [data={}] - Data to pass to the middleware as parameters
   *
   * @returns {Promise} Promise that resolves if the middleware executed successfully, and rejects if it doesn't
   * @example
   * router.data('user.ensure')
   *   .then(...);
   */
  data(middleware = [], data = {}) {
    return this.middleware.data.run(middleware, data);
  }

};

Router.staticViews = {};

// @todo research if this is necessary
function makeAnchorDOMElementsUseRouterNavigate(router, anchorSelector) {
  const elements = document.querySelectorAll(anchorSelector || 'a[href^="/"]:not([href^="//"])');

  _.each(elements, element => {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      const url = e.target.href;
      router.navigate(url);
    });
  });
}

// originally taken from Grapnel.fragment.set, changed to replace the current history item instead of adding to the history
function replaceNavigate(grapnel, frag) {
  if (grapnel.options.mode === 'pushState') {
    frag = (grapnel.options.root) ? (grapnel.options.root + frag) : frag;
    window.history.replaceState({}, "", frag);
  } else if (window.location) {
    frag = (grapnel.options.hashBang ? '!' : '') + frag;
    if (!window.history.replaceState) {
      console.error(`Can't replace url to '${frag}', replaceState not available, falling back to doing normal navigate, which creates a history item.`);
      window.location.hash = frag;
    } else {
      window.history.replaceState({}, "", `#${frag}`);
    }
  } else {
    window._pathname = frag || '';
  }
}

function constructGrapnelRouter(options = {}, router) {
  const grapnelOptions = _.pick(options, [
    'pushState',
    'root',
    'env',
    'mode',
    'hashBang'
  ]);

  router.grapnel = new Grapnel(grapnelOptions);

  addRoutesToGrapnelRouter(options, router);

  return router.grapnel;
}

function addRoutesToGrapnelRouter(options, router) {
  options.routes = options.routes || {};

  _.each(options.routes, (route, routeName) => {
    _.defaults(route, Router.routeDefaults, {
      route: routeName,
      router
    });

    const middleware = [
      securityMiddlewareFactory(route),
      dataMiddlewareFactory(route),
      successMiddlewareFactory(route)
    ];

    middleware.unshift(route.route);
    router.grapnel.get.apply(router.grapnel, middleware);

    return route;
  });

  addDefaultRouteToGrapnelRouter(options, router);
  addNotFoundRouteToGrapnelRouter(options, router);
}

function addDefaultRouteToGrapnelRouter(options, router) {
  const defaultRoute = options.defaultRoute;

  if (defaultRoute) {
    if (!options.routes[defaultRoute]) {
      throw new Error(`Default route '${defaultRoute}' doesn't exist.`);
    }

    const defaultRouteMiddleware = redirectMiddlewareFactory(router, defaultRoute);

    router.grapnel.get('/', defaultRouteMiddleware);
    router.grapnel.get('', defaultRouteMiddleware);
  }
}

function addNotFoundRouteToGrapnelRouter(options, router) {
  const notFoundRoute = options.notFoundRoute;

  if (notFoundRoute) {
    if (!options.routes[notFoundRoute]) {
      throw new Error(`Default route '${notFoundRoute}' doesn't exist.`);
    }

    const notFoundMiddleware = redirectMiddlewareFactory(router, options.notFoundRoute);

    router.grapnel.get('/*', notFoundMiddleware);
    router.grapnel.get('*', notFoundMiddleware);
  }
}

function redirectMiddlewareFactory(router, route) {
  return function redirectMiddleware(req, event) {
    if (!event.parent()) {
      router.redirect(route);
    }
  }
}

function ensureViewForRoute(route) {
  const viewName = route.view;

  if (!this.views[viewName]) {
    const viewOptions = this.options.views[viewName];

    // for render server, if this is true, the rendered element is already on the page
    if (window._preRendered) {
      viewOptions.el = viewOptions.$holder
        ? $(`> ${viewOptions.tag}`, viewOptions.$holder)[0]
        : $(`${viewOptions.holder} > ${viewOptions.tag}`)[0];
    }

    viewOptions.name = viewOptions.name || viewName;

    if (viewOptions.static) {
      _.defaults(viewOptions, this.options.staticViewConfig);
    } else {
      _.defaults(viewOptions, this.options.viewConfig);
    }

    this.views[viewName] = View(viewOptions);
  }

  return this.views[viewName];
}

function constructStaticViews() {
  _.each(this.options.staticViews, (staticView, staticViewName) => {
    staticView.router = this;
    staticView.name = staticView.name || staticViewName;
    this.staticViews[staticViewName] = StaticView(staticView);
  });
}

function renderStaticViews(staticViews, data = {}) {
  _.each(this.staticViews, (staticView, name) => {
    if (staticViews && staticViews.indexOf(name) !== -1) {
      staticView.view.render(data);
    } else {
      staticView.view.hide();
    }
  });
}

export default Router;