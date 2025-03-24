using {sap.capire.bookshop as Base} from '../../../db/schema';

using {
  HelloRequest,
  HelloResponse
} from '../../../db/cds-types/types.cds';


service AdminService {
  @odata.draft.enabled: true
  entity UserActivityLog as projection on Base.UserActivityLog;

  @odata.draft.enabled: true
  entity Promotions      as projection on Base.Promotions;

  @requires: 'authenticated-user'
  entity Users           as projection on Base.Users;

  action sendMail(request : HelloRequest) returns HelloResponse;
}
