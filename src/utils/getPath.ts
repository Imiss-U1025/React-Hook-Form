import flatten from './flatten';
import isString from './isString';
import isObject from './isObject';

function getPath(path: string, value: any): any {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const pathWithIndex = `${path}[${index}]`;
      if (Array.isArray(item)) {
        return getPath(pathWithIndex, item);
      } else if (isObject(item)) {
        return Object.entries(item).map(([key, objectValue]) =>
          isString(objectValue)
            ? `${pathWithIndex}.${key}`
            : getPath(`${pathWithIndex}.${key}`, objectValue),
        );
      }
      return `${path}[${index}]`;
    });
  } else if (isObject(value)) {
    return Object.entries(value).map(([key, objectValue]) =>
      isString(objectValue) ? `${path}.${key}` : getPath(path, objectValue),
    );
  }
}

export default (parentPath: string, value: any) =>
  flatten(getPath(parentPath, value));
