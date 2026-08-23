import './style.css';

// Placeholder screen: the game title only – the player cannot read (CLAUDE.md rule 1).
// STEP-02 replaces it with the scaled stage.
const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = '<main class="splash"><h1>Mlsná abeceda</h1></main>';
}
