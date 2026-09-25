import { EntityHandler, Use } from '../../../../../../../lib';

import { MiddlewareGatedKeys } from '../../../middleware/MiddlewareGatedKeys';

import { Notes } from '#cds-models/GatedDraftService';

// No handler methods at all: the class-level gate alone must still be registered.
@EntityHandler(Notes)
@Use(MiddlewareGatedKeys)
class GatedNoteHandler {}

export default GatedNoteHandler;
