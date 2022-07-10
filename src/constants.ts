/** define TypeScript types */
export const tsTypes = {
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  array: (t: string) => `${t}[]`,
  arrayWithValues: (...args: string[]) => {
    if (args.length === 2 && args[1] === '2') {
      return `[${args[0]}, ${args[0]}]`;
    }
    return `[${args.join(', ')}]`;
  },
  record: 'Record<string, unknown>',
  recordWithValue: (t: string) => `Record<string, ${t}>`,
  void: 'void',
  unknownArray: 'Array<unknown>',
  unknown: 'unknown',

  // custom types
  /** floating window config options */
  floatWinConfig: 'INvimFloatWinConfig',
}

/**
 * The type mapping between `nvim --api-info` and TypeScript type.
 */
export const NVIM_TYPE_MAP: Record<string, string> = {
  Integer: tsTypes.number,
  Float: tsTypes.number,
  String: tsTypes.string,
  Boolean: tsTypes.boolean,
  Array: tsTypes.unknownArray,
  Dict: tsTypes.record,
  Dictionary: tsTypes.record,
  Object: tsTypes.record,
  Buffer: tsTypes.number,
  Window: tsTypes.number,
  Tabpage: tsTypes.number,
  void: tsTypes.void,
  LuaRef: tsTypes.unknown,
  '2': '2',

  float_config: tsTypes.floatWinConfig,
  // @TODO: check for these types
  Error: tsTypes.unknown,
  runtime: tsTypes.unknown,
};

/** convert base types */
export const convertTypeDirectly = (type: string) => {
  if (!(type in NVIM_TYPE_MAP)) {
    // throw new Error('Unknown type name detected: ' + vimType);
    console.log('Unknown type name detected: ' + type);
    return 'unknown' + ` /* ${type} */`;
  }
  return NVIM_TYPE_MAP[type];
};

/** process comma ',' separated parameters */
export const processParams = (params: string): string[] => {
  if (params.includes(',')) {
    // multiple parameters
    const parameters = params.split(',').map(param => param.trim());
    return parameters.map(param => convertTypeDirectly(param));
  } else {
    // one parameter
    return [convertTypeDirectly(params)];
  }
};

export const NVIM_CONTAINER_TYPE_MAP: Record<
  string,
  { one: (param: string) => string; multi?: (...param: string[]) => string }
> = {
  Dict: {
    one: tsTypes.recordWithValue,
  },
  ArrayOf: { one: tsTypes.arrayWithValues, multi: tsTypes.arrayWithValues },
  DictionaryOf: { one: tsTypes.recordWithValue },
};


export type NVIM_TYPE_MAP = typeof NVIM_TYPE_MAP;

export const modules = { api: 'api' };
