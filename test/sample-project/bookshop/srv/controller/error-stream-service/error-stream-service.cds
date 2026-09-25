// Fixture for @OnError (errors thrown inside the error handler) and @Stream (root vs. $batch / nested calls).
service ErrorStreamService {
  // Raises a 400 error whose message is `mode` - the @OnError handlers select their own behavior from it.
  function failFn(mode : String)   returns String;
  // @Stream function - streams plain text to a root HTTP request; rejected with 400 inside a $batch part.
  function streamFn()              returns @Core.MediaType: 'application/octet-stream' LargeBinary;
  // @Stream function - streams a larger, multi-chunk CSV body to a root HTTP request.
  function largeStreamFn()         returns @Core.MediaType: 'text/csv' LargeBinary;
  // Plain function - used as a sibling part inside a $batch and as a liveness check.
  function plainFn()               returns String;
  // Calls `streamFn` through `srv.send` and reports what the nested call returned.
  function nestedStreamFn()        returns String;
}
