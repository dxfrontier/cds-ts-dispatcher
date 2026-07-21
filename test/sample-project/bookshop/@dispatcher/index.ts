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
      kind: string;
      users: {
        manager: {
          roles: string[];
        };
        user: {
          roles: string[];
        };
      };
      tenants: {};
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
    messaging: {
      impl: string;
      local: boolean;
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
    '@cap-js/cds-typer': {
      impl: string;
    };
  };
  typer: {
    output_directory: string;
    inline_declarations: string;
    target_module_type: string;
    properties_optional: boolean;
    use_entities_proxy: boolean;
    build_task: boolean;
  };
  schema: {
    buildTaskType: {
      name: string;
      description: string;
    };
    cds: {
      typer: {
        type: string;
        description: string;
        properties: {
          cache: {
            type: string;
            description: string;
            enum: string[];
            default: string;
          };
          output_directory: {
            type: string;
            description: string;
            default: string;
          };
          log_level: {
            type: string;
            description: string;
            enum: string[];
            default: string;
          };
          js_config_path: {
            type: string;
            description: string;
          };
          use_entities_proxy: {
            type: string;
            description: string;
            default: boolean;
          };
          inline_declarations: {
            type: string;
            description: string;
            enum: string[];
            default: string;
          };
          properties_optional: {
            type: string;
            description: string;
            default: boolean;
          };
          ieee754compatible: {
            type: string;
            description: string;
            default: boolean;
          };
          legacy_binary_types: {
            type: string;
            description: string;
            default: boolean;
          };
          target_module_type: {
            type: string;
            description: string;
            enum: string[];
            default: string;
          };
          build_task: {
            type: string;
            description: string;
            default: boolean;
          };
        };
      };
    };
  };
  appid: null;
}
