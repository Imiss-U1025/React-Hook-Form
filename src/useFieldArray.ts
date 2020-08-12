import * as React from 'react';
import { useFormContext } from './useFormContext';
import { isMatchFieldArrayName } from './logic/isNameInFieldArray';
import generateId from './logic/generateId';
import isObject from './utils/isObject';
import deepEqual from './logic/deepEqual';
import getFieldArrayParentName from './logic/getFieldArrayParentName';
import get from './utils/get';
import set from './utils/set';
import isUndefined from './utils/isUndefined';
import removeArrayAt from './utils/remove';
import unset from './utils/unset';
import moveArrayAt from './utils/move';
import swapArrayAt from './utils/swap';
import prependAt from './utils/prepend';
import isArray from './utils/isArray';
import insertAt from './utils/insert';
import fillEmptyArray from './utils/fillEmptyArray';
import { filterBooleanArray } from './utils/filterBooleanArray';
import unique from './utils/unique';
import {
  Field,
  FieldValues,
  UseFieldArrayOptions,
  Control,
  ArrayField,
} from './types/form';

const appendId = <TValue extends object, TKeyName extends string>(
  value: TValue,
  keyName: TKeyName,
): Partial<ArrayField<TValue, TKeyName>> => ({
  [keyName]: generateId(),
  ...(isObject(value) ? value : { value }),
});

const mapIds = <TData extends object, TKeyName extends string>(
  data: TData | TData[],
  keyName: TKeyName,
) => (isArray(data) ? data : []).map((value) => appendId(value, keyName));

export const useFieldArray = <
  TFieldArrayValues extends FieldValues = FieldValues,
  TKeyName extends string = 'id',
  TControl extends Control = Control
>({
  control,
  name,
  keyName = 'id' as TKeyName,
}: UseFieldArrayOptions<TKeyName, TControl>) => {
  const methods = useFormContext();

  if (process.env.NODE_ENV !== 'production') {
    if (!control && !methods) {
      throw new Error('📋 useFieldArray is missing `control` prop.');
    }

    if (!name) {
      console.warn('📋 useFieldArray is missing `name` attribute.');
    }
  }

  const focusIndexRef = React.useRef(-1);
  const {
    isWatchAllRef,
    resetFieldArrayFunctionRef,
    fieldArrayNamesRef,
    reRender,
    fieldsRef,
    defaultValuesRef,
    removeFieldEventListener,
    formState: { dirtyFields, touched, errors },
    updateFormState,
    readFormStateRef,
    watchFieldsRef,
    validFieldsRef,
    fieldsWithValidationRef,
    fieldArrayDefaultValues,
    validateSchemaIsValid,
    renderWatchedInputs,
    getValues,
  } = control || methods.control;

  const getDefaultValues = () => [
    ...(get(fieldArrayDefaultValues.current, name) ||
      get(defaultValuesRef.current, name) ||
      []),
  ];
  const memoizedDefaultValues = React.useRef<Partial<TFieldArrayValues>[]>(
    getDefaultValues(),
  );
  const [fields, setField] = React.useState<
    Partial<ArrayField<TFieldArrayValues, TKeyName>>[]
  >(mapIds(memoizedDefaultValues.current, keyName));
  const allFields = React.useRef<
    Partial<ArrayField<TFieldArrayValues, TKeyName>>[]
  >(fields);
  const rootParentName = getFieldArrayParentName(name);

  const getCurrentFieldsValues = () =>
    get(getValues() || {}, name, allFields.current).map(
      (item: Partial<TFieldArrayValues>, index: number) => ({
        ...allFields.current[index],
        ...item,
      }),
    );

  allFields.current = fields;
  fieldArrayNamesRef.current.add(name);

  if (!get(fieldArrayDefaultValues.current, name) && rootParentName) {
    set(
      fieldArrayDefaultValues.current,
      rootParentName,
      get(defaultValuesRef.current, rootParentName),
    );
  }

  const appendValueWithKey = (values: Partial<TFieldArrayValues>[]) =>
    values.map((value: Partial<TFieldArrayValues>) => appendId(value, keyName));

  const setFieldAndValidState = (
    fieldsValues: Partial<ArrayField<TFieldArrayValues, TKeyName>>[],
  ) => {
    setField(fieldsValues);

    if (readFormStateRef.current.isValid && validateSchemaIsValid) {
      validateSchemaIsValid({
        [name]: fieldsValues,
      });
    }
  };

  const shouldRenderFieldArray = () => {
    renderWatchedInputs(name);
    !isWatchAllRef.current && reRender();
  };

  const getIsDirty = (
    flagOrFields?: (Partial<TFieldArrayValues> | undefined)[],
  ): boolean => {
    if (
      readFormStateRef.current.isDirty ||
      readFormStateRef.current.dirtyFields
    ) {
      return (
        isUndefined(flagOrFields) ||
        !deepEqual(
          flagOrFields.map(({ [keyName]: omitted, ...rest } = {}) => rest),
          get(defaultValuesRef.current, name, []),
        )
      );
    }
    return false;
  };

  const resetFields = () => {
    for (const key in fieldsRef.current) {
      if (isMatchFieldArrayName(key, name) && fieldsRef.current[key]) {
        removeFieldEventListener(fieldsRef.current[key] as Field, true);
      }
    }
  };

  const append = (
    value: Partial<TFieldArrayValues> | Partial<TFieldArrayValues>[],
    shouldFocus = true,
  ) => {
    setFieldAndValidState([
      ...allFields.current,
      ...(isArray(value)
        ? appendValueWithKey(value)
        : [appendId(value, keyName)]),
    ]);

    if (
      readFormStateRef.current.dirtyFields ||
      readFormStateRef.current.isDirty
    ) {
      set(dirtyFields, name, [
        ...(get(dirtyFields, name) || fillEmptyArray(fields.slice(0, 1))),
        ...filterBooleanArray(value),
      ]);
      updateFormState({
        isDirty: true,
        dirtyFields,
      });
    }

    focusIndexRef.current = shouldFocus ? allFields.current.length : -1;
    shouldRenderFieldArray();
  };

  const prepend = (
    value: Partial<TFieldArrayValues> | Partial<TFieldArrayValues>[],
    shouldFocus = true,
  ) => {
    const emptyArray = fillEmptyArray(value);

    setFieldAndValidState(
      prependAt(
        getCurrentFieldsValues(),
        isArray(value) ? appendValueWithKey(value) : [appendId(value, keyName)],
      ),
    );
    resetFields();

    if (isArray(get(errors, name))) {
      set(errors, name, prependAt(get(errors, name), emptyArray));
    }

    if (readFormStateRef.current.touched && get(touched, name)) {
      set(touched, name, prependAt(get(touched, name), emptyArray));
    }

    if (
      readFormStateRef.current.dirtyFields ||
      readFormStateRef.current.isDirty
    ) {
      set(
        dirtyFields,
        name,
        prependAt(get(dirtyFields, name) || [], filterBooleanArray(value)),
      );
    }

    updateFormState({
      errors,
      dirtyFields,
      isDirty: true,
      touched,
    });

    shouldRenderFieldArray();
    focusIndexRef.current = shouldFocus ? 0 : -1;
  };

  const remove = (index?: number | number[]) => {
    const fieldValues = getCurrentFieldsValues();
    setFieldAndValidState(removeArrayAt(fieldValues, index));
    resetFields();

    if (isArray(get(errors, name))) {
      set(errors, name, removeArrayAt(get(errors, name), index));

      if (!unique(get(errors, name, [])).length) {
        unset(errors, name);
      }
    }

    if (readFormStateRef.current.touched && get(touched, name)) {
      set(touched, name, removeArrayAt(get(touched, name), index));
    }

    if (
      (readFormStateRef.current.dirtyFields ||
        readFormStateRef.current.isDirty) &&
      get(dirtyFields, name)
    ) {
      set(dirtyFields, name, removeArrayAt(get(dirtyFields, name), index));

      if (!unique(get(dirtyFields, name, [])).length) {
        unset(dirtyFields, name);
      }
    }

    if (readFormStateRef.current.isValid && !validateSchemaIsValid) {
      let fieldIndex = -1;
      let isFound = false;
      const isIndexUndefined = isUndefined(index);

      while (fieldIndex++ < fields.length) {
        const isLast = fieldIndex === fields.length - 1;
        const isCurrentIndex =
          (isArray(index) ? index : [index]).indexOf(fieldIndex) >= 0;

        if (isCurrentIndex || isIndexUndefined) {
          isFound = true;
        }

        if (!isFound) {
          continue;
        }

        for (const key in fields[fieldIndex]) {
          const currentFieldName = `${name}[${fieldIndex}].${key}`;

          if (isCurrentIndex || isLast || isIndexUndefined) {
            validFieldsRef.current.delete(currentFieldName);
            fieldsWithValidationRef.current.delete(currentFieldName);
          } else {
            const previousFieldName = `${name}[${fieldIndex - 1}].${key}`;

            if (validFieldsRef.current.has(currentFieldName)) {
              validFieldsRef.current.add(previousFieldName);
            }
            if (fieldsWithValidationRef.current.has(currentFieldName)) {
              fieldsWithValidationRef.current.add(previousFieldName);
            }
          }
        }
      }
    }

    updateFormState({
      dirtyFields,
      errors,
      touched,
      isDirty: getIsDirty(removeArrayAt(fieldValues, index)),
    });

    shouldRenderFieldArray();
  };

  const insert = (
    index: number,
    value: Partial<TFieldArrayValues> | Partial<TFieldArrayValues>[],
    shouldFocus = true,
  ) => {
    const emptyArray = fillEmptyArray(value);
    const fieldValues = getCurrentFieldsValues();

    setFieldAndValidState(
      insertAt(
        fieldValues,
        index,
        isArray(value) ? appendValueWithKey(value) : [appendId(value, keyName)],
      ),
    );
    resetFields();

    if (isArray(get(errors, name))) {
      set(errors, name, insertAt(get(errors, name), index, emptyArray));
    }

    if (readFormStateRef.current.touched && get(touched, name)) {
      set(touched, name, insertAt(get(touched, name), index, emptyArray));
    }

    if (
      (readFormStateRef.current.dirtyFields ||
        readFormStateRef.current.isDirty) &&
      get(dirtyFields, name)
    ) {
      set(
        dirtyFields,
        name,
        insertAt(get(dirtyFields, name), index, filterBooleanArray(value)),
      );
    }

    updateFormState({
      dirtyFields,
      errors,
      touched,
      isDirty: getIsDirty(insertAt(fieldValues, index)),
    });

    shouldRenderFieldArray();

    focusIndexRef.current = shouldFocus ? index : -1;
  };

  const swap = (indexA: number, indexB: number) => {
    const fieldValues = getCurrentFieldsValues();
    swapArrayAt(fieldValues, indexA, indexB);
    resetFields();
    setFieldAndValidState([...fieldValues]);

    if (isArray(get(errors, name))) {
      swapArrayAt(get(errors, name), indexA, indexB);
    }

    if (readFormStateRef.current.touched && get(touched, name)) {
      swapArrayAt(get(touched, name), indexA, indexB);
    }

    if (
      (readFormStateRef.current.dirtyFields ||
        readFormStateRef.current.isDirty) &&
      get(dirtyFields, name)
    ) {
      swapArrayAt(get(dirtyFields, name), indexA, indexB);
    }

    updateFormState({
      dirtyFields,
      errors,
      touched,
      isDirty: getIsDirty(fieldValues),
    });
    shouldRenderFieldArray();
  };

  const move = (from: number, to: number) => {
    const fieldValues = getCurrentFieldsValues();
    moveArrayAt(fieldValues, from, to);
    resetFields();
    setFieldAndValidState([...fieldValues]);

    if (isArray(get(errors, name))) {
      moveArrayAt(get(errors, name), from, to);
    }

    if (readFormStateRef.current.touched && get(touched, name)) {
      moveArrayAt(get(touched, name), from, to);
    }

    if (
      (readFormStateRef.current.dirtyFields ||
        readFormStateRef.current.isDirty) &&
      get(dirtyFields, name)
    ) {
      moveArrayAt(get(dirtyFields, name), from, to);
    }

    updateFormState({
      dirtyFields,
      errors,
      touched,
      isDirty: getIsDirty(fieldValues),
    });
    shouldRenderFieldArray();
  };

  const reset = () => {
    resetFields();
    memoizedDefaultValues.current = getDefaultValues();
    setField(mapIds(memoizedDefaultValues.current, keyName));
  };

  React.useEffect(() => {
    const defaultValues = get(fieldArrayDefaultValues.current, name);

    if (defaultValues && fields.length < defaultValues.length) {
      defaultValues.pop();
      set(fieldArrayDefaultValues.current, name, defaultValues);
    }

    if (isWatchAllRef.current) {
      reRender();
    } else if (watchFieldsRef) {
      let shouldRenderUseWatch = true;
      for (const watchField of watchFieldsRef.current) {
        if (watchField.startsWith(name)) {
          reRender();
          shouldRenderUseWatch = false;
          break;
        }
      }

      shouldRenderUseWatch && renderWatchedInputs(name);
    }

    if (focusIndexRef.current > -1) {
      for (const key in fieldsRef.current) {
        const field = fieldsRef.current[key];
        if (
          key.startsWith(`${name}[${focusIndexRef.current}]`) &&
          field!.ref.focus
        ) {
          field!.ref.focus();
          break;
        }
      }
    }

    focusIndexRef.current = -1;
  }, [
    fields,
    name,
    fieldArrayDefaultValues,
    reRender,
    fieldsRef,
    watchFieldsRef,
    isWatchAllRef,
  ]);

  React.useEffect(() => {
    const resetFunctions = resetFieldArrayFunctionRef.current;
    resetFunctions[name] = reset;

    return () => {
      resetFields();
      delete resetFunctions[name];
      fieldArrayNamesRef.current.delete(name);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    swap: React.useCallback(swap, [name, errors]),
    move: React.useCallback(move, [name, errors]),
    prepend: React.useCallback(prepend, [name, errors]),
    append: React.useCallback(append, [name, errors]),
    remove: React.useCallback(remove, [fields, name, errors]),
    insert: React.useCallback(insert, [name, errors]),
    fields,
  };
};
