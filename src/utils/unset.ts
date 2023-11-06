import isEmptyObject from './isEmptyObject';
import isKey from './isKey';
import isObject from './isObject';
import isUndefined from './isUndefined';
import omit from './omit';
import stringToPath from './stringToPath';

function baseGet(object: any, updatePath: (string | number)[]) {
  const length = updatePath.slice(0, -1).length;
  let index = 0;

  while (index < length) {
    object = isUndefined(object) ? index++ : object[updatePath[index++]];
  }

  return object;
}

function isEmptyArray(obj: unknown[]) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !isUndefined(obj[key])) {
      return false;
    }
  }
  return true;
}

export default function unset(object: any, path: string | (string | number)[]) {
  const paths = Array.isArray(path)
    ? path
    : isKey(path)
    ? [path]
    : stringToPath(path);
    
  const index = paths.length - 1;
  const key = paths[index];
  
  const sourceObject = paths.length === 1 ? object : baseGet(object, paths);
  const unsetObject = omit(sourceObject, String(key));

  if (
    index !== 0 &&
    ((isObject(unsetObject) && isEmptyObject(unsetObject)) ||
      (Array.isArray(unsetObject) && isEmptyArray(unsetObject)))
  ) {
    unset(object, paths.slice(0, -1));
  }

  return object;
}
