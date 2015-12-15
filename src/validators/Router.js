/**
 * @author rik
 */
const RouterValidator = {

  construct(options = {}) {

    if (typeof options.routes !== 'object') {
      throw new Error(`Can't construct router, routes object not provided.`);
    }

    if (typeof options.middleware !== 'object') {
      throw new Error(`Can't construct router, middleware object not provided.`);
    }
  }

};

export default RouterValidator;