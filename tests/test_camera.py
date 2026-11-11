"""Browser tests with a simulated webcam; no API quota or physical camera needed."""
import json
import os
from pathlib import Path
import subprocess
import shutil
import sys
import tempfile
import time
import unittest
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
STATIC_SITE = os.environ.get('STATIC_SITE') == '1'
ORIGIN = 'http://127.0.0.1:8123' + ('/ESCP-2627DT-A3/' if STATIC_SITE else '/')

class CameraTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.static_directory = None
        command = ['node', 'server.js']
        if STATIC_SITE:
            cls.static_directory = tempfile.TemporaryDirectory()
            shutil.copytree(ROOT / 'public', Path(cls.static_directory.name) / 'ESCP-2627DT-A3')
            command = [sys.executable, '-m', 'http.server', '8123', '--bind', '127.0.0.1', '--directory', cls.static_directory.name]
        cls.server = subprocess.Popen(command, cwd=ROOT,
            env={**os.environ, 'PORT':'8123'}, stdout=subprocess.DEVNULL)
        for _ in range(50):
            try:
                with urlopen(ORIGIN) as response:
                    if response.status == 200: break
            except OSError: time.sleep(.1)
        else: raise RuntimeError('App did not start')
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch(headless=True,
            executable_path=os.environ.get('CHROMIUM_PATH') or None,
            args=['--use-fake-device-for-media-stream'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.p.stop()
        cls.server.terminate(); cls.server.wait(timeout=10)
        if cls.static_directory: cls.static_directory.cleanup()

    def setUp(self):
        self.context = self.browser.new_context(permissions=['camera'],
            viewport={'width':390, 'height':844}, reduced_motion='reduce')
        # External fonts/maps are unrelated to camera tests.
        self.context.route('https://**/*', lambda route: route.abort())
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])

    def login(self):
        self.page.goto(ORIGIN)
        self.page.locator('#toStaff').click()
        self.page.locator('#em').fill('jonas@shelflife.demo')
        self.page.locator('#pw').fill('Staff-demo1')
        self.page.locator('#go').click()
        self.page.locator('#scan').click()

    def test_capture_retake_stop_and_manual_save(self):
        self.login()
        expect(self.page.locator('#cameraCapture')).to_be_enabled()
        self.page.evaluate('window.firstTrack = document.querySelector("video").srcObject.getVideoTracks()[0]')
        self.page.locator('#cameraCapture').click()
        expect(self.page.locator('#cameraPhoto')).to_be_visible()
        self.assertEqual(self.page.evaluate('firstTrack.readyState'), 'ended')
        self.assertTrue(self.page.locator('#cameraPhoto').get_attribute('src').startswith('data:image/jpeg'))
        self.page.locator('#cameraRetake').click()
        expect(self.page.locator('#cameraCapture')).to_be_enabled()
        self.page.locator('#cameraCapture').click()
        self.page.locator('#cameraUse').click()
        self.page.locator('#pname').fill('Apples')
        for question, value in [('q2','good'),('q3','firm'),('q4','none'),('q5','none'),('q6','fridge')]:
            self.page.locator(f'[data-q="{question}"][data-v="{value}"]').click()
        self.page.locator('#gen').click()
        self.page.locator('#rq').fill('10')
        self.page.locator('#rp').fill('4.00')
        expect(self.page.locator('#discountPreview')).to_contain_text('20% off')
        expect(self.page.locator('#discountPreview')).to_contain_text('3,20')
        self.page.locator('#rp').fill('2.99')
        expect(self.page.locator('#discountPreview')).to_contain_text('2,39')
        self.page.locator('#sv').click()
        expect(self.page.locator('[data-view="edash"]')).to_have_count(1)
        expect(self.page.locator('#recent')).to_contain_text('Apples')
        expect(self.page.locator('#savedRecommendation')).to_contain_text('20% off')
        self.assertEqual(self.page.evaluate('Object.values(JSON.parse(localStorage.sl_local).products)[0].discount.state'), 'pending')
        self.page.locator('#reviewSaved').click()
        self.page.locator('#approve').click()
        expect(self.page.get_by_text('Live for customers', exact=True)).to_be_visible()
        self.assertEqual(self.page.evaluate('Object.values(JSON.parse(localStorage.sl_local).offers)[0].newPrice'), 2.39)
        self.page.locator('[data-view="eproduct"] [data-back]').click()
        self.page.get_by_role('button', name='Log another product').click()
        expect(self.page.locator('#cameraCapture')).to_be_enabled()
        self.page.locator('#cameraCapture').click()
        self.page.locator('#cameraUse').click()
        expect(self.page.locator('#pname')).to_have_value('')
        expect(self.page.locator('#qcount')).to_have_text('0/6 answered')
        self.page.locator('#pname').fill('Bananas')
        for question, value in [('q2','good'),('q3','firm'),('q4','none'),('q5','none'),('q6','room')]:
            self.page.locator(f'[data-q="{question}"][data-v="{value}"]').click()
        self.page.locator('#gen').click()
        self.page.locator('#rq').fill('5')
        self.page.locator('#rp').fill('1.99')
        self.page.locator('#sv').click()
        expect(self.page.locator('[data-view="edash"]')).to_have_count(1)
        expect(self.page.locator('#recent')).to_contain_text('Apples')
        expect(self.page.locator('#recent')).to_contain_text('Bananas')
        expect(self.page.get_by_role('button', name='Log another product')).to_be_visible()
        self.page.reload()
        expect(self.page.locator('#recent')).to_contain_text('Apples')
        expect(self.page.locator('#recent')).to_contain_text('Bananas')
        self.assertEqual(self.page.evaluate('Object.keys(JSON.parse(localStorage.sl_local).products).length'), 2)
        self.assertTrue(self.page.evaluate('Object.values(JSON.parse(localStorage.sl_local).products)[0].photo.startsWith("data:image/jpeg")'))

    def test_permission_denial_preserves_upload(self):
        self.page.add_init_script('navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Denied", "NotAllowedError"); };')
        self.login()
        expect(self.page.locator('#cameraStatus')).to_contain_text('permission was denied')
        self.page.locator('#cameraFile').set_input_files(str(ROOT / 'figma.png'))
        expect(self.page.locator('#cameraUse')).to_be_visible()

    def test_pending_permission_stream_stops_after_navigation(self):
        self.page.add_init_script('''window.stopped = false;
            navigator.mediaDevices.getUserMedia = () => new Promise(resolve => {
                window.releaseCamera = () => resolve({getTracks: () => [{stop: () => window.stopped = true}]});
            });''')
        self.login()
        self.page.locator('[data-view="scan"] [data-back]').click()
        self.page.evaluate('releaseCamera()')
        self.page.wait_for_function('window.stopped')

    def test_manual_identification_makes_no_ai_request(self):
        requests = []
        self.page.on('request', lambda request: requests.append(request.url))
        self.login()
        expect(self.page.locator('#cameraCapture')).to_be_enabled()
        self.page.locator('#cameraCapture').click()
        self.page.locator('#cameraUse').click()
        expect(self.page.locator('#pname')).to_be_visible()
        expect(self.page.locator('#qcount')).to_have_text('0/6 answered')
        self.page.locator('#pname').fill('Bananas')
        expect(self.page.locator('#qcount')).to_have_text('1/6 answered')
        expect(self.page.locator('#pcat')).to_have_value('Fruits')
        self.assertFalse(any('/api/analyze' in url for url in requests))

    def test_date_recommendation_updates_and_expired_product_is_blocked(self):
        self.login()
        self.page.locator('#cameraFile').set_input_files(str(ROOT / 'figma.png'))
        self.page.locator('#cameraUse').click()
        self.page.locator('#pname').fill('Apples')
        for question, value in [('q2','excellent'),('q3','firm'),('q4','none'),('q5','useby'),('q6','fridge')]:
            self.page.locator(f'[data-q="{question}"][data-v="{value}"]').click()
        self.page.locator('#dt').fill(self.page.evaluate('addDays(today(), 2)'))
        self.page.locator('#gen').click()
        self.page.locator('#rp').fill('10')
        expect(self.page.locator('#discountPreview')).to_contain_text('30% off')
        expect(self.page.locator('#discountPreview')).to_contain_text('7,00')
        self.page.locator('#rd').fill(self.page.evaluate('addDays(today(), -1)'))
        expect(self.page.locator('#discountPreview')).to_contain_text('No discount recommended')
        expect(self.page.locator('#discountPreview')).to_contain_text('on hold')
        self.page.locator('#rq').fill('5')
        self.page.locator('#sv').click()
        expect(self.page.locator('[data-view="edash"]')).to_have_count(1)
        expect(self.page.locator('#savedRecommendation')).to_contain_text('No discount recommended')
        self.page.locator('#reviewSaved').click()
        expect(self.page.locator('#approve')).to_have_count(0)

    def test_customer_codes_only_in_details_stable_and_location_specific(self):
        self.page.goto(ORIGIN)
        self.page.locator('#toCust').click()
        self.page.locator('#em').fill('alex@shelflife.demo')
        self.page.locator('#pw').fill('ShelfLife-demo1')
        self.page.locator('#go').click()
        expect(self.page.locator('#mlist')).to_be_visible()
        self.page.evaluate('''async () => {
            for (const [id, storeId] of [['test-one','edeka-friedrichstrasse'],['test-two','rewe-hauptbahnhof']])
                await DB.set('offers', id, {productId:id,storeId,name:'Test Apples',category:'Fruits',unit:'kg',price:3,pct:20,newPrice:2.4,dateType:'none',date:null,qty:5,active:true});
        }''')
        self.page.locator('#mlist [data-id="edeka-friedrichstrasse"]').click()
        expect(self.page.locator('.discount-code')).to_have_count(0)
        self.page.locator('[data-id="test-one"]').click()
        expect(self.page.locator('.discount-code')).to_have_text(__import__('re').compile(r'^\d{4}$'))
        first = self.page.locator('.discount-code').inner_text()
        expect(self.page.locator('.discount-ticket')).to_contain_text('EDEKA Bahnhof Friedrichstraße')
        self.page.reload()
        self.page.locator('#mlist [data-id="edeka-friedrichstrasse"]').click()
        self.page.locator('[data-id="test-one"]').click()
        expect(self.page.locator('.discount-code')).to_have_text(first)
        self.page.reload()
        self.page.locator('#mlist [data-id="rewe-hauptbahnhof"]').click()
        self.page.locator('[data-id="test-two"]').click()
        expect(self.page.locator('.discount-code')).not_to_have_text(first)
        expect(self.page.locator('.discount-ticket')).to_contain_text('REWE Berlin Hauptbahnhof')

    def open_customer_privacy(self):
        self.page.goto(ORIGIN)
        self.page.locator('#toCust').click()
        self.page.locator('#em').fill('alex@shelflife.demo')
        self.page.locator('#pw').fill('ShelfLife-demo1')
        self.page.locator('#go').click()
        self.page.locator('#prof').click()
        self.page.locator('#gear').click()
        self.page.locator('[data-a="priv"]').click()
        expect(self.page.locator('#privacyClose')).to_be_visible()

    def test_privacy_permissions_planned_features_export_and_survey_deletion(self):
        self.page.add_init_script('''window.permissionRequests = 0;
            navigator.mediaDevices.getUserMedia = () => {window.permissionRequests++; throw Error('Unexpected camera request');};
            navigator.geolocation.getCurrentPosition = () => {window.permissionRequests++;};''')
        self.open_customer_privacy()
        expect(self.page.get_by_text('Product photos will be sent to OpenAI', exact=False)).to_be_visible()
        expect(self.page.get_by_role('checkbox', name='Analyze product photos with AI', exact=False)).to_be_disabled()
        expect(self.page.get_by_role('checkbox', name='Use my location', exact=False)).to_be_disabled()
        expect(self.page.locator('#cameraPermission')).to_contain_text('Allowed by browser')
        self.assertEqual(self.page.evaluate('window.permissionRequests'), 0)
        self.page.evaluate('''async () => {
            await DB.set('customers','cust-alex',{name:'Private Alex',prefs:['Bakery'],points:1350,surveys:{s1:{answer:'Yes'}}});
            await DB.set('customers','cust-mira',{name:'Other private profile',surveys:{secret:'Other answer'}});
            localStorage.setItem('unrelated_application', 'keep');
        }''')
        with self.page.expect_download() as download_info:
            self.page.locator('#privacyExport').click()
        exported = json.loads(Path(download_info.value.path()).read_text())
        self.assertEqual(exported['profile']['name'], 'Private Alex')
        self.assertNotIn('Other private profile', json.dumps(exported))
        self.assertNotIn('pw', exported['account'])
        self.page.locator('#privacySurveys').click()
        self.page.locator('#privacyConfirmNo').click()
        self.assertTrue(self.page.evaluate('!!DB.get("customers","cust-alex").surveys.s1'))
        self.page.locator('#privacySurveys').click()
        self.page.locator('#privacyConfirmYes').click()
        expect(self.page.locator('#privacyMessage')).to_contain_text('Survey answers deleted')
        self.assertEqual(self.page.evaluate('DB.get("customers","cust-alex").surveys'), {})
        self.assertEqual(self.page.evaluate('DB.get("customers","cust-alex").points'), 1350)
        self.assertTrue(self.page.evaluate('!!DB.get("customers","cust-mira").surveys.secret'))
        self.page.locator('#privacyResetPrefs').click()
        self.page.locator('#privacyConfirmYes').click()
        expect(self.page.locator('#privacyMessage')).to_contain_text('Food preferences reset')
        self.assertEqual(self.page.evaluate('DB.get("customers","cust-alex").prefs'), ['Fruits','Vegetables','Dairy'])
        self.page.locator('#privacyProfile').click()
        self.page.locator('#privacyConfirmYes').click()
        expect(self.page.locator('#privacyMessage')).to_contain_text('Saved profile deleted')
        self.assertTrue(self.page.evaluate('!DB.get("customers","cust-alex")'))
        self.assertTrue(self.page.evaluate('!!DB.get("customers","cust-mira")'))
        self.page.locator('#privacyClear').click()
        self.page.locator('#privacyConfirmNo').click()
        self.assertIsNotNone(self.page.evaluate('localStorage.getItem("sl_local")'))
        self.page.locator('#privacyClear').click()
        self.page.locator('#privacyConfirmYes').click()
        expect(self.page.locator('#toCust')).to_be_visible()
        self.assertEqual(self.page.evaluate('Object.keys(localStorage).filter(key => key.startsWith("sl_"))'), [])
        self.assertEqual(self.page.evaluate('localStorage.getItem("unrelated_application")'), 'keep')

    def test_staff_privacy_photo_removal_preserves_product_and_offer(self):
        self.login()
        self.page.locator('[data-view="scan"] [data-back]').click()
        self.page.evaluate('''async () => {
            const product = {name:'Apples',storeId:'edeka-friedrichstrasse',photo:'data:image/png;base64,iVBORw0KGgo=',qty:5};
            await DB.set('products','privacy-photo',product);
            await DB.set('offers','privacy-photo',{...product,active:true,pct:20});
            localStorage.setItem('sl_draft',JSON.stringify({photo:'draft-photo'}));
            S.draft = {photo:'draft-photo'};
        }''')
        self.page.locator('#gear').click()
        self.page.locator('#staffPrivacy').click()
        expect(self.page.locator('#privacyRemovePhoto')).to_be_visible()
        self.page.locator('#privacyRemovePhoto').click()
        self.page.locator('#privacyConfirmYes').click()
        expect(self.page.locator('#privacyMessage')).to_contain_text('Photo removed')
        self.assertIsNone(self.page.evaluate('DB.get("products","privacy-photo").photo'))
        self.assertIsNone(self.page.evaluate('DB.get("offers","privacy-photo").photo'))
        self.assertEqual(self.page.evaluate('DB.get("products","privacy-photo").qty'), 5)
        self.page.locator('#privacyDraft').click()
        self.page.locator('#privacyConfirmYes').click()
        expect(self.page.locator('#privacyMessage')).to_contain_text('draft discarded')
        self.assertIsNone(self.page.evaluate('localStorage.getItem("sl_draft")'))

if __name__ == '__main__': unittest.main(verbosity=2)
