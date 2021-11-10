import { FieldElement } from '../types';

export default (element: FieldElement): element is HTMLSelectElement =>
  element.type == 'select-one';
