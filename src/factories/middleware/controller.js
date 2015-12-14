/**
 * @author rik
 */
import executeController from '../../helpers/executeController';

function controllerMiddlewareFactory(route) {
  return function controllerMiddleware(req, res) {
    //noinspection JSUnresolvedVariable
    executeController(route.controller, req.params, route)
      .then((data) => {
        route.router.success(route, data);
      }, (data) => {
        res.preventDefault();
        const errorRoute = route.errorRoute || route.router.options.errorRoute;

        if (errorRoute) {
          route.router.redirect(errorRoute);
        }

        route.router.fail(route, {
          reason: 'controller',
          data
        });
      });
  }
}

export default controllerMiddlewareFactory;