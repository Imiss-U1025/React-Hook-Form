import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import useForm from './useForm';
import { act } from 'react-test-renderer';
const { withProfiler } = require('jest-react-profiler');

describe('useForm performance', () => {
  it('should not trigger extra render when user typing', () => {
    function Greeting() {
      const { register } = useForm({ mode: 'onChange' });
      return (
        <form>
          <input data-testid="test" name="test" ref={register} />
        </form>
      );
    }

    const GreetingWithProfiler = withProfiler(Greeting);

    const { getByTestId } = render(<GreetingWithProfiler />);
    const input = getByTestId('test');
    act(() => {
      fireEvent.input(input, { target: { value: 'TEST VALUE' } });
      // @ts-ignore
      expect(input.value).toBe('TEST VALUE');

      // @ts-ignore
      expect(GreetingWithProfiler).toHaveCommittedTimes(1);
    })
  });
});
