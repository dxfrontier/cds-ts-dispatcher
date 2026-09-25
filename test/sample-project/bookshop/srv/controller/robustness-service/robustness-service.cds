using {cuid} from '@sap/cds/common';

entity RobustnessItemsEntity : cuid {
  name : String(100);
}

service RobustnessService {
  entity RobustnessItems as projection on RobustnessItemsEntity;

  function returnNull()                          returns String;
  function returnString(value : String)          returns String;
  function returnInteger(value : Integer)        returns Integer;
  function returnDecimal(value : Decimal(9, 2))  returns Decimal(9, 2);
  function returnIntegerList()                   returns array of Integer;
  action   readQueryOptions()                    returns String;
}
