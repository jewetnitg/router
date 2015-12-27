/**
 * @author rik
 */
import _ from 'lodash';

let listener = null;

function makeAnchorDOMElementsUseRouterNavigate(router, anchorSelector = router.options.anchorSelector) {
  const elements = document.querySelectorAll(anchorSelector || 'a[href^="/"]:not([href^="//"])');
  listener = listener || function (e) {
      e.preventDefault();
      const url = e.target.href;
      router.navigate(url);
    };

  _.each(elements, element => {
    element.removeEventListener('click', listener);
    element.addEventListener('click', listener);
  });
}

export default makeAnchorDOMElementsUseRouterNavigate;