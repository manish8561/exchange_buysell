import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "greaterThanZero", async: false })
export class GreaterThanZeroConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    return value > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} value must be greater than zero!`;
  }
}

@ValidatorConstraint({ name: "greaterThanEqualToZero", async: false })
export class GreaterThanEqualToZeroConstraint
  implements ValidatorConstraintInterface
{
  validate(value: number, args: ValidationArguments) {
    return value >= 0;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} value must be greater than equal to zero!`;
  }
}
