import fs from 'fs';
import { parse } from '@babel/parser';
import Unpacker from './unpacker';

const source = fs.readFileSync('input/source.js').toString();
const ast = parse(source);

const unpacker = new Unpacker(ast);
unpacker.unpack();