import { AfterRead, EntityHandler, Results, Use } from '../../../../../../../lib';

import { MiddlewareGatedKeys } from '../../../middleware/MiddlewareGatedKeys';

import { Document, Documents } from '#cds-models/GatedDraftService';

// Draft-enabled entity: the class-level gate applies to the active entity and to its drafts.
@EntityHandler(Documents)
@Use(MiddlewareGatedKeys)
class GatedDocumentHandler {
  @AfterRead()
  private async afterRead(@Results() results: Document[]): Promise<void> {
    // no-op: the class only needs one handler method, the gate does the work
  }
}

export default GatedDocumentHandler;
