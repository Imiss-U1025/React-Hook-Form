import * as React from 'react';
import useForm from 'react-hook-form';
import { withRouter } from 'react-router';
import * as yup from 'yup';

let renderCounter = 0;

const validationSchema = yup.object().shape({
  firstName: yup.string().required(),
  lastName: yup
    .string()
    .max(5)
    .required(),
});

const IsValid: React.FC = (props: any) => {
  const isBuildInValidation = props.match.params.mode === 'build-in';
  const { register, handleSubmit, formState, errors } = useForm<{
    firstName: string;
    lastName: string;
    select: string;
    radio: string;
    checkbox: string;
  }>({
    mode: 'onChange',
    ...(isBuildInValidation ? {} : { validationSchema }),
    ...(props.match.params.defaultValues === 'defaultValues'
      ? {
          defaultValues: {
            firstName: 'test',
            lastName: 'test1',
          },
        }
      : {}),
  });

  renderCounter++;

  console.log(errors);

  return (
    <form onSubmit={handleSubmit(() => {})}>
      {isBuildInValidation ? (
        <>
          <input name="location" ref={register} placeholder="location" />
          <input
            name="firstName"
            ref={register({ required: true })}
            placeholder="firstName"
          />
          <input
            name="lastName"
            ref={register({ required: true })}
            placeholder="lastName"
          />
          <input name="age" ref={register} placeholder="age" />
        </>
      ) : (
        <>
          <input name="location" ref={register} placeholder="location" />
          <input name="firstName" ref={register} placeholder="firstName" />
          <input name="lastName" ref={register} placeholder="lastName" />
          <input name="age" ref={register} placeholder="age" />
        </>
      )}
      <div id="isValid">{JSON.stringify(formState.isValid)}</div>
      <div id="renderCount">{renderCounter}</div>
    </form>
  );
};

export default withRouter(IsValid);
