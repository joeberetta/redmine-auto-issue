const parseFrontMatter = require('front-matter');

const RM_CONF_TASK_LEVEL = [
  { depth: 1, type: 'feature', trackerId: 8 },
  { depth: 2, type: 'story', trackerId: 9 },
  { depth: 3, type: 'task', trackerId: 11 },
];

const RM_CONF_CONFIG_DICT = {
  api_key: 'string',
  rm_endpoint: 'string',
  project_id: 'number',
};

const NeedCleanStart = new Error(
  'Rename your current ./issues.md file and restart script. You will see the missing part'
);
NeedCleanStart.stack = undefined;

/**
 *
 * @param {import('@textlint/ast-node-types').TxtDocumentNode} mdAst
 * @param {string} mdText
 * @returns {import('./types').RedmineIssueSync.JsonOutput}
 */
module.exports.convertAstToRedmineJson = (mdAst) => {
  /**
   * @type {import('./types').RedmineIssueSync.UserConfig}
   */
  const _config = {};
  /**
   * @type {import('./types').RedmineIssueSync.IssueAst[]}
   */
  const _tasks = [];

  //#region Aggregate config
  const _frontMatter = mdAst.children.find((_astNode) => _astNode.type === 'Yaml');
  if (!_frontMatter) {
    throw NeedCleanStart;
  }
  const _parsedConfig = parseFrontMatter(_frontMatter.raw).attributes;

  for (const _configKey in RM_CONF_CONFIG_DICT) {
    const _configKeyType = RM_CONF_CONFIG_DICT[_configKey];

    if (typeof _parsedConfig[_configKey] !== _configKeyType) {
      throw new Error(
        `Provide ${_configKey} of type "${_configKeyType}";\nProvided config: ${JSON.stringify(_parsedConfig)}`
      );
    }
    _config[_configKey] = _parsedConfig[_configKey];
  }

  //#endregion

  const _astNodes = Object.entries(mdAst.children).map(([_i, _c]) => [parseInt(_i), _c]);

  for (const [_index, _astNode] of _astNodes) {
    /**
     * @type {import('./types').RedmineIssueSync.IssueAst}
     */
    const _task = {
      issueId: null,
      parentIssueId: null,
      subject: '',
      description: '',
      trackerId: RM_CONF_TASK_LEVEL[RM_CONF_TASK_LEVEL.length - 1].trackerId,
      _trackerLevel: RM_CONF_TASK_LEVEL[RM_CONF_TASK_LEVEL.length - 1].depth,
      _trackerName: RM_CONF_TASK_LEVEL[RM_CONF_TASK_LEVEL.length - 1].type,
      _index: _tasks.length,
      _parentTaskIndex: -1,
    };

    //#region Aggregate tasks list
    if (_astNode.type === 'Header' && RM_CONF_TASK_LEVEL.length >= _astNode.depth) {
      _task.subject = _astNode.children[0].value.trim();

      _task.issueId = parseInt(_astNode.children[1]?.children?.[0]?.value) ?? null;

      const __taskType = RM_CONF_TASK_LEVEL[_astNode.depth - 1];

      _task.trackerId = __taskType.trackerId;
      _task._trackerLevel = __taskType.depth;
      _task._trackerName = __taskType.type;

      // It's possible nested story or task, let's try to find parent task index
      if (_astNode.depth > 1 && _tasks.length) {
        _task._parentTaskIndex =
          [..._tasks].reverse().find((__parentTask) => __parentTask._trackerLevel < _astNode.depth)?._index ?? -1;

        if (_task._parentTaskIndex > -1) {
          _task.parentIssueId = parseInt(_tasks[_task._parentTaskIndex].issueId);
        }
      }

      _tasks.push(_task);
      continue;
    }
    //#endregion

    //#region Aggregate task description
    if (_tasks.length) {
      const _lastTaskIndex = _tasks.length - 1;
      _tasks[_lastTaskIndex].description += `\n\n${_astNode.raw}`;

      // Clean trailing linebreaks
      if (_tasks[_lastTaskIndex].description.startsWith('\n\n')) {
        _tasks[_lastTaskIndex].description = _tasks[_lastTaskIndex].description.replace('\n\n', '');
      }

      // Unescape headings
      _tasks[_lastTaskIndex].description = _tasks[_lastTaskIndex].description.replaceAll('\\#', '#');

      _tasks[_lastTaskIndex].description = _tasks[_lastTaskIndex].description.trim();
    }
    //#endregion
  }

  return { note: "AUTOGENERATED. Don't edit this file. It's just for debug purposes", config: _config, tasks: _tasks };
};