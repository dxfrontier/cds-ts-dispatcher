// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../_')
// service
const AdminService = { name: 'AdminService' }
module.exports = AdminService
module.exports.AdminService = AdminService
// UserActivityLog
module.exports.UserActivityLog = createEntityProxy(['AdminService', 'UserActivityLog'], { target: { is_singular: true } })
module.exports.UserActivityLog_ = createEntityProxy(['AdminService', 'UserActivityLog'], { target: { is_singular: false }})
// Promotions
module.exports.Promotion = createEntityProxy(['AdminService', 'Promotions'], { target: { is_singular: true } })
module.exports.Promotions = createEntityProxy(['AdminService', 'Promotions'], { target: { is_singular: false }})
// Users
module.exports.User = createEntityProxy(['AdminService', 'Users'], { target: { is_singular: true } })
module.exports.Users = createEntityProxy(['AdminService', 'Users'], { target: { is_singular: false }})
// events
// actions
module.exports.sendMail = 'sendMail'
// enums
