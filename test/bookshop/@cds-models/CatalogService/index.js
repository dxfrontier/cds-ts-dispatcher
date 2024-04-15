// This is an automatically generated file. Please do not change its contents manually!
const cds = require('@sap/cds')
const csn = cds.entities('CatalogService')
module.exports = { name: 'CatalogService' }
module.exports.Book = csn.Books
module.exports.Books = csn.Books
module.exports.Author = csn.Authors
module.exports.Authors = csn.Authors
module.exports.Review = csn.Reviews
module.exports.Reviews = csn.Reviews
module.exports.Publisher = csn.Publishers
module.exports.Publishers = csn.Publishers
module.exports.BookOrder = csn.BookOrders
module.exports.BookOrders = csn.BookOrders
module.exports.BookRecommendation = csn.BookRecommendations
module.exports.BookRecommendations = csn.BookRecommendations
module.exports.BookFormat = csn.BookFormats
module.exports.BookFormats = csn.BookFormats
module.exports.BookSale = csn.BookSales
module.exports.BookSales = csn.BookSales
module.exports.BookEvent = csn.BookEvents
module.exports.BookEvents = csn.BookEvents
module.exports.BookStat = csn.BookStats
module.exports.BookStats = csn.BookStats
module.exports.Currency = csn.Currencies
module.exports.Currencies = csn.Currencies
module.exports.Genre = csn.Genres
module.exports.Genres = csn.Genres
// events
module.exports.OrderedBook = 'CatalogService.OrderedBook'
// actions
module.exports.changeBookProperties = 'changeBookProperties'
module.exports.submitOrder = 'submitOrder'
module.exports.submitOrderFunction = 'submitOrderFunction'
// enums
