const config = require('config');

const sender = config.get('notifications.sender');
const supports = config.get('notifications.supportRecipients');
const { sendMail, generateMail } = require('../../services/mail');

exports.sendWelcomeMail = function sendWelcomeMail(user, data) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Bienvenue sur ezMESURE !',
    ...generateMail('welcome', { username: user.data, ...data }),
  });
};

exports.sendPasswordRecovery = function sendPasswordRecovery(user, data) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Réinitialisation mot de passe ezMESURE/Kibana',
    ...generateMail('new-password', { user, ...data }),
  });
};

exports.sendNewUserToContacts = function sendNewUserToContacts(receivers, data) {
  return sendMail({
    from: sender,
    to: receivers,
    cc: supports,
    subject: `${data.newUser} s'est inscrit sur ezMESURE`,
    ...generateMail('new-account', { data }),
  });
};
