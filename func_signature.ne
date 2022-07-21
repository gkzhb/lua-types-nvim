@{%
  // Moo lexer documention is here:
  // https://github.com/no-context/moo

  const moo = require("moo");
  const lexer = moo.compile({
	  dots: /\.{3}/,
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
  });
  const emptyParamList = () => ({ type: 'paramList', params: [] });
  const cloneParams = (params) => params.map(item => ({...item}));
%}

# Pass your lexer with @lexer:
@lexer lexer

main -> function {% id %}

# space is optional
space -> %ws | null
opComma -> %comma | null
optionalComma -> space %comma {% () => ({ comma: true }) %}
  | null {% () => ({ comma: false }) %}

param -> space %lbracket %id %rbracket {% (list) => ({ type: 'param', id: list[2], optional: false, more: false }) %}
  | space %id {% (list) => ({ type: 'param', id: list[1], optional: false, more: false }) %}
  | space %number {% (list) => ({ type: 'param', id: list[1], numeric: true, optional: false, more: false }) %}

optionalParamList1 -> optionalParamList optionalParamList1 {% list => {
  const ret = { type: 'optinalParamList', params: cloneParams(list[0].params) };
  if (list[1].params.length) {
	ret.params.push(...cloneParams(list[1].params));
  }
  ret.params.forEach(item => item.optional = true);
  return ret;
} %}
  | null {% emptyParamList %}

optionalParamListOneLevel -> optionalComma space %lr nonEmptyParamList space %rr {% list => {
  const ret = { type: 'optinalParamList', params: cloneParams(list[3].params), comma: undefined };
  ret.params.forEach(item => item.optional = true);
  return ret;
} %}

optionalParamList -> optionalParamListOneLevel optionalParamList1 {% list => {
  const ret = { type: 'optinalParamList', params: cloneParams(list[0].params) };
  if (list[1].params.length) {
    ret.params.push(...cloneParams(list[1].params));
  }
  return ret;
} %}

dots -> space %dots {% () =>
  ({ type: 'paramList', params: [{ type: 'param', id: { text: 'args' }, optional: true, more: true }]})
%}
nonEmptyRemainReqParamList -> space %comma reqParamList {% list => list[2] %}
  | optionalComma dots {% list => ({ ...list[1], comma: list[0].comma }) %}
remainReqParamList -> nonEmptyRemainReqParamList {% id %}
  | null {% emptyParamList %}
optionalParam -> param {% id %} | null {% () => null %}
# at least one param
reqParamList -> nonEmptyRemainReqParamList {% id %}
  | param remainReqParamList {% (list) => {
  const ret = { type: 'paramList', params: [ list[0] ] };
  if (list[1].params.length > 0) {
    ret.params.push(...list[1].params);
  }
  if (list[1].comma === false) {
    if (ret.params.length > 1) {
      ret.params.pop();
      ret.params[ret.params.length - 1].more = true;
    } else {
      ret.comma === false;
    }
  }
  return ret;
} %}
optOptionalParamList -> optionalParamList {% id %} | null {% emptyParamList %}
# eat up commas from begin
nonEmptyParamList -> reqParamList optOptionalParamList {% (list) => {
  const ret = { type: 'paramList', params: cloneParams(list[0].params) };
  if (list[1].params.length > 0) {
    ret.params.push(...cloneParams(list[1].params));
  } else {
    ret.comma = list[0].comma;
  }
  return ret;
} %}
  | optionalParamList {% list => list[0] %}

paramList -> nonEmptyParamList space {% id %} | space {% emptyParamList %}

function -> %id %lparen paramList %rparen {% list => ({ type: 'function', params: list[2].params, id: list[0] }) %}
