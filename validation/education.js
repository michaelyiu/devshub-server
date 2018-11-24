const _ = require('lodash');
const Validator = require('validator');


module.exports = function validateEducationInput(data) {
  let errors = {};

  data.school = !_.isEmpty(data.school) ? data.school : '';
  data.degree = !_.isEmpty(data.degree) ? data.degree : '';
  data.fieldOfStudy = !_.isEmpty(data.fieldOfStudy) ? data.fieldOfStudy : '';
  data.from = !_.isEmpty(data.from) ? data.from : '';

  if (Validator.isEmpty(data.school)) {
    errors.school = 'School field is required';
  }
  if (Validator.isEmpty(data.degree)) {
    errors.degree = 'Degree field is required';
  }
  if (Validator.isEmpty(data.fieldOfStudy)) {
    errors.fieldOfStudy = 'Field of study field is required';
  }
  if (Validator.isEmpty(data.from)) {
    errors.from = 'From date field is required';
  }

  return {
    errors,
    isValid: _.isEmpty(errors),

  }
}