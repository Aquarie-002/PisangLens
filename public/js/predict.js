import { USE_MOCK_PREDICTION } from './config.js';

const scenarios = {
    healthy: ['Healthy', 0.94],
    disease: ['Sigatoka', 0.88],
    low: ['Cordana Leaf Spot', 0.64],
};

// Deterministic default fixture; it does not inspect image contents.
let scenario = 'healthy';

// Automated tests may select fixtures directly; no public controls use this hook.
export function setPredictionScenario(value) {
    scenario = value;
}

export async function predict(canvas) {
    if (!canvas.width || !canvas.height) throw new Error('Foto belum tersedia.');
    if (!USE_MOCK_PREDICTION) throw new Error('Model asli belum tersedia.');
    if (!Object.hasOwn(scenarios, scenario)) throw new Error('Simulasi prediksi gagal. Silakan coba kembali.');
    const [class_name, confidence_score] = scenarios[scenario];
    return { class_name, confidence_score, prediction_source: 'mock', model_version: 'phase-1-mock' };
}
