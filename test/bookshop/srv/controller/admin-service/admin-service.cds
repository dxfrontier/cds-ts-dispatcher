using {sap.capire.bookshop as my} from '../../../db/schema';

using {
  HelloRequest,
  HelloResponse
} from '../../../db/data/cds-types/types';


service AdminService {
  entity UserActivityLog as projection on my.UserActivityLog;
  entity BookStatistics  as projection on my.BookStatistics;
  action sendMail(request : HelloRequest) returns HelloResponse;
}
