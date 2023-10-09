import { CDSDispatcher } from '../../../../../lib/index';
import BookHandler from './handler/BookHandler';

module.exports = new CDSDispatcher([BookHandler]).initializeEntityHandlers();
