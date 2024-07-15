// This is an automatically generated file. Please do not change its contents manually!
const cds = require('@sap/cds')
const csn = cds.entities('CatalogService')
module.exports = { name: 'CatalogService' }
module.exports.Book = { is_singular: true, __proto__: csn.Books }
module.exports.Books = csn.Books
module.exports.Author = { is_singular: true, __proto__: csn.Authors }
module.exports.Authors = csn.Authors
module.exports.Review = { is_singular: true, __proto__: csn.Reviews }
module.exports.Reviews = csn.Reviews
module.exports.Publisher = { is_singular: true, __proto__: csn.Publishers }
module.exports.Publishers = csn.Publishers
module.exports.BookOrder = { is_singular: true, __proto__: csn.BookOrders }
module.exports.BookOrders = csn.BookOrders
module.exports.BookRecommendation = { is_singular: true, __proto__: csn.BookRecommendations }
module.exports.BookRecommendations = csn.BookRecommendations
module.exports.BookFormat = { is_singular: true, __proto__: csn.BookFormats }
module.exports.BookFormats = csn.BookFormats
module.exports.BookSale = { is_singular: true, __proto__: csn.BookSales }
module.exports.BookSales = csn.BookSales
module.exports.BookEvent = { is_singular: true, __proto__: csn.BookEvents }
module.exports.BookEvents = csn.BookEvents
module.exports.BookStat = { is_singular: true, __proto__: csn.BookStats }
module.exports.BookStats = csn.BookStats
module.exports.Currency = { is_singular: true, __proto__: csn.Currencies }
module.exports.Currencies = csn.Currencies
module.exports.Genre = { is_singular: true, __proto__: csn.Genres }
module.exports.Genres = csn.Genres
// events
module.exports.OrderedBook = 'CatalogService.OrderedBook'
// actions
module.exports.changeBookProperties = 'changeBookProperties'
module.exports.submitOrder = 'submitOrder'
module.exports.submitOrderFunction = 'submitOrderFunction'
// enums
