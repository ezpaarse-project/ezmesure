// eslint-disable-next-line import/prefer-default-export
export function getErrorMessage(err) {
  let text;
  if (err.data?.error) {
    // is a API error
    text = err.data?.error;
  }
  if (!text && err.cause) {
    text = err.cause?.message ?? `${err.cause}`;
  }
  if (!text) {
    text = err.message ?? `${err}`;
  }
  if (!text) {
    text = 'Unknown Error';
  }

  if (err.status) {
    text = `${text} (${err.statusCode} - ${err.statusMessage})`;
  }

  return text;
}
