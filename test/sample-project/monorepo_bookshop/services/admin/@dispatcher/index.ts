// Type definitions for envConfig
export interface CDS_ENV {
    _context: string;
    _home: string;
    _sources: string[];
    _profiles: _profiles;
    production: boolean;
    requires: Requires;
    runtime: Runtime;
    server: Server;
    protocols: Protocols;
    features: Features;
    fiori: Fiori;
    ql: Ql;
    log: Log;
    folders: Folders;
    i18n: I18n;
    odata: Odata;
    sql: Sql;
    hana: Hana;
    build: Build;
    cdsc: Cdsc;
    query: Query;
    plugins: Plugins;
    config: Config;
    '_home_cds-dk': string;
}
interface _profiles {
    _defined: _defined;
}
interface _defined {
}
interface Requires {
    middlewares: boolean;
    queue: Queue;
    auth: Auth;
    db: Db;
}
interface Queue {
    model: string;
    maxAttempts: number;
    chunkSize: number;
    parallel: boolean;
    storeLastError: boolean;
    timeout: string;
    legacyLocking: boolean;
    ignoredContext: string[];
    kind: string;
}
interface Auth {
    restrict_all_services: boolean;
    kind: string;
    users: Users;
    tenants: Tenants;
}
interface Users {
    alice: Alice;
    bob: Bob;
    carol: Carol;
    dave: Dave;
    erin: Erin;
    fred: Fred;
    me: Me;
    yves: Yves;
    '*': boolean;
}
interface Alice {
    tenant: string;
    roles: string[];
}
interface Bob {
    tenant: string;
    roles: string[];
}
interface Carol {
    tenant: string;
    roles: string[];
}
interface Dave {
    tenant: string;
    roles: string[];
    features: any[];
}
interface Erin {
    tenant: string;
    roles: string[];
}
interface Fred {
    tenant: string;
    features: string[];
}
interface Me {
    tenant: string;
    features: string[];
}
interface Yves {
    roles: string[];
}
interface Tenants {
    t1: T1;
    t2: T2;
}
interface T1 {
    features: string[];
}
interface T2 {
    features: string;
}
interface Db {
    impl: string;
    credentials: Credentials;
    kind: string;
}
interface Credentials {
    url: string;
}
interface Runtime {
    patch_as_upsert: boolean;
    put_as_upsert: boolean;
    put_as_replace: boolean;
}
interface Server {
    shutdown_on_uncaught_errors: boolean;
    exit_on_multi_install: boolean;
    force_exit_timeout: number;
    cors: boolean;
    index: boolean;
    port: number;
}
interface Protocols {
    'odata-v4': {
        path: string;
    };
    'odata-v2': {
        path: string;
    };
    rest: Rest;
    hcql: Hcql;
}
interface Rest {
    path: string;
}
interface Hcql {
    path: string;
}
interface Features {
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
    consistent_params: boolean;
}
interface Fiori {
    preview: Preview;
    routes: boolean;
    lean_draft: boolean;
    wrap_multiple_errors: boolean;
    draft_lock_timeout: boolean;
    draft_deletion_timeout: boolean;
}
interface Preview {
    ui5: Ui5;
}
interface Ui5 {
    version: string;
    theme: Theme;
}
interface Theme {
    light: string;
    dark: string;
    'switch': boolean;
}
interface Ql {
}
interface Log {
    levels?: Levels;
    service?: boolean;
    user?: boolean;
    mask_headers?: string[];
    aspects?: string[];
    als_custom_fields?: Als_custom_fields;
    cls_custom_fields?: string[];
    format: string;
}
interface Levels {
    compile: string;
    cli: string;
}
interface Als_custom_fields {
    query: number;
    target: number;
    details: number;
    reason: number;
}
interface Folders {
    db: string;
    srv: string;
    app: string;
}
interface I18n {
    file: string;
    folders: string[];
    languages: string;
    default_language: string;
    preserved_locales: string[];
    fallback_bundle: string;
    fatjson: boolean;
}
interface Odata {
    flavors: Flavors;
    version: string;
    context_with_columns: boolean;
    max_batch_header_size: string;
}
interface Flavors {
    v2: V2;
    v4: V4;
    w4: W4;
    x4: X4;
}
interface V2 {
    version: string;
}
interface V4 {
    version: string;
}
interface W4 {
    version: string;
    containment: boolean;
    structs: boolean;
    refs: boolean;
    xrefs: boolean;
}
interface X4 {
    version: string;
    containment: boolean;
    structs: boolean;
    refs: boolean;
    xrefs: boolean;
}
interface Sql {
    names: string;
    dialect: string;
}
interface Hana {
    'deploy-format': string;
    journal: Journal;
    table_data: Table_data;
}
interface Journal {
    'change-mode': string;
}
interface Table_data {
    column_mapping: Column_mapping;
}
interface Column_mapping {
    LargeBinary: string;
}
interface Build {
    target: string;
}
interface Cdsc {
    moduleLookupDirectories: string[];
}
interface Query {
    limit: Limit;
}
interface Limit {
    max: number;
}
interface Plugins {
    '@sap/cds-fiori': {
        impl: string;
    };
    '@cap-js/sqlite': {
        impl: string;
    };
}
interface Config {
    log: Log;
}
