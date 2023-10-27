using {sap.capire.bookshop as my} from '../../../db/schema';

using {
  HelloRequest,
  HelloResponse
} from '../../../db/cds-types/types.cds';


service AdminService {
  @odata.draft.enabled: true
  entity UserActivityLog as projection on my.UserActivityLog;

  @odata.draft.enabled: true
  entity Promotions      as projection on my.Promotions;

  entity Users           as projection on my.Users;
  action sendMail(request : HelloRequest) returns HelloResponse;
}
