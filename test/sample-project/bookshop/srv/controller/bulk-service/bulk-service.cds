entity BulkEntity {
  key ID    : Integer;
      email : String(100);
      title : String(100);
}

@protocol: ['odata', 'rest']
service BulkService {
  entity BulkItems as projection on BulkEntity;
}
