import { readFileSync, openSync, writeSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Game } from './game.mjs';
import { InputError, validateInputs, validateScenario } from './validation.mjs';

function readJSON(path) {
  try { return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, '')); }
  catch (error) { throw new InputError(`${path}: ${error.message}`); }
}

export function parseArgs(args) {
  const allowed = new Set(['seed', 'night', 'ticks', 'out', 'inputs', 'scenario', 'snapshot-every']);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i].slice(2);
    if (!args[i].startsWith('--') || !allowed.has(name) || args[i + 1] === undefined || name in options) {
      throw new Error(`Tham số không hợp lệ: ${args[i]}`);
    }
    options[name] = args[i + 1];
  }
  for (const name of ['seed', 'night', 'ticks', 'out']) {
    if (!(name in options)) throw new Error(`Thiếu --${name}`);
  }
  for (const name of ['seed', 'night', 'ticks', 'snapshot-every']) {
    if (name in options) {
      if (!/^-?\d+$/.test(options[name]) || !Number.isSafeInteger(Number(options[name]))) {
        throw new Error(`--${name}: cần số nguyên`);
      }
      options[name] = Number(options[name]);
    }
  }
  options['snapshot-every'] ??= 10;
  if (options.night < 1 || options.night > 3 || options.ticks < 0 || options['snapshot-every'] < 1 || !options.out) {
    throw new Error('night phải là 1, 2 hoặc 3; ticks >= 0; snapshot-every >= 1; out không rỗng');
  }
  for (const name of ['scenario', 'inputs']) {
    if (options[name] && resolve(options.out) === resolve(options[name])) {
      throw new Error('Không được ghi đè file đầu vào');
    }
  }
  return options;
}

export function runHeadless(options) {
  const contract = JSON.parse(readFileSync(new URL('../game.contract.json', import.meta.url), 'utf8'));
  const scenario = options.scenario ? validateScenario(readJSON(options.scenario), contract.tuning) : {};
  const inputs = options.inputs ? validateInputs(readJSON(options.inputs)) : { frames: [] };
  const game = new Game(contract.tuning, { seed: options.seed, scenario, night: options.night });
  const fd = openSync(options.out, 'w');
  const line = data => writeSync(fd, `${JSON.stringify(data)}\n`);
  try {
    line(game.snapshot());
    let frame = 0;
    while (game.tick < options.ticks && game.state === 'playing') {
      const patch = inputs.frames[frame]?.tick === game.tick ? inputs.frames[frame++] : {};
      for (const event of game.step(patch)) line(event);
      if (game.tick % options['snapshot-every'] === 0) line(game.snapshot());
    }
    line(game.end());
  } finally {
    closeSync(fd);
  }
  return game;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runHeadless(parseArgs(process.argv.slice(2)));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = error instanceof InputError ? 2 : 1;
  }
}
