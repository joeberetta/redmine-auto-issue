const { readFileSync, writeFileSync } = require('fs');
const { parse: parseMdToJson } = require('@textlint/markdown-to-ast');
const { convertAstToRedmineJson } = require('./md-ast-to-rm-json');
const { syncIssues } = require('./rm-json-to-issues');

console.clear();
console.log('Welcome to Redmine auto issue generator\n');

const FILES = {
  _frontmatterTemplate: './assets/example_frontmatter.md',
  input: 'issues.md',
  output: 'issues.json',
};

let mdText = '';
try {
  mdText = readFileSync(`./${FILES.input}`, { encoding: 'utf8' });
} catch (err) {
  if (err.message.startsWith('ENOENT')) {
    writeFileSync(FILES.input, readFileSync(FILES._frontmatterTemplate, { encoding: 'utf8' }));
    console.log(`Created initial input file. See ${process.cwd()}/${FILES.input}`);

    mdText = readFileSync(`./${FILES.input}`, { encoding: 'utf8' });
  }
}

const rmParsedJson = convertAstToRedmineJson(parseMdToJson(mdText));
console.log(`Parsed ${rmParsedJson.tasks.length} tasks. See ${process.cwd()}/${FILES.output}`);
writeFileSync(FILES.output, JSON.stringify(rmParsedJson, null, 2));

if (process.argv[2] === '--sync') {
  syncIssues(rmParsedJson).then((_rmJson) => writeFileSync(FILES.output, JSON.stringify(_rmJson, null, 2)));
}
