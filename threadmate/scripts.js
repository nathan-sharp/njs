document.addEventListener('DOMContentLoaded', function () {
  const typesSelect = document.getElementById('Types');
  const threadClassContainer = document.getElementById('thread-class-container');
  const threadClassSelect = document.getElementById('thread-class');
  const pitchContainer = document.getElementById('pitch-container');
  const pitchInput = document.getElementById('pitch');
  const tpiContainer = document.getElementById('tpi-container');
  const tpiInput = document.getElementById('threads-per-inch');

  function toggleThreadClass() {
    const isMetric = typesSelect.value === 'M Series Metric';

    // Thread Class
    if (threadClassContainer) {
      threadClassContainer.style.display = isMetric ? 'none' : '';
    }
    if (threadClassSelect) {
      threadClassSelect.disabled = isMetric;
      if (isMetric) {
        threadClassSelect.setAttribute('aria-hidden', 'true');
      } else {
        threadClassSelect.removeAttribute('aria-hidden');
      }
    }

    // Pitch (show only for M Series Metric)
    if (pitchContainer && pitchInput) {
      pitchContainer.style.display = isMetric ? '' : 'none';
      pitchInput.disabled = !isMetric;
      if (!isMetric) {
        pitchInput.setAttribute('aria-hidden', 'true');
      } else {
        pitchInput.removeAttribute('aria-hidden');
      }
    }

    // Threads Per Inch (hide for M Series Metric)
    if (tpiContainer && tpiInput) {
      tpiContainer.style.display = isMetric ? 'none' : '';
      tpiInput.disabled = isMetric;
      if (isMetric) {
        tpiInput.setAttribute('aria-hidden', 'true');
      } else {
        tpiInput.removeAttribute('aria-hidden');
      }
    }
  }

  typesSelect.addEventListener('change', toggleThreadClass);
  toggleThreadClass();
});
