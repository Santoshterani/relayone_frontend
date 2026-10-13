// The backend has no validation-rules endpoint yet, so the rules the forms need live here and match
// node/src/validations/common.js. If an endpoint is added later, fetch it here and keep the same shape.
const rules = {
  password: { min: 8, pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,100}$/, hint: 'At least 8 characters with a letter and a number.' },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, hint: 'Enter a valid email address.' },
  name: { min: 2, max: 120 },
  company: { min: 2, max: 150 }
};
export default rules;
