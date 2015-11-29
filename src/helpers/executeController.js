/**
 * @author rik
 */
import _ from 'lodash';
import ControllerRequest from '../factories/ControllerRequest';

function executeController(controller, data, controllers, route, grapnel) {
  if (typeof controller === 'string') {
    const controllerFunction = _.get(controllers, controller);

    if (!controllerFunction) {
      throw new Error(`Controller '${controller}' not defined.`);
    }

    return executeController(controllerFunction, data, controllers, route, grapnel);
  } else if (typeof controller === 'function') {
    const req = ControllerRequest({
      params: data,
      route: route,
      grapnel: grapnel
    });

    return Promise.resolve()
      .then(() => {
        return controller(req);
      });
  } else {
    return Promise.resolve(data);
  }
}

export default executeController;