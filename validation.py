from datetime import datetime
from jsonschema import validators, Draft4Validator


all_validators = dict(Draft4Validator.VALIDATORS)
CustomValidator = validators.create(
    meta_schema=Draft4Validator.META_SCHEMA, validators=all_validators
)

car_schema = {
            'type': 'object',
            'properties': {
                'matricula': {
                    'type': 'string'
                },
                'color': {
                    'type': 'string'
                },
            }
        }

car_validator = CustomValidator(
    car_schema,  types={"datetime": datetime}
)

