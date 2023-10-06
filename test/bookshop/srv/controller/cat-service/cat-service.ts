import { CDSDispatcher } from '../../../../../lib/index';
import ListOfBookHandler from './handler/ListOfBookHandler';

module.exports = new CDSDispatcher([ListOfBookHandler]).initializeEntityHandlers();
