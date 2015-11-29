/**
 * @author rik
 */
import executeController from '../../helpers/executeController';

function controllerMiddlewareFactory(route, grapnel, controllers) {
  return function controllerMiddleware(req, res) {
    //noinspection JSUnresolvedVariable
    executeController(route.controller, req.params, controllers, route, grapnel)
      .then((data) => {
        grapnel.trigger('controller:success', {
          data,
          route
        });
      }, (data) => {
        res.preventDefault();
        grapnel.trigger('controller:failure', {
          route,
          data
        });
      });
  }
}

export default controllerMiddlewareFactory;