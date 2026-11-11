/* Privacy controls are shared by customer and staff settings. */
function openPrivacy(){
  const account = me();
  if (!account) return;
  const staff = STAFF(account.role);
  const productOptions = staff ? myProducts().filter(p => p.photo).map(p => `<option value="${esc(p.id)}">${esc(p.name)}${p.batch ? ` · ${esc(p.batch)}` : ""}</option>`).join("") : "";
  sheet(`<div class="row between"><h2 style="font-size:22px;color:var(--forest)">Privacy &amp; Data</h2><button class="btn btn-ghost btn-sm" id="privacyClose">Close</button></div>
    <p class="sub" style="margin:12px 0">Manage access, understand how your information is used, and control your saved data.</p>
    <div class="privacy-sections">
      <details class="card pad" open><summary>Permissions &amp; location</summary>
        <dl class="kv"><dt>Location access</dt><dd id="locationPermission">Checking browser permission…</dd><dt>Camera access</dt><dd id="cameraPermission">Checking browser permission…</dd><dt>Notifications</dt><dd id="notificationPermission">Checking browser permission…</dd></dl>
        <p class="note">Browser permission and an app feature being enabled are separate. Opening this window does not request access.</p>
        <button class="btn btn-ghost btn-sm" id="refreshPermissions">Refresh permission status</button>
        <h3>Nearby stores <span class="demo-tag">Planned</span></h3>
        <p>Location will help find nearby stores when you choose “Find nearby stores”. Manual store selection will remain available. Location search is not connected in this version.</p>
        <label class="privacy-option"><input type="checkbox" disabled> Use my location for nearby stores — coming soon</label>
        <label class="privacy-option"><input type="checkbox" disabled> Remember my preferred store — coming soon</label>
        <p class="note">Planned default: use location for that search without saving precise coordinates. Remembering a preferred store will be a separate choice.</p>
        <h3>Camera &amp; notifications</h3>
        <p>The camera photographs products and stops after capture, on leaving the screen, or when the tab is hidden. No microphone is requested. Uploading a photo is an alternative.</p>
        <p>Staff can enable device alerts from their dashboard. Customer notification preferences can be saved, but customer alert delivery is not connected yet.</p>
        <details><summary>How to change browser access</summary><p>Open the controls beside the website address and choose Site settings or Permissions. Change Location, Camera or Notifications there. The app cannot revoke browser permissions itself. If camera access still fails, check the camera permission for your browser in macOS or Windows privacy settings.</p></details>
      </details>
      <details class="card pad" open><summary>Photos &amp; AI analysis</summary>
        <p>Product photos will be sent to OpenAI for product identification and visible-condition suggestions when AI analysis is enabled. Staff will review and confirm the suggestions.</p>
        <label class="privacy-option"><input type="checkbox" disabled> Analyze product photos with AI — awaiting connection</label>
        <p class="note">AI upload is planned but is not enabled in the current public capture workflow. This setting does not activate uploads. The camera and manual condition survey work now. A working AI connection and upload notice are required before enabling this control.</p>
        <p>Only the product photo and analysis instructions are intended for the AI request. Avoid including faces, receipts or private information. A photo cannot establish food safety or extend a use-by date.</p>
        <p class="note">AI-provider retention and deletion terms must be disclosed for the configured service before activation. Deleting a local photo would not by itself delete a copy already sent to a provider.</p>
      </details>
      <details class="card pad"><summary>What is stored &amp; for how long</summary>
        <p>Saved information includes display names, food preferences, loyalty points, survey answers and notification preferences. Staff records include product photos, condition checks, batch details, prices, offers and inspection history. The browser also keeps the demo sign-in session, unfinished draft and discount-code assignments.</p>
        <p>${DB.mode === "db" ? "This session uses the prototype's shared database. People with access to that prototype may read its records. Local deletion does not erase shared records." : "This version stores those records in this browser. They do not sync between devices. Clearing site data removes the local records."}</p>
        <p>There is no automatic deletion schedule in this version. Records remain until removed or browser storage is cleared. Signing out only ends the demo session; it does not delete records.</p>
        <p class="note">Demo accounts do not securely separate people sharing a browser. Customer and employee screens show different information, but that is not production access control.</p>
        <label class="privacy-option"><input type="checkbox" disabled> Automatically delete old data — planned; no schedule is active</label>
      </details>
      <details class="card pad"><summary>External services &amp; future features</summary>
        <p>GitHub Pages hosts the website. Google Fonts supplies fonts, and Cloudflare's CDN supplies the Leaflet map library. These services receive connection information such as your IP address when resources are loaded, even when product records remain in the browser.</p>
        <p>OpenAI photo analysis, optional nearby-store location, shared account storage, customer alert delivery and checkout redemption are planned connections. Their controls and privacy explanations will be updated as they become available. No setting here turns on an unconnected feature.</p>
        <p class="note">Local export and deletion do not remove hosting logs or data held by an external provider. Retention policies and a privacy contact for a live service must be supplied before production use.</p>
      </details>
      <details class="card pad" open><summary>Manage your data</summary>
        <p>${staff ? "Download your local profile and this store's product/offer records, or remove a product photo while keeping its record." : "Download your saved customer profile, preferences, points and survey responses. Other demo accounts and store records are excluded."}</p>
        <button class="btn btn-outline" id="privacyExport">Download my saved data</button>
        ${!staff ? `<button class="btn btn-ghost" id="privacyResetPrefs">Reset my food preferences</button><button class="btn btn-warn" id="privacySurveys">Delete my survey answers</button><button class="btn btn-warn" id="privacyProfile">Delete my saved profile</button>` : ""}
        <button class="btn btn-ghost" id="privacyDraft">Discard unfinished photo and draft</button>
        ${productOptions ? `<label class="fld" for="privacyPhoto">Saved product photo<select class="inp" id="privacyPhoto">${productOptions}</select></label><button class="btn btn-warn" id="privacyRemovePhoto">Remove selected product photo</button>` : ""}
        <button class="btn btn-warn" id="privacyClear" ${DB.mode !== "local" ? "disabled" : ""}>Clear all Shelf Life data from this browser</button>
        <p class="note">Clearing all data affects every demo account using this browser, including store records, photos and discount codes. It does not revoke browser permissions or delete external copies. This action is available in browser-only storage mode.</p>
        <div id="privacyConfirm" hidden class="card pad" role="group" aria-label="Confirm data deletion"><p id="privacyConfirmMessage"></p><div class="row" style="gap:8px"><button class="btn btn-warn" id="privacyConfirmYes">Confirm deletion</button><button class="btn btn-ghost" id="privacyConfirmNo">Cancel</button></div></div>
        <p id="privacyMessage" role="status" aria-live="polite"></p>
      </details>
    </div>`, (panel, close) => {
      let closed = false, action = null;
      const message = text => { $("#privacyMessage", panel).textContent = text; };
      const confirm = (text, callback) => {
        action = callback; $("#privacyConfirmMessage", panel).textContent = text;
        $("#privacyConfirm", panel).hidden = false;
        $("#privacyConfirmYes", panel).focus();
      };
      $("#privacyClose", panel).onclick = () => { closed = true; close(); };
      $("#privacyConfirmNo", panel).onclick = () => { action = null; $("#privacyConfirm", panel).hidden = true; };
      $("#privacyConfirmYes", panel).onclick = async () => {
        if (!action) return;
        const callback = action; action = null;
        $("#privacyConfirm", panel).hidden = true;
        try { await callback(); } catch { message("Could not complete deletion. Please try again."); }
      };
      async function refreshPermissions(){
        for (const [name, id] of [["geolocation", "locationPermission"], ["camera", "cameraPermission"], ["notifications", "notificationPermission"]]) {
          let state = "Status unavailable here — check browser site settings";
          try {
            const permission = await navigator.permissions.query({name});
            state = {granted:"Allowed by browser", denied:"Blocked by browser", prompt:"Not granted — browser will ask when needed"}[permission.state] || state;
          } catch {
            if (name === "notifications" && "Notification" in window) state = Notification.permission === "granted" ? "Allowed by browser" : Notification.permission === "denied" ? "Blocked by browser" : "Not granted";
          }
          if (!closed && panel.isConnected) $("#" + id, panel).textContent = state;
        }
      }
      $("#refreshPermissions", panel).onclick = refreshPermissions;
      refreshPermissions();
      $("#privacyExport", panel).onclick = () => {
        const profile = clone(DB.get("customers", account.id)) || null;
        const data = {exportedAt:new Date().toISOString(), storageMode:DB.mode, account:{id:account.id,role:account.role,name:account.name,email:account.email}, profile};
        if (staff) { data.products = myProducts(); data.offers = DB.list("offers").filter(o => o.storeId === account.storeId); }
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:"application/json"}));
        const link = document.createElement("a"); link.href = url; link.download = "shelf-life-data.json"; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); message("Your data download has started. Keep the file private.");
      };
      $("#privacyResetPrefs", panel)?.addEventListener("click", () => confirm("Reset your food preferences to Fruits, Vegetables and Dairy? Other saved information will be kept.", async () => { await saveCustomer({prefs:["Fruits","Vegetables","Dairy"]}); message("Food preferences reset."); }));
      $("#privacySurveys", panel)?.addEventListener("click", () => confirm("Delete this profile's survey answers? Points already earned will be kept.", async () => { const profile = clone(customerDoc()); profile.surveys = {}; await DB.set("customers", account.id, profile); message("Survey answers deleted. Earned points kept."); }));
      $("#privacyProfile", panel)?.addEventListener("click", () => confirm("Delete your saved display name, preferences, points and survey answers? Store records and other profiles will be kept. Your demo account will return to its example defaults; this does not delete an online account.", async () => { await DB.del("customers", account.id); message("Saved profile deleted. Demo defaults will now be shown."); }));
      $("#privacyDraft", panel).onclick = () => confirm("Discard the unfinished photo and condition-check draft? Saved products will be kept.", () => { S.draft = null; S.aiBlob = null; localStorage.removeItem("sl_draft"); message("Unfinished photo and draft discarded."); });
      $("#privacyRemovePhoto", panel)?.addEventListener("click", () => {
        const id = $("#privacyPhoto", panel).value, product = DB.get("products", id);
        if (!product || product.storeId !== account.storeId) return;
        confirm(`Remove the saved photo of ${product.name} from the product and its customer offer? The product record will be kept.`, async () => {
          await DB.patch("products", id, {photo:null});
          if (DB.get("offers", id)) await DB.patch("offers", id, {photo:null});
          message("Photo removed from the product and offer. Any downloaded copies are unchanged.");
        });
      });
      $("#privacyClear", panel).onclick = () => confirm("Permanently clear all Shelf Life data in this browser for every demo account? This removes profiles, surveys, drafts, product photos, store records, offers and discount-code assignments, and signs you out. This cannot be undone.", () => {
        if (DB.mode !== "local") return;
        for (const key of Object.keys(localStorage)) if (key.startsWith("sl_")) localStorage.removeItem(key);
        DB.data = Object.fromEntries(COLS.map(collection => [collection, {}]));
        S.session = null; S.draft = null; S.aiBlob = null; S.mapView = null; S.selStore = null;
        closed = true; close(); go("welcome", {skip:true}, {reset:true,anim:"fade"});
      });
    });
}
