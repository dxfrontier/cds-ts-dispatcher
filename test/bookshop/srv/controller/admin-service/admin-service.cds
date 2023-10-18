using {sap.capire.bookshop as my} from '../../../db/schema';

using {
  HelloRequest,
  HelloResponse
} from '../../../db/cds-types/types.cds';


service AdminService {
  entity UserActivityLog as projection on my.UserActivityLog;
  entity Users           as projection on my.Users;
  action sendMail(request : HelloRequest) returns HelloResponse;
}
