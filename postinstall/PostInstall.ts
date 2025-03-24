import { EnvGenerator } from './util/EnvGenerator';

class PostInstall {
  private readonly GenerateEnv: EnvGenerator;

  public run() {
    new EnvGenerator().run();
    // add more postinstall utils if needed ...
  }
}

new PostInstall().run();
