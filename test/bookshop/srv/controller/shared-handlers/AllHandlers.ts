import { AfterRead, CDS_DISPATCHER, EntityHandler, Req, Results, TypedRequest } from '../../../../../lib';

@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)
class AllEntities {
  @AfterRead()
  private async all(@Req() req: TypedRequest<any>, @Results() results: any[]): Promise<void> {
    console.log('Triggering READ for all entities ...');
  }
}

export default AllEntities;
