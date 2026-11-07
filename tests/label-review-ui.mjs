import assert from 'node:assert/strict';
import { expertReview } from '../public/js/learning.js';

class Element {
    constructor(tag) { this.tagName = tag; this.children = []; this.disabled = false; this.value = ''; this.textContent = ''; this.events = {}; }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    setAttribute() {}
    addEventListener(name, handler) { this.events[name] = handler; }
    reportValidity() { return true; }
    querySelectorAll(tags) {
        return this.children.flatMap(child => [ ...(tags.split(',').includes(child.tagName) ? [child] : []), ...child.querySelectorAll(tags) ]);
    }
}
globalThis.document = { createElement: tag => new Element(tag) };
const ticket = { id: 1, scan_id: 2, predicted_class: 'Healthy', prediction_source: 'local' };
const tick = () => new Promise(resolve => setImmediate(resolve));
const response = (body, status = 200) => ({ ok: status === 200, status, text: async () => JSON.stringify(body) });
const saved = { queue_id: '3', review_outcome: 'valid', corrected_label: 'Sigatoka', review_note: 'Saved note', status: 'pending' };

globalThis.fetch = async () => response({ review: saved });
let container = new Element('div');
expertReview(container, { ticket, token: 'test', active: () => true });
await tick();
let form = container.children[1];
assert(form.querySelectorAll('select,textarea,button').every(input => input.disabled));
assert.equal(form.querySelectorAll('textarea')[0].value, saved.review_note);
assert(form.children.at(-1).textContent.includes('Menunggu kurasi admin'));
console.log('PASS: refresh restores saved review and prevents duplicate submission');

let calls = [];
globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return response(options.method === 'POST' ? { queue_id: '4', status: 'pending' } : { review: null });
};
container = new Element('div');
expertReview(container, { ticket, token: 'test', active: () => true });
await tick();
form = container.children[1];
form.querySelectorAll('textarea')[0].value = 'Review note';
await form.events.submit({ preventDefault() {} });
assert.equal(calls.length, 2);
assert.equal(JSON.parse(calls[1].options.body).consultation_id, ticket.id);
assert.equal(calls[1].options.credentials, 'omit');
assert(form.querySelectorAll('button')[0].disabled);
assert(form.children.at(-1).textContent.includes('tidak menjalankan pelatihan ulang otomatis'));
console.log('PASS: confirmed submission disables form and explains separate retraining');

globalThis.fetch = async () => response({ status: 'error' }, 503);
container = new Element('div');
expertReview(container, { ticket, token: 'test', active: () => true });
await tick();
assert(container.children[1].children.at(-1).textContent.includes('migrasi dan izin database'));
console.log('PASS: unavailable storage reports actionable error');

let resolveFetch;
globalThis.fetch = () => new Promise(resolve => { resolveFetch = resolve; });
container = new Element('div');
const dispose = expertReview(container, { ticket, token: 'test', active: () => true });
dispose();
resolveFetch(response({ review: saved }));
await tick();
assert.equal(container.children.length, 0);
console.log('PASS: stale response cannot restore disposed private review');
