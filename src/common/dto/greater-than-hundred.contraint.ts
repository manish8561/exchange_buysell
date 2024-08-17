import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "greaterThanHundred", async: false })
export class GreaterThanHundredConstraint
  implements ValidatorConstraintInterface
{
  validate(value: number, args: ValidationArguments) {
    return value < 100;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} value must be less than 100!`;
  }
}
