const superagent = require('superagent');

/**
 * @param {import('superagent').Request} request
 * @param {string} apiKey
 * @returns {import('superagent').Request}
 */
const _setRequestHeaders = (request, apiKey) => {
  request.set('X-Redmine-API-Key', apiKey).set('Content-Type', 'application/json');
  return request;
};

/**
 *
 * @param {number} issueId
 * @param {import('./types').RedmineIssueSync.UserConfig} config
 * @returns {import('superagent').Request}
 */
const _prepareIssueRequest = (issueId, config) => {
  const _request = issueId
    ? superagent.put(`${config.rm_endpoint}/issues/${issueId}.json`)
    : superagent.post(`${config.rm_endpoint}/issues.json`);

  return _setRequestHeaders(_request, config.api_key);
};

/**
 * @typedef {object} user
 * @property {number} user.id
 * @property {string} user.login
 * @property {boolean} user.admin
 * @property {string} user.firstname
 * @property {string} user.lastname
 * @property {string} user.created_on
 * @property {string} user.updated_on
 * @property {string} user.last_login_on
 * @property {string} user.passwd_changed_on
 * @property {string} user.avatar_url
 * @property {null} user.twofa_scheme
 * @property {string} user.api_key

 * @param {string} endpoint
 * @param {import('./types').RedmineIssueSync.UserConfig} config
 * @returns {Promise<user>}
 * @throws
 */
const getCurrentUserId = async (endpoint, config) => {
  return await _setRequestHeaders(superagent.get(`${endpoint}/users/current.json`), config.api_key)
    .then((res) => JSON.stringify(res.body.user))
    .catch((err) => {
      if (err.status === 401) {
        throw new Error(`Invalid "api_key". Please check it here ${config.rm_endpoint}/my/account`);
      }

      throw new Error(`Got error while fetchin user info. ${err.status}, ${err.response.text}`);
    });
};

/**
 * @param {import('./types').RedmineIssueSync.JsonOutput} issues
 */
module.exports.syncIssues = async (issues) => {
  const currentUser = await getCurrentUserId(issues.config.rm_endpoint, issues.config);

  for (const [_index, _task] of Object.entries(issues.tasks).map(([_i, _t]) => [parseInt(_i), _t])) {
    // Set parent issue after assigning
    if (_task._parentTaskIndex > -1) {
      _task.parentIssueId = parseInt(issues.tasks[_task._parentTaskIndex].issueId);
    }

    await _prepareIssueRequest(_task.issueId, issues.config)
      .set('X-Redmine-API-Key', issues.config.api_key)
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          issue: {
            project_id: issues.config.project_id,
            tracker_id: _task.trackerId,
            subject: _task.subject,
            description: _task.description,
            parent_issue_id: _task.parentIssueId,
            assigned_to_id: currentUser.id,
          },
        })
      )
      .then((res) => {
        if (res.status === 201) issues.tasks[_index].issueId = parseInt(res.body.issue.id);
        console.log(`Issue synced. See ${issues.config.rm_endpoint}/issues/${issues.tasks[_index].issueId}`);
      })
      .catch((err) => {
        const _defaultMsg = `[Failed to ${_task.issueId ? 'update' : 'create'} issue]:`;
        const _defaultStack = `\nInput issue: "ID: ${_task.issueId}. Subject: ${_task.subject}"\n`;
        if (err.status === 403) {
          console.warn(_defaultMsg, 'Forbidden error', _defaultStack);
        } else if (err.status === 404) {
          console.warn(_defaultMsg, 'Not found error', _defaultStack);
        } else
          console.warn(
            `${_defaultMsg} ${_defaultStack}\nDetails:`,
            err.status ? `${err.status}${` ${err.response.text}` ?? ''};` : err.response?.toJSON?.() ?? err,
            `\nCheck parsed issues ${process.cwd()}/issues.json`
          );
      });
  }

  return issues;
};
