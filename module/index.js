import React from "react";
import P from "prop-types";
import shallowequal from "shallowequal";

const all = (xs, fn) =>
  !!Object.keys(xs).reduce((acc, x) => {
    return acc && fn(xs[x]);
  }, true);
const append = (key, value, obj) => ({
  ...obj,
  [key]: {
    ...obj[key],
    ...value
  }
});

export default function reactFormHoc(options = {}) {
  return Component => {
    const { fields = [], validate = () => {} } = options;

    return class ReactFormHoc extends React.Component {
      static displayName = "react-form-hoc";

      static propTypes = {
        onChange: P.func,
        initialValues: P.object,
        validate: P.bool
      };

      static defaultProps = {
        onChange: () => {},
        initialValues: {},
        validate: false,
        touchAll: false
      };

      constructor(props, ...rest) {
        super(props, ...rest);

        this.state = this.stateFromProps(props);
      }

      stateFromProps = ({ initialValues, touchAll }) => {
        return fields.reduce(
          (acc, name) => ({
            ...acc,
            values: initialValues,
            fields: {
              ...acc.fields,
              [name]: {
                name,
                error: validate(name, initialValues[name]),
                touched: touchAll,
                value: initialValues[name],
                initialValue: initialValues[name],
                onChange: this.handleChanges(name),
                onBlur: this.handleBlur(name)
              }
            }
          }),
          {
            fields: {}
          }
        );
      };

      componentWillReceiveProps(next) {
        const { initialValues, touchAll } = this.props;
        if (!shallowequal(next.initialValues, initialValues)) {
          this.setState(this.stateFromProps(next));
        }
        if (next.touchAll !== touchAll) {
          this.touchAll();
        }
      }

      touchAll = () => {
        this.setState({
          ...this.state,
          fields: fields.reduce(
            (acc, name) => ({
              ...acc,
              [name]: {
                ...acc[name],
                touched: true
              }
            }),
            this.state.fields
          )
        });
      };

      allValid = state => {
        const { fields } = state;
        return all(fields, field => !field.error);
      };

      handleChanges = key => {
        return e => {
          const { fields, values } = this.state;
          const { value } = e.target;
          const error = validate(key, value);
          const newState = {
            ...this.state,
            values: { ...values, [key]: value },
            fields: append(key, { value, error }, fields)
          };
          this.setState(newState);
          this.props.onChange(newState.values, this.allValid(newState));
        };
      };

      handleBlur = key => {
        return () => {
          const { fields } = this.state;
          const field = fields[key];
          const error = validate(key, field.value);
          this.setState({
            ...this.state,
            fields: {
              ...fields,
              [key]: { ...field, touched: true, error }
            }
          });
        };
      };

      render() {
        const { state, props } = this;

        return <Component {...props} {...state} />;
      }
    };
  };
}
