/**
 * @author rik
 */
const regex = {
  splats: /[*|:][^/]+/g,
  splatNames: /[*|:]([^/]+)/g,
  splatModifiersAndNames: /([*|:])([^/]+)/g
};

export default regex;