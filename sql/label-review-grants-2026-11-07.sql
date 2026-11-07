-- REQUIRES EXPLICIT USER APPROVAL. Not executed by the repair task.
-- First run continuous-learning-2026-11-07.sql in the existing pisanglens DB.
-- The observed runtime principal is pisanglens_app@127.0.0.1.
-- Only the new curation table receives permissions; existing grants stay intact.
GRANT SELECT, INSERT, UPDATE (status, approved_by, decided_at)
    ON pisanglens.retraining_queue TO 'pisanglens_app'@'127.0.0.1';
