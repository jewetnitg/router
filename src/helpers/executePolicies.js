/**
 * @author rik
 */
import _ from 'lodash';
import Request from '../factories/Request';

function executePolicies(policies = [], data = {}, policyFns = {}) {
  if (Array.isArray(policies)) {
    return Promise.all(
      _.map(policies, (policy) => {
        return executePolicies(policy, data, policyFns);
      })
    );
  } else if (typeof policies === 'string') {
    return executePolicy(policies, data, policyFns);
  } else {
    return Promise.resolve();
  }
}

function executePolicy(policyName, data = {}, policies = {}) {
  const policy = policies[policyName];

  if (!policy) {
    throw new Error(`Policy '${policyName}' not defined.`);
  }

  const req = Request({
    params: data
  });

  return policy(req);
}

export default executePolicies;