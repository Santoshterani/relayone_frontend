import rules from '../api/getValidations';
/** Field rules shared by the forms (mirrors the server's rules). */
export default function useValidationContext() { return rules; }
