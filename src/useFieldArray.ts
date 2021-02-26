import * as React from 'react';
import { useFormContext } from './useFormContext';
import setFieldArrayDirtyFields from './logic/setFieldArrayDirtyFields';
import mapIds from './logic/mapId';
import getFieldArrayParentName from './logic/getNodeParentName';
import get from './utils/get';
import set from './utils/set';
import removeArrayAt from './utils/remove';
import unset from './utils/unset';
import moveArrayAt from './utils/move';
import isKey from './utils/isKey';
import swapArrayAt from './utils/swap';
import prependAt from './utils/prepend';
import appendAt from './utils/append';
import insertAt from './utils/insert';
import fillEmptyArray from './utils/fillEmptyArray';
import compact from './utils/compact';
import isUndefined from './utils/isUndefined';
import focusFieldBy from './logic/focusFieldBy';
import getFieldsValues from './logic/getFieldsValues';
import {
  FieldValues,
  UseFieldArrayProps,
  FieldPath,
  FieldArrayWithId,
  UseFieldArrayReturn,
  FieldArray,
  FieldArrayMethodProps,
  FieldErrors,
} from './types';

export const useFieldArray = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TKeyName extends string = 'id'
>({
  control,
  name,
  keyName = 'id' as TKeyName,
}: UseFieldArrayProps<TFieldValues, TName, TKeyName>): UseFieldArrayReturn<
  TFieldValues,
  TName,
  TKeyName
> => {
  const methods = useFormContext();
  const focusNameRef = React.useRef('');
  const {
    isWatchAllRef,
    watchFieldsRef,
    getFormIsDirty,
    watchSubjectRef,
    fieldArraySubjectRef,
    fieldArrayNamesRef,
    fieldsRef,
    defaultValuesRef,
    formStateRef,
    formStateSubjectRef,
    readFormStateRef,
    validFieldsRef,
    fieldsWithValidationRef,
    fieldArrayDefaultValuesRef,
  } = control || methods.control;

  const [fields, setFields] = React.useState<
    Partial<FieldArrayWithId<TFieldValues, TName, TKeyName>>[]
  >(
    mapIds(
      get(fieldArrayDefaultValuesRef.current, getFieldArrayParentName(name))
        ? get(fieldArrayDefaultValuesRef.current, name, [])
        : get(defaultValuesRef.current, name, []),
      keyName,
    ),
  );

  set(fieldArrayDefaultValuesRef.current, name, [...fields]);
  fieldArrayNamesRef.current.add(name);

  const registerFieldArray = <T extends Object[]>(values: T, index: number) => {
    values.forEach((appendValueItem) => {
      const submitData = Object.entries(appendValueItem)[0];
      if (submitData) {
        const [key, value] = submitData;
        const inputName = `${name}.${index}.${key}`;

        set(fieldsRef.current, inputName, {
          _f: {
            ref: {
              name: inputName,
            },
            name: inputName,
            value,
          },
        });
      }
    });
  };

  const omitKey = <
    T extends Partial<FieldArrayWithId<TFieldValues, TName, TKeyName>>[]
  >(
    fields: T,
  ) => fields.map(({ [keyName]: omitted, ...rest } = {}) => rest);

  const getCurrentFieldsValues = () => {
    const values = get(getFieldsValues(fieldsRef, defaultValuesRef), name, []);

    return mapIds<TFieldValues, TKeyName>(
      get(fieldArrayDefaultValuesRef.current, name, []).map(
        (item: Partial<TFieldValues>, index: number) => ({
          ...item,
          ...values[index],
        }),
      ),
      keyName,
    );
  };

  const getFocusDetail = (
    index: number,
    options?: FieldArrayMethodProps,
  ): string => {
    if (options) {
      if (!isUndefined(options.focusIndex)) {
        return `${name}.${options.focusIndex}`;
      }
      if (options.focusName) {
        return options.focusName;
      }
      if (!options.shouldFocus) {
        return '';
      }
    }
    return `${name}.${index}`;
  };

  const resetFields = <T>(index?: T) =>
    (Array.isArray(index) ? index : [index]).forEach((currentIndex) =>
      set(
        fieldsRef.current,
        `${name}${isUndefined(currentIndex) ? '' : `.${currentIndex}`}`,
        [],
      ),
    );

  const setFieldsAndNotify = (
    fieldsValues: Partial<
      FieldArrayWithId<TFieldValues, TName, TKeyName>
    >[] = [],
  ) => {
    setFields(mapIds(fieldsValues, keyName));
    fieldArraySubjectRef.current.next({
      name,
      fields: omitKey([...fieldsValues]),
    });
  };

  const cleanup = <T>(ref: T) =>
    !compact(get(ref, name, [])).length && unset(ref, name);

  const updateDirtyFieldsWithDefaultValues = <
    T extends Partial<FieldArrayWithId<TFieldValues, TName, TKeyName>>[]
  >(
    updatedFieldArrayValues?: T,
  ) =>
    updatedFieldArrayValues &&
    set(
      formStateRef.current.dirtyFields,
      name,
      setFieldArrayDirtyFields(
        omitKey(updatedFieldArrayValues),
        get(defaultValuesRef.current, name, []),
        get(formStateRef.current.dirtyFields, name, []),
      ),
    );

  const batchStateUpdate = <T extends Function>(
    method: T,
    args: {
      argA?: unknown;
      argB?: unknown;
    },
    updatedFieldArrayValues: Partial<
      FieldArrayWithId<TFieldValues, TName, TKeyName>
    >[] = [],
    shouldSet = true,
    shouldUpdateValid = false,
  ) => {
    if (get(fieldsRef.current, name)) {
      const output = method(get(fieldsRef.current, name), args.argA, args.argB);
      shouldSet && set(fieldsRef.current, name, output);
    }

    if (Array.isArray(get(formStateRef.current.errors, name))) {
      const output = method(
        get(formStateRef.current.errors, name),
        args.argA,
        args.argB,
      );
      shouldSet && set(formStateRef.current.errors, name, output);
      cleanup(formStateRef.current.errors);
    }

    if (
      readFormStateRef.current.touchedFields &&
      get(formStateRef.current.touchedFields, name)
    ) {
      const output = method(
        get(formStateRef.current.touchedFields, name),
        args.argA,
        args.argB,
      );
      shouldSet && set(formStateRef.current.touchedFields, name, output);
      cleanup(formStateRef.current.touchedFields);
    }

    if (
      readFormStateRef.current.dirtyFields ||
      readFormStateRef.current.isDirty
    ) {
      set(
        formStateRef.current.dirtyFields,
        name,
        setFieldArrayDirtyFields(
          omitKey(updatedFieldArrayValues),
          get(defaultValuesRef.current, name, []),
          get(formStateRef.current.dirtyFields, name, []),
        ),
      );
      updateDirtyFieldsWithDefaultValues(updatedFieldArrayValues);
      cleanup(formStateRef.current.dirtyFields);
    }

    if (shouldUpdateValid && readFormStateRef.current.isValid) {
      set(
        validFieldsRef.current,
        name,
        method(get(validFieldsRef.current, name, []), args.argA),
      );
      cleanup(validFieldsRef.current);

      set(
        fieldsWithValidationRef.current,
        name,
        method(get(fieldsWithValidationRef.current, name, []), args.argA),
      );
      cleanup(fieldsWithValidationRef.current);
    }

    formStateSubjectRef.current.next({
      isDirty: getFormIsDirty(name, omitKey(updatedFieldArrayValues)),
      errors: formStateRef.current.errors as FieldErrors<TFieldValues>,
      isValid: formStateRef.current.isValid,
    });
  };

  const append = (
    value:
      | Partial<FieldArray<TFieldValues, TName>>
      | Partial<FieldArray<TFieldValues, TName>>[],
    options?: FieldArrayMethodProps,
  ) => {
    const appendValue = Array.isArray(value) ? value : [value];
    const updatedFieldArrayValues = appendAt(
      getCurrentFieldsValues(),
      appendValue,
    );
    setFieldsAndNotify(updatedFieldArrayValues);
    batchStateUpdate(
      appendAt,
      {
        argA: fillEmptyArray(value),
      },
      updatedFieldArrayValues,
    );
    registerFieldArray(
      appendValue,
      get(fieldArrayDefaultValuesRef.current, name).length,
    );

    focusNameRef.current = getFocusDetail(
      updatedFieldArrayValues.length - 1,
      options,
    );
  };

  const prepend = (
    value:
      | Partial<FieldArray<TFieldValues, TName>>
      | Partial<FieldArray<TFieldValues, TName>>[],
    options?: FieldArrayMethodProps,
  ) => {
    const prependValue = Array.isArray(value) ? value : [value];
    const updatedFieldArrayValues = prependAt(
      getCurrentFieldsValues(),
      prependValue,
    );
    setFieldsAndNotify(updatedFieldArrayValues);
    batchStateUpdate(
      prependAt,
      {
        argA: fillEmptyArray(value),
      },
      updatedFieldArrayValues,
    );
    registerFieldArray(prependValue, 0);

    focusNameRef.current = getFocusDetail(0, options);
  };

  const remove = (index?: number | number[]) => {
    const fieldValues = getCurrentFieldsValues();
    const updatedFieldArrayValues: Partial<
      FieldArrayWithId<TFieldValues, TName, TKeyName>
    >[] = removeArrayAt(fieldValues, index);
    resetFields(index);
    batchStateUpdate(
      removeArrayAt,
      {
        argA: index,
      },
      updatedFieldArrayValues,
      true,
      true,
    );
    setFieldsAndNotify(updatedFieldArrayValues);
  };

  const insert = (
    index: number,
    value:
      | Partial<FieldArray<TFieldValues, TName>>
      | Partial<FieldArray<TFieldValues, TName>>[],
    options?: FieldArrayMethodProps,
  ) => {
    const insertValue = Array.isArray(value) ? value : [value];
    const fieldValues = getCurrentFieldsValues();
    const updatedFieldArrayValues = insertAt(fieldValues, index, insertValue);

    setFieldsAndNotify(updatedFieldArrayValues);
    batchStateUpdate(
      insertAt,
      {
        argA: index,
        argB: fillEmptyArray(value),
      },
      updatedFieldArrayValues,
    );
    registerFieldArray(insertValue, index);

    focusNameRef.current = getFocusDetail(index, options);
  };

  const swap = (indexA: number, indexB: number) => {
    const fieldValues = getCurrentFieldsValues();
    swapArrayAt(fieldValues, indexA, indexB);
    batchStateUpdate(
      swapArrayAt,
      {
        argA: indexA,
        argB: indexB,
      },
      fieldValues,
      false,
    );
    setFieldsAndNotify(fieldValues);
  };

  const move = (from: number, to: number) => {
    const fieldValues = getCurrentFieldsValues();
    moveArrayAt(fieldValues, from, to);
    setFieldsAndNotify(fieldValues);
    batchStateUpdate(
      moveArrayAt,
      {
        argA: from,
        argB: to,
      },
      fieldValues,
      false,
    );
  };

  React.useEffect(() => {
    if (isWatchAllRef.current) {
      formStateSubjectRef.current.next({});
    } else {
      for (const watchField of watchFieldsRef.current) {
        if (name.startsWith(watchField)) {
          formStateSubjectRef.current.next({});
          break;
        }
      }
    }

    watchSubjectRef.current.next({
      name,
      value: get(getFieldsValues(fieldsRef, defaultValuesRef), name, []),
    });

    focusNameRef.current &&
      focusFieldBy(fieldsRef.current, (key: string) =>
        key.startsWith(focusNameRef.current),
      );

    focusNameRef.current = '';
  }, [fields, name]);

  React.useEffect(() => {
    fieldArraySubjectRef.current.next({
      name: undefined,
      fields: undefined,
    });
  }, [fields]);

  React.useEffect(() => {
    const fieldArraySubscription = fieldArraySubjectRef.current.subscribe({
      next({ name: inputName, fields, isReset }) {
        if (isReset) {
          unset(fieldsRef.current, inputName || name);

          if (inputName) {
            set(fieldArrayDefaultValuesRef.current, inputName, fields);
            setFieldsAndNotify(get(fieldArrayDefaultValuesRef.current, name));
          } else {
            fieldArrayDefaultValuesRef.current = fields;
            setFieldsAndNotify(get(fields, name));
          }
        }
      },
    });

    return () => {
      fieldArraySubscription.unsubscribe();
      isKey(name) && unset(fieldArrayDefaultValuesRef.current, name);
      fieldArrayNamesRef.current.delete(name);
    };
  }, []);

  return {
    swap: React.useCallback(swap, [name]),
    move: React.useCallback(move, [name]),
    prepend: React.useCallback(prepend, [name]),
    append: React.useCallback(append, [name]),
    remove: React.useCallback(remove, [name]),
    insert: React.useCallback(insert, [name]),
    fields: fields as FieldArrayWithId<TFieldValues, TName, TKeyName>,
  };
};
