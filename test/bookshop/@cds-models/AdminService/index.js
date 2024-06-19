// This is an automatically generated file. Please do not change its contents manually!
const cds = require('@sap/cds')
const csn = cds.entities('AdminService')
module.exports = { name: 'AdminService' }
module.exports.UserActivityLog = { is_singular: true, __proto__: csn.UserActivityLog }
module.exports.UserActivityLog_ = csn.UserActivityLog
module.exports.Promotion = { is_singular: true, __proto__: csn.Promotions }
module.exports.Promotions = { is_singular: true, __proto__: csn.Promotions }
module.exports.User = { is_singular: true, __proto__: csn.Users }
module.exports.Users = { is_singular: true, __proto__: csn.Users }
// events
// actions
module.exports.sendMail = 'sendMail'
// enums
