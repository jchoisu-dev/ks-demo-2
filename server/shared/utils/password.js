const bcrypt = require('bcryptjs');
const ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", ROUNDS);
const isBcryptHash = (hash) => /^\$2[aby]\$\d{2}\$/.test(String(hash || ""));
const hashPassword = async (plain) => bcrypt.hash(String(plain), ROUNDS);
const verifyPassword = async (plain, hash) => {
  if (typeof plain != "string" || !hash) {
    await bcrypt.compare(String(plain || ""), DUMMY_HASH);
    return false;
  }
  if (!isBcryptHash(hash)) {
    await bcrypt.compare(plain, DUMMY_HASH);
    return false;
  }
  return await bcrypt.compare(plain, hash);
};
const rejectWithDelay = async (plain) => {
  await bcrypt.compare(String(plain || ""), DUMMY_HASH);
};
module.exports = {
  isBcryptHash,
  hashPassword,
  verifyPassword,
  rejectWithDelay
}
