import * as _ from 'lodash';

export function stringifyWrappers(wrappers) {
  let left = '';
  let right = '';

  for (const wrapper of wrappers) {
    switch (wrapper) {
      case 'NON_NULL':
        right = '!' + right;
        break;
      case 'LIST':
        left = left + '[';
        right = ']' + right;
        break;
    }
  }
  return [left, right];
}

export function buildId(...parts) {
  return parts.join('::');
}

export function typeNameToId(name: string) {
  return buildId('TYPE', name);
}

export function extractTypeId(id: string) {
  let [, type] = id.split('::');
  return buildId('TYPE', type);
}

export function isSystemType(type) {
  return _.startsWith(type.name, '__');
}

export function isBuiltInScalarType(type) {
  return ['Int', 'Float', 'String', 'Boolean', 'ID'].indexOf(type.name) !== -1;
}

export function isScalarType(type) {
  return type.kind === 'SCALAR' || type.kind === 'ENUM';
}

export function isScalarNonEnumType(type) {
  return type.kind === 'SCALAR';
}

export function isObjectType(type) {
  return type.kind === 'OBJECT';
}

export function isInputObjectType(type) {
  return type.kind === 'INPUT_OBJECT';
}
