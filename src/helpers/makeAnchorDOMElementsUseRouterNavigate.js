/**
 * @author rik
 */
import _ from 'lodash';

function makeAnchorDOMElementsUseRouterNavigate(router, anchorSelector = router.options.anchorSelector) {
  const elements = document.querySelectorAll(anchorSelector || 'a[href^="/"]:not([href^="//"])');

  _.each(elements, element => {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      const url = e.target.href;
      router.navigate(url);
    });
  });
}

export default makeAnchorDOMElementsUseRouterNavigate;