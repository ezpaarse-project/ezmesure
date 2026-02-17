/**
 * @template {Record<string, string>} Types
 *
 * @param {Types} types
 * @param {string} modifier
 *
 * @returns {Record<keyof Types, string>}
 */
function applyModifier(types, modifier) {
  return Object.fromEntries(
    Object.entries(types)
      .map(([key, value]) => [key, `${value}.${modifier}`]),
  );
}

const NOTIFICATION_TYPES = {
  institutionValidated: 'institution:validated',
  newUserMatchingInstitution: 'institution:new_user_matching_institution',
  membershipRequest: 'institution:membership_request',
  roleAssigned: 'institution:role_assigned',

  newCounterDataAvailable: 'counter:new_data_available',
};

const ADMIN_NOTIFICATION_TYPES = applyModifier({
  ...NOTIFICATION_TYPES,

  counterReadyChange: 'institution:counter_ready_change',

  userRequestDeletion: 'user:request_deletion',
  userDeleted: 'user:auto_deleted',

  contactForm: 'contact:form',

  appRecentActivity: 'app:recent_activity',
}, 'admin');

const NOTIFICATION_KEYS = [
  ...Object.values(NOTIFICATION_TYPES),
  ...Object.values(ADMIN_NOTIFICATION_TYPES),
];

const EVENT_TYPES = {
  selfJoinInstitution: 'institution:self_join',
  joinOnboardingInstitution: 'institution:user_onboarded',
  declareInstitution: 'institution:declared',
};

module.exports = {
  NOTIFICATION_TYPES,
  ADMIN_NOTIFICATION_TYPES,
  NOTIFICATION_KEYS,

  EVENT_TYPES,
};
