import './style.css';
import { createAudioEngine } from './audio/context';
import { kitchenScene } from './scenes/kitchen';
import { titleScene } from './scenes/title';
import { createOrientationGuard } from './stage/orientation';
import { createSceneManager } from './stage/scenes';
import { createStage } from './stage/stage';

const app = document.querySelector<HTMLElement>('#app');
if (app) {
  const stage = createStage(app);
  const audio = createAudioEngine();
  const scenes = createSceneManager(stage, audio, { title: titleScene, kitchen: kitchenScene });
  const orientation = createOrientationGuard(app);
  scenes.go('title');

  if (import.meta.env.DEV) {
    // Handles for the manual checks in docs/steps/STEP-02-*.md; stripped from the build.
    Object.assign(window, {
      __stage: stage,
      __audio: audio,
      __scenes: scenes,
      __orientation: orientation,
    });
  }
}
