/**
 * @author rik
 */
import _ from 'lodash';
import Grapnel from 'grapnel';


import replaceNavigate from '../helpers/replaceNavigate';
import makeAnchorDOMElementsUseRouterNavigate from '../helpers/makeAnchorDOMElementsUseRouterNavigate';

import RouterValidator from '../validators/Router';
import Director from 'frontend-view';
import GrapnelFactory from './Grapnel';

/**
 * The Router factory / class, responsible for creating a Router.
 *
 * @class Router
 *
 * @param options {Object}
 *
 * @property middleware {Object} Hashmap containing security and data middleware
 * @property routes {Object<Object>} Hashmap containing routes
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
 * @example
 * const router = Router({
 *   pushState: true,
 *   views: {...}, // hashmap of views by name, see frontend-view spec
 *   routes: {
 *     '/onlyIfLoggedIn': {
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
  options.session = options.session || {};

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
    session: {
      value: options.session
    },
    unauthorized: {
      value: options.unauthorized
    },
    error: {
      value: options.error
    }
  };

  const router = Object.create(Router.prototype, props);

  router.director = Director({
    adapters: options.adapters,
    views: options.views,
    staticViews: options.staticViews,
    middleware: options.middleware,
    viewConfig: options.viewConfig,
    staticViewConfig: options.staticViewConfig,
    libraries: options.libraries,
    session: options.session
  });

  /**
   * An instance of the Grapnel router, responsible for actual routing
   *
   * @name grapnel
   * @memberof Router
   * @instance
   * @type Object
   */
  router.grapnel = GrapnelFactory(options, router, Router);
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

  // @todo make private, refactor to success middleware, should never be called by the end-user
  success(route, params = {}, res = {}) {
    this.director.setComposition(route, params, res)
      .then(() => {
        // for render server
        if (window._onRouterReady) {
          window._onRouterReady();
          delete window._onRouterReady;
        }

        // @todo research if this is necessary
        makeAnchorDOMElementsUseRouterNavigate(this);
      });
  },

  // @todo make private, should never be called by the end-user
  sync(data = {}) {
    if (!this.currentRoute) {
      throw new Error(`Can't sync data, no current route.`);
    }

    this.director.sync(data);
  },

  // @todo make private, should never be called by the end-user
  fail(route, data) {
    switch (data.reason) {
      case 'security':
        const unauthorized = route.unauthorized || this.options.unauthorizedRoute;

        if (typeof unauthorized === 'string') {
          this.redirect(unauthorized);
        } else if (typeof unauthorized === 'function') {
          unauthorized(route, data);
        }
        break;
      case 'data':
        const error = route.error || this.options.errorRoute;

        if (typeof error === 'string') {
          this.redirect(error);
        } else if (typeof error === 'function') {
          error(route, data);
        }

        console.warn('error in data middleware', route, data);

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
   * @method makeUrl
   * @memberof Router
   * @instance
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
   * @method security
   * @memberof Router
   * @instance
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
    return this.director.middleware.security.run(middleware, data);
  },

  /**
   * Runs one or more data middleware with data.
   *
   * @method data
   * @memberof Router
   * @instance
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
    return this.director.middleware.data.run(middleware, data)
      .then(data => {
        return _.omit(data, ['sync', 'destruct']);
      });
  }

};

export default Router;