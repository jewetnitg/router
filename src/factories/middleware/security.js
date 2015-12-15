/**
 * @author rik
 */
import middlewareMiddlewareFactory from './middleware';

function securityMiddlewareFactory(route) {
  return middlewareMiddlewareFactory('security', route, 'unauthorized');
}

export default securityMiddlewareFactory;