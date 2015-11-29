/**
 * @author rik
 */
import _ from 'lodash';
import $ from 'jquery';
import Grapnel from 'grapnel';

import Request from './Request';
import ControllerRequest from './ControllerRequest';

import controllerMiddlewareFactory from './middleware/controller';
import policiesMiddlewareFactory from './middleware/policies';

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
 * @example
 * const router = Router2({
 *   pushState: true,
 *   success(route, data) {
 *     // the route and data resolved from the Controller
 *   },
 *   fail(route, data) {
 *     // the failed route and data from policy/controller that failed
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
  _.defaults(options, {
    policies: {},
    controllers: {}
  });

  // @todo validate options
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
    }
  };
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
  }

};

function makeAnchorDOMElementsUseRouterNavigate(router, anchorSelector) {
  $(document).on('click', (e) => {
    if ($(e.target).is(anchorSelector || 'a[href^="/"]:not([href^="//"])')) {
      e.preventDefault();
      const url = $(e.target).attr('href');
      router.navigate(url);
    }
  });
}

// originally take from Grapnel.fragment.set, changed to replace the current history item instead of add to the history
function replaceNavigate(grapnel, frag) {
  if (grapnel.options.mode === 'pushState') {
    frag = (grapnel.options.root) ? (grapnel.options.root + frag) : frag;
    window.history.replaceState({}, null, frag);
  } else if (window.location) {
    frag = (grapnel.options.hashBang ? '!' : '') + frag;
    if (!window.history.replaceState) {
      console.error(`Can't replace url to '${frag}', replaceState not available, falling back to doing normal navigate, which creates a history item.`);
      window.location.hash = frag;
    } else {
      window.history.replaceState(undefined, undefined, `#${frag}`);
    }
  } else {
    window._pathname = frag || '';
  }
}

function constructGrapnelRouter(options = {}, router) {
  const grapnel = new Grapnel({
    pushState: options.pushState,
    root: options.root,
    env: options.env,
    mode: options.mode,
    hashBang: options.hashBang
  });

  addRoutesToGrapnelRouter(options, grapnel);

  grapnel.on('controller:success', (data) => {
    options.success(data.route, data.data);
  });

  grapnel.on('controller:sync', (data) => {
    options.sync(data.route, data.data);
  });

  grapnel.on('controller:failure', (data) => {
    options.fail(data.route, {
      reason: 'controller',
      data: data.data
    });
  });

  grapnel.on('policy:failure', (data) => {
    if (data.route.unauthorized) {
      router.redirect(data.route.unauthorized);
    }

    options.fail(data.route, {
      reason: 'policy',
      data: data.data
    });
  });

  return grapnel;
}

function addRoutesToGrapnelRouter(options, grapnel) {
  _.each(options.routes, (route, routeName) => {
    // @todo validate options
    route.route = route.route || routeName;
    const middleware = [
      policiesMiddlewareFactory(route, grapnel, options.policies),
      controllerMiddlewareFactory(route, grapnel, options.controllers)
    ];

    middleware.unshift(route.route);
    grapnel.get.apply(grapnel, middleware);

    return route;
  });
}

export default Router;