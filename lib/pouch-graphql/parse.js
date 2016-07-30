module.exports = Parse;

const rspace = /^[ \f\r\t\v\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;

function Parse (schema) {
  if (!(this instanceof Parse)) return new Parse(schema);

  this.original = schema;
  this.str = schema;

  return this.document();
}

Parse.prototype.match = function(pattern) {
  // skip over whitespace
  this.ignored();

  let str = this.str;

  if (typeof pattern === 'string') {
    if (str.substr(0, pattern.length) === pattern) {
      this.str = str.substr(pattern.length);
      return pattern;
    }
  } else {
    let match = pattern.exec(str);
    if (match) {
      this.str = str.substr(match[0].length);
      return match[0];
    }
  }
};

Parse.prototype.required = function (value, name) {
  if (value) return value;
  throw this.error('Expected ' + name + ' but got "' + this.str[0] + '"');
};

Parse.prototype.expect = function(str) {
  this.required(this.match(str), '"' + str + '"');
};

Parse.prototype.ignored = function() {
  let str = this.str;

  while (true) {

    // newline
    if (str[0] === '\n') {
      str = str.substr(1);
      continue;
    }

    // comma
    if (str[0] === ',') {
      str = str.substr(1);
      continue;
    }

    // other spacing
    let m = rspace.exec(str);
    if (m) {
      str = str.substr(m[0].length);
      continue;
    }

    break;
  }

  this.str = str;
};

Parse.prototype.document = function() {
  let definitions = this.list(this.type_definition);

  if (this.str.length) {
    throw this.error('invalid definition (must be either a type, interface, union, scalar, input or extend)');
  }

  // document token
  return {
    kind: 'Document',
    definitions: definitions,
  };
};

Parse.prototype.list = function(node_type) {
  let result = [];

  while (true) {
    let node = this.comment() || node_type.call(this);
    if (node) result.push(node);
    else break;
  }
  return result;
};

Parse.prototype.comment = function() {
  let c = this.match(/^\#[^\n]*/);
  if (c) {
    return {
      kind: 'Comment',
      value: c,
    };
  }
};

Parse.prototype.type_definition = function() {
  return this.object_type_definition()
    || this.interface_type_definition()
    || this.union_type_definition()
    || this.scalar_type_definition()
    || this.enum_type_definition()
    || this.input_object_type_definition()
    || this.type_extension_definition();
};

Parse.prototype.object_type_definition = function() {
  if (this.match('type')) {
    let node = { kind: 'ObjectTypeDefinition' };
    node.name = this.required(this.name(), 'name');
    node.interfaces = this.implements() || [];
    this.expect('{');
    node.fields = this.list(this.field_definition);
    this.expect('}');
    return node;
  }
};

Parse.prototype.field_definition = function() {
  let node = { kind: 'FieldDefinition' };

  node.name = this.name();
  if (!node.name) return;

  node.arguments = this.arguments_definition();
  this.expect(':');
  node.type = this.required(this.type(), 'type');

  return node;
};

Parse.prototype.arguments_definition = function() {
  if (!this.match('(')) return null;
  let args = this.list(this.input_value_definition);
  this.expect(')');
  return args || [];
};

Parse.prototype.input_value_definition = function() {
  let node = { kind: 'InputValueDefinition' };

  node.name = this.name();
  if (!node.name) return;

  this.expect(':');
  node.type = this.required(this.type(), 'type');
  node.defaultValue = this.default_value() || null;

  return node;
};

Parse.prototype.interface_type_definition = function() {
  if (this.match('interface')) {
    let node = { kind: 'InterfaceTypeDefinition' };
    node.name = this.required(this.name(), 'Name');
    this.expect('{');
    node.fields = this.list(this.field_definition);
    this.expect('}');
    return node;
  }
};

Parse.prototype.implements = function() {
  if (this.match('implements')) {
    return this.list(this.named_type);
  }
};

Parse.prototype.union_type_definition = function() {
  if (this.match('union')) {
    let node = { kind: 'UnionTypeDefinition' };
    node.name = this.required(this.name(), 'Name');
    this.expect('=');

    let types = [];
    types.push(this.required(this.named_type(), 'NamedType'));
    while (this.match('|')) {
      types.push(this.required(this.named_type(), 'NamedType'));
    }
    node.types = types;

    return node;
  }
};

Parse.prototype.scalar_type_definition = function() {
  if (this.match('scalar')) {
    let node = { kind: 'ScalarTypeDefinition' };
    node.name = this.required(this.name(), 'Name');
    return node;
  }
};

Parse.prototype.enum_type_definition = function() {
  if (this.match('enum')) {
    let node = { kind: 'EnumTypeDefinition' };
    node.name = this.required(this.name(), 'Name');
    this.expect('{');
    node.values = this.list(this.enum_value_definition);
    this.expect('}');
    return node;
  }
};

Parse.prototype.enum_value_definition = function() {
  let name = this.name();
  if (name) return { kind: 'EnumValueDefinition', name: name };
};

Parse.prototype.input_object_type_definition = function() {
  if (this.match('input')) {
    let node = { kind: 'InputObjectTypeDefinition' };
    node.name = this.required(this.name(), 'Name');
    this.expect('{');
    node.fields = this.list(this.input_value_definition);
    this.expect('}');
    return node;
  }
};

Parse.prototype.type_extension_definition = function() {
  if (this.match('extend')) {
    let node = { kind: 'TypeExtensionDefinition' };
    node.definition = this.required(this.object_type_definition(), 'ObjectTypeDefinition');
    return node;
  }
};

Parse.prototype.name = function() {
  let name = this.match(/^[_A-Za-z][_0-9A-Za-z]*/);
  if (name) {
    return {
      kind: 'Name',
      value: name
    };
  }
};

Parse.prototype.named_type = function() {
  let name = this.name();
  if (name) {
    return {
      kind: 'NamedType',
      name: name
    };
  }
};

Parse.prototype.list_type = function() {
  if (this.match('[')) {
    let node = {
      kind: 'ListType',
      type: this.required(this.type(), 'Type'),
    };
    this.expect(']');
    return node;
  }
};

Parse.prototype.type = function() {
  let t = this.named_type() || this.list_type();
  if (this.match('!')) {
    return { kind: 'NonNullType', type: t };
  }
  return t;
};

Parse.prototype.value = function() {
  return this.number_value()
    || this.string_value()
    || this.boolean_value()
    || this.enum_value()
    || this.list_value()
    || this.object_value();
};

Parse.prototype.number_value = function() {
  let str = this.match(/^(\-?0|\-?[1-9][0-9]*)(\.[0-9]+)?([Ee](\+|\-)?[0-9]+)?/);
  if (str) {
    return {
      kind: 'NumberValue',
      value: JSON.parse(str),
    };
  }
};

Parse.prototype.string_value = function() {
  let str = this.match(/^\"([^\"\\\n]|\\\\|\\\")*\"/);
  if (str) {
    return {
      kind: 'StringValue',
      value: JSON.parse(str),
    };
  }
};

Parse.prototype.boolean_value = function() {
  let TRUE = this.match('true');
  let FALSE = this.match('false');
  if (TRUE || FALSE) {
    return {
      kind: 'BooleanValue',
      value: TRUE ? true : false,
    };
  }
};

Parse.prototype.enum_value = function() {
  let n = this.name();
  if (n) {
    return {
      kind: 'EnumValue',
      name: n,
    };
  }
};

Parse.prototype.list_value = function () {
  if (this.match('[')) {
    let node = { kind: 'ListValue' };
    node.values = this.list(this.value);
    this.expect(']');
    return node;
  }
};

Parse.prototype.object_field = function() {
  let n = this.name();
  if (n) {
    this.expect(':');
    return {
      kind: 'ObjectField',
      name: n,
      value: this.required(this.value(), 'Value'),
    };
  }
};

Parse.prototype.object_value = function() {
  if (this.match('{')) {
    let node = { kind: 'ObjectValue' };
    node.fields = this.list(this.object_field);
    this.expect('}');
    return node;
  }
};

Parse.prototype.default_value = function() {
  if (this.match('=')) {
    return this.required(this.value(), 'Value');
  }
};

Parse.prototype.error = function(msg) {
  let offset = this.original.length - this.str.length;
  return new Error(msg + error_location(this.original, offset));
};

function error_location (str, offset) {
  let lines = [];

  let left = offset - 1;
  let right = offset;
  let chunk;

  // before
  chunk = [];
  while (str[left] && str[left] !== '\n') {
    chunk.push(str[left]);
    left--;
  }
  lines[1] = '    ' + chunk.reverse().join('');

  // place caret
  let padding = Array(lines[1].length).join(' ');
  lines[2] = padding + '^';

  // line before
  chunk = [];
  left--;
  while (str[left] && str[left] !== '\n') {
    chunk.push(str[left]);
    left--;
  }
  lines[0] = '    ' + chunk.reverse().join('');

  // after
  chunk = [];
  while (str[right] && str[right] !== '\n') {
    chunk.push(str[right]);
    right++;
  }
  lines[1] += chunk.join('');

  // line after
  chunk = [];
  right++;
  while (str[right] && str[right] !== '\n') {
    chunk.push(str[right]);
    right++;
  }
  lines[3] = '    ' + chunk.join('');

  return '\n\n' + lines.join('\n') + '\n';
};
