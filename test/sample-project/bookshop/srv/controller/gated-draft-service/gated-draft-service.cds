// Class-level `@Use` on a draft-enabled entity: the gate middleware must run for the ACTIVE entity
// (direct CRUD on active instances, on by default since `@sap/cds` 10) as well as for its `.drafts`.
entity GatedDocumentsEntity {
  key ID    : Integer;
      title : String(100);
}

entity GatedNotesEntity {
  key ID   : Integer;
      text : String(100);
}

service GatedDraftService {
  @odata.draft.enabled: true
  entity Documents as projection on GatedDocumentsEntity;

  entity Notes     as projection on GatedNotesEntity;
}
