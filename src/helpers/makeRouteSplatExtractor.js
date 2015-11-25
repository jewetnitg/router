/**
 * @author rik
 */
import _ from 'lodash';

// regex strings for complex (*splat) and simple (:splat) splats
const regexes = {
  simple: '(/[^/]+)',
  complex: '((?:/[^/]+)+)'
};

/**
 *
 * @param route {String} The route to make a parameter extractor for
 */
function makeRouteSplatExtractor(route = "") {
  // this regex matches a /:splat and /*splat, it groups the /: and /* so a 'type' can easily be determined
  const splatRegex = /(\/[*|:])([^/]+)/g;
  // array that contains the names of the found splats, so we can map them onto the values
  const splats = [];

  // set the initial match for the do while
  let match = splatRegex.exec(route);

  // string of regex that will match a url that matches the route
  let regexStr = '';

  // the part of the route that hasn't been processed yet
  let restRoute = route;

  // we only need to do this for routes that have splats
  if (match) {
    do {
      // determine the splat type
      const type = match[1] === '/:' ? 'simple' : 'complex';
      // get the appropriate regex for the type
      const _regex = regexes[type];
      // contains the part of the restRoute before the matched splat
      let beforeSplat = '';

      // get the part before the splat from the string,
      // set the part after the string as the next restRoute,
      // when the next iteration occurs, beforeSplat will be the part
      // between the last splat and the current splat, this part should be string matched in the regex
      [beforeSplat, restRoute] = restRoute.split(match[0]);

      // add the part before the splat to as a string to the regex so it matches exactly,
      // add the appropriate regex for the current splat as well
      regexStr += beforeSplat + _regex;

      // put the splat name in the splats array, so we can map values onto keys (the splats pushed into the array here)
      splats.push(match[2]);
    } while (match = splatRegex.exec(route));
  } else {
    // if the route doesn't have any splats, the regex is simply the route itself
    regexStr = route;
  }

  // make an actual regex object of the created regex string
  const regex = new RegExp(regexStr, 'g');

  return RouteExtractor(regex, splats);
}

/**
 *
 *
 * @param regex {RegExp} Regular expression that matches a the splats of this route on a url
 * @param splats {Array<String>}
 *
 * @returns {Function}
 * @constructor
 */
function RouteExtractor(regex, splats = []) {
  // actually make the function that returns an object with the values of the splats in the route when passing a url
  return function (url = "") {
    regex.lastIndex = 0;
    let values = regex.exec(url);

    // even a route without
    if (!values) {
      return false;
    }
    // remove the full match (this is the full url)
    const match = values.shift();

    // all splats must be specified, or the matched url must be the full url
    if (values.length !== splats.length || match !== url) {
      return false;
    }

    // go through the matched parts and remove the leading forward slashes
    values = _.map(values, (value) => {
      return value.substring(1);
    });

    // map the keys onto the values
    return _.object(splats, values);
  }
}

export default makeRouteSplatExtractor;