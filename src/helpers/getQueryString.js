import _ from 'lodash';

function getQueryString(name, json) {
  const keys = [];
  const values = [];

  _.each(location.search.replace(/^\?/, '').split('&'), (pair) => {
    let [key, value] = _.map(pair.split('='), (str) => {
      return decodeURIComponent(str);
    });

    if ((!name || name === key) && json) {
      value = JSON.parse(value);
    }

    if (key && value) {
      keys.push(key);
      values.push(value);
    }
  });

  const params = _.object(keys, values);
  const param = name ? params[name] : null;

  return param || params;
}

export default getQueryString;