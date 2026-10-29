-- Query student attendance results
-- Columns: student name, identity number, check-in time, and attendance status
-- Sorted by: verified students first, then by check-in time (earliest to latest)

SELECT
    s.name,
    s.identity_number,
    s.attended_at AS check_in_time,
    CASE
        WHEN s.attended_at IS NULL THEN 'Not attended'
        WHEN s.verified_at IS NOT NULL THEN 'Verified'
        WHEN COALESCE(a.verification_cycle_count, 0) > 0
             AND (a.verification_expires_at IS NULL OR a.verification_expires_at <= clock_timestamp())
            THEN 'Unverified / Left Early'
        ELSE 'Present'
    END AS attendance_status
FROM students s
LEFT JOIN attendance_state a ON a.id = 1
ORDER BY
    (s.verified_at IS NOT NULL) DESC,
    s.attended_at ASC NULLS LAST,
    s.name ASC;
