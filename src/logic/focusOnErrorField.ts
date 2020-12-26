import get from '../utils/get';
import isUndefined from '../utils/isUndefined';
import { FieldErrors, FieldRefs } from '../types';

export default <TFieldValues>(
  fields: FieldRefs,
  fieldErrors: FieldErrors<TFieldValues>,
) => {
  for (const key in fields) {
    if (get(fieldErrors, key)) {
      const field = fields[key];

      if (field) {
        if (field.ref.focus && isUndefined(field.ref.focus())) {
          break;
        } else if (field.refs) {
          field.refs[0].focus();

          break;
        }
      }
    }
  }
};
