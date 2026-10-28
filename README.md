# Shelf Life

A browser prototype for photographing grocery goods, recording staff condition checks, and reviewing demo offers. Based on the complete Claude example in `SHELF-LIFE-APP.md` and the green design system in `DESIGN-3.md` / `figma.png`.

## Run on Mac or Windows

1. Install Node.js 20 or newer (a current LTS version is recommended).
2. Open Terminal on Mac or PowerShell on Windows in this repository.
3. Run `npm ci` once, then `npm start`. No build step is needed.
4. Open `http://localhost:8000` in a current Chrome, Edge, Safari or Firefox browser.

Stop the server with Ctrl+C. Keep it running while using the app. `PORT` and `HOST` environment variables can change the listening port/address. The server serves only `public/`, not repository documents.

Browsers that support it can use their Install / Add to Dock / Create shortcut menu to open Shelf Life in its own window. Installation support varies by browser; the local server must still be running. Offline operation is not implemented.

## Photograph goods

1. Choose **Employee Login**. Tap Jonas's demo account, then **Log in**.
2. Choose **Scan a Product**, and allow camera access.
3. Select the webcam or phone camera, then **Take photo**.
4. Review the picture, choose **Retake** if necessary, then **Use photo** to identify the product manually.
5. Continue to the freshness survey and **Save & Monitor Product**.

The camera stops after capture, on navigation, when the tab is hidden, and when the page closes. Enable it again after returning from another tab. Photos are resized before being attached to a product. Uploading JPEG, PNG or WebP is an alternative; HEIC support depends on the browser. Files over 25 MB are rejected.

Camera access requires **localhost or HTTPS**. On a phone accessing a remotely hosted app, use HTTPS. An HTTP LAN address such as a computer's local IP will not enable live camera capture. If access is denied, allow the browser in macOS System Settings → Privacy & Security → Camera, or Windows Settings → Privacy & security → Camera, and check the site's camera permission. If the camera is busy, close other camera apps. No microphone is requested.

## Optional AI integration (not enabled in the capture workflow)

The current capture workflow is manual and requires no API key. Photos are not sent to an AI service. The retained server adapter can be used for a future optional OpenAI integration. The adapter uses its image-capable `gpt-4.1-mini` model by default. API usage is billed separately from a ChatGPT subscription. Set the server environment variable `SHELF_LIFE_AI_KEY` securely, then restart `npm start`. In the managed cloud, use the secret field in environment settings; never enter keys in chat or commit them to Git. For local development, set it through your operating system's environment settings or secret manager before starting the server. Optional `SHELF_LIFE_AI_MODEL` selects another model that supports images and structured JSON output.

If AI is re-enabled in a future feature, the retained analysis view sends a resized JPEG to `/api/analyze`; the server calls `api.openai.com`. It returns product identity and visible-condition observations for staff review. Setting a key alone does not enable AI in the current manual capture flow. No API key is returned to the browser. An HTTPS deployment is needed to use cameras on remote phones.

Live AI still needs a configured key and an end-to-end provider check. The automated AI tests use controlled responses; they do not establish model accuracy. The local server has no production authentication and must not be exposed publicly with a paid API key; add server-side authentication, per-user quotas and HTTPS before a shared deployment.

## Demo limits and next development steps

- Data and photos remain in this browser's local storage. They do not synchronize between computers or phones, and clearing site data deletes them. Storage is limited; this is not a durable production photo archive.
- Demo accounts are public fixtures, not secure authentication. Do not deploy for real store operations with these accounts.
- Photos cannot establish food safety or extend use-by dates. AI observations are suggestions, never staff condition confirmations.
- Maps require Leaflet from `cdnjs.cloudflare.com`; fonts use `fonts.googleapis.com` and `fonts.gstatic.com`. If unavailable, the store list and system fonts still work.
- The example's pricing and approval rules are retained for this camera iteration. They differ from the 30% cap and phase rules in `product_multi_retailer.md`; reconciling those specifications is a separate feature task. Existing example figures and offers are demos.

## Validation

`npm test` runs server checks. Browser camera tests use Python Playwright: install `tests/requirements.txt`, run `python -m playwright install chromium`, then `python tests/test_camera.py`. Set `CHROMIUM_PATH` to an existing Chromium executable if needed.

Automated tests use a simulated video device. Physical cameras and permissions still need testing on actual Mac, Windows and phone hardware.
