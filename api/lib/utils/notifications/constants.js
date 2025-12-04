module.exports.NOTIFICATION_TYPES = {
  institutionValidated: 'institution:validated',
  newUserMatchingInstitution: 'institution:new_user_matching_institution',
  membershipRequest: 'institution:membership_request',
  roleAssigned: 'institution:role_assigned',
  counterReadyChange: 'institution:counter_ready_change',

  contactForm: 'contact:form',

  newCounterDataAvailable: 'counter:new_data_available',

  appRecentActivity: 'app:recent_activity',
};

module.exports.EVENT_TYPES = {
  selfJoinInstitution: 'institution:self_join',
  joinOnboardingInstitution: 'institution:user_onboarded',
  declareInstitution: 'institution:declared',
};
