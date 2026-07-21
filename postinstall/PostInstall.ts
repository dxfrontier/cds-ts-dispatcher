import { EnvGenerator } from './util/EnvGenerator';

class PostInstall {
  public run() {
    // Last-resort guard: a postinstall must never abort a consumer's `npm install`, wherever it
    // fails — including the project scan that runs while `EnvGenerator` is being constructed.
    try {
      new EnvGenerator().run();
      // add more postinstall utils if needed ...
    } catch (error) {
      console.warn(`⚠️  [cds-ts-dispatcher] Postinstall skipped: ${(error as Error).message}`);
    }
  }
}

new PostInstall().run();
