// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../_')
// service
const CatalogService = { name: 'CatalogService' }
module.exports = CatalogService
module.exports.CatalogService = CatalogService
// Books
module.exports.Book = createEntityProxy(['CatalogService', 'Books'], { target: { is_singular: true } })
module.exports.Books = createEntityProxy(['CatalogService', 'Books'], { target: { is_singular: false }})
// Authors
module.exports.Author = createEntityProxy(['CatalogService', 'Authors'], { target: { is_singular: true } })
module.exports.Authors = createEntityProxy(['CatalogService', 'Authors'], { target: { is_singular: false }})
// Reviews
module.exports.Review = createEntityProxy(['CatalogService', 'Reviews'], { target: { is_singular: true } })
module.exports.Reviews = createEntityProxy(['CatalogService', 'Reviews'], { target: { is_singular: false }})
// Publishers
module.exports.Publisher = createEntityProxy(['CatalogService', 'Publishers'], { target: { is_singular: true } })
module.exports.Publishers = createEntityProxy(['CatalogService', 'Publishers'], { target: { is_singular: false }})
// BookOrders
module.exports.BookOrder = createEntityProxy(['CatalogService', 'BookOrders'], { target: { is_singular: true } })
module.exports.BookOrders = createEntityProxy(['CatalogService', 'BookOrders'], { target: { is_singular: false }})
// BookRecommendations
module.exports.BookRecommendation = createEntityProxy(['CatalogService', 'BookRecommendations'], { target: { is_singular: true } })
module.exports.BookRecommendations = createEntityProxy(['CatalogService', 'BookRecommendations'], { target: { is_singular: false }})
// BookFormats
module.exports.BookFormat = createEntityProxy(['CatalogService', 'BookFormats'], { target: { is_singular: true } })
module.exports.BookFormats = createEntityProxy(['CatalogService', 'BookFormats'], { target: { is_singular: false }})
// BookSales
module.exports.BookSale = createEntityProxy(['CatalogService', 'BookSales'], { target: { is_singular: true } })
module.exports.BookSales = createEntityProxy(['CatalogService', 'BookSales'], { target: { is_singular: false }})
// Wishlists
module.exports.Wishlist = createEntityProxy(['CatalogService', 'Wishlists'], { target: { is_singular: true } })
module.exports.Wishlists = createEntityProxy(['CatalogService', 'Wishlists'], { target: { is_singular: false }})
// ShoppingCart
module.exports.ShoppingCart = createEntityProxy(['CatalogService', 'ShoppingCart'], { target: { is_singular: true } })
module.exports.ShoppingCart_ = createEntityProxy(['CatalogService', 'ShoppingCart'], { target: { is_singular: false }})
// BookSeries
module.exports.BookSery = createEntityProxy(['CatalogService', 'BookSeries'], { target: { is_singular: true } })
module.exports.BookSeries = createEntityProxy(['CatalogService', 'BookSeries'], { target: { is_singular: false }})
// BookEvents
module.exports.BookEvent = createEntityProxy(['CatalogService', 'BookEvents'], { target: { is_singular: true } })
module.exports.BookEvents = createEntityProxy(['CatalogService', 'BookEvents'], { target: { is_singular: false }})
// BookStats
module.exports.BookStat = createEntityProxy(['CatalogService', 'BookStats'], { target: { is_singular: true } })
module.exports.BookStats = createEntityProxy(['CatalogService', 'BookStats'], { target: { is_singular: false }})
// Currencies
module.exports.Currency = createEntityProxy(['CatalogService', 'Currencies'], { target: { is_singular: true } })
module.exports.Currencies = createEntityProxy(['CatalogService', 'Currencies'], { target: { is_singular: false }})
// Genres
module.exports.Genre = createEntityProxy(['CatalogService', 'Genres'], { target: { is_singular: true } })
module.exports.Genres = createEntityProxy(['CatalogService', 'Genres'], { target: { is_singular: false }})
// Books.texts
module.exports.Books.text = createEntityProxy(['CatalogService', 'Books.texts'], { target: { is_singular: true } })
module.exports.Books.texts = createEntityProxy(['CatalogService', 'Books.texts'], { target: { is_singular: false }})
// Currencies.texts
module.exports.Currencies.text = createEntityProxy(['CatalogService', 'Currencies.texts'], { target: { is_singular: true } })
module.exports.Currencies.texts = createEntityProxy(['CatalogService', 'Currencies.texts'], { target: { is_singular: false }})
// Genres.texts
module.exports.Genres.text = createEntityProxy(['CatalogService', 'Genres.texts'], { target: { is_singular: true } })
module.exports.Genres.texts = createEntityProxy(['CatalogService', 'Genres.texts'], { target: { is_singular: false }})
// events
module.exports.OrderedBook = 'CatalogService.OrderedBook'
module.exports.event_2 = 'CatalogService.event_2'
// actions
module.exports.changeBookProperties = 'changeBookProperties'
module.exports.submitOrder = 'submitOrder'
module.exports.submitOrderFunction = 'submitOrderFunction'
// enums
