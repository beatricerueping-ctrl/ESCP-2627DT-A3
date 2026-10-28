const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyzePhoto } = require('../ai');
const result = { identified:true,product:'Apples',category:'Fruits',confidence:'high',visible_color:'Green',
  bruising:'none',discoloration:'none',surface_damage:'none',possible_mold:false,deterioration_notes:'No visible damage.',
  image_quality:'good',image_quality_note:'',observation:'Green apples.',suggested_condition:'good' };
const image = 'data:image/jpeg;base64,/9j/';
test('sends image to provider and validates structured observations', async () => {
  const actual = await analyzePhoto(image, {apiKey:'test-only-fixture', fetchImpl:async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    const body = JSON.parse(options.body);
    assert.equal(body.messages[1].content[1].image_url.url, image);
    assert.equal(body.response_format.json_schema.strict, true);
    return {ok:true,json:async () => ({choices:[{message:{content:JSON.stringify(result)}}]})};
  }});
  assert.deepEqual(actual, result);
});
test('missing credentials, invalid images, refusals and malformed AI results fail explicitly', async () => {
  await assert.rejects(analyzePhoto(image, {apiKey:''}), error => error.status === 503);
  await assert.rejects(analyzePhoto('https://example.com/image', {apiKey:'test-only-fixture'}), error => error.status === 400);
  await assert.rejects(analyzePhoto(image, {apiKey:'test-only-fixture',fetchImpl:async () => ({ok:true,json:async () => ({choices:[{message:{content:'{}'}}]})})}), error => error.status === 502);
  await assert.rejects(analyzePhoto(image, {apiKey:'test-only-fixture',fetchImpl:async () => ({ok:false,status:429})}), error => error.status === 429);
});
