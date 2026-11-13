const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const phonePattern = (term) => term.replace(/[^\d+]/g, "").split("").map(escapeRegex).join("[\\s\\-.()]*");
const searchFilter = (q) => {
  const terms = String(q).trim().split(/\s+/).filter(Boolean).slice(0, 5);
  return terms.map(term => {
    const text = { $regex: escapeRegex(term), $options: "i" };
    const or = [{ "user.firstName": text }, { "user.lastName": text }, { "user.phone": text }];
    if (/\d/.test(term)) or.push({ "user.phone": { $regex: phonePattern(term) } });
    return { $or: or };
  });
};
const findFilter = async (query) => {
  const filter = {
    "user.role": "employee",
    "user.active": true,
    "user.deleted": false
  };

  if (query.q && String(query.q).trim()) {
    filter.$and = searchFilter(query.q);
  }

  if (query.firstName) {
    filter["user.firstName"] = {
      $regex: escapeRegex(query.firstName),
      $options: "i"
    };
  }

  if (query.lastName) {
    filter["user.lastName"] = {
      $regex: escapeRegex(query.lastName),
      $options: "i"
    };
  }

  if (query.email) {
    filter["user.email"] = {
      $regex: escapeRegex(query.email),
      $options: "i"
    };
  }

  return filter;
};

module.exports = {
  findFilter
}