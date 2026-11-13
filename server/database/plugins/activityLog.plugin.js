const service = () => require("../../modules/log/log.service");
const record = async (entry) => {
  try {
    await service().record(entry);
  } catch (error) {
    console.error("Activity log failed:", error.message);
  }
};
const activityLogPlugin = (schema, { entity }) => {
  schema.pre("save", async function () {
    this.$locals.activityIsNew = this.isNew;
    if (!this.isNew) this.$locals.activityBefore = await this.constructor.findById(this._id).lean();
  });
  schema.post("save", async function (doc) {
    const before = doc.$locals.activityIsNew ? null : doc.$locals.activityBefore;
    if (!doc.$locals.activityIsNew && !before) return;
    await record({ entity, modelName: doc.constructor.modelName, before, after: doc.toObject() });
  });
  schema.pre("findOneAndUpdate", async function () {
    this._activityBefore = await this.model.findOne(this.getQuery()).lean();
  });
  schema.post("findOneAndUpdate", async function () {
    const before = this._activityBefore || null;
    const after = await this.model.findOne(before ? { _id: before._id } : this.getQuery()).lean();
    if (!after) return;
    await record({ entity, modelName: this.model.modelName, before, after });
  });
  schema.pre("findOneAndDelete", async function () {
    this._activityBefore = await this.model.findOne(this.getQuery()).lean();
  });
  schema.post("findOneAndDelete", async function () {
    if (!this._activityBefore) return;
    await record({ entity, modelName: this.model.modelName, before: this._activityBefore, after: null });
  });
};
module.exports = activityLogPlugin;
