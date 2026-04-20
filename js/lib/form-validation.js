export function clearFieldValidation(input, errorNode) {
  if (errorNode) {
    errorNode.textContent = '';
  }

  if (input) {
    input.classList.remove('invalid');
    input.setAttribute('aria-invalid', 'false');
  }
}

export function showFieldValidation(input, errorNode, message) {
  if (errorNode) {
    errorNode.textContent = message;
  }

  if (input) {
    input.classList.add('invalid');
    input.setAttribute('aria-invalid', 'true');
  }
}

export function validateTextField(input, errorNode, {
  label,
  requiredMessage = null,
  minLength = 1,
  minLengthMessage = null,
} = {}) {
  const value = String(input?.value ?? '').trim();
  const name = label ?? 'This field';

  if (value === '') {
    showFieldValidation(
      input,
      errorNode,
      requiredMessage ?? `${name} is required.`
    );
    return false;
  }

  if (value.length < minLength) {
    showFieldValidation(
      input,
      errorNode,
      minLengthMessage ?? `${name} must be at least ${minLength} characters.`
    );
    return false;
  }

  clearFieldValidation(input, errorNode);
  return true;
}
