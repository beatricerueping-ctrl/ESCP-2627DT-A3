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
        self.page.locator('#rp').fill('2.99')
        self.page.locator('#sv').click()
        expect(self.page.locator('[data-view="edash"]')).to_have_count(1)
        expect(self.page.locator('#recent')).to_contain_text('Apples')
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

if __name__ == '__main__': unittest.main(verbosity=2)
