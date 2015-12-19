/**
 * @author rik
 */
function RequestFactoryFactory(session = {}) {
  return function RequestFactory(params = {}) {
    return {
      params,
      param(path) {
        return _.get(params, path);
      },
      session
    };
  }
}

export default RequestFactoryFactory;