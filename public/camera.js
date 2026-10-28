/* Camera capture is independent of the demo database and AI provider. */
window.ShelfLifeCamera = function mountCamera(root, { prepare, onUse }) {
  root.innerHTML = `
    <p id="cameraStatus" class="camera-status" role="status" aria-live="polite">Starting camera…</p>
    <label class="camera-label" for="cameraDevice">Camera
      <select id="cameraDevice" class="inp" disabled><option>Default camera</option></select>
    </label>
    <div class="viewfinder"><video id="cameraVideo" playsinline muted hidden aria-label="Live camera preview"></video>
      <img id="cameraPhoto" alt="Product photo to review" hidden>
      <div class="guide" id="cameraGuide"></div></div>
    <div class="camera-actions">
      <button type="button" class="btn btn-outline" id="cameraRetry">Enable camera</button>
      <button type="button" class="btn btn-primary" id="cameraCapture" disabled>Take photo</button>
      <button type="button" class="btn btn-outline" id="cameraRetake" hidden>Retake</button>
      <button type="button" class="btn btn-primary" id="cameraUse" hidden>Use photo</button>
      <button type="button" class="btn btn-outline" id="cameraUpload">Upload photo</button>
    </div>
    <p class="camera-help">Photograph the goods in good light. Choose Use photo, then select or type the product name and record its condition. No photo is sent to an AI service. A photo alone cannot determine food safety.</p>
    <input type="file" accept="image/*" id="cameraFile" hidden>`;
  const find = id => root.querySelector('#' + id);
  const video = find('cameraVideo'), image = find('cameraPhoto'), status = find('cameraStatus');
  const select = find('cameraDevice');
  let stream = null, photo = null, disposed = false, suspended = false, generation = 0, busy = false;
  const active = () => !disposed && !suspended && !document.hidden;
  const setStatus = message => { if (!disposed) status.textContent = message; };

  function stop() {
    generation++;
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    video.hidden = true;
    find('cameraCapture').disabled = true;
  }
  function controls() {
    find('cameraCapture').hidden = !!photo;
    find('cameraRetry').hidden = !!photo || !!stream;
    find('cameraRetake').hidden = !photo;
    find('cameraUse').hidden = !photo;
    image.hidden = !photo;
    find('cameraGuide').hidden = !!photo;
    select.disabled = !!photo || !stream;
    for (const id of ['cameraRetake', 'cameraUse', 'cameraUpload']) find(id).disabled = busy;
  }
  const messages = {
    NotAllowedError: 'Camera permission was denied. Allow camera access in your browser and system privacy settings, then choose Enable camera. You can also upload a photo.',
    NotFoundError: 'No camera was found. Connect a webcam and choose Enable camera, or upload a photo.',
    NotReadableError: 'The camera could not be opened. Close other apps using it, then choose Enable camera.',
    OverconstrainedError: 'That camera is unavailable. Select another camera or try Enable camera again.'
  };
  async function start(deviceId) {
    stop();
    if (!active() || photo) return;
    if (!window.isSecureContext) {
      setStatus('Camera access requires HTTPS or localhost. Open the app securely, or upload a photo.');
      controls(); return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('This browser does not support live camera capture. Try a current browser or upload a photo.');
      controls(); return;
    }
    const request = generation;
    setStatus('Allow camera access when your browser asks.');
    try {
      const next = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }),
        width: { ideal: 1600 }, height: { ideal: 1200 }
      } });
      if (!active() || generation !== request || photo) { next.getTracks().forEach(t => t.stop()); return; }
      stream = next; video.srcObject = next; video.hidden = false;
      await video.play();
      if (!active() || generation !== request) return;
      find('cameraCapture').disabled = !video.videoWidth;
      setStatus('Camera ready. Position the goods in the frame and take a photo.');
      controls();
      try {
        const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
        if (!active() || generation !== request) return;
        select.replaceChildren(...devices.map((device, index) => new Option(device.label || `Camera ${index + 1}`, device.deviceId)));
        select.value = stream.getVideoTracks()[0].getSettings().deviceId || '';
      } catch { /* Capture still works when device enumeration is unavailable. */ }
    } catch (error) {
      if (generation !== request || !active()) return;
      stop(); controls();
      setStatus(messages[error.name] || 'Camera access failed. Try Enable camera again or upload a photo.');
    }
  }
  async function accept(blob) {
    if (!blob || !blob.type.startsWith('image/')) { setStatus('Choose an image file.'); return; }
    if (blob.size > 25 * 1024 * 1024) { setStatus('Choose a photo smaller than 25 MB.'); return; }
    busy = true; controls();
    const request = generation;
    try {
      const prepared = await prepare(blob);
      if (!active() || generation !== request) return;
      stop(); photo = prepared; image.src = photo.thumb;
      setStatus('Photo captured. Review it, then choose Use photo or Retake.');
    } catch { setStatus('This image could not be read. Try a JPEG, PNG or WebP photo.'); }
    finally { busy = false; if (!disposed) controls(); }
  }
  find('cameraCapture').onclick = () => {
    if (busy || !stream || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => { if (active()) accept(blob); }, 'image/jpeg', 0.92);
  };
  find('cameraRetry').onclick = () => start();
  select.onchange = () => start(select.value);
  find('cameraRetake').onclick = () => { photo = null; image.removeAttribute('src'); controls(); start(select.value); };
  find('cameraUpload').onclick = () => find('cameraFile').click();
  find('cameraFile').onchange = event => {
    const file = event.target.files[0]; event.target.value = '';
    if (file) accept(file);
  };
  find('cameraUse').onclick = () => { if (photo && !busy) { stop(); onUse(photo); } };
  const visibility = () => {
    if (document.hidden) { stop(); controls(); setStatus('Camera paused. Choose Enable camera to resume.'); }
  };
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', visibilityStop);
  function visibilityStop() { stop(); }
  start();
  return {
    suspend() { suspended = true; stop(); controls(); },
    resume() { suspended = false; if (!photo) start(select.value); },
    destroy() { disposed = true; stop(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', visibilityStop); }
  };
};
