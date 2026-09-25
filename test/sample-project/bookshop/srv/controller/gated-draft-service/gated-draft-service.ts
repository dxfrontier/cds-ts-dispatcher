import { CDSDispatcher } from '../../../../../../lib';

import GatedDocumentHandler from './handler/GatedDocumentHandler';
import GatedNoteHandler from './handler/GatedNoteHandler';

export = new CDSDispatcher([
  // Entities
  GatedDocumentHandler,
  GatedNoteHandler,
]).initialize();
