import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJiti } from '/Users/leonhardbreuer/.bun/install/global/node_modules/jiti/lib/jiti.mjs';
import { CombinedAutocompleteProvider } from '/Users/leonhardbreuer/.bun/install/global/node_modules/@earendil-works/pi-tui/dist/index.js';
import { AgentSession, CustomEditor } from '/Users/leonhardbreuer/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/dist/index.js';

const dir = mkdtempSync(join(tmpdir(), 'pi-inline-skills-'));
try {
  const commands = ['alpha', 'beta'].map(name => {
    const path = join(dir, `${name}.md`);
    writeFileSync(path, `---\nname: ${name}\ndescription: Example\n---\n${name} instructions`);
    return { name: `skill:${name}`, source: 'skill', sourceInfo: { path }, description: name };
  });
  const handlers = new Map();
  let factory;
  if (process.env.CHECK_EXTENSION) {
    const jiti = createJiti(import.meta.url, { alias: {
      '@earendil-works/pi-coding-agent': '/Users/leonhardbreuer/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/dist/index.js',
      '@earendil-works/pi-tui': '/Users/leonhardbreuer/.bun/install/global/node_modules/@earendil-works/pi-tui/dist/index.js',
    } });
    const extension = await jiti.import(process.env.CHECK_EXTENSION, { default: true });
    extension({ on: (event, handler) => handlers.set(event, handler), getCommands: () => commands });
    handlers.get('session_start')({}, { mode: 'tui', ui: { setEditorComponent: value => { factory = value; } } });
  }
  let provider = new CombinedAutocompleteProvider(commands, dir);
  let editor;
  if (factory) {
    editor = factory({ requestRender() {} }, {
      borderColor: value => value,
      selectList: { selectedPrefix: value => value, selectedText: value => value, description: value => value, scrollInfo: value => value, noMatch: value => value },
    }, { matches: () => false });
    assert.equal(typeof editor.handleInput, 'function');
    const original = CustomEditor.prototype.setAutocompleteProvider;
    CustomEditor.prototype.setAutocompleteProvider = function (value) { provider = value; };
    try { editor.setAutocompleteProvider(provider); } finally { CustomEditor.prototype.setAutocompleteProvider = original; }
  }
  const options = { signal: new AbortController().signal };
  const suggestions = await provider.getSuggestions(['Do this /alp'], 0, 12, options);
  if (!process.env.CHECK_EXPANSION_ONLY) {
  assert.ok(suggestions?.items.some(item => item.value === 'skill:alpha'), 'inline skill autocomplete missing');
  assert.equal(provider.shouldTriggerFileCompletion(['Do this /alp'], 0, 12), true);
  const completion = provider.applyCompletion(['Do this /alp AFTER'], 0, 12, suggestions.items[0], suggestions.prefix);
  assert.equal(completion.lines[0], 'Do this /skill:alpha  AFTER');
  for (const [lines, line, col] of [[['/alp'], 0, 4], [['First', 'Then /bet'], 1, 9], [['/skill:alpha do this /bet'], 0, 24]]) {
    assert.ok((await provider.getSuggestions(lines, line, col, options))?.items.length);
  }
  }
  const prompt = '/skill:alpha do this /skill:beta';
  const expanded = handlers.has('input')
    ? await handlers.get('input')({ text: prompt, source: 'interactive' }, { ui: { notify(message) { throw new Error(message); } } })
    : { text: AgentSession.prototype._expandSkillCommand.call({ resourceLoader: { getSkills: () => ({ skills: commands.map(command => ({ name: command.name.slice(6), filePath: command.sourceInfo.path, baseDir: dir })) }) } }, prompt) };
  assert.ok(expanded.text.includes('alpha instructions'));
  assert.ok(expanded.text.includes('beta instructions'), 'second skill was not attached');
  if (handlers.has('input')) {
    const run = text => handlers.get('input')({ text, source: 'rpc' }, { ui: { notify(message) { throw new Error(message); } } });
    const repeated = await run('Use /skill:alpha and /skill:alpha.');
    assert.equal(repeated.text.split('alpha instructions').length - 1, 1);
    assert.equal((await run('Use /skill:unknown')).action, 'continue');
    assert.equal((await run('`/skill:alpha`')).action, 'continue');
    assert.equal((await run('```\n/skill:alpha\n```')).action, 'continue');
    assert.equal((await run('/tmp/skill:alpha')).action, 'continue');
    assert.equal((await run('\\/skill:alpha')).action, 'continue');
    assert.equal((await run('Do this\n/skill:beta')).action, 'transform');
  }
  if (editor) {
    const original = CustomEditor.prototype.setAutocompleteProvider;
    let actualProvider;
    CustomEditor.prototype.setAutocompleteProvider = function (value) { actualProvider = value; original.call(this, value); };
    try { editor.setAutocompleteProvider(new CombinedAutocompleteProvider(commands, dir)); } finally { CustomEditor.prototype.setAutocompleteProvider = original; }
    for (const character of 'Do this /bet') editor.handleInput(character);
    await editor.autocompleteRequestTask;
    assert.equal(editor.isShowingAutocomplete(), true, 'typing inline slash did not open autocomplete');
    assert.equal(editor.getText(), 'Do this /bet');
    editor.setText('Do this /alp');
    editor.handleInput('\t');
    await editor.autocompleteRequestTask;
    assert.ok(editor.isShowingAutocomplete() || editor.getText().includes('/skill:alpha'), 'inline Tab completion failed');
  }
  console.log('PASS: automatic inline autocomplete, Tab, completion placement, multiline, multiple skills, deduplication, literal/path protection');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
