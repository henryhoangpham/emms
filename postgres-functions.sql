CREATE OR REPLACE FUNCTION search_pjt_master(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0,
    p_search_string TEXT DEFAULT '',
    p_contract_type TEXT DEFAULT 'All',
    p_status TEXT[] DEFAULT ARRAY['0.Proposal', '1. On going']
)
RETURNS TABLE (
    id BIGINT,
    pjt_code TEXT,
    project_topic TEXT,
    client TEXT,
    client_pic_name TEXT,
    client_pic_email TEXT,
    contract_type TEXT,
    inquiry_date TIMESTAMP,
    proposal_date TEXT,
    status TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            "PJT".id,
            "PJT".pjt_code,
            "PJT".project_topic,
            "PJT".client,
            "PJT".client_pic_name,
            "PJT".client_pic_email,
            "PJT".contract_type,
            "PJT".inquiry_date,
            "PJT".proposal_date,
            "PJT".status
        FROM "PJT"
        WHERE (
            -- Search string filter
            "PJT".pjt_code ILIKE '%' || p_search_string || '%'
            OR "PJT".project_topic ILIKE '%' || p_search_string || '%'
            OR "PJT".client ILIKE '%' || p_search_string || '%'
        )
          -- Contract type filter
          AND (
              p_contract_type = 'All' OR 
              (p_contract_type = 'Others' AND "PJT".contract_type NOT IN ('Pay as you go (project)', 'Pay as you go (monthly)', 'Package')) OR
              (p_contract_type != 'Others' AND p_contract_type != 'All' AND "PJT".contract_type = p_contract_type)
          )
          -- Status filter
          AND "PJT".status = ANY(p_status)
          -- Ensure inquiry_date is not null
          AND "PJT".inquiry_date IS NOT NULL
    ),
    total AS (
        SELECT COUNT(*) AS total_count FROM filtered_data
    )
    SELECT 
        fd.id,
        fd.pjt_code,
        fd.project_topic,
        fd.client,
        fd.client_pic_name,
        fd.client_pic_email,
        fd.contract_type,
        fd.inquiry_date,
        fd.proposal_date,
        fd.status,
        t.total_count
    FROM filtered_data fd, total t
    ORDER BY fd.inquiry_date DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION search_masternew2024(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_candidate_expert TEXT[] DEFAULT NULL,
    p_search_string TEXT DEFAULT ''
)
RETURNS TABLE (
    id TEXT,
    exlink_expert_id BIGINT,
    recruiter TEXT,
    date DATE,
    candidate_expert TEXT,
    pjt TEXT,
    channel TEXT,
    name TEXT,
    period_of_enrollment TEXT,
    "position" TEXT,
    linkedin TEXT,
    proposed_currency TEXT,
    duration BIGINT,
    item_id TEXT,
    currency_id TEXT,
    expert_billing_data TEXT,
    expert_billing_currency TEXT,
    monthly_id TEXT,
    actual_expert_fee DOUBLE PRECISION,
    usd_actual_expert_fee DOUBLE PRECISION,
    usd_actual_client_fee DOUBLE PRECISION,
    usd_actual_net_revenue DOUBLE PRECISION,
    true_client TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            "MasterNew2024".id,
            "MasterNew2024".exlink_expert_id,
            "MasterNew2024".recruiter,
            "MasterNew2024".date,
            "MasterNew2024".candidate_expert,
            "MasterNew2024".pjt,
            "MasterNew2024".channel,
            "MasterNew2024".name,
            "MasterNew2024".period_of_enrollment,
            "MasterNew2024".position,
            "MasterNew2024".linkedin,
            "MasterNew2024".proposed_currency,
            "MasterNew2024".duration,
            "MasterNew2024".item_id,
            "MasterNew2024".currency_id,
            "MasterNew2024".expert_billing_data,
            "MasterNew2024".expert_billing_currency,
            "MasterNew2024".monthly_id,
            "MasterNew2024".actual_expert_fee,
            "MasterNew2024".usd_actual_expert_fee,
            "MasterNew2024".usd_actual_client_fee,
            "MasterNew2024".usd_actual_net_revenue,
            "MasterNew2024".true_client
        FROM public."MasterNew2024"
        WHERE (
            -- Date range filter
            (p_date_from IS NULL OR "MasterNew2024".date >= p_date_from) AND
            (p_date_to IS NULL OR "MasterNew2024".date <= p_date_to)
        )
        AND (
            -- Candidate/Expert filter
            p_candidate_expert IS NULL OR
            "MasterNew2024".candidate_expert = ANY(p_candidate_expert)
        )
        AND (
            -- Search term filter
            p_search_string = '' OR
            "MasterNew2024".recruiter ILIKE '%' || p_search_string || '%' OR
            "MasterNew2024".pjt ILIKE '%' || p_search_string || '%' OR
            "MasterNew2024".position ILIKE '%' || p_search_string || '%' OR
            "MasterNew2024".name ILIKE '%' || p_search_string || '%'
        )
    ),
    total AS (
        SELECT COUNT(*) AS total_count FROM filtered_data
    )
    SELECT 
        fd.id,
        fd.exlink_expert_id,
        fd.recruiter,
        fd.date,
        fd.candidate_expert,
        fd.pjt,
        fd.channel,
        fd.name,
        fd.period_of_enrollment,
        fd.position,
        fd.linkedin,
        fd.proposed_currency,
        fd.duration,
        fd.item_id,
        fd.currency_id,
        fd.expert_billing_data,
        fd.expert_billing_currency,
        fd.monthly_id,
        fd.actual_expert_fee,
        fd.usd_actual_expert_fee,
        fd.usd_actual_client_fee,
        fd.usd_actual_net_revenue,
        fd.true_client,
        t.total_count
    FROM filtered_data fd, total t
    ORDER BY fd.date DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION search_masternew_unified(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_candidate_expert TEXT[] DEFAULT NULL,
    p_search_string TEXT DEFAULT '',
    p_year TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY')

)
RETURNS TABLE (
    id TEXT,
    exlink_expert_id BIGINT,
    recruiter TEXT,
    date DATE,
    candidate_expert TEXT,
    pjt TEXT,
    channel TEXT,
    name TEXT,
    period_of_enrollment TEXT,
    "position" TEXT,
    linkedin TEXT,
    proposed_currency TEXT,
    duration BIGINT,
    item_id TEXT,
    currency_id TEXT,
    expert_billing_data TEXT,
    expert_billing_currency TEXT,
    monthly_id TEXT,
    actual_expert_fee DOUBLE PRECISION,
    usd_actual_expert_fee DOUBLE PRECISION,
    usd_actual_client_fee DOUBLE PRECISION,
    usd_actual_net_revenue DOUBLE PRECISION,
    true_client TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    master_table_name text;
BEGIN
    -- Validate the year to prevent SQL injection
    IF p_year NOT IN ('2023', '2024', '2025') THEN
        RAISE EXCEPTION 'Invalid year. Only 2023, 2024 and 2025 are supported.';
    END IF;

    -- Determine which master table to use based on year
    master_table_name := 'MasterNew' || p_year;

    RETURN QUERY
    EXECUTE format('
        WITH filtered_data AS (
            SELECT 
                id,
                exlink_expert_id,
                recruiter,
                date,
                candidate_expert,
                pjt,
                channel,
                name,
                period_of_enrollment,
                "position",
                linkedin,
                proposed_currency,
                duration,
                item_id,
                currency_id,
                expert_billing_data,
                expert_billing_currency,
                monthly_id,
                actual_expert_fee,
                usd_actual_expert_fee,
                usd_actual_client_fee,
                usd_actual_net_revenue,
                true_client
            FROM public.%I
            WHERE (
                -- Date range filter
                ($1 IS NULL OR date >= $1) AND
                ($2 IS NULL OR date <= $2)
            )
            AND (
                -- Candidate/Expert filter
                $3 IS NULL OR
                candidate_expert = ANY($3)
            )
            AND (
                -- Search term filter
                $4 = '''' OR
                recruiter ILIKE ''%%'' || $4 || ''%%'' OR
                pjt ILIKE ''%%'' || $4 || ''%%'' OR
                "position" ILIKE ''%%'' || $4 || ''%%'' OR
                name ILIKE ''%%'' || $4 || ''%%''
            )
        ),
        total AS (
            SELECT COUNT(*) AS total_count FROM filtered_data
        )
        SELECT 
            fd.id,
            fd.exlink_expert_id,
            fd.recruiter,
            fd.date,
            fd.candidate_expert,
            fd.pjt,
            fd.channel,
            fd.name,
            fd.period_of_enrollment,
            fd.position,
            fd.linkedin,
            fd.proposed_currency,
            fd.duration,
            fd.item_id,
            fd.currency_id,
            fd.expert_billing_data,
            fd.expert_billing_currency,
            fd.monthly_id,
            fd.actual_expert_fee,
            fd.usd_actual_expert_fee,
            fd.usd_actual_client_fee,
            fd.usd_actual_net_revenue,
            fd.true_client,
            t.total_count
        FROM filtered_data fd, total t
        ORDER BY fd.date DESC
        LIMIT $5
        OFFSET $6;
    ', master_table_name)
    USING p_date_from, p_date_to, p_candidate_expert, p_search_string, p_limit, p_offset;
END;
$$;

-- Example usage:
-- SELECT * FROM search_masternew_unified(10, 0, '2024-01-01', '2024-01-31', ARRAY['Expert'], 'hana');
-- SELECT * FROM search_masternew_unified(10, 0, '2023-01-01', '2023-12-31', ARRAY['Expert'], 'h', '2023');
-- SELECT * FROM search_masternew_unified(10, 0, '2025-01-01', '2025-01-31', ARRAY['Candidate'], '');

CREATE OR REPLACE FUNCTION search_operational_clients(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0,
    p_invoice_entity TEXT DEFAULT 'All',
    p_contract_type TEXT DEFAULT 'All',
    p_search_string TEXT DEFAULT '',
    p_priorities BIGINT[] DEFAULT ARRAY[]::integer[],
    p_segments TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    ID BIGINT,
    Client_Code_Name TEXT,
    Company_name TEXT,
    Contract_Type TEXT,
    Country_Code TEXT,
    Invoice_Address TEXT,
    Invoice_Currency TEXT,
    Invoice_Entity TEXT,
    Client_ID TEXT,
    Account_Manager TEXT,
    Client_Facing TEXT,
    Geo TEXT,
    AM TEXT,
    PM TEXT,
    Company_Segment TEXT,
    Existing_Account_Priority BIGINT,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            "OperationalClients"."ID",
            "OperationalClients"."Client_Code_Name",
            "OperationalClients"."Company_name",
            "OperationalClients"."Contract_Type",
            "OperationalClients"."Country_Code",
            "OperationalClients"."Invoice_Address",
            "OperationalClients"."Invoice_Currency",
            "OperationalClients"."Invoice_Entity",
            "OperationalClients"."Client_ID",
            "OperationalClients"."Account_Manager",
            "OperationalClients"."Client_Facing",
            "OperationalClients"."Geo",
            "OperationalClients"."AM",
            "OperationalClients"."PM",
            "OperationalClients"."Company_Segment",
            "OperationalClients"."_00_Existing_Account_Priority" AS "Existing_Account_Priority"
        FROM public."OperationalClients"
        WHERE (
            -- Invoice entity filter
            (p_invoice_entity = 'All' OR "OperationalClients"."Invoice_Entity" = p_invoice_entity)
        )
        AND (
            p_contract_type = 'All' OR 
            (p_contract_type = 'Others' AND "OperationalClients"."Contract_Type" NOT IN ('Pay as you go (project)', 'Pay as you go (monthly)', 'Package')) OR
            (p_contract_type != 'Others' AND p_contract_type != 'All' AND "OperationalClients"."Contract_Type" = p_contract_type)
        )
        AND (
            -- Search string filter
            p_search_string = '' OR
            "OperationalClients"."Client_Code_Name" ILIKE '%' || p_search_string || '%' OR
            "OperationalClients"."Company_name" ILIKE '%' || p_search_string || '%' OR
            "OperationalClients"."Client_ID" ILIKE '%' || p_search_string || '%'
        )
        AND (
            -- Priorities filter
            ARRAY_LENGTH(p_priorities, 1) IS NULL OR 
            "OperationalClients"."_00_Existing_Account_Priority" = ANY(p_priorities)
        )
        AND (
            -- Segments filter
            p_segments IS NULL OR 
            "OperationalClients"."Company_Segment" = ANY(p_segments)
        )
    ),
    total AS (
        SELECT COUNT(*) AS total_count FROM filtered_data
    )
    SELECT 
        fd."ID",
        fd."Client_Code_Name",
        fd."Company_name",
        fd."Contract_Type",
        fd."Country_Code",
        fd."Invoice_Address",
        fd."Invoice_Currency",
        fd."Invoice_Entity",
        fd."Client_ID",
        fd."Account_Manager",
        fd."Client_Facing",
        fd."Geo",
        fd."AM",
        fd."PM",
        fd."Company_Segment",
        fd."Existing_Account_Priority",
        t.total_count
    FROM filtered_data fd, total t
    ORDER BY fd."ID"
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


CREATE OR REPLACE FUNCTION get_client_combine_stats(
  p_client_codes text[],
  p_year text DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY')
)
RETURNS TABLE (
  client_code text,
  monthly_data jsonb[],
  ytd_totals jsonb
) AS $$
BEGIN
  PERFORM set_config('statement_timeout', '600000', true);

  RETURN QUERY
  WITH master_stats_by_month AS (
    SELECT 
      true_client,
      SUBSTRING(monthly_id, 1, 6) AS month,
      COUNT(CASE WHEN candidate_expert LIKE '%Expert%' THEN 1 END) as iv_count,
      COUNT(CASE WHEN channel LIKE '%DBExpert%' THEN 1 END) as dbiv_count,
      COUNT(CASE WHEN candidate_expert = 'Candidate' THEN 1 END) as cdd_count,
      COUNT(CASE WHEN channel LIKE '%DBCandidate%' THEN 1 END) as dbcdd_count,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN duration ELSE 0 END) as total_duration,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN usd_actual_client_fee ELSE 0 END) as revenue,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN usd_actual_net_revenue ELSE 0 END) as net_revenue
    FROM "MasterNew2024"
    WHERE true_client = ANY(p_client_codes)
    AND monthly_id LIKE p_year || '%'
    GROUP BY true_client, SUBSTRING(monthly_id, 1, 6)
  ),
  pjt_stats_by_month AS (
    SELECT 
      client,
      SUBSTRING(inquiry_month, 1, 6) AS month,
      COUNT(CASE WHEN status = '1. On going' THEN 1 END) as pjt_count,
      SUM(CASE WHEN status = '1. On going' THEN required_nr_of_calls ELSE 0 END) as cr_count
    FROM "PJT"
    WHERE client = ANY(p_client_codes)
    AND inquiry_month LIKE p_year || '%'
    GROUP BY client, SUBSTRING(inquiry_month, 1, 6)
  ),
  aggregated_monthly AS (
    SELECT 
      oc."Client_Code_Name" AS client_code,
      COALESCE(ms.month, ps.month) AS month,
      SUM(COALESCE(ms.iv_count, 0)) AS iv_count,
      SUM(COALESCE(ms.dbiv_count, 0)) AS dbiv_count,
      SUM(COALESCE(ms.cdd_count, 0)) AS cdd_count,
      SUM(COALESCE(ms.dbcdd_count, 0)) AS dbcdd_count,
      SUM(COALESCE(ms.total_duration, 0)) AS total_duration,
      SUM(COALESCE(ms.revenue, 0)) AS revenue,
      SUM(COALESCE(ms.net_revenue, 0)) AS net_revenue,
      SUM(COALESCE(ps.pjt_count, 0)) AS pjt_count,
      SUM(COALESCE(ps.cr_count, 0)) AS cr_count
    FROM "OperationalClients" oc
    LEFT JOIN master_stats_by_month ms ON ms.true_client = oc."Client_Code_Name"
    LEFT JOIN pjt_stats_by_month ps ON ps.client = oc."Client_Code_Name" AND ms.month = ps.month
    WHERE oc."Client_Code_Name" = ANY(p_client_codes)
    GROUP BY oc."Client_Code_Name", COALESCE(ms.month, ps.month)
  ),
  master_ytd AS (
    SELECT 
      true_client AS client_code,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN 1 ELSE 0 END) as iv_count,
      SUM(CASE WHEN channel LIKE '%DBExpert%' THEN 1 ELSE 0 END) as dbiv_count,
      SUM(CASE WHEN candidate_expert = 'Candidate' THEN 1 ELSE 0 END) as cdd_count,
      SUM(CASE WHEN channel LIKE '%DBCandidate%' THEN 1 ELSE 0 END) as dbcdd_count,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN duration ELSE 0 END) as total_duration,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN usd_actual_client_fee ELSE 0 END) as revenue,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN usd_actual_net_revenue ELSE 0 END) as net_revenue
    FROM "MasterNew2024"
    WHERE true_client = ANY(p_client_codes)
    AND monthly_id LIKE p_year || '%'
    GROUP BY true_client
  ),
  pjt_ytd AS (
    SELECT 
      client AS client_code,
      SUM(CASE WHEN status = '1. On going' THEN 1 ELSE 0 END) as pjt_count,
      SUM(CASE WHEN status = '1. On going' THEN required_nr_of_calls ELSE 0 END) as cr_count
    FROM "PJT"
    WHERE client = ANY(p_client_codes)
    AND inquiry_month LIKE p_year || '%'
    GROUP BY client
  )
  SELECT 
    am.client_code,
    ARRAY_AGG(
      JSONB_BUILD_OBJECT(
        'month', am.month,
        'stats', JSONB_BUILD_OBJECT(
          'iv', COALESCE(am.iv_count, 0),
          'dbiv', COALESCE(am.dbiv_count, 0),
          'cdd', COALESCE(am.cdd_count, 0),
          'dbcdd', COALESCE(am.dbcdd_count, 0),
          'total_duration', COALESCE(am.total_duration, 0),
          'revenue', COALESCE(am.revenue, 0),
          'net_revenue', COALESCE(am.net_revenue, 0),
          'pjt', COALESCE(am.pjt_count, 0),
          'cr', COALESCE(am.cr_count, 0)
        )
      )
      ORDER BY am.month
    ) AS monthly_data,
    JSONB_BUILD_OBJECT(
      'year', p_year,
      'stats', JSONB_BUILD_OBJECT(
        'iv', COALESCE(my.iv_count, 0),
        'dbiv', COALESCE(my.dbiv_count, 0),
        'cdd', COALESCE(my.cdd_count, 0),
        'dbcdd', COALESCE(my.dbcdd_count, 0),
        'total_duration', COALESCE(my.total_duration, 0),
        'revenue', COALESCE(my.revenue, 0),
        'net_revenue', COALESCE(my.net_revenue, 0),
        'pjt', COALESCE(py.pjt_count, 0),
        'cr', COALESCE(py.cr_count, 0)
      )
    ) AS ytd_totals
  FROM aggregated_monthly am
  LEFT JOIN master_ytd my ON am.client_code = my.client_code
  LEFT JOIN pjt_ytd py ON am.client_code = py.client_code
  GROUP BY am.client_code, my.iv_count, my.dbiv_count, my.cdd_count, my.dbcdd_count, my.total_duration, my.revenue, my.net_revenue, py.pjt_count, py.cr_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_client_combine_stats_unified(
  p_client_codes text[],
  p_year text DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY')
)
RETURNS TABLE (
  client_code text,
  monthly_data jsonb[],
  ytd_totals jsonb
) AS $$
DECLARE
  master_table_name text;
BEGIN
  -- Set statement timeout
  PERFORM set_config('statement_timeout', '600000', true);
  
  -- Determine which master table to use based on year
  master_table_name := 'MasterNew' || p_year;
  
  -- Validate the year to prevent SQL injection
  IF p_year NOT IN ('2023', '2024', '2025') THEN
    RAISE EXCEPTION 'Invalid year. Only 2023, 2024 and 2025 are supported.';
  END IF;

  RETURN QUERY
  EXECUTE format('
    WITH master_stats_by_month AS (
      SELECT 
        true_client,
        SUBSTRING(monthly_id, 1, 6) AS month,
        COUNT(CASE WHEN candidate_expert LIKE ''%%Expert%%'' THEN 1 END) as iv_count,
        COUNT(CASE WHEN channel LIKE ''%%DBExpert%%'' THEN 1 END) as dbiv_count,
        COUNT(CASE WHEN candidate_expert = ''Candidate'' THEN 1 END) as cdd_count,
        COUNT(CASE WHEN channel LIKE ''%%DBCandidate%%'' THEN 1 END) as dbcdd_count,
        SUM(CASE WHEN candidate_expert LIKE ''%%Expert%%'' THEN duration ELSE 0 END) as total_duration,
        SUM(CASE WHEN candidate_expert LIKE ''%%Expert%%'' THEN usd_actual_client_fee ELSE 0 END) as revenue,
        SUM(CASE WHEN candidate_expert LIKE ''%%Expert%%'' THEN usd_actual_net_revenue ELSE 0 END) as net_revenue
      FROM %I
      WHERE true_client = ANY($1)
      AND monthly_id LIKE $2 || ''%%''
      GROUP BY true_client, SUBSTRING(monthly_id, 1, 6)
    ),
    pjt_stats_by_month AS (
      SELECT 
        client,
        SUBSTRING(inquiry_month, 1, 6) AS month,
        COUNT(CASE WHEN status = ''1. On going'' THEN 1 END) as pjt_count,
        SUM(CASE WHEN status = ''1. On going'' THEN required_nr_of_calls ELSE 0 END) as cr_count
      FROM "PJT"
      WHERE client = ANY($1)
      AND inquiry_month LIKE $2 || ''%%''
      GROUP BY client, SUBSTRING(inquiry_month, 1, 6)
    ),
    aggregated_monthly AS (
      SELECT 
        oc."Client_Code_Name" AS client_code,
        COALESCE(ms.month, ps.month) AS month,
        SUM(COALESCE(ms.iv_count, 0)) AS iv_count,
        SUM(COALESCE(ms.dbiv_count, 0)) AS dbiv_count,
        SUM(COALESCE(ms.cdd_count, 0)) AS cdd_count,
        SUM(COALESCE(ms.dbcdd_count, 0)) AS dbcdd_count,
        SUM(COALESCE(ms.total_duration, 0)) AS total_duration,
        SUM(COALESCE(ms.revenue, 0)) AS revenue,
        SUM(COALESCE(ms.net_revenue, 0)) AS net_revenue,
        SUM(COALESCE(ps.pjt_count, 0)) AS pjt_count,
        SUM(COALESCE(ps.cr_count, 0)) AS cr_count
      FROM "OperationalClients" oc
      LEFT JOIN master_stats_by_month ms ON ms.true_client = oc."Client_Code_Name"
      LEFT JOIN pjt_stats_by_month ps ON ps.client = oc."Client_Code_Name" AND ms.month = ps.month
      WHERE oc."Client_Code_Name" = ANY($1)
      GROUP BY oc."Client_Code_Name", COALESCE(ms.month, ps.month)
    ),
    master_ytd AS (
      SELECT 
        true_client AS client_code,
        SUM(CASE WHEN candidate_expert LIKE ''%%Expert%%'' THEN 1 ELSE 0 END) as iv_count,
        SUM(CASE WHEN channel LIKE ''%%DBExpert%%'' THEN 1 ELSE 0 END) as dbiv_count,
        SUM(CASE WHEN candidate_expert = ''Candidate'' THEN 1 ELSE 0 END) as cdd_count,
        SUM(CASE WHEN channel LIKE ''%%DBCandidate%%'' THEN 1 ELSE 0 END) as dbcdd_count,
        SUM(CASE WHEN candidate_expert LIKE ''%%Expert%%'' THEN duration ELSE 0 END) as total_duration,
        SUM(CASE WHEN candidate_expert LIKE ''%%Expert%%'' THEN usd_actual_client_fee ELSE 0 END) as revenue,
        SUM(CASE WHEN candidate_expert LIKE ''%%Expert%%'' THEN usd_actual_net_revenue ELSE 0 END) as net_revenue
      FROM %I
      WHERE true_client = ANY($1)
      AND monthly_id LIKE $2 || ''%%''
      GROUP BY true_client
    ),
    pjt_ytd AS (
      SELECT 
        client AS client_code,
        SUM(CASE WHEN status = ''1. On going'' THEN 1 ELSE 0 END) as pjt_count,
        SUM(CASE WHEN status = ''1. On going'' THEN required_nr_of_calls ELSE 0 END) as cr_count
      FROM "PJT"
      WHERE client = ANY($1)
      AND inquiry_month LIKE $2 || ''%%''
      GROUP BY client
    )
    SELECT 
      am.client_code,
      ARRAY_AGG(
        JSONB_BUILD_OBJECT(
          ''month'', am.month,
          ''stats'', JSONB_BUILD_OBJECT(
            ''iv'', COALESCE(am.iv_count, 0),
            ''dbiv'', COALESCE(am.dbiv_count, 0),
            ''cdd'', COALESCE(am.cdd_count, 0),
            ''dbcdd'', COALESCE(am.dbcdd_count, 0),
            ''total_duration'', COALESCE(am.total_duration, 0),
            ''revenue'', COALESCE(am.revenue, 0),
            ''net_revenue'', COALESCE(am.net_revenue, 0),
            ''pjt'', COALESCE(am.pjt_count, 0),
            ''cr'', COALESCE(am.cr_count, 0)
          )
        )
        ORDER BY am.month
      ) AS monthly_data,
      JSONB_BUILD_OBJECT(
        ''year'', $2,
        ''stats'', JSONB_BUILD_OBJECT(
          ''iv'', COALESCE(my.iv_count, 0),
          ''dbiv'', COALESCE(my.dbiv_count, 0),
          ''cdd'', COALESCE(my.cdd_count, 0),
          ''dbcdd'', COALESCE(my.dbcdd_count, 0),
          ''total_duration'', COALESCE(my.total_duration, 0),
          ''revenue'', COALESCE(my.revenue, 0),
          ''net_revenue'', COALESCE(my.net_revenue, 0),
          ''pjt'', COALESCE(py.pjt_count, 0),
          ''cr'', COALESCE(py.cr_count, 0)
        )
      ) AS ytd_totals
    FROM aggregated_monthly am
    LEFT JOIN master_ytd my ON am.client_code = my.client_code
    LEFT JOIN pjt_ytd py ON am.client_code = py.client_code
    GROUP BY am.client_code, my.iv_count, my.dbiv_count, my.cdd_count, my.dbcdd_count, 
             my.total_duration, my.revenue, my.net_revenue, py.pjt_count, py.cr_count
  ', master_table_name, master_table_name)
  USING p_client_codes, p_year;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_client_combine_stats_unified(ARRAY['L.E.K. SGP'], '2025');
-- SELECT * FROM get_client_combine_stats_unified(ARRAY['L.E.K. SGP'], '2024');
-- SELECT * FROM get_client_combine_stats_unified(ARRAY['Accenture Japan'], '2023');

CREATE OR REPLACE FUNCTION get_company_kpi(
    p_yyyymm text
)
RETURNS TABLE (
    date date,
    call_request_all int,
    call_request_actual int,
    candidate_actual int,
    candidate_actual_from_db int,
    expert_actual int,
    revenue float8,
    net_revenue float8
) AS $$
DECLARE
    v_year int;
    v_month int;
    v_start_date date;
    master_table_name text;
BEGIN
    -- Extract year and month from p_yyyymm
    v_year := CAST(substring(p_yyyymm from 1 for 4) AS int);
    v_month := CAST(substring(p_yyyymm from 5 for 2) AS int);
    v_start_date := make_date(v_year, v_month, 1);
    
    -- Determine which master table to use
    master_table_name := 'MasterNew' || v_year;

    -- Validate the year
    IF v_year NOT IN (2023, 2024, 2025) THEN
        RAISE EXCEPTION 'Invalid year. Only 2023, 2024 and 2025 are supported.';
    END IF;

    RETURN QUERY EXECUTE format('
        WITH dates AS (
            -- Generate all dates for the month
            SELECT generate_series(
                %L::date,
                (%L::date + interval ''1 month'' - interval ''1 day'')::date,
                interval ''1 day''
            )::date AS date
        ),
        call_requests AS (
            -- Calculate call_request_all and call_request_actual
            SELECT 
                inquiry_date::date AS date,
                SUM(CASE WHEN am <> ''Yuasa Tomoyuki'' THEN COALESCE(required_nr_of_calls, 0) ELSE 0 END)::int AS call_request_all,
                SUM(CASE 
                    WHEN am <> ''Yuasa Tomoyuki'' 
                         AND status NOT IN (''0.Proposal'', ''5. Proposal Lost'') 
                    THEN COALESCE(required_nr_of_calls, 0) 
                    ELSE 0 
                END)::int AS call_request_actual
            FROM "PJT"
            WHERE EXTRACT(YEAR FROM inquiry_date) = $1
            AND EXTRACT(MONTH FROM inquiry_date) = $2
            GROUP BY inquiry_date::date
        ),
        candidates AS (
            -- Get daily candidate counts (all and filtered)
            SELECT 
                date::date,
                COUNT(*) FILTER (WHERE channel <> ''DBCandidate'')::int AS daily_actual_count,
                COUNT(*) FILTER (WHERE channel = ''DBCandidate'')::int AS daily_actual_from_db_count
            FROM %I
            WHERE EXTRACT(YEAR FROM date) = $1
            AND EXTRACT(MONTH FROM date) = $2
            AND candidate_expert = ''Candidate''
            AND status NOT IN (''0.Proposal'', ''5. Proposal Lost'')
            GROUP BY date::date
        ),
        experts AS (
            -- Get daily expert counts
            SELECT 
                date::date,
                COUNT(*)::int AS expert_count,
                SUM(COALESCE(usd_actual_client_fee, 0.0))::float8 AS daily_revenue,
                SUM(COALESCE(usd_actual_net_revenue, 0.0))::float8 AS daily_net_revenue
            FROM %I
            WHERE EXTRACT(YEAR FROM date) = $1
            AND EXTRACT(MONTH FROM date) = $2
            AND candidate_expert LIKE ''%%Expert%%''
            GROUP BY date::date
        )
        SELECT 
            d.date,
            COALESCE(cr.call_request_all, 0)::int AS call_request_all,
            COALESCE(cr.call_request_actual, 0)::int AS call_request_actual,
            COALESCE(c.daily_actual_count, 0)::int AS candidate_actual,
            COALESCE(c.daily_actual_from_db_count, 0)::int AS candidate_actual_from_db,
            COALESCE(e.expert_count, 0)::int AS expert_actual,
            COALESCE(e.daily_revenue, 0.0)::float8 AS revenue,
            COALESCE(e.daily_net_revenue, 0.0)::float8 AS net_revenue
        FROM dates d
        LEFT JOIN call_requests cr ON d.date = cr.date
        LEFT JOIN candidates c ON d.date = c.date
        LEFT JOIN experts e ON d.date = e.date
        ORDER BY d.date;
    ', v_start_date, v_start_date, master_table_name, master_table_name)
    USING v_year, v_month;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_experts(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0,
    p_search_string TEXT DEFAULT ''
)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    email TEXT,
    phone_number TEXT,
    linkedin_url TEXT,
    description TEXT,
    experience TEXT,
    rate TEXT,
    job_from TEXT,
    job_to TEXT,
    company TEXT,
    title TEXT,
    recruiter TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            "Experts".*
        FROM "Experts"
        WHERE (
            p_search_string = '' OR
            "Experts".name ILIKE '%' || p_search_string || '%' OR
            "Experts".email ILIKE '%' || p_search_string || '%' OR
            "Experts".company ILIKE '%' || p_search_string || '%' OR
            "Experts".title ILIKE '%' || p_search_string || '%' OR
            "Experts".description ILIKE '%' || p_search_string || '%' OR
            "Experts".experience ILIKE '%' || p_search_string || '%'
        )
    ),
    total AS (
        SELECT COUNT(*) AS total_count FROM filtered_data
    )
    SELECT 
        fd.*,
        t.total_count
    FROM filtered_data fd, total t
    ORDER BY fd.name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
