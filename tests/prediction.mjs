import assert from 'node:assert/strict';
import { predict, setPredictionScenario } from '../public/js/predict.js';
import { consultationEligible } from '../public/js/consultations.js';
import { USE_MOCK_PREDICTION, MOCK_PREDICTION_LABEL } from '../public/js/config.js';

assert.equal(USE_MOCK_PREDICTION, true);
assert.equal(MOCK_PREDICTION_LABEL, 'Simulasi prediksi — bukan hasil analisis foto');
const canvas = { width: 224, height: 224 };
const defaultResult = await predict(canvas);
assert.equal(defaultResult.class_name, 'Healthy');
assert.deepEqual(await predict({ width: 800, height: 400 }), defaultResult);
console.log('PASS: default mock is deterministic and independent of image dimensions');
for (const [scenario, label, score, eligible] of [
    ['healthy', 'Healthy', .94, false],
    ['disease', 'Sigatoka', .88, true],
    ['low', 'Cordana Leaf Spot', .64, true],
]) {
    setPredictionScenario(scenario);
    const result = await predict(canvas);
    assert.deepEqual(result, {class_name: label, confidence_score: score, prediction_source: 'mock', model_version: 'phase-1-mock'});
    assert.equal(consultationEligible({predicted_class: label, confidence_score: score}), eligible);
    console.log('PASS: internal ' + scenario + ' fixture and consultation eligibility');
}
setPredictionScenario('failure');
await assert.rejects(predict(canvas), /gagal/);
setPredictionScenario('healthy');
await assert.rejects(predict({width: 0, height: 0}), /Foto belum tersedia/);
assert.deepEqual(await predict(canvas), defaultResult);
console.log('PASS: error fixture, missing image rejection and default restoration');
