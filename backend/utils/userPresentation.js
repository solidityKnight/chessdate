const publicUserAttributes = [
  'id',
  'username',
  'displayName',
  'profilePhoto',
  'isProfilePhotoVerified',
  'lastActiveAt',
  'eloRating',
  'country',
  'city',
  'gender',
  'matchPreferences',
  'wins',
  'losses',
  'draws',
];

function normalizeMatchPreferences(input) {
  const validOptions = ['male', 'female'];
  const values = Array.isArray(input) ? input : validOptions;
  const normalized = values
    .map((value) => String(value).toLowerCase())
    .filter((value) => validOptions.includes(value));

  return normalized.length > 0 ? Array.from(new Set(normalized)) : validOptions;
}

function getProfileCompletion(user) {
  if (!user) return 0;

  const checklist = [
    user.displayName,
    user.bio,
    user.profilePhoto,
    user.city,
    user.country,
    user.age,
    Array.isArray(user.interests) && user.interests.length > 0,
    user.matchPreferences && user.matchPreferences.length > 0,
  ];

  const completed = checklist.filter(Boolean).length;
  return Math.round((completed / checklist.length) * 100);
}

function sanitizeUser(user) {
  if (!user) return null;
  const value = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete value.password;
  value.matchPreferences = normalizeMatchPreferences(value.matchPreferences);
  value.profileCompletion = getProfileCompletion(value);
  return value;
}

module.exports = {
  publicUserAttributes,
  normalizeMatchPreferences,
  getProfileCompletion,
  sanitizeUser,
};
