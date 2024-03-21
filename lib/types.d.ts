export namespace RedmineIssueSync {
  declare interface UserConfig {
    /**
     * Get it from sidebar in https://redmine.org/my/account
     * @see https://www.redmine.org/projects/redmine/wiki/Rest_api#Authentication
     */
    api_key: string;
    /**
     * Base url of endpoint like "https://redmine.org".
     * Pass without trailing slash `/` in the end
     */
    rm_endpoint: string;

    /**
     * List projects here https://redmine.org/projects.json?key=api_key
     */
    project_id: number;
  }

  interface IssueAst {
    issueId: number | null;
    parentIssueId: number | null;
    subject: string;
    description: string;
    trackerId: number;
    _trackerLevel: 1 | 2 | 3;
    _trackerName: 'feature' | 'story' | 'task';
    _index: number;
    _parentTaskIndex: -1 | number;
  }

  interface JsonOutput {
    config: UserConfig;
    tasks: IssueAst[];
  }
}
