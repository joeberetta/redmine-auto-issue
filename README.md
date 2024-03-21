# Redmine issue generator

Tiny cli for writing multiple issues inside single md file and syncing it with [redmine](http://redmine.org/)

## Installation

Clone the project

```bash
git clone https://github.com/joeberetta/redmine-auto-issue.git
```

Go to the project directory

```bash
cd redmine-auto-issue
```

Install dependencies

```bash
npm install
```

## Usage

### First time start

Dry run. For first time creates initial [issues.md](./issues.md) file inside project root

```bash
npm run start
```

Complete content of ./issues.md file:

- [front-matter](./assets/example_frontmatter.md)
- [issues description](./assets/example_issues.md)

After dry run, if everything is ok, sync it with redmine

```bash
npm run start:sync
```

> After completing of sync `issueId` and `parentIssueId` params in `./issues.md` will be updated

### Update existing issues

As said above, you're able to get issue ids after syncing

If you need to update existing tasks, just add empty links to the end of heading. Example:

```md
# New feature name

# Existing feature name [12345](#redmine_issue_id)
```

## Roadmap

- [ ] add tests
- [ ] publish to npm
- [ ] add support for other properties like assignee, estimate, start/due date and etc. Currently only subject and description properties supported
- [ ] add support for updating input markdown file to link synced issues. Currently you need to add extra link to subject name from ./issues.json
- [ ] add more configuration options

## Authors

- [Joe Beretta](https://github.com/joeberetta)

## Contributing

Contributions are always welcome!

Please open issue and I will do my best to help you with your question or contribution

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Used By

This project is used by the following companies:

- [ilink.dev](https://ilink.dev)
