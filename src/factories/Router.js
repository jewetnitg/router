/**
 * @author rik
 */
import _ from 'lodash';
import Grapnel from 'grapnel';

import controllerMiddlewareFactory from './middleware/controller';
import policiesMiddlewareFactory from './middleware/policies';
import policyExecutor from '../singletons/policyExecutor';

/**
 * The Router factory / class, responsible for creating a Router.
 *
 * @class Router
 *
 * @param options {Object}
 *
 * @property controllers {Object<Object<Function>>} Hashmap containing Controllers
 * @property policies {Object<Function>} Hashmap containing policies
 * @property routes {Object<Object>} Hashmap containing routes
 * @property success {Function} Function that gets executed when a route has successfully executed
 * @property fail {Function} Function that gets executed when a route has failed to execute successfully
 * @property sync {Function} Function that gets executed when a controller syncs
 * @property {String} [anchorSelector='a[href^="/"]:not([href^="//"])'] - jQuery selector that represents all anchors that should be event.preventDefault()'ed and use the router to navigate instead
 *
 * @property pushState {Boolean} Grapnel pushState option
 * @property root {Boolean} Grapnel root option
 * @property env {Boolean} Grapnel env option
 * @property mode {Boolean} Grapnel mode option
 * @property hashBang {Boolean} Grapnel hashBang option
 *
 * @todo implement defaultRoute, notFoundRoute, errorRoute (for controller errors)
 *
 * @example
 * const router = Router({
 *   pushState: true,
 *   success(route, data) {
 *     // the route and data resolved from the Controller
 *   },
 *   fail(route, data) {
 *     // the failed route and data from policy/controller that failed
 *     data.reason; // 'policy' or 'controller'
 *     data.data; // data policy/controlller rejected with
 *   },
 *   sync(route, data) {
 *     // controller sync happened for the route passed in with data passed in
 *   },
 *   routes: {
 *     '/testReject': {
 *       policies: ['test'],
 *       controller: 'test.test'
 *     }
 *   },
 *   '/testResolve': {
 *       policies: [],
 *       controller: 'test.test'
 *     }
 *   },
 *   policies: {
 *     test: function() {
 *       return Promise.reject();
 *     }
 *   },
 *   controllers: {
 *     test: {
 *       test: function () {
 *         return {
 *           test: true
 *         }
 *       }
 *     }
 *   }
 * });
 *
 */
function Router(options = {}) {
  _.merge(options, Router.defaults, options);

  if (typeof options.success !== 'function') {
    throw new Error(`Can't construct router, success method not provided.`);
  }

  if (typeof options.fail !== 'function') {
    throw new Error(`Can't construct router, fail method not provided.`);
  }

  if (typeof options.sync !== 'function') {
    throw new Error(`Can't construct router, sync method not provided.`);
  }

  if (typeof options.routes !== 'object') {
    throw new Error(`Can't construct router, routes object not provided.`);
  }

  if (typeof options.policies !== 'object') {
    throw new Error(`Can't construct router, policies object not provided.`);
  }

  if (typeof options.controllers !== 'object') {
    throw new Error(`Can't construct router, controllers object not provided.`);
  }

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
    success: {
      value: options.success
    },
    fail: {
      value: options.fail
    },
    sync: {
      value: options.sync
    },
    controllers: {
      value: options.controllers
    }
  };

  Router.policyExecutor.add(options.policies);

  const router = Object.create(Router.prototype, props);

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
 * @property {Object<Function>} [policies={}] Policies specified as a hashmap
 * @property {Object<Object<Function>>} [controllers={}] Controllers specified as a hashmap
 */
Router.defaults = {
  policies: {},
  controllers: {}
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

/**
 * The {@link PolicyExecutor} instance all {@link Router}s use, this may be overridden
 *
 * @name policyExecutor
 * @memberof Router
 * @static
 * @type PolicyExecutor
 */
Router.policyExecutor = policyExecutor;

Router.prototype = {

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
   * @todo add a data param so that urls an contains splats that will be filled with the data
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
   * @todo add a data param so that urls an contains splats that will be filled with the data
   * @example
   * router.redirect('/user/5');
   */
  redirect(url) {
    this.navigate(url, {
      replace: true
    });
  },

  /**
   * Executes one or more policies.
   *
   * @method policy
   * @memberof Router
   * @instance
   *
   * @param policy {String|Array<String>} Policy / Policies to execute
   * @param data {Object} 'Request' data
   * @example
   * router.policy('isLoggedIn')
   *   .then(...)
   * router.policy(['isLoggedIn', 'isLoggedInUser'], userModel)
   *   .then(...)
   */
  policy(policy = [], data = {}) {
    return Router.policyExecutor.execute(policy, data);
  }

};

// @todo reserach if this is necessary
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

// originally take from Grapnel.fragment.set, changed to replace the current history item instead of add to the history
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

  if (options.defaultRoute) {
    const routeObj = options.routes[options.defaultRoute];

    if (!routeObj) {
      throw new Error(`Default route '${options.defaultRoute}' doesn't exist.`);
    }

    options.routes[''] = routeObj;
    options.routes['/'] = routeObj;
  }

  _.each(options.routes, (route, routeName) => {
    _.merge(route, Router.routeDefaults, {
      route: routeName,
      router
    }, route);

    const middleware = [
      policiesMiddlewareFactory(route),
      controllerMiddlewareFactory(route)
    ];

    middleware.unshift(route.route);
    router.grapnel.get.apply(router.grapnel, middleware);

    return route;
  });
}

export default Router;