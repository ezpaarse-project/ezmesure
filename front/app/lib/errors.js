// eslint-disable-next-line import/prefer-default-export
export function getErrorMessage(err, fallback = 'Unknown Error') {
  let text;
  // is a API error
  if (err.data?.error) {
    text = err.data?.error;
  }
  // if a page not found
  if (!text && err.statusCode === 404) {
    text = "This page doesn't exists";
  }
  // have a cause
  if (!text && err.cause) {
    text = err.cause?.message ?? `${err.cause}`;
  }
  // is a native error
  if (!text) {
    text = err.message ?? `${err}`;
  }
  // fallback to text
  if (!text) {
    text = fallback;
  }

  // if everything failed
  if (text === '[object Object]') {
    console.warn('Unable to parse error:', { ...err });
    text = fallback;
  }

  // shows HTTP status
  if (err.status || err.statusCode) {
    text = `${text} (${err.statusCode} - ${err.statusMessage})`;
  }

  return text;
}
