const dayjs = require('dayjs');
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const { CONSTANT_UTC_OFFSET_MINUTES } = require('../constants');
const formatDate = async(date) => {
  if (!date) return "";
  return dayjs.utc(date).format("DD-MM-YYYY");
};
const formatLocalDate = async(date) => {
  if (!date) return "";
  return dayjs.utc(date).utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format("DD-MM-YYYY");
};
module.exports = {
  formatDate,
  formatLocalDate
}
