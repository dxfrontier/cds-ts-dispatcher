import { Service } from "@sap/cds";
import { EntityHandler, Inject, ServiceHelper } from "../../../../../../lib";
import { Book } from "../../../util/entities/CatalogService";

@EntityHandler(Book)
class BookHandler {
    @Inject(ServiceHelper.SRV) private readonly srv: Service;
}

export default BookHandler;
