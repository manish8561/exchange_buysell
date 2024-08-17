import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "maxMysqlOffsetLimit", async: false })
export class MaxMysqlOffsetLimitConstraint
  implements ValidatorConstraintInterface
{
  validate(value: number, args: ValidationArguments) {
    return value <= Number("18446744073709551615");
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} value must be less than maximum limit of the system!`;
  }
}
