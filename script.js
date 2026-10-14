(function () {
  'use strict';

  var player = document.getElementById('player');
  var video = document.getElementById('video');
  var soundBtn = document.getElementById('soundBtn');
  var toggleBtn = document.getElementById('toggleBtn');
  var playOverlay = document.getElementById('playOverlay');
  var replayOverlay = document.getElementById('replayOverlay');
  var errorBox = document.getElementById('errorBox');
  var retryBtn = document.getElementById('retryBtn');
  var progressBar = document.getElementById('progressBar');
  var soundModal = document.getElementById('soundModal');
  var playSoundBtn = document.getElementById('playSoundBtn');
  var playMutedBtn = document.getElementById('playMutedBtn');

  video.loop = false;

  function setState(name, on) {
    player.classList.toggle(name, on);
  }

  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }

  function updateSoundButton() {
    var on = !video.muted;
    soundBtn.classList.toggle('is-on', on);
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Mute sound' : 'Enable sound');
  }

  function updateToggleButton() {
    var paused = video.paused;
    setState('is-paused', paused);
    toggleBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  }

  function play() {
    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function (err) {
        // NotAllowedError = autoplay blocked; anything else is handled by the error event.
        if (err && err.name === 'NotAllowedError') {
          setState('is-loading', false);
          setState('is-blocked', true);
          show(playOverlay);
        }
      });
    }
  }

  // Match the player box to the video's real aspect ratio.
  video.addEventListener('loadedmetadata', function () {
    if (video.videoWidth && video.videoHeight) {
      player.style.setProperty('--ar', video.videoWidth + ' / ' + video.videoHeight);
    }
  });

  video.addEventListener('playing', function () {
    setState('is-loading', false);
    setState('is-blocked', false);
    setState('is-ended', false);
    hide(playOverlay);
    hide(replayOverlay);
    updateToggleButton();
  });

  video.addEventListener('pause', updateToggleButton);
  video.addEventListener('play', updateToggleButton);
  video.addEventListener('volumechange', updateSoundButton);

  video.addEventListener('waiting', function () { setState('is-loading', true); });
  video.addEventListener('canplay', function () { setState('is-loading', false); });

  video.addEventListener('timeupdate', function () {
    if (video.duration) {
      progressBar.style.transform = 'scaleX(' + video.currentTime / video.duration + ')';
    }
  });

  video.addEventListener('ended', function () {
    setState('is-ended', true);
    progressBar.style.transform = 'scaleX(1)';
    show(replayOverlay);
    replayOverlay.focus({ preventScroll: true });
  });

  video.addEventListener('error', function () {
    setState('is-loading', false);
    setState('has-error', true);
    hide(soundModal);
    hide(playOverlay);
    hide(replayOverlay);
    show(errorBox);
  });

  // Sound modal: the button tap is a user gesture, so the browser allows audio.
  function startFromModal(withSound) {
    hide(soundModal);
    video.muted = !withSound;
    play();
  }

  playSoundBtn.addEventListener('click', function () { startFromModal(true); });
  playMutedBtn.addEventListener('click', function () { startFromModal(false); });

  // Enable / toggle sound
  soundBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    if (!video.muted && video.paused && !video.ended) play();
  });

  // Play / pause
  function togglePlayback() {
    if (video.ended) return;
    if (video.paused) play();
    else video.pause();
  }

  toggleBtn.addEventListener('click', togglePlayback);
  video.addEventListener('click', togglePlayback);

  // Autoplay blocked: the tap is a user gesture, so we can play with sound.
  playOverlay.addEventListener('click', function () {
    video.muted = false;
    play();
  });

  replayOverlay.addEventListener('click', function () {
    video.currentTime = 0;
    play();
  });

  retryBtn.addEventListener('click', function () {
    setState('has-error', false);
    setState('is-loading', true);
    hide(errorBox);
    video.load();
    play();
  });

  // Space / K toggles playback on desktop
  document.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'k') && e.target === document.body) {
      e.preventDefault();
      togglePlayback();
    }
  });

  // Events may have fired before this deferred script ran.
  if (video.error) {
    video.dispatchEvent(new Event('error'));
  } else {
    if (video.readyState >= 3) setState('is-loading', false);
    updateSoundButton();
    updateToggleButton();
    playSoundBtn.focus({ preventScroll: true });
  }
})();
