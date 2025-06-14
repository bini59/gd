-- 던파 캐릭터 분류·컨텐츠 추천 DB 스키마

-- 계정-캐릭터 매핑 테이블
CREATE TABLE IF NOT EXISTS account_char (
    account_id TEXT NOT NULL,
    char_id TEXT NOT NULL,
    character_name TEXT,
    fame INTEGER NOT NULL,
    server_id TEXT,
    job_name TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (account_id, char_id)
);

-- Sync 실패 로그 테이블
CREATE TABLE IF NOT EXISTS sync_fail (
    id SERIAL PRIMARY KEY,
    char_id TEXT,
    error_message TEXT,
    error_data JSONB,
    failed_at TIMESTAMP DEFAULT NOW()
);

-- Sync 실행 로그 테이블
CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    message TEXT,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    duration INTEGER, -- milliseconds
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_account_char_account_fame 
ON account_char(account_id, fame DESC);

CREATE INDEX IF NOT EXISTS idx_account_char_fame 
ON account_char(fame);

CREATE INDEX IF NOT EXISTS idx_sync_fail_failed_at 
ON sync_fail(failed_at);

CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at 
ON sync_logs(created_at DESC);

-- Materialized View: 컨텐츠 입장 가능 여부
CREATE MATERIALIZED VIEW IF NOT EXISTS char_eligibility AS
SELECT 
    account_id,
    char_id,
    character_name,
    fame,
    job_name,
    server_id,
    -- 컨텐츠별 입장 가능 여부 (Fame 기준)
    (fame >= 58000) AS nabeel_eligible,
    (fame >= 55000) AS nightmare_eligible,
    (fame >= 52000) AS goddess_eligible,
    (fame >= 50000) AS azure_eligible,
    (fame >= 60000) AS venus_eligible,
    -- 슬롯 제한 적용 (계정별 Top N)
    ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY fame DESC) as rank_in_account,
    updated_at
FROM account_char;

-- Materialized View 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_char_eligibility_account_char 
ON char_eligibility(account_id, char_id);

CREATE INDEX IF NOT EXISTS idx_char_eligibility_account_rank 
ON char_eligibility(account_id, rank_in_account);

-- View refresh 함수
CREATE OR REPLACE FUNCTION refresh_char_eligibility()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY char_eligibility;
    PERFORM pg_notify('eligibility_refreshed', NOW()::text);
END;
$$ LANGUAGE plpgsql;