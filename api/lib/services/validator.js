const mandatoryFields = [
  'datetime',
  'log_id',
  'rtype',
  'mime',
  'title_id',
  'doi',
];

function validationError(message) {
  const err = new Error(message);
  err.type = 'validation';
  return err;
}

/**
 * Validate the columns of a CSV
 * @param {Array<String>} columns
 */
exports.validateColumns = (columns) => {
  const missingFields = mandatoryFields.filter((field) => !columns.includes(field));

  if (missingFields.length > 0) {
    throw validationError(`Champs manquants: ${missingFields.join(', ')}`);
  }
};

/**
 * Validate an EC
 * @param {Object} ec
 */
exports.validateEvent = (ec, lineNumber) => {
  if (!ec.log_id) {
    throw validationError(`Ligne #${lineNumber}: champ "log_id" vide`);
  }
  if (!ec.datetime) {
    throw validationError(`Ligne #${lineNumber}: champ "datetime" vide`);
  }
  if (Number.isNaN(Date.parse(ec.datetime))) {
    throw validationError(`Ligne #${lineNumber}: champ "datetime" invalide, le fichier a-t-il été modifié ?`);
  }
  if (ec.date && !/^\d{4}-\d{2}-\d{2}$/.test(ec.date)) {
    throw validationError(`Ligne #${lineNumber}: champ "date" invalide, le fichier a-t-il été modifié ?`);
  }
};
