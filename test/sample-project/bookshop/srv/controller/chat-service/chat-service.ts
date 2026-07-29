import { CDSDispatcher } from '../../../../../../lib';

import ChatHandler from './handler/ChatHandler';

export = new CDSDispatcher([ChatHandler]).initialize();
