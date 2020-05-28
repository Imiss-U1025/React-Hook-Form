import * as React from 'react';
import isBoolean from './utils/isBoolean';
import isUndefined from './utils/isUndefined';
import isReactComponentClass from './utils/isReactComponentClass';
import get from './utils/get';
import set from './utils/set';
import getInputValue from './logic/getInputValue';
import skipValidation from './logic/skipValidation';
import isNameInFieldArray from './logic/isNameInFieldArray';
import { useFormContext } from './useFormContext';
import { VALUE } from './constants';
import { Control, Field, EventFunction } from './types/form';
import { ControllerProps } from './types/props';

const Controller = <TControl extends Control = Control>({
  name,
  rules,
  render: InnerComponent,
  defaultValue,
  control,
  onFocus,
}: ControllerProps<TControl>) => {
  const methods = useFormContext();
  const {
    defaultValuesRef,
    setValue,
    register,
    unregister,
    errorsRef,
    removeFieldEventListener,
    trigger,
    mode: { isOnSubmit, isOnBlur, isOnChange },
    reValidateMode: { isReValidateOnBlur, isReValidateOnSubmit },
    formState: { isSubmitted },
    touchedFieldsRef,
    readFormStateRef,
    reRender,
    fieldsRef,
    fieldArrayNamesRef,
  } = control || methods.control;
  const [value, setInputStateValue] = React.useState(
    isUndefined(defaultValue)
      ? get(defaultValuesRef.current, name)
      : defaultValue,
  );
  const valueRef = React.useRef(value);
  const isCheckboxInput = isBoolean(value);
  const shouldReValidateOnBlur = isOnBlur || isReValidateOnBlur;
  const rulesRef = React.useRef(rules);
  const onFocusRef = React.useRef(onFocus);
  const isNotFieldArray = !isNameInFieldArray(fieldArrayNamesRef.current, name);
  rulesRef.current = rules;

  const shouldValidate = () =>
    !skipValidation({
      hasError: !!get(errorsRef.current, name),
      isOnBlur,
      isOnSubmit,
      isOnChange,
      isReValidateOnBlur,
      isReValidateOnSubmit,
      isSubmitted,
    });

  const commonTask = (event: any) => {
    const data = getInputValue(event, isCheckboxInput);
    setInputStateValue(data);
    valueRef.current = data;
    return data;
  };

  const registerField = React.useCallback(() => {
    if (!isNotFieldArray) {
      removeFieldEventListener(fieldsRef.current[name] as Field, true);
    }

    register(
      Object.defineProperty({ name, focus: onFocusRef.current }, VALUE, {
        set(data) {
          setInputStateValue(data);
          valueRef.current = data;
        },
        get() {
          return valueRef.current;
        },
      }),
      rulesRef.current,
    );
  }, [
    isNotFieldArray,
    fieldsRef,
    rulesRef,
    name,
    onFocusRef,
    register,
    removeFieldEventListener,
  ]);

  React.useEffect(
    () => () => {
      !isNameInFieldArray(fieldArrayNamesRef.current, name) && unregister(name);
    },
    [unregister, name, fieldArrayNamesRef],
  );

  React.useEffect(() => {
    registerField();
  }, [registerField]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!fieldsRef.current[name]) {
      registerField();
      if (isNotFieldArray) {
        setInputStateValue(
          isUndefined(defaultValue)
            ? get(defaultValuesRef.current, name)
            : defaultValue,
        );
      }
    }
  });

  const onBlur = () => {
    if (
      readFormStateRef.current.touched &&
      !get(touchedFieldsRef.current, name)
    ) {
      set(touchedFieldsRef.current, name, true);
      reRender();
    }

    if (shouldReValidateOnBlur) {
      trigger(name);
    }
  };

  const onChange = (event: any): any =>
    setValue(name, commonTask(event), shouldValidate());

  const props = {
    onChange,
    onBlur,
    value,
  };

  return isReactComponentClass(InnerComponent) ? (
    <InnerComponent {...props} />
  ) : (
    InnerComponent(props)
  );
};

export { Controller };
