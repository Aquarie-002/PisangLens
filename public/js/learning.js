import { requestApi } from './api.js';
import { scanPhoto } from './photos.js';

export const learningLabelOrder = ['Cordana Leaf Spot', 'Healthy', 'Pestalotiopsis Leaf Blight', 'Sigatoka'];

function reviewError(error) {
    if (error.status === 503) return 'Penyimpanan tinjauan belum tersedia. Hubungi pengelola untuk memeriksa migrasi dan izin database.';
    if (error.status === 409) return 'Tinjauan sudah tersimpan untuk foto ini. Buka ulang konsultasi untuk melihat statusnya.';
    return error.message;
}

export function expertReview(container, { ticket, token, active, demo }) {
    container.replaceChildren();
    if (demo || ticket.prediction_source === 'mock') return () => container.replaceChildren();
    let disposed = false;
    const heading = document.createElement('h3'); heading.textContent = 'Tinjau label untuk perbaikan model';
    const form = document.createElement('form');
    const outcomeLabel = document.createElement('label'); outcomeLabel.textContent = 'Hasil peninjauan';
    const outcome = document.createElement('select'); outcome.name = 'review_outcome';
    for (const [value, text] of [['valid', 'Label dapat dipastikan'], ['undetermined', 'Tidak dapat dipastikan'], ['unusable', 'Foto tidak layak digunakan']]) {
        const option = document.createElement('option'); option.value = value; option.textContent = text; outcome.append(option);
    }
    outcomeLabel.append(outcome);
    const labelLabel = document.createElement('label'); labelLabel.textContent = 'Label hasil peninjauan';
    const label = document.createElement('select'); label.name = 'corrected_label';
    for (const name of learningLabelOrder) { const option = document.createElement('option'); option.value = name; option.textContent = name; label.append(option); }
    label.value = ticket.predicted_class;
    labelLabel.append(label);
    const noteLabel = document.createElement('label'); noteLabel.textContent = 'Catatan peninjauan';
    const note = document.createElement('textarea'); note.name = 'review_note'; note.required = true; note.maxLength = 2000; note.rows = 3; noteLabel.append(note);
    const send = document.createElement('button'); send.type = 'submit'; send.textContent = 'Kirim tinjauan ke admin';
    const status = document.createElement('p'); status.setAttribute('role', 'status');
    outcome.onchange = () => { label.disabled = outcome.value !== 'valid'; };
    form.append(outcomeLabel, labelLabel, noteLabel, send, status);
    function showSaved(review) {
        outcome.value = review.review_outcome ?? outcome.value;
        label.value = review.corrected_label ?? label.value;
        note.value = review.review_note ?? note.value;
        for (const input of form.querySelectorAll('select,textarea,button')) input.disabled = true;
        status.textContent = review.status === 'pending'
            ? 'Tinjauan tersimpan. Menunggu kurasi admin. Persetujuan tidak menjalankan pelatihan ulang otomatis.'
            : review.status === 'approved' ? 'Tinjauan disetujui admin sebagai kandidat data latih. Pelatihan ulang dilakukan terpisah.'
            : review.review_outcome === 'valid' ? 'Tinjauan tersimpan dan kandidat ditolak admin.'
            : 'Tinjauan tersimpan. Foto ini tidak menjadi kandidat data latih.';
    }
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (disposed || !active() || send.disabled || !form.reportValidity()) return;
        const body = { scan_id: ticket.scan_id, consultation_id: ticket.id, review_outcome: outcome.value,
            corrected_label: outcome.value === 'valid' ? label.value : null, review_note: note.value.trim() };
        send.disabled = true;
        try {
            const result = await requestApi('botanist/review', { method: 'POST', token, body });
            if (disposed || !active()) return;
            if (!result.queue_id) throw new Error('Tinjauan belum dikonfirmasi.');
            showSaved({ ...body, ...result });
        } catch (error) { if (!disposed && active()) { status.textContent = reviewError(error); send.disabled = false; } }
    });
    container.append(heading, form);
    send.disabled = true;
    status.textContent = 'Memeriksa tinjauan tersimpan…';
    void requestApi('botanist/review-status', { token, query: { consultation_id: ticket.id } }).then(result => {
        if (disposed || !active()) return;
        if (result.review) showSaved(result.review);
        else { send.disabled = false; status.textContent = ''; }
    }).catch(error => {
        if (!disposed && active()) { status.textContent = reviewError(error); send.disabled = false; }
    });
    return () => { disposed = true; container.replaceChildren(); };
}

export function initializeLearningQueue({ token, active, demo }) {
    const list = document.getElementById('learning-list'), status = document.getElementById('learning-status');
    const refresh = document.getElementById('learning-refresh');
    let busy = false, generation = 0, cleanups = [];
    function clear() { generation++; cleanups.forEach(fn => fn()); cleanups = []; list.replaceChildren(); }
    async function load() {
        if (busy || !active()) return;
        clear(); const request = generation; busy = true; refresh.disabled = true;
        status.textContent = 'Memuat kandidat data latih…';
        try {
            const rows = demo ? [] : await requestApi('admin/queue', { token, query: { type: 'retraining' } });
            if (!active() || request !== generation) return;
            if (!Array.isArray(rows)) throw new Error('Antrean belum dapat dibaca.');
            for (const row of rows) {
                const item = document.createElement('li'), photo = document.createElement('div');
                const heading = document.createElement('h3'); heading.textContent = row.corrected_label;
                const detail = document.createElement('p'); detail.textContent = `Prediksi awal: ${row.original_label} · Peninjau: ${row.reviewer_name} · ${row.review_note}`;
                const buttons = document.createElement('div'); buttons.className = 'actions';
                for (const [decision, text] of [['approve', 'Setujui data latih'], ['reject', 'Tolak kandidat']]) {
                    const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
                    button.addEventListener('click', async () => {
                        if (busy || !active()) return;
                        busy = true; for (const b of list.querySelectorAll('button')) b.disabled = true;
                        let success = false;
                        try {
                            const response = await requestApi('admin/approve', { method: 'POST', token, body: { target_id: row.id, approval_type: 'retraining', decision } });
                            if (response.updated_status !== (decision === 'approve' ? 'approved' : 'rejected')) throw new Error('Keputusan belum dikonfirmasi.');
                            success = true;
                        } catch (error) { if (active()) status.textContent = error.message; }
                        finally { busy = false; for (const b of list.querySelectorAll('button')) b.disabled = false; }
                        if (success && active()) await load();
                    });
                    buttons.append(button);
                }
                item.append(photo, heading, detail, buttons); list.append(item);
                cleanups.push(scanPhoto(photo, row, token, () => active() && request === generation));
            }
            status.textContent = demo ? 'Simulasi admin tidak mengumpulkan data latih nyata.' : rows.length ? 'Setujui hanya label dan foto yang telah diperiksa.' : 'Tidak ada kandidat yang menunggu kurasi.';
        } catch (error) { if (active()) status.textContent = reviewError(error); }
        finally { busy = false; refresh.disabled = false; }
    }
    refresh.addEventListener('click', load);
    window.addEventListener('hashchange', () => { if (location.hash === '#dataset') void load(); else clear(); });
    window.addEventListener('pagehide', clear);
    if (location.hash === '#dataset') void load();
}
