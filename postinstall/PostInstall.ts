import { GenerateEnv } from './util/GenerateEnv';

class PostInstall {
  private readonly GenerateEnv: GenerateEnv;

  public run() {
    new GenerateEnv().run();
    // add more postinstall utils if needed ...
  }
}

new PostInstall().run();
