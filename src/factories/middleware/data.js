/**
 * @author rik
 */
import middlewareMiddlewareFactory from './middleware';

function dataMiddlewareFactory(route) {
  return middlewareMiddlewareFactory('data', route, 'error');
}

export default dataMiddlewareFactory;