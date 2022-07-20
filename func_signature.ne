@{%
  // Moo lexer documention is here:
  // https://github.com/no-context/moo

  const moo = require("moo");
  const lexer = moo.compile({
    number: /-?\d+/,
    ws:     /[ \t]+/,
    lparen:  '(',
    rparen:  ')',
    lbracket: '{',
    rbracket: '}',
    lr: '[',
    rr: ']',
    comma: ',',
    id: /[a-zA-Z][a-zA-Z0-9-_\.]*/,
    dots: /\.{3}/,
  });
%}

# Pass your lexer with @lexer:
@lexer lexer

main -> function {% id %}

# space is optional
space -> null | %ws

optionalComma -> null | space %comma | space

param -> space %lbracket %id %rbracket {% (list) => ({ type: 'param', id: list[2], optional: false }) %}
  | space %id {% (list) => ({ type: 'param', id: list[1], optional: false }) %}
  | space %number {% (list) => ({ type: 'param', id: list[1], optional: false }) %}

optionalParamList -> space %lr optionalComma paramList %rr {% (list) => {
  list[3].params.forEach(item => item.optional = true);
  return list[3];
} %}
  | optionalParamList optionalParamList {% list => {
      list[0].params.push(...list[1].params);
      return list[0];
    } %}

# at least one param
reqParamList -> param {% (list) => {
  const ret = { type: 'paramList', params: [ list[0] ] };
  return ret;
} %}
  | param space %comma reqParamList  {% (list) => {
  const ret = { type: 'paramList', params: [ list[0] ] };
  if (list.length > 1) {
    ret.params.push(...list[3].params)
  }
  return ret;
} %}

# eat up spaces afterwards and ahead
paramList -> space {% () => ({ type: 'paramList', params: [] }) %}
  | space %dots space {% () => ({ type: 'paramList', params: [{ type: 'param', id: { text: 'args' }, optional: true, more: true }]}) %}
  | reqParamList space {% list => list[0] %}
  | reqParamList space %dots space {% list => {
      list[0].params[list[0].params.length - 1].more = true;
      return list[0];
    } %}
  | optionalParamList space {% list => list[0] %}
  | reqParamList optionalParamList space {% (list) => {
    list[0].params.push(...list[1].params);
    return list[0];
  } %}

function -> %id %lparen paramList %rparen {% list => ({ type: 'function', params: list[2].params, id: list[0] }) %}
