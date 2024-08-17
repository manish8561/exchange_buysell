import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "comapareValues", async: false })
export class CompareValuesConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: any) {
    const order_limit = args?.object?.order_limit;
    return value > order_limit;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} value must be greater than order limit!`;
  }
}
