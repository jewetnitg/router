/**
 * @author rik
 */
import _ from 'lodash';
import ControllerRequest from '../factories/ControllerRequest';

/**
 * Executes a controller from a given hashmap
 * @param controller
 * @param data
 * @param route
 * @param router
 * @returns {Promise.<*>}
 */
function executeController(controller, data, route) {
  switch (typeof controller) {
    case 'string':
      return executeControllerSpecifiedAsString(controller, data, route);
      break;
    case 'function':
      return executeControllerSpecifiedAsFunction(data, route, controller);
      break;
    default:
      return Promise.resolve(data);
  }
}

function executeControllerSpecifiedAsString(controller, data, route) {
  const controllerFunction = getControllerByPath(route.router.controllers, controller);

  return executeController(controllerFunction, data, route);
}

function executeControllerSpecifiedAsFunction(data, route, controller) {
  const req = makeControllerRequest(data, route);

  return wrapInPromise(() => {
    return controller(req);
  });
}

function getControllerByPath(controllers, path) {
  const controllerFunction = _.get(controllers, path);

  if (!controllerFunction) {
    throw new Error(`Controller '${path}' not defined.`);
  }

  return controllerFunction;
}

function wrapInPromise(fn) {
  return Promise.resolve()
    .then(() => {
      return fn();
    });
}

function makeControllerRequest(params, route) {
  return ControllerRequest({
    params,
    route
  });
}

export default executeController;