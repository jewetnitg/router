/**
 * @author rik
 */
import events from 'events';

import _ from 'lodash';

import Route from './Route';

/**
 * @class Router
 *
 * @param options {Object} Object containing the properties listed below
 *
 * @property {Boolean} [pushState=true]
 * @property routes {Object<Object>} Hashmap containing routes
 * @property policies {Object<Function>} Hashmap containing policies
 *
 * @returns {Router} The constructed Router
 *
 * @example
 * const router = Router({
 *   pushState: true,
 *   routes: {
 *     '/user/:id': {
 *       policies: ['isLoggedIn']
 *     }
 *   }
 * });
 */
function Router(options) {
  _.defaults(options, Router.defaults);

  // @todo call validator

  const props = {
    pushState: {
      value: options.pushState
    },
    defaultRoute: {
      value: options.defaultRoute
    },
    routes: {
      value: options.routes
    },
    policies: {
      value: options.policies
    },
    routeHandler: {
      value: options.routeHandler
    },
    eventEmitter: {
      value: new events.EventEmitter()
    }
  };

  const router = Object.create(Router.prototype, props);

  privateApi.constructRoutes.call(router);

  return router;
}

Router.defaults = {
  pushState: true,
  routes: {},
  policies: {}
};

Router.prototype = {

  pushState: true,

  /**
   * @name currentRoute
   * @memberof Router
   * @instance
   * @type Route|undefined
   */
  get currentRoute() {
    return privateApi.findRouteForCurrentUrl.call(this);
  },

  /**
   * @name currentUrl
   * @memberof Router
   * @instance
   * @type String
   */
  get currentUrl() {
    if (this.pushState) {
      return privateApi.currentUrlFromPopState.call(this);
    } else {
      return privateApi.currentUrlFromHash.call(this);
    }
  },

  /**
   * @method on
   * @param event {String}
   * @param callback {Function}
   */
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  },

  /**
   * @method trigger
   * @param event {String}
   * @param data {*}
   */
  trigger(event, data) {
    this.eventEmitter.emit(event, data);
  },

  /**
   * @method off
   * @param event {String}
   * @param callback {Function}
   */
  off(event, callback) {
    if (callback) {
      this.eventEmitter.removeListener(event, callback);
    } else {
      this.eventEmitter.removeAllListeners(event);
    }
  },

  /**
   * @method once
   * @param event {String}
   * @param callback {Function}
   */
  once(event, callback) {
    const cb = data => {
      callback(data);
      this.off(event, cb);
    };

    this.on(event, cb)
  },

  /**
   *
   */
  start() {
    //noinspection JSUnusedAssignment
    privateApi.startListeningForRouteEvents.call(this);
    //noinspection JSUnusedAssignment
    privateApi.executeCurrentRoute.call(this);

    this.on('route', () => {
      privateApi.executeCurrentRoute.call(this);
    });
  },

  /**
   *
   * @param url
   * @param options
   */
  navigate(url, options = {}) {
    _.defaults(options, {
      trigger: true,
      replace: false
    });

    if (this.pushState) {
      //noinspection JSUnusedAssignment
      privateApi.navigateForPopState.call(this, url, options);
    } else {
      //noinspection JSUnusedAssignment
      privateApi.navigateForHashChange.call(this, url, options);
    }
  },

  /**
   *
   * @returns {*}
   */
  refresh() {
    //noinspection JSUnusedAssignment
    return privateApi.executeCurrentRoute.call(this);
  },

  /**
   *
   * @param url
   */
  redirect(url) {
    this.navigate(url, {
      replace: true
    });
  }

};

const privateApi = {

  constructRoutes() {
    _.each(this.routes, (routeOptions, route) => {
      routeOptions.route = routeOptions.route || route;
      routeOptions.router = this;

      this.routes[route] = Route(routeOptions);
    });
  },

  startListeningForRouteEvents() {
    if (!this.pushState) {
      //noinspection JSUnusedAssignment
      privateApi.startListeningForHashChangeEvents.call(this);
    } else {
      //noinspection JSUnusedAssignment
      privateApi.startListeningForPopStateEvents.call(this);
    }
  },

  startListeningForHashChangeEvents() {
    window.addEventListener('hashchange', () => {
      this.trigger('route');
    }, false);
  },

  startListeningForPopStateEvents() {
    window.addEventListener('popstate', () => {
      this.trigger('route');
    }, false);
  },

  currentUrlFromHash() {
    return window.location.hash.replace('#!', '');
  },

  currentUrlFromPopState() {
    return history.state ? history.state.path : window.location.pathname;
  },

  findRouteForCurrentUrl() {
    return _.find(this.routes, (route) => {
      // getParamsFromUrl returns false if the url doesn't match the route,
      // it returns an empty object if it doesn't but doesn't have params
      return !!route.getParamsFromUrl(this.currentUrl);
    });
  },

  executeCurrentRoute() {
    const currentRoute = this.currentRoute;

    if (currentRoute && currentRoute.execute) {
      const params = currentRoute.getParamsFromUrl(this.currentUrl);
      return currentRoute.execute(params);
    } else {
      // @todo allow for a 404 route
      if (this.defaultRoute) {
        this.navigate(this.defaultRoute);
      }
    }
  },

  navigateForPopState(url, options = {}) {
    const path = url.replace(/!|#/g, '');

    if (options.replace) {
      history.replaceState({path}, '', path);
    } else {
      history.pushState({path}, '', path);
    }

    if (options.trigger) {
      this.trigger('route', options);
    }
  },

  navigateForHashChange(url, options = {}) {
    // @todo implement properly
    if (options.trigger) {
      //noinspection JSUnusedAssignment
      window.location.hash = '!#' + privateApi.sanitizeUrl.call(this, url);
    }
  },

  sanitizeUrl(url) {
    return url.replace(/!|#/g, '');
  }

};

export default Router;