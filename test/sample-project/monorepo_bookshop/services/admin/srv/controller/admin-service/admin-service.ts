import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';
import UserActivityLogHandler from './handler/UserActivityLogHandler';

export = new CDSDispatcher([UserActivityLogHandler]).initialize();
