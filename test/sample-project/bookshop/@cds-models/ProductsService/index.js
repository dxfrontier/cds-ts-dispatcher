// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../_')
// service
const ProductsService = { name: 'ProductsService' }
module.exports = ProductsService
module.exports.ProductsService = ProductsService
// Products
module.exports.Product = createEntityProxy(['ProductsService', 'Products'], { target: { is_singular: true } })
module.exports.Products = createEntityProxy(['ProductsService', 'Products'], { target: { is_singular: false }})
// events
// actions
// enums
