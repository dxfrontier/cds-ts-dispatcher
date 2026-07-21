// Type definitions for envConfig
export interface CDS_ENV {
  _context: string;
  _home: string;
  _sources: string[];
  _profiles: {
    _defined: {};
  };
  production: boolean;
  requires: {
    middlewares: boolean;
    queue: {
      model: string;
      maxAttempts: number;
      timeout: string;
      legacyLocking: boolean;
      chunkSize: number;
      parallel: boolean;
      _ignoredContext: string[];
      kind: string;
    };
    scheduling: {
      impl: string;
      queued: boolean;
      silent: boolean;
      markerInterval: string;
      flushInterval: string;
      _optimisticMarkers: boolean;
    };
    auth: {
      restrict_all_services: boolean;
      kind: string;
      users: {
        alice: {
          tenant: string;
          roles: string[];
        };
        bob: {
          tenant: string;
          roles: string[];
        };
        carol: {
          tenant: string;
          roles: string[];
        };
        dave: {
          tenant: string;
          roles: string[];
          features: unknown[];
        };
        erin: {
          tenant: string;
          roles: string[];
        };
        fred: {
          tenant: string;
          features: string[];
        };
        me: {
          tenant: string;
          features: string[];
        };
        yves: {
          roles: string[];
        };
        '*': boolean;
      };
      tenants: {
        t1: {
          features: string[];
        };
        t2: {
          features: string;
        };
      };
    };
    db: {
      impl: string;
      credentials: {
        url: string;
      };
      data: string[];
      pool: {
        evictionRunIntervalMillis: number;
        min: number;
        max: number;
      };
      kind: string;
    };
  };
  runtime: {
    patch_as_upsert: boolean;
    put_as_upsert: boolean;
    put_as_replace: boolean;
  };
  server: {
    shutdown_on_uncaught_errors: boolean;
    exit_on_multi_install: boolean;
    force_exit_timeout: number;
    cors: boolean;
    index: boolean;
    port: number;
  };
  protocols: {
    'odata-v4': {
      path: string;
    };
    'odata-v2': {
      path: string;
    };
    rest: {
      path: string;
    };
    hcql: {
      path: string;
    };
    'data.product': null;
  };
  features: {
    folders: string;
    sql_simple_queries: number;
    pre_compile_edmxs: boolean;
    live_reload: boolean;
    in_memory_db: boolean;
    test_data: boolean;
    test_mocks: boolean;
    with_mocks: boolean;
    mocked_bindings: boolean;
    skip_unused: boolean;
    deploy_data_onconflict: string;
    assert_integrity: boolean;
    precise_timestamps: boolean;
    ieee754compatible: boolean;
    compat_clone_appends: boolean;
    compat_srv_getters: boolean;
    compat_texts_entities: boolean;
    legacy_srv_results: boolean;
    legacy_db_results: boolean;
    bulk_inserts_via_rest: boolean;
    annotate_for_flows: boolean;
    history_for_flows: boolean;
  };
  fiori: {
    preview: {
      ui5: {
        version: string;
        theme: {
          light: string;
          dark: string;
          switch: boolean;
        };
      };
    };
    routes: boolean;
    lean_draft: boolean;
    wrap_multiple_errors: boolean;
    draft_lock_timeout: boolean;
    draft_deletion_timeout: boolean;
    draft_messages: boolean;
    draft_new_action: boolean;
    bypass_draft: boolean;
  };
  ql: {};
  log: {
    levels: {
      compile: string;
      cli: string;
    };
    service: boolean;
    user: boolean;
    mask_headers: string[];
    aspects: string[];
    als_custom_fields: {
      query: number;
      target: number;
      details: number;
      reason: number;
    };
    cls_custom_fields: string[];
    format: string;
  };
  folders: {
    db: string;
    srv: string;
    app: string;
    apps: string;
  };
  i18n: {
    file: string;
    folders: string[];
    languages: string;
    default_language: string;
    preserved_locales: string[];
    fallback_bundle: string;
    fatjson: boolean;
  };
  odata: {
    flavors: {
      v2: {
        version: string;
      };
      v4: {
        version: string;
      };
      w4: {
        version: string;
        containment: boolean;
        structs: boolean;
        refs: boolean;
        xrefs: boolean;
      };
      x4: {
        version: string;
        containment: boolean;
        structs: boolean;
        refs: boolean;
        xrefs: boolean;
      };
    };
    version: string;
    context_with_columns: boolean;
    max_batch_header_size: string;
    max_batch_parallelization: number;
  };
  sql: {
    names: string;
    dialect: string;
  };
  hana: {
    'deploy-format': string;
    journal: {
      'change-mode': string;
    };
    table_data: {
      column_mapping: {
        LargeBinary: string;
      };
    };
  };
  build: {
    target: string;
  };
  cdsc: {
    moduleLookupDirectories: string[];
  };
  query: {
    limit: {
      max: number;
    };
  };
  remote: {};
  plugins: {
    '@sap/cds-fiori': {
      impl: string;
    };
    '@cap-js/sqlite': {
      impl: string;
    };
  };
  appid: null;
}
