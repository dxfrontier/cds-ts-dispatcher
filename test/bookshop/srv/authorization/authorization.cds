using {CatalogService} from '../controller/cat-service/catalog-service';


annotate CatalogService.BookSales with  @requires: 'authenticated-user'  @(restrict: [
    {
        grant: [
            'READ',
            'WRITE'
        ],
        to   : ['User']
    },
    {
        grant: ['*'],
        to   : ['Manager']
    }
]);
