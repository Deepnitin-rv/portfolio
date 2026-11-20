export interface PythonRunResult {
  output: string[];
  error: string | null;
  durationMs: number;
}

type PyValue =
  | number
  | string
  | boolean
  | null
  | PyValue[]
  | PyDict
  | PyFunction
  | PyModule;

interface PyDict {
  __type: 'dict';
  entries: Map<string, PyValue>;
}

interface PyFunction {
  __type: 'function';
  name: string;
  params: string[];
  body: Statement[];
  closure: Scope;
}

interface PyModule {
  __type: 'module';
  name: string;
  members: Record<string, PyValue | ((...args: PyValue[]) => PyValue)>;
}

class ReturnSignal {
  value: PyValue;
  constructor(value: PyValue) {
    this.value = value;
  }
}

class BreakSignal {}
class ContinueSignal {}

class PythonError extends Error {
  line?: number;
  constructor(message: string, line?: number) {
    super(line ? `Line ${line}: ${message}` : message);
    this.line = line;
  }
}

class Scope {
  vars = new Map<string, PyValue>();
  parent: Scope | null;

  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  get(name: string, line?: number): PyValue {
    if (this.vars.has(name)) return this.vars.get(name)!;
    if (this.parent) return this.parent.get(name, line);
    throw new PythonError(`NameError: name '${name}' is not defined`, line);
  }

  set(name: string, value: PyValue): void {
    this.vars.set(name, value);
  }

  assign(name: string, value: PyValue): void {
    if (this.vars.has(name)) {
      this.vars.set(name, value);
      return;
    }
    if (this.parent && this.parent.has(name)) {
      this.parent.assign(name, value);
      return;
    }
    this.vars.set(name, value);
  }

  has(name: string): boolean {
    if (this.vars.has(name)) return true;
    return this.parent ? this.parent.has(name) : false;
  }
}

// --- Tokenizer for Python expressions ---

type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'FSTRING'
  | 'IDENT'
  | 'OP'
  | 'PUNC'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

const MULTI_OPS = ['**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/='];
const KEYWORD_OPS = new Set(['and', 'or', 'not', 'in', 'is', 'if', 'else', 'for']);

function tokenizeExpr(input: string, line?: number): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++;
      continue;
    }

    if (ch === '#') {
      break;
    }

    // f-string: f"..." or f'...'
    if ((ch === 'f' || ch === 'F') && (input[i + 1] === '"' || input[i + 1] === "'")) {
      const quote = input[i + 1];
      i += 2;
      let raw = '';
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          raw += input[i] + input[i + 1];
          i += 2;
        } else {
          raw += input[i];
          i++;
        }
      }
      if (i >= input.length) {
        throw new PythonError('SyntaxError: unterminated f-string literal', line);
      }
      i++;
      tokens.push({ type: 'FSTRING', value: raw });
      continue;
    }

    // Regular string
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          const next = input[i + 1];
          if (next === 'n') str += '\n';
          else if (next === 't') str += '\t';
          else str += next;
          i += 2;
        } else {
          str += input[i];
          i++;
        }
      }
      if (i >= input.length) {
        throw new PythonError('SyntaxError: unterminated string literal', line);
      }
      i++;
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    // Number
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let numStr = '';
      let seenDot = false;
      while (i < input.length && (/[0-9]/.test(input[i]) || (input[i] === '.' && !seenDot))) {
        if (input[i] === '.') seenDot = true;
        numStr += input[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Identifier / keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i];
        i++;
      }
      if (KEYWORD_OPS.has(ident)) {
        tokens.push({ type: 'OP', value: ident });
      } else {
        tokens.push({ type: 'IDENT', value: ident });
      }
      continue;
    }

    // Multi-char operators
    const two = input.slice(i, i + 2);
    if (MULTI_OPS.includes(two)) {
      tokens.push({ type: 'OP', value: two });
      i += 2;
      continue;
    }

    if ('+-*/%<>='.includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    if ('()[]{},:.'.includes(ch)) {
      tokens.push({ type: 'PUNC', value: ch });
      i++;
      continue;
    }

    throw new PythonError(`SyntaxError: unexpected character '${ch}'`, line);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// --- Helpers ---

function isDict(v: PyValue): v is PyDict {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && '__type' in v && v.__type === 'dict';
}

function isFunction(v: PyValue): v is PyFunction {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && '__type' in v && v.__type === 'function';
}

function isModule(v: PyValue): v is PyModule {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && '__type' in v && v.__type === 'module';
}

function isTruthy(v: PyValue): boolean {
  if (v === null || v === false) return false;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (isDict(v)) return v.entries.size > 0;
  return true;
}

function formatPyValue(v: PyValue, repr = false): string {
  if (v === null) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
  if (typeof v === 'string') return repr ? `'${v}'` : v;
  if (Array.isArray(v)) {
    return `[${v.map((item) => formatPyValue(item, true)).join(', ')}]`;
  }
  if (isDict(v)) {
    const parts: string[] = [];
    v.entries.forEach((val, key) => {
      parts.push(`'${key}': ${formatPyValue(val, true)}`);
    });
    return `{${parts.join(', ')}}`;
  }
  if (isFunction(v)) return `<function ${v.name}>`;
  if (isModule(v)) return `<module '${v.name}'>`;
  return String(v);
}

function toIterable(v: PyValue, line?: number): PyValue[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split('');
  if (isDict(v)) return Array.from(v.entries.keys());
  throw new PythonError('TypeError: object is not iterable', line);
}

function toNumber(v: PyValue, line?: number): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  throw new PythonError(`TypeError: expected number, got ${typeof v}`, line);
}

// --- Expression Evaluator ---

interface EvalContext {
  output: string[];
  steps: number;
  maxSteps: number;
  depth: number;
  maxDepth: number;
}

class ExprParser {
  tokens: Token[];
  pos = 0;
  scope: Scope;
  ctx: EvalContext;
  line?: number;

  constructor(tokens: Token[], scope: Scope, ctx: EvalContext, line?: number) {
    this.tokens = tokens;
    this.scope = scope;
    this.ctx = ctx;
    this.line = line;
  }

  peek(): Token {
    return this.tokens[this.pos] ?? { type: 'EOF', value: '' };
  }

  consume(expectedValue?: string): Token {
    const tok = this.peek();
    if (expectedValue !== undefined && tok.value !== expectedValue) {
      throw new PythonError(
        `SyntaxError: expected '${expectedValue}', got '${tok.value || 'EOF'}'`,
        this.line
      );
    }
    this.pos++;
    return tok;
  }

  parse(): PyValue {
    const first = this.parseTernary();
    if (this.peek().type === 'PUNC' && this.peek().value === ',') {
      const items: PyValue[] = [first];
      while (this.peek().type === 'PUNC' && this.peek().value === ',') {
        this.consume(',');
        if (this.peek().type === 'EOF') break;
        items.push(this.parseTernary());
      }
      if (this.peek().type !== 'EOF') {
        throw new PythonError(
          `SyntaxError: unexpected token '${this.peek().value}'`,
          this.line
        );
      }
      return items;
    }
    if (this.peek().type !== 'EOF') {
      throw new PythonError(
        `SyntaxError: unexpected token '${this.peek().value}'`,
        this.line
      );
    }
    return first;
  }

  parseTernary(): PyValue {
    const expr = this.parseOr();
    if (this.peek().type === 'OP' && this.peek().value === 'if') {
      this.consume('if');
      const cond = this.parseOr();
      this.consume('else');
      const alt = this.parseTernary();
      return isTruthy(cond) ? expr : alt;
    }
    return expr;
  }

  parseOr(): PyValue {
    let left = this.parseAnd();
    while (this.peek().type === 'OP' && this.peek().value === 'or') {
      this.consume('or');
      const right = this.parseAnd();
      left = isTruthy(left) ? left : right;
    }
    return left;
  }

  parseAnd(): PyValue {
    let left = this.parseNot();
    while (this.peek().type === 'OP' && this.peek().value === 'and') {
      this.consume('and');
      const right = this.parseNot();
      left = isTruthy(left) ? right : left;
    }
    return left;
  }

  parseNot(): PyValue {
    if (this.peek().type === 'OP' && this.peek().value === 'not') {
      this.consume('not');
      return !isTruthy(this.parseNot());
    }
    return this.parseComparison();
  }

  parseComparison(): PyValue {
    let left = this.parseAddSub();
    const cmpOps = new Set(['==', '!=', '<', '<=', '>', '>=', 'in', 'is']);

    while (
      this.peek().type === 'OP' &&
      (cmpOps.has(this.peek().value) ||
        (this.peek().value === 'not' && this.tokens[this.pos + 1]?.value === 'in'))
    ) {
      let op = this.consume().value;
      if (op === 'not' && this.peek().value === 'in') {
        this.consume('in');
        op = 'not in';
      }
      const right = this.parseAddSub();
      switch (op) {
        case '==':
          left = left === right;
          break;
        case '!=':
          left = left !== right;
          break;
        case '<':
          left = toNumber(left, this.line) < toNumber(right, this.line);
          break;
        case '<=':
          left = toNumber(left, this.line) <= toNumber(right, this.line);
          break;
        case '>':
          left = toNumber(left, this.line) > toNumber(right, this.line);
          break;
        case '>=':
          left = toNumber(left, this.line) >= toNumber(right, this.line);
          break;
        case 'is':
          left = left === right;
          break;
        case 'in':
          if (typeof right === 'string' && typeof left === 'string') {
            left = right.includes(left);
          } else {
            left = toIterable(right, this.line).includes(left);
          }
          break;
        case 'not in':
          if (typeof right === 'string' && typeof left === 'string') {
            left = !right.includes(left);
          } else {
            left = !toIterable(right, this.line).includes(left);
          }
          break;
      }
    }
    return left;
  }

  parseAddSub(): PyValue {
    let left = this.parseMulDiv();
    while (this.peek().type === 'OP' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseMulDiv();
      if (op === '+') {
        if (typeof left === 'string' && typeof right === 'string') {
          left = left + right;
        } else if (Array.isArray(left) && Array.isArray(right)) {
          left = [...left, ...right];
        } else {
          left = toNumber(left, this.line) + toNumber(right, this.line);
        }
      } else {
        left = toNumber(left, this.line) - toNumber(right, this.line);
      }
    }
    return left;
  }

  parseMulDiv(): PyValue {
    let left = this.parseUnary();
    while (
      this.peek().type === 'OP' &&
      ['*', '/', '//', '%'].includes(this.peek().value)
    ) {
      const op = this.consume().value;
      const right = this.parseUnary();
      if (op === '*') {
        if (typeof left === 'string' && typeof right === 'number') {
          left = left.repeat(Math.max(0, Math.floor(right)));
        } else if (Array.isArray(left) && typeof right === 'number') {
          const out: PyValue[] = [];
          for (let k = 0; k < Math.floor(right); k++) out.push(...left);
          left = out;
        } else {
          left = toNumber(left, this.line) * toNumber(right, this.line);
        }
      } else {
        const l = toNumber(left, this.line);
        const r = toNumber(right, this.line);
        if (r === 0) throw new PythonError('ZeroDivisionError: division by zero', this.line);
        if (op === '/') left = l / r;
        else if (op === '//') left = Math.floor(l / r);
        else left = ((l % r) + r) % r;
      }
    }
    return left;
  }

  parseUnary(): PyValue {
    if (this.peek().type === 'OP' && (this.peek().value === '-' || this.peek().value === '+')) {
      const op = this.consume().value;
      const val = toNumber(this.parseUnary(), this.line);
      return op === '-' ? -val : val;
    }
    return this.parsePower();
  }

  parsePower(): PyValue {
    const base = this.parsePostfix();
    if (this.peek().type === 'OP' && this.peek().value === '**') {
      this.consume('**');
      const exp = this.parseUnary();
      return Math.pow(toNumber(base, this.line), toNumber(exp, this.line));
    }
    return base;
  }

  parsePostfix(): PyValue {
    let val = this.parsePrimary();

    while (true) {
      const next = this.peek();
      if (next.type === 'PUNC' && next.value === '(') {
        val = this.parseCall(val);
      } else if (next.type === 'PUNC' && next.value === '[') {
        this.consume('[');
        // Check slice syntax [start:end]
        let startVal: PyValue = null;
        let isSlice = false;
        if (this.peek().value === ':') {
          isSlice = true;
        } else {
          startVal = this.parseTernary();
          if (this.peek().value === ':') isSlice = true;
        }

        if (isSlice) {
          this.consume(':');
          let endVal: PyValue = null;
          if (this.peek().value !== ']') {
            endVal = this.parseTernary();
          }
          this.consume(']');
          if (Array.isArray(val) || typeof val === 'string') {
            const len = val.length;
            const s = startVal === null ? 0 : toNumber(startVal, this.line);
            const e = endVal === null ? len : toNumber(endVal, this.line);
            const normS = s < 0 ? Math.max(0, len + s) : s;
            const normE = e < 0 ? Math.max(0, len + e) : e;
            val = val.slice(normS, normE);
          } else {
            throw new PythonError('TypeError: object is not subscriptable', this.line);
          }
        } else {
          this.consume(']');
          if (Array.isArray(val) || typeof val === 'string') {
            let idx = toNumber(startVal, this.line);
            if (idx < 0) idx = val.length + idx;
            if (idx < 0 || idx >= val.length) {
              throw new PythonError('IndexError: index out of range', this.line);
            }
            val = val[idx];
          } else if (isDict(val)) {
            const key = String(startVal);
            if (!val.entries.has(key)) {
              throw new PythonError(`KeyError: '${key}'`, this.line);
            }
            val = val.entries.get(key)!;
          } else {
            throw new PythonError('TypeError: object is not subscriptable', this.line);
          }
        }
      } else if (next.type === 'PUNC' && next.value === '.') {
        this.consume('.');
        const attr = this.consume().value;
        val = this.resolveAttribute(val, attr);
      } else {
        break;
      }
    }

    return val;
  }

  resolveAttribute(target: PyValue, attr: string): PyValue {
    if (isModule(target)) {
      if (attr in target.members) {
        return target.members[attr] as PyValue;
      }
      throw new PythonError(
        `AttributeError: module '${target.name}' has no attribute '${attr}'`,
        this.line
      );
    }

    if (Array.isArray(target)) {
      if (attr === 'append') {
        return ((item: PyValue) => {
          target.push(item);
          return null;
        }) as unknown as PyValue;
      }
      if (attr === 'pop') {
        return (() => {
          if (target.length === 0) throw new PythonError('IndexError: pop from empty list', this.line);
          return target.pop() ?? null;
        }) as unknown as PyValue;
      }
      if (attr === 'sort') {
        return (() => {
          target.sort((a, b) => Number(a) - Number(b));
          return null;
        }) as unknown as PyValue;
      }
    }

    if (typeof target === 'string') {
      if (attr === 'upper') return (() => target.toUpperCase()) as unknown as PyValue;
      if (attr === 'lower') return (() => target.toLowerCase()) as unknown as PyValue;
      if (attr === 'strip') return (() => target.trim()) as unknown as PyValue;
      if (attr === 'split') {
        return ((sep?: PyValue) =>
          sep === undefined ? target.trim().split(/\s+/) : target.split(String(sep))) as unknown as PyValue;
      }
      if (attr === 'join') {
        return ((iterable: PyValue) =>
          toIterable(iterable, this.line).map((x) => formatPyValue(x)).join(target)) as unknown as PyValue;
      }
    }

    if (isDict(target)) {
      if (attr === 'keys') return (() => Array.from(target.entries.keys())) as unknown as PyValue;
      if (attr === 'values') return (() => Array.from(target.entries.values())) as unknown as PyValue;
      if (attr === 'get') {
        return ((k: PyValue, def: PyValue = null) =>
          target.entries.get(String(k)) ?? def) as unknown as PyValue;
      }
    }

    throw new PythonError(`AttributeError: object has no attribute '${attr}'`, this.line);
  }

  parseCall(callee: PyValue): PyValue {
    this.consume('(');
    const args: PyValue[] = [];
    const kwargs: Record<string, PyValue> = {};

    while (this.peek().value !== ')') {
      // Check keyword arg: IDENT = expr
      if (
        this.peek().type === 'IDENT' &&
        this.tokens[this.pos + 1]?.type === 'OP' &&
        this.tokens[this.pos + 1]?.value === '='
      ) {
        const key = this.consume().value;
        this.consume('=');
        kwargs[key] = this.parseTernary();
      } else {
        args.push(this.parseTernary());
      }
      if (this.peek().value === ',') {
        this.consume(',');
      } else {
        break;
      }
    }
    this.consume(')');

    if (typeof callee === 'function') {
      return (callee as (...a: PyValue[]) => PyValue)(...args, ...(Object.keys(kwargs).length ? [{ __kwargs: kwargs } as unknown as PyValue] : []));
    }

    if (isFunction(callee)) {
      if (this.ctx.depth >= this.ctx.maxDepth) {
        throw new PythonError('RecursionError: maximum recursion depth exceeded', this.line);
      }
      const fnScope = new Scope(callee.closure);
      callee.params.forEach((param, idx) => {
        if (param in kwargs) fnScope.set(param, kwargs[param]);
        else if (idx < args.length) fnScope.set(param, args[idx]);
        else {
          throw new PythonError(
            `TypeError: ${callee.name}() missing required argument '${param}'`,
            this.line
          );
        }
      });

      this.ctx.depth++;
      try {
        executeStatements(callee.body, fnScope, this.ctx);
      } catch (err) {
        if (err instanceof ReturnSignal) {
          this.ctx.depth--;
          return err.value;
        }
        this.ctx.depth--;
        throw err;
      }
      this.ctx.depth--;
      return null;
    }

    throw new PythonError('TypeError: object is not callable', this.line);
  }

  parsePrimary(): PyValue {
    const tok = this.peek();

    if (tok.type === 'NUMBER') {
      this.consume();
      return Number(tok.value);
    }

    if (tok.type === 'STRING') {
      this.consume();
      return tok.value;
    }

    if (tok.type === 'FSTRING') {
      this.consume();
      return evaluateFString(tok.value, this.scope, this.ctx, this.line);
    }

    if (tok.type === 'IDENT') {
      this.consume();
      if (tok.value === 'True') return true;
      if (tok.value === 'False') return false;
      if (tok.value === 'None') return null;
      return this.scope.get(tok.value, this.line);
    }

    // Parenthesized expression or tuple
    if (tok.type === 'PUNC' && tok.value === '(') {
      this.consume('(');
      if (this.peek().value === ')') {
        this.consume(')');
        return [];
      }
      const first = this.parseTernary();
      if (this.peek().value === ',') {
        const items: PyValue[] = [first];
        while (this.peek().value === ',') {
          this.consume(',');
          if (this.peek().value === ')') break;
          items.push(this.parseTernary());
        }
        this.consume(')');
        return items;
      }
      this.consume(')');
      return first;
    }

    // List literal or list comprehension
    if (tok.type === 'PUNC' && tok.value === '[') {
      return this.parseListOrComprehension();
    }

    // Dict literal
    if (tok.type === 'PUNC' && tok.value === '{') {
      this.consume('{');
      const entries = new Map<string, PyValue>();
      while (this.peek().value !== '}') {
        const key = this.parseTernary();
        this.consume(':');
        const val = this.parseTernary();
        entries.set(String(key), val);
        if (this.peek().value === ',') this.consume(',');
        else break;
      }
      this.consume('}');
      return { __type: 'dict', entries };
    }

    throw new PythonError(`SyntaxError: invalid syntax near '${tok.value || 'EOF'}'`, this.line);
  }

  parseListOrComprehension(): PyValue[] {
    this.consume('[');
    if (this.peek().value === ']') {
      this.consume(']');
      return [];
    }

    // Snapshot token range up to matching ']' to detect top-level 'for'
    let depth = 0;
    let forIndex = -1;
    for (let k = this.pos; k < this.tokens.length; k++) {
      const tv = this.tokens[k].value;
      if (tv === '[' || tv === '(' || tv === '{') depth++;
      else if (tv === ']' || tv === ')' || tv === '}') {
        if (depth === 0) break;
        depth--;
      } else if (depth === 0 && this.tokens[k].type === 'OP' && tv === 'for') {
        forIndex = k;
        break;
      }
    }

    if (forIndex !== -1) {
      // List comprehension: [expr_tokens for var_tokens in iter_tokens (if cond_tokens)?]
      const exprTokens = this.tokens.slice(this.pos, forIndex);
      this.pos = forIndex + 1; // skip 'for'

      const targetVars: string[] = [];
      while (this.peek().type === 'IDENT') {
        targetVars.push(this.consume().value);
        if (this.peek().value === ',') this.consume(',');
        else break;
      }
      this.consume('in');

      // Find optional 'if' or closing ']'
      let ifIndex = -1;
      let closeIndex = -1;
      let d = 0;
      for (let k = this.pos; k < this.tokens.length; k++) {
        const tv = this.tokens[k].value;
        if (tv === '[' || tv === '(' || tv === '{') d++;
        else if (tv === ']' || tv === ')' || tv === '}') {
          if (d === 0 && tv === ']') {
            closeIndex = k;
            break;
          }
          d--;
        } else if (d === 0 && this.tokens[k].type === 'OP' && tv === 'if' && ifIndex === -1) {
          ifIndex = k;
        }
      }

      if (closeIndex === -1) {
        throw new PythonError('SyntaxError: unclosed list comprehension', this.line);
      }

      const iterEnd = ifIndex !== -1 ? ifIndex : closeIndex;
      const iterTokens = this.tokens.slice(this.pos, iterEnd);
      const condTokens = ifIndex !== -1 ? this.tokens.slice(ifIndex + 1, closeIndex) : null;

      this.pos = closeIndex + 1;

      const iterable = toIterable(
        new ExprParser([...iterTokens, { type: 'EOF', value: '' }], this.scope, this.ctx, this.line).parse(),
        this.line
      );

      const results: PyValue[] = [];
      for (const item of iterable) {
        if (++this.ctx.steps > this.ctx.maxSteps) {
          throw new PythonError('RuntimeError: execution step limit exceeded', this.line);
        }
        const compScope = new Scope(this.scope);
        bindTargetVars(targetVars, item, compScope, this.line);

        if (condTokens) {
          const cond = new ExprParser(
            [...condTokens, { type: 'EOF', value: '' }],
            compScope,
            this.ctx,
            this.line
          ).parse();
          if (!isTruthy(cond)) continue;
        }

        const evaluated = new ExprParser(
          [...exprTokens, { type: 'EOF', value: '' }],
          compScope,
          this.ctx,
          this.line
        ).parse();
        results.push(evaluated);
      }
      return results;
    }

    const items: PyValue[] = [];
    while (this.peek().value !== ']') {
      items.push(this.parseTernary());
      if (this.peek().value === ',') this.consume(',');
      else break;
    }
    this.consume(']');
    return items;
  }
}

function evaluateFString(raw: string, scope: Scope, ctx: EvalContext, line?: number): string {
  let out = '';
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === '{') {
      if (raw[i + 1] === '{') {
        out += '{';
        i += 2;
        continue;
      }
      let depth = 1;
      let j = i + 1;
      while (j < raw.length && depth > 0) {
        if (raw[j] === '{') depth++;
        else if (raw[j] === '}') depth--;
        j++;
      }
      if (depth !== 0) throw new PythonError('SyntaxError: unclosed brace in f-string', line);
      const inner = raw.slice(i + 1, j - 1);

      // Check optional format specifier like :.2f or :.3f
      let exprStr = inner;
      let fmtSpec = '';
      const colonIdx = findTopLevelColon(inner);
      if (colonIdx !== -1) {
        exprStr = inner.slice(0, colonIdx);
        fmtSpec = inner.slice(colonIdx + 1).trim();
      }

      const val = evalExpression(exprStr, scope, ctx, line);
      if (fmtSpec) {
        const match = fmtSpec.match(/^\.(\d+)f$/);
        if (match && typeof val === 'number') {
          out += val.toFixed(Number(match[1]));
        } else {
          out += formatPyValue(val);
        }
      } else {
        out += formatPyValue(val);
      }
      i = j;
    } else if (raw[i] === '}' && raw[i + 1] === '}') {
      out += '}';
      i += 2;
    } else {
      out += raw[i];
      i++;
    }
  }
  return out;
}

function findTopLevelColon(str: string): number {
  let depth = 0;
  let inQuote: string | null = null;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuote) {
      if (ch === inQuote && str[i - 1] !== '\\') inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
    } else if (ch === ':' && depth === 0) {
      return i;
    }
  }
  return -1;
}

function evalExpression(expr: string, scope: Scope, ctx: EvalContext, line?: number): PyValue {
  const tokens = tokenizeExpr(expr, line);
  return new ExprParser(tokens, scope, ctx, line).parse();
}

function bindTargetVars(vars: string[], value: PyValue, scope: Scope, line?: number) {
  if (vars.length === 1) {
    scope.assign(vars[0], value);
    return;
  }
  const items = toIterable(value, line);
  if (items.length !== vars.length) {
    throw new PythonError(
      `ValueError: expected ${vars.length} values to unpack, got ${items.length}`,
      line
    );
  }
  vars.forEach((v, i) => scope.assign(v, items[i]));
}

// --- Statement Parser (Indentation-based) ---

type Statement =
  | { kind: 'expr'; expr: string; line: number }
  | { kind: 'assign'; targets: string[]; op: string; expr: string; line: number }
  | { kind: 'indexAssign'; target: string; indexExpr: string; expr: string; line: number }
  | { kind: 'if'; branches: { cond: string | null; body: Statement[] }[]; line: number }
  | { kind: 'for'; targets: string[]; iterExpr: string; body: Statement[]; line: number }
  | { kind: 'while'; cond: string; body: Statement[]; line: number }
  | { kind: 'def'; name: string; params: string[]; body: Statement[]; line: number }
  | { kind: 'return'; expr: string | null; line: number }
  | { kind: 'import'; moduleName: string; line: number }
  | { kind: 'break'; line: number }
  | { kind: 'continue'; line: number }
  | { kind: 'pass'; line: number };

interface SourceLine {
  indent: number;
  text: string;
  lineNum: number;
}

function stripInlineComment(line: string): string {
  let inQuote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === inQuote && line[i - 1] !== '\\') inQuote = null;
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === '#') {
      return line.slice(0, i);
    }
  }
  return line;
}

function preprocessLines(code: string): SourceLine[] {
  const rawLines = code.split('\n');
  const lines: SourceLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const cleaned = stripInlineComment(rawLines[i]).replace(/\s+$/, '');
    if (!cleaned.trim()) continue;
    const indentMatch = cleaned.match(/^ */);
    const indent = indentMatch ? indentMatch[0].length : 0;
    lines.push({
      indent,
      text: cleaned.trim(),
      lineNum: i + 1,
    });
  }
  return lines;
}

function findTopLevelAssign(text: string): { lhs: string; op: string; rhs: string } | null {
  let depth = 0;
  let inQuote: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === inQuote && text[i - 1] !== '\\') inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
    } else if (depth === 0) {
      const two = text.slice(i, i + 2);
      if (['==', '!=', '<=', '>='].includes(two)) {
        i++;
        continue;
      }
      if (['+=', '-=', '*=', '/='].includes(two)) {
        return {
          lhs: text.slice(0, i).trim(),
          op: two,
          rhs: text.slice(i + 2).trim(),
        };
      }
      if (ch === '=') {
        return {
          lhs: text.slice(0, i).trim(),
          op: '=',
          rhs: text.slice(i + 1).trim(),
        };
      }
    }
  }
  return null;
}

function parseBlock(lines: SourceLine[], startIdx: number, expectedIndent: number): { stmts: Statement[]; nextIdx: number } {
  const stmts: Statement[] = [];
  let i = startIdx;

  while (i < lines.length) {
    const current = lines[i];
    if (current.indent < expectedIndent) break;
    if (current.indent > expectedIndent) {
      throw new PythonError('IndentationError: unexpected indent', current.lineNum);
    }

    const text = current.text;
    const lineNum = current.lineNum;

    if (text === 'pass') {
      stmts.push({ kind: 'pass', line: lineNum });
      i++;
      continue;
    }
    if (text === 'break') {
      stmts.push({ kind: 'break', line: lineNum });
      i++;
      continue;
    }
    if (text === 'continue') {
      stmts.push({ kind: 'continue', line: lineNum });
      i++;
      continue;
    }
    if (text === 'return' || text.startsWith('return ')) {
      const expr = text === 'return' ? null : text.slice(7).trim();
      stmts.push({ kind: 'return', expr, line: lineNum });
      i++;
      continue;
    }
    if (text.startsWith('import ')) {
      const moduleName = text.slice(7).trim();
      stmts.push({ kind: 'import', moduleName, line: lineNum });
      i++;
      continue;
    }

    if (text.startsWith('def ')) {
      const match = text.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*:$/);
      if (!match) {
        throw new PythonError('SyntaxError: invalid function definition', lineNum);
      }
      const name = match[1];
      const params = match[2]
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      const nextLine = lines[i + 1];
      if (!nextLine || nextLine.indent <= expectedIndent) {
        throw new PythonError('IndentationError: expected an indented block', lineNum);
      }
      const parsedBody = parseBlock(lines, i + 1, nextLine.indent);
      stmts.push({ kind: 'def', name, params, body: parsedBody.stmts, line: lineNum });
      i = parsedBody.nextIdx;
      continue;
    }

    if (text.startsWith('if ') && text.endsWith(':')) {
      const branches: { cond: string | null; body: Statement[] }[] = [];
      const cond = text.slice(3, -1).trim();
      const nextLine = lines[i + 1];
      if (!nextLine || nextLine.indent <= expectedIndent) {
        throw new PythonError('IndentationError: expected an indented block', lineNum);
      }
      const firstBody = parseBlock(lines, i + 1, nextLine.indent);
      branches.push({ cond, body: firstBody.stmts });
      i = firstBody.nextIdx;

      while (i < lines.length && lines[i].indent === expectedIndent) {
        const branchText = lines[i].text;
        if (branchText.startsWith('elif ') && branchText.endsWith(':')) {
          const elifCond = branchText.slice(5, -1).trim();
          const bNext = lines[i + 1];
          if (!bNext || bNext.indent <= expectedIndent) {
            throw new PythonError('IndentationError: expected an indented block', lines[i].lineNum);
          }
          const bParsed = parseBlock(lines, i + 1, bNext.indent);
          branches.push({ cond: elifCond, body: bParsed.stmts });
          i = bParsed.nextIdx;
        } else if (branchText === 'else:') {
          const bNext = lines[i + 1];
          if (!bNext || bNext.indent <= expectedIndent) {
            throw new PythonError('IndentationError: expected an indented block', lines[i].lineNum);
          }
          const bParsed = parseBlock(lines, i + 1, bNext.indent);
          branches.push({ cond: null, body: bParsed.stmts });
          i = bParsed.nextIdx;
          break;
        } else {
          break;
        }
      }

      stmts.push({ kind: 'if', branches, line: lineNum });
      continue;
    }

    if (text.startsWith('for ') && text.endsWith(':')) {
      const match = text.match(/^for\s+(.+?)\s+in\s+(.+):$/);
      if (!match) {
        throw new PythonError('SyntaxError: invalid for loop syntax', lineNum);
      }
      const targets = match[1].split(',').map((t) => t.trim()).filter(Boolean);
      const iterExpr = match[2].trim();
      const nextLine = lines[i + 1];
      if (!nextLine || nextLine.indent <= expectedIndent) {
        throw new PythonError('IndentationError: expected an indented block', lineNum);
      }
      const bodyParsed = parseBlock(lines, i + 1, nextLine.indent);
      stmts.push({ kind: 'for', targets, iterExpr, body: bodyParsed.stmts, line: lineNum });
      i = bodyParsed.nextIdx;
      continue;
    }

    if (text.startsWith('while ') && text.endsWith(':')) {
      const cond = text.slice(6, -1).trim();
      const nextLine = lines[i + 1];
      if (!nextLine || nextLine.indent <= expectedIndent) {
        throw new PythonError('IndentationError: expected an indented block', lineNum);
      }
      const bodyParsed = parseBlock(lines, i + 1, nextLine.indent);
      stmts.push({ kind: 'while', cond, body: bodyParsed.stmts, line: lineNum });
      i = bodyParsed.nextIdx;
      continue;
    }

    const assign = findTopLevelAssign(text);
    if (assign) {
      const idxMatch = assign.lhs.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[(.+)\]$/);
      if (idxMatch && assign.op === '=') {
        stmts.push({
          kind: 'indexAssign',
          target: idxMatch[1],
          indexExpr: idxMatch[2],
          expr: assign.rhs,
          line: lineNum,
        });
      } else {
        const targets = assign.lhs.split(',').map((t) => t.trim()).filter(Boolean);
        stmts.push({
          kind: 'assign',
          targets,
          op: assign.op,
          expr: assign.rhs,
          line: lineNum,
        });
      }
      i++;
      continue;
    }

    stmts.push({ kind: 'expr', expr: text, line: lineNum });
    i++;
  }

  return { stmts, nextIdx: i };
}

function executeStatements(stmts: Statement[], scope: Scope, ctx: EvalContext): void {
  for (const stmt of stmts) {
    if (++ctx.steps > ctx.maxSteps) {
      throw new PythonError('RuntimeError: execution step limit exceeded', stmt.line);
    }

    switch (stmt.kind) {
      case 'pass':
        break;

      case 'break':
        throw new BreakSignal();

      case 'continue':
        throw new ContinueSignal();

      case 'return': {
        const val = stmt.expr !== null ? evalExpression(stmt.expr, scope, ctx, stmt.line) : null;
        throw new ReturnSignal(val);
      }

      case 'import': {
        if (stmt.moduleName === 'math') {
          const mathMod: PyModule = {
            __type: 'module',
            name: 'math',
            members: {
              pi: Math.PI,
              e: Math.E,
              sqrt: (x: PyValue) => Math.sqrt(toNumber(x, stmt.line)),
              pow: (a: PyValue, b: PyValue) => Math.pow(toNumber(a, stmt.line), toNumber(b, stmt.line)),
              floor: (x: PyValue) => Math.floor(toNumber(x, stmt.line)),
              ceil: (x: PyValue) => Math.ceil(toNumber(x, stmt.line)),
              sin: (x: PyValue) => Math.sin(toNumber(x, stmt.line)),
              cos: (x: PyValue) => Math.cos(toNumber(x, stmt.line)),
              log: (x: PyValue) => Math.log(toNumber(x, stmt.line)),
            },
          };
          scope.set('math', mathMod);
        } else {
          throw new PythonError(
            `ModuleNotFoundError: No module named '${stmt.moduleName}' (supported: math)`,
            stmt.line
          );
        }
        break;
      }

      case 'def': {
        const fn: PyFunction = {
          __type: 'function',
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
          closure: scope,
        };
        scope.set(stmt.name, fn);
        break;
      }

      case 'assign': {
        const val = evalExpression(stmt.expr, scope, ctx, stmt.line);
        if (stmt.op === '=') {
          bindTargetVars(stmt.targets, val, scope, stmt.line);
        } else {
          if (stmt.targets.length !== 1) {
            throw new PythonError('SyntaxError: augmented assignment requires a single target', stmt.line);
          }
          const name = stmt.targets[0];
          const prev = scope.get(name, stmt.line);
          let nextVal: PyValue;
          if (stmt.op === '+=') {
            if (typeof prev === 'string' && typeof val === 'string') nextVal = prev + val;
            else if (Array.isArray(prev) && Array.isArray(val)) nextVal = [...prev, ...val];
            else nextVal = toNumber(prev, stmt.line) + toNumber(val, stmt.line);
          } else if (stmt.op === '-=') {
            nextVal = toNumber(prev, stmt.line) - toNumber(val, stmt.line);
          } else if (stmt.op === '*=') {
            nextVal = toNumber(prev, stmt.line) * toNumber(val, stmt.line);
          } else {
            const denom = toNumber(val, stmt.line);
            if (denom === 0) throw new PythonError('ZeroDivisionError: division by zero', stmt.line);
            nextVal = toNumber(prev, stmt.line) / denom;
          }
          scope.assign(name, nextVal);
        }
        break;
      }

      case 'indexAssign': {
        const container = scope.get(stmt.target, stmt.line);
        const key = evalExpression(stmt.indexExpr, scope, ctx, stmt.line);
        const val = evalExpression(stmt.expr, scope, ctx, stmt.line);
        if (Array.isArray(container)) {
          let idx = toNumber(key, stmt.line);
          if (idx < 0) idx = container.length + idx;
          if (idx < 0 || idx >= container.length) {
            throw new PythonError('IndexError: list assignment index out of range', stmt.line);
          }
          container[idx] = val;
        } else if (isDict(container)) {
          container.entries.set(String(key), val);
        } else {
          throw new PythonError('TypeError: object does not support item assignment', stmt.line);
        }
        break;
      }

      case 'if': {
        for (const branch of stmt.branches) {
          if (branch.cond === null || isTruthy(evalExpression(branch.cond, scope, ctx, stmt.line))) {
            executeStatements(branch.body, scope, ctx);
            break;
          }
        }
        break;
      }

      case 'for': {
        const iterable = toIterable(evalExpression(stmt.iterExpr, scope, ctx, stmt.line), stmt.line);
        for (const item of iterable) {
          if (++ctx.steps > ctx.maxSteps) {
            throw new PythonError('RuntimeError: execution step limit exceeded', stmt.line);
          }
          bindTargetVars(stmt.targets, item, scope, stmt.line);
          try {
            executeStatements(stmt.body, scope, ctx);
          } catch (err) {
            if (err instanceof ContinueSignal) continue;
            if (err instanceof BreakSignal) break;
            throw err;
          }
        }
        break;
      }

      case 'while': {
        while (isTruthy(evalExpression(stmt.cond, scope, ctx, stmt.line))) {
          if (++ctx.steps > ctx.maxSteps) {
            throw new PythonError('RuntimeError: execution step limit exceeded', stmt.line);
          }
          try {
            executeStatements(stmt.body, scope, ctx);
          } catch (err) {
            if (err instanceof ContinueSignal) continue;
            if (err instanceof BreakSignal) break;
            throw err;
          }
        }
        break;
      }

      case 'expr': {
        evalExpression(stmt.expr, scope, ctx, stmt.line);
        break;
      }
    }
  }
}

function createBuiltinScope(ctx: EvalContext): Scope {
  const scope = new Scope();

  const wrap = (fn: (...args: PyValue[]) => PyValue) => fn as unknown as PyValue;

  scope.set(
    'print',
    wrap((...rawArgs: PyValue[]) => {
      let sep = ' ';
      const args = [...rawArgs];
      const last = args[args.length - 1] as unknown as { __kwargs?: Record<string, PyValue> } | undefined;
      if (last && typeof last === 'object' && '__kwargs' in last && last.__kwargs) {
        args.pop();
        if ('sep' in last.__kwargs) sep = formatPyValue(last.__kwargs.sep);
      }
      ctx.output.push(args.map((a) => formatPyValue(a)).join(sep));
      return null;
    })
  );

  scope.set(
    'range',
    wrap((...args: PyValue[]) => {
      if (args.length < 1 || args.length > 3) {
        throw new PythonError('TypeError: range() expects 1 to 3 arguments');
      }
      let start = 0;
      let stop = 0;
      let step = 1;
      if (args.length === 1) {
        stop = toNumber(args[0]);
      } else if (args.length === 2) {
        start = toNumber(args[0]);
        stop = toNumber(args[1]);
      } else {
        start = toNumber(args[0]);
        stop = toNumber(args[1]);
        step = toNumber(args[2]);
      }
      if (step === 0) throw new PythonError('ValueError: range() arg 3 must not be zero');
      const res: number[] = [];
      if (step > 0) {
        for (let k = start; k < stop && res.length < 10000; k += step) res.push(k);
      } else {
        for (let k = start; k > stop && res.length < 10000; k += step) res.push(k);
      }
      return res;
    })
  );

  scope.set(
    'len',
    wrap((x: PyValue) => {
      if (Array.isArray(x) || typeof x === 'string') return x.length;
      if (isDict(x)) return x.entries.size;
      throw new PythonError('TypeError: object has no len()');
    })
  );

  scope.set(
    'sum',
    wrap((iterable: PyValue) =>
      toIterable(iterable).reduce<number>((acc, v) => acc + toNumber(v), 0)
    )
  );

  scope.set(
    'min',
    wrap((...args: PyValue[]) => {
      const items = args.length === 1 ? toIterable(args[0]) : args;
      if (items.length === 0) throw new PythonError('ValueError: min() arg is an empty sequence');
      return Math.min(...items.map((x) => toNumber(x)));
    })
  );

  scope.set(
    'max',
    wrap((...args: PyValue[]) => {
      const items = args.length === 1 ? toIterable(args[0]) : args;
      if (items.length === 0) throw new PythonError('ValueError: max() arg is an empty sequence');
      return Math.max(...items.map((x) => toNumber(x)));
    })
  );

  scope.set('abs', wrap((x: PyValue) => Math.abs(toNumber(x))));

  scope.set(
    'round',
    wrap((x: PyValue, digits: PyValue = 0) => {
      const factor = Math.pow(10, toNumber(digits));
      return Math.round(toNumber(x) * factor) / factor;
    })
  );

  scope.set('int', wrap((x: PyValue) => Math.trunc(Number(x))));
  scope.set('float', wrap((x: PyValue) => Number(x)));
  scope.set('str', wrap((x: PyValue) => formatPyValue(x)));
  scope.set('bool', wrap((x: PyValue) => isTruthy(x)));
  scope.set('list', wrap((x: PyValue) => [...toIterable(x)]));

  scope.set(
    'sorted',
    wrap((...rawArgs: PyValue[]) => {
      const args = [...rawArgs];
      let reverse = false;
      const last = args[args.length - 1] as unknown as { __kwargs?: Record<string, PyValue> } | undefined;
      if (last && typeof last === 'object' && '__kwargs' in last && last.__kwargs) {
        args.pop();
        reverse = Boolean(last.__kwargs.reverse);
      }
      const copy = [...toIterable(args[0])].sort((a, b) =>
        typeof a === 'number' && typeof b === 'number'
          ? a - b
          : formatPyValue(a).localeCompare(formatPyValue(b))
      );
      return reverse ? copy.reverse() : copy;
    })
  );

  scope.set(
    'enumerate',
    wrap((iterable: PyValue, start: PyValue = 0) => {
      const offset = toNumber(start);
      return toIterable(iterable).map((val, idx) => [offset + idx, val]);
    })
  );

  scope.set(
    'zip',
    wrap((...iterables: PyValue[]) => {
      const arrays = iterables.map((it) => toIterable(it));
      const minLen = arrays.length === 0 ? 0 : Math.min(...arrays.map((a) => a.length));
      const zipped: PyValue[][] = [];
      for (let idx = 0; idx < minLen; idx++) {
        zipped.push(arrays.map((a) => a[idx]));
      }
      return zipped;
    })
  );

  return scope;
}

export function runPythonCode(code: string): PythonRunResult {
  const startTime = performance.now();
  const ctx: EvalContext = {
    output: [],
    steps: 0,
    maxSteps: 30000,
    depth: 0,
    maxDepth: 100,
  };

  try {
    const lines = preprocessLines(code);
    const { stmts } = parseBlock(lines, 0, lines[0]?.indent ?? 0);
    const scope = createBuiltinScope(ctx);
    executeStatements(stmts, scope, ctx);

    return {
      output: ctx.output,
      error: null,
      durationMs: performance.now() - startTime,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unexpected Python execution error';
    return {
      output: ctx.output,
      error: message,
      durationMs: performance.now() - startTime,
    };
  }
}
