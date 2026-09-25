import { CDSDispatcher } from '../../../../../../lib';

import ErrorStreamHandler from './handler/ErrorStreamHandler';

export = new CDSDispatcher([
  // Unbound functions + @OnError
  ErrorStreamHandler,
]).initialize();
