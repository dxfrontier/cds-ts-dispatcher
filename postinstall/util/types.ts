export type PackageJson = {
  name: string | undefined;
  workspaces: string[] | undefined;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  imports: Record<string, string>;
  path: string;
};

export type ExecutionPaths = {
  executedInstalledPath: string;
  envFilePath: string;
  runtimeStubPath: string;
  dispatcherPath: string;
}[];
