import {
  UseFormMethods,
  FieldValues,
  FieldValuesFromControl,
  FieldValuesFromFieldErrors,
  FieldName,
  FieldErrors,
  MultipleFieldErrors,
  Message,
  ValidationOptions,
  Control,
} from './form';
import { Assign } from './utils';

export type FormProviderProps<
  TFieldValues extends FieldValues = FieldValues
> = {
  children: React.ReactNode;
} & UseFormMethods<TFieldValues>;

type AsProps<TAs> = TAs extends undefined
  ? {}
  : TAs extends React.ReactElement
  ? Record<string, any>
  : TAs extends React.ComponentType<infer P>
  ? P
  : TAs extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[TAs]
  : never;

export type ControllerProps<
  TAs extends
    | React.ReactElement
    | React.ComponentType<any>
    | keyof JSX.IntrinsicElements,
  TControl extends Control = Control
> = Assign<
  {
    name: FieldName<FieldValuesFromControl<TControl>>;
    as: TAs;
    rules?: ValidationOptions;
    onFocus?: () => void;
    render: (data: {
      onChange: {
        (...event: any[]): void;
        (callback: (...args: any[]) => any): (...event: any[]) => void;
      };
      onBlur: () => void;
      value: any;
    }) => React.ReactElement;
    onChangeName?: string;
    onBlurName?: string;
    valueName?: string;
    defaultValue?: unknown;
    control?: TControl;
  },
  AsProps<TAs>
>;

export type ErrorMessageProps<
  TFieldErrors extends FieldErrors,
  TAs extends
    | undefined
    | React.ReactElement
    | React.ComponentType<any>
    | keyof JSX.IntrinsicElements = undefined
> = Assign<
  {
    as?: TAs;
    errors?: TFieldErrors;
    name: FieldName<FieldValuesFromFieldErrors<TFieldErrors>>;
    message?: Message;
    children?: (data: {
      message: Message;
      messages?: MultipleFieldErrors;
    }) => React.ReactNode;
  },
  AsProps<TAs>
>;
