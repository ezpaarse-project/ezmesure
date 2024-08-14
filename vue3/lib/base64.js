/**
 *
 * @param {File} file
 * @returns {Promise<string>}
*/
// eslint-disable-next-line import/prefer-default-export
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result.replace(/^data:.*?;base64,/i, '');
      resolve(b64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
