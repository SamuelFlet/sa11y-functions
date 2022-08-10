import { setPanel } from "../constants";
import buildPanel from "../setup/buildPanel";
import skipToIssue from "./skipToIssue";
import { errorCount, warningCount } from "../constants";
import { Lang } from "./lang/Lang";
export default function updatePanel  ()  {
    setPanel(true);

    buildPanel();
    skipToIssue();

    const $skipBtn = document.getElementById('sa11y-cycle-toggle');
    $skipBtn.disabled = false;
    $skipBtn.setAttribute('style', 'cursor: pointer !important;');

    const $panel = document.getElementById('sa11y-panel');
    $panel.classList.add('sa11y-active');

    const html = document.querySelector('html');
    html.setAttribute('data-sa11y-active', 'true');

    const $panelContent = document.getElementById('sa11y-panel-content');
    const $status = document.getElementById('sa11y-status');
    const $findButtons = document.querySelectorAll('.sa11y-btn');

    if (errorCount > 0 && warningCount > 0) {
      $panelContent.setAttribute('class', 'sa11y-errors');
      $status.innerHTML = `${Lang._('ERRORS')} <span class="sa11y-panel-count sa11y-margin-right">${errorCount}</span> ${Lang._('WARNINGS')} <span class="sa11y-panel-count">${warningCount}</span>`;
    } else if (errorCount > 0) {
      $panelContent.setAttribute('class', 'sa11y-errors');
      $status.innerHTML = `${Lang._('ERRORS')} <span class="sa11y-panel-count">${errorCount}</span>`;
    } else if (warningCount > 0) {
      $panelContent.setAttribute('class', 'sa11y-warnings');
      $status.innerHTML = `${Lang._('WARNINGS')} <span class="sa11y-panel-count">${warningCount}</span>`;
    } else {
      $panelContent.setAttribute('class', 'sa11y-good');
      $status.textContent = `${Lang._('PANEL_STATUS_NONE')}`;

      if ($findButtons.length === 0) {
        $skipBtn.disabled = true;
        $skipBtn.setAttribute('style', 'cursor: default !important;');
      }
    }
  };