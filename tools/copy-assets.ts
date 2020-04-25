#!/usr/bin/env ts-node-script
import { isString } from "util";

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const resolve = t => path.resolve(__dirname, t);
const exists = t => fs.existsSync(resolve(t));
const read = t => exists(t) ? fs.readFileSync(resolve(t)) : null;
const readdirs = t =>
  fs.readdirSync(resolve(t), { withFileTypes: true })
    .filter(p => p.isDirectory())
    .map(p => p.name)
    .filter(isString)
    ;
const write = ({ fp, contents }) => {
  const wt = resolve(fp);
  fs.writeFileSync(wt, contents, 'utf8');
}

const run = async ({
  hook,
}) => {
  await mkdirp(resolve('../dist/assets'));
  const sfp = `../src/hooks/${hook}/${hook}.ts`;
  const contents = read(sfp);
  if (!contents)
    return;
  const tfp = `../dist/assets/${hook}.ts`;
  write({ fp: tfp, contents }); 
};

const hooks = readdirs('../src/hooks');

hooks.forEach(hook => run({ hook }));
