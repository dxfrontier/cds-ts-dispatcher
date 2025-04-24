using {cuid} from '@sap/cds/common';


entity ProductsEntity : cuid {
  name : String(100);
}

service ProductsService {
  entity Products as projection on ProductsEntity;
}
