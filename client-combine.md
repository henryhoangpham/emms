### Table definitions

create table
  public."PJT" (
    id bigint null,
    em_es text null,
    related_projects text null,
    pjt_code text null,
    project_topic text null,
    keywords text null,
    status text null,
    closing_month timestamp without time zone null,
    required_nr_of_calls bigint null,
    lost_reason text null,
    country_area_1 text null,
    country_area_2 text null,
    country_area_3 text null,
    country_area_4 text null,
    sector text null,
    industry text null,
    es_budget text null,
    not_used_1 text null,
    not_used_2 text null,
    invoice_client text null,
    client_pic_email text null,
    client_pic_name text null,
    client text null,
    contract_type text null,
    invoice_id text null,
    inquiry_date timestamp without time zone null,
    proposal_date text null,
    start_date timestamp without time zone null,
    sales text null,
    project_source text null,
    client_facing text null,
    am text null,
    pm text null,
    rec1 text null,
    rec2 text null,
    rec3 text null,
    rec4 text null,
    number_of_rec bigint null,
    cr_r double precision null,
    pjt_sheet text null,
    not_used_3 text null,
    not_used_4 text null,
    kickoff_mtg text null,
    first_response_in_1_hour text null,
    rcp_in_3_hours text null,
    class text null,
    reachable_potential text null,
    cold_call_reactive text null,
    confidential_strictrness text null,
    not_used_5 text null,
    difficulty text null,
    reason1 text null,
    reason2 text null,
    reason3 text null,
    number_of_cdd text null,
    number_of_iv text null,
    rev text null,
    nr text null,
    inquiry_month text null,
    not_used_6 text null,
    closecheck text null,
    tag1 text null,
    es_pj_code text null,
    tag2 text null,
    tag3 text null,
    tag4 text null
  ) tablespace pg_default;

  create table
  public."MasterNew2024" (
    id text null,
    exlink_expert_id bigint null,
    recruiter text null,
    date date null,
    candidate_expert text null,
    pjt text null,
    channel text null,
    name text null,
    period_of_enrollment text null,
    position text null,
    linkedin text null,
    proposed_currency text null,
    duration bigint null,
    item_id text null,
    currency_id text null,
    expert_billing_data text null,
    expert_billing_currency text null,
    monthly_id text null,
    actual_expert_fee double precision null,
    usd_actual_expert_fee double precision null,
    usd_actual_client_fee double precision null,
    usd_actual_net_revenue double precision null,
    true_client text null
  ) tablespace pg_default;

  create table
  public."OperationalClients" (
    "ID" bigint null,
    "Client_Code_Name" text null,
    "Company_name" text null,
    "Contract_Type" text null,
    "Country_Code" text null,
    "Invoice_Address" text null,
    "Invoice_Currency" text null,
    "Invoice_Entity" text null,
    "Client_ID" text null,
    "Account_Manager" text null,
    "Client_Facing" text null,
    "Geo" text null,
    "AM" text null,
    "PM" text null,
    "Company_Segment" text null,
    "Existing_Account_Priority" bigint null
  ) tablespace pg_default;

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
    inquiry_month TEXT,
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
            "PJT".status,
            "PJT".inquiry_month
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
        fd.inquiry_month,
        t.total_count
    FROM filtered_data fd, total t
    ORDER BY fd.inquiry_date DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION get_project_detail(
    p_id BIGINT
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
    nr_of_cdd BIGINT,
    nr_of_iv BIGINT,
    total_revenue NUMERIC,
    candidates JSONB,
    experts JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
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
        "PJT".status,
        (SELECT COUNT(*) 
         FROM "MasterNew2024" 
         WHERE "MasterNew2024".pjt = "PJT".pjt_code
           AND "MasterNew2024".candidate_expert = 'Candidate') AS nr_of_cdd,
        (SELECT COUNT(*) 
         FROM "MasterNew2024" 
         WHERE "MasterNew2024".pjt = "PJT".pjt_code
           AND "MasterNew2024".candidate_expert LIKE '%Expert%') AS nr_of_iv,
        (SELECT SUM("MasterNew2024".fee_from_client)::NUMERIC 
         FROM "MasterNew2024" 
         WHERE "MasterNew2024".pjt = "PJT".pjt_code
           AND "MasterNew2024".candidate_expert LIKE '%Expert%') AS total_revenue,
        (SELECT jsonb_agg(row_to_json(m))
         FROM (
             SELECT "MasterNew2024".id, exlink_expert_id, recruiter, date, candidate_expert, pjt, channel, name, period_of_enrollment, position, proposed_currency, duration, item_id, currency_id, expert_billing_data, expert_billing_currency, fee_for_expert, fee_from_client, net_revenue
             FROM "MasterNew2024"
             WHERE "MasterNew2024".pjt = "PJT".pjt_code
               AND "MasterNew2024".candidate_expert = 'Candidate'
         ) m) AS candidates,
        (SELECT jsonb_agg(row_to_json(m))
         FROM (
             SELECT "MasterNew2024".id, exlink_expert_id, recruiter, date, candidate_expert, pjt, channel, name, period_of_enrollment, position, proposed_currency, duration, item_id, currency_id, expert_billing_data, expert_billing_currency, fee_for_expert, fee_from_client, net_revenue
             FROM "MasterNew2024"
             WHERE "MasterNew2024".pjt = "PJT".pjt_code
               AND "MasterNew2024".candidate_expert LIKE '%Expert%'
         ) m) AS experts
    FROM "PJT"
    WHERE "PJT".id = p_id;
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

CREATE OR REPLACE FUNCTION search_operational_clients(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0,
    p_invoice_entity TEXT DEFAULT 'All',
    p_contract_type TEXT DEFAULT 'All',
    p_search_string TEXT DEFAULT ''
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
            "OperationalClients"."Existing_Account_Priority"
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


--- Let's analyze the requirements and discuss the best approach for implementing the Client Combine information feature.

---
# It is a list of Openration Client like @OperationalClientList.tsx 

# it aggregates data from PJT and MasterNew2024 tables as well

## aggredate 

### with MasterNew2025
#### condition: 
##### Operational_Client.Client_Code_Name = MasterNew2024.true_client
##### MasterNew2024.monthly_id
#### values:
##### count of record with MasterNew2024.candidate_expert contains "Expert" -> IV
##### count of record with MasterNew2024.channel contains "DBExpert" -> DBIV
##### count of record with MasterNew2024.candidate_expert contains "Candidate" -> CDD
##### count of record with MasterNew2024.channel contains "DBCDD" -> DBCDD
##### sum of MasterNew2024.usd_actual_client_fee of records with MasterNew2024.candidate_expert contains "Expert" -> Rev
##### sum of MasterNew2024.usd_actual_net_revenue of records with MasterNew2024.candidate_expert contains "Expert" -> NR

### with PJT
#### condition: 
##### Operational_Client.Client_Code_Name = PJT.client
##### PJT.inquiry_month
#### values:
##### count of record with PJT.status = '1. On going' -> PJT
##### sum of PJT.required_nr_of_calls of records with PJT.status = '1. On going'  -> CR

### Note: 
#### MasterNew2024.monthly_id and PJT.inquiry_month values like '202411', '202410', so the aggrigation is by month
---

## Data Aggregation Options
### Server-side Full Aggregation
**Pros:**
- Single API call
- Better performance for small to medium datasets
- Simpler client-side code

**Cons:**
- Higher server load
- More complex SQL query
- Potentially large response payload

### Client-side Pagination with Server Aggregation
**Pros:**
- Lower server load per request
- Smaller response payload
- Better for large datasets

**Cons:**
- Multiple API calls needed
- More complex client-side state management

## Time Period Options
### Full Year Aggregation
```
   WITH monthly_stats AS (
     SELECT 
       true_client,
       SUBSTRING(monthly_id, 1, 6) as month,
       COUNT(CASE WHEN candidate_expert LIKE '%Expert%' THEN 1 END) as iv_count,
       COUNT(CASE WHEN channel LIKE '%DBExpert%' THEN 1 END) as dbiv_count,
       -- ... other aggregations
     FROM "MasterNew2024"
     GROUP BY true_client, SUBSTRING(monthly_id, 1, 6)
   )
```
### Monthly Aggregation with Dynamic Loading
```
   CREATE OR REPLACE FUNCTION get_client_monthly_stats(
     p_client_codes text[],
     p_month text
   ) RETURNS TABLE (
     client_code text,
     iv_count bigint,
     dbiv_count bigint,
     cdd_count bigint,
     dbcdd_count bigint,
     revenue numeric,
     net_revenue numeric,
     pjt_count bigint,
     cr_count bigint
   )
```

## Recommended Approach: hybrid of both

### Initial Load:
```
interface ClientCombineStats {
  client_code: string;
  current_month: {
    iv: number;
    dbiv: number;
    cdd: number;
    dbcdd: number;
    revenue: number;
    net_revenue: number;
    pjt: number;
    cr: number;
  };
  ytd_totals: {
    iv: number;
    dbiv: number;
    cdd: number;
    dbcdd: number;
    revenue: number;
    net_revenue: number;
    pjt: number;
    cr: number;
  };
}
```
### Implementation Strategy:
- Load operational clients with pagination (like current implementation)
- For each page, fetch aggregated stats for displayed clients
- Implement lazy loading for historical data
- Cache results client-side

Proposed SQL
```
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
  RETURN QUERY
  WITH master_stats_by_month AS (
    SELECT 
      true_client,
      SUBSTRING(monthly_id, 1, 6) AS month,
      COUNT(CASE WHEN candidate_expert LIKE '%Expert%' THEN 1 END) as iv_count,
      COUNT(CASE WHEN channel LIKE '%DBExpert%' THEN 1 END) as dbiv_count,
      COUNT(CASE WHEN candidate_expert = 'Candidate' THEN 1 END) as cdd_count,
      COUNT(CASE WHEN channel LIKE '%DBCDD%' THEN 1 END) as dbcdd_count,
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
  ytd_totals AS (
    SELECT 
      true_client AS client_code,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN 1 ELSE 0 END) as iv_count,
      SUM(CASE WHEN channel LIKE '%DBExpert%' THEN 1 ELSE 0 END) as dbiv_count,
      SUM(CASE WHEN candidate_expert = 'Candidate' THEN 1 ELSE 0 END) as cdd_count,
      SUM(CASE WHEN channel LIKE '%DBCDD%' THEN 1 ELSE 0 END) as dbcdd_count,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN usd_actual_client_fee ELSE 0 END) as revenue,
      SUM(CASE WHEN candidate_expert LIKE '%Expert%' THEN usd_actual_net_revenue ELSE 0 END) as net_revenue,
      SUM(CASE WHEN status = '1. On going' THEN 1 ELSE 0 END) as pjt_count,
      SUM(CASE WHEN status = '1. On going' THEN required_nr_of_calls ELSE 0 END) as cr_count
    FROM "MasterNew2024" ms
    LEFT JOIN "PJT" ps ON ms.true_client = ps.client
    WHERE ms.true_client = ANY(p_client_codes)
    AND ms.monthly_id LIKE p_year || '%'
    GROUP BY true_client
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
          'revenue', COALESCE(am.revenue, 0),
          'net_revenue', COALESCE(am.net_revenue, 0),
          'pjt', COALESCE(am.pjt_count, 0),
          'cr', COALESCE(am.cr_count, 0)
        )
      )
    ) AS monthly_data,
    JSONB_BUILD_OBJECT(
      'year', p_year,
      'stats', JSONB_BUILD_OBJECT(
        'iv', SUM(COALESCE(yt.iv_count, 0)),
        'dbiv', SUM(COALESCE(yt.dbiv_count, 0)),
        'cdd', SUM(COALESCE(yt.cdd_count, 0)),
        'dbcdd', SUM(COALESCE(yt.dbcdd_count, 0)),
        'revenue', SUM(COALESCE(yt.revenue, 0)),
        'net_revenue', SUM(COALESCE(yt.net_revenue, 0)),
        'pjt', SUM(COALESCE(yt.pjt_count, 0)),
        'cr', SUM(COALESCE(yt.cr_count, 0))
      )
    ) AS ytd_totals
  FROM aggregated_monthly am
  LEFT JOIN ytd_totals yt ON am.client_code = yt.client_code
  GROUP BY am.client_code, yt.client_code;
END;
$$ LANGUAGE plpgsql;
```

[
  {
    "client_code": "L.E.K. SGP",
    "monthly_data": [
      {
        "month": "202401",
        "stats": {
          "cr": 0,
          "iv": 4,
          "cdd": 51,
          "pjt": 0,
          "dbiv": 2,
          "dbcdd": 0,
          "revenue": 2600,
          "net_revenue": 1700
        }
      },
      {
        "month": "202402",
        "stats": {
          "cr": 0,
          "iv": 6,
          "cdd": 21,
          "pjt": 0,
          "dbiv": 1,
          "dbcdd": 0,
          "revenue": 3420,
          "net_revenue": 2120
        }
      },
      {
        "month": "202403",
        "stats": {
          "cr": 0,
          "iv": 4,
          "cdd": 21,
          "pjt": 0,
          "dbiv": 0,
          "dbcdd": 0,
          "revenue": 1880,
          "net_revenue": 1055
        }
      },
      {
        "month": "202404",
        "stats": {
          "cr": 0,
          "iv": 2,
          "cdd": 14,
          "pjt": 0,
          "dbiv": 1,
          "dbcdd": 0,
          "revenue": 600,
          "net_revenue": 425
        }
      },
      {
        "month": "202405",
        "stats": {
          "cr": 0,
          "iv": 0,
          "cdd": 1,
          "pjt": 0,
          "dbiv": 0,
          "dbcdd": 0,
          "revenue": 0,
          "net_revenue": 0
        }
      },
      {
        "month": "202406",
        "stats": {
          "cr": 0,
          "iv": 4,
          "cdd": 15,
          "pjt": 0,
          "dbiv": 1,
          "dbcdd": 0,
          "revenue": 2812.5,
          "net_revenue": 2143.87777379699
        }
      },
      {
        "month": "202407",
        "stats": {
          "cr": 0,
          "iv": 0,
          "cdd": 15,
          "pjt": 0,
          "dbiv": 0,
          "dbcdd": 0,
          "revenue": 0,
          "net_revenue": 0
        }
      },
      {
        "month": "202408",
        "stats": {
          "cr": 0,
          "iv": 3,
          "cdd": 10,
          "pjt": 0,
          "dbiv": 2,
          "dbcdd": 0,
          "revenue": 400,
          "net_revenue": -96.6108658715879
        }
      },
      {
        "month": "202409",
        "stats": {
          "cr": 9,
          "iv": 0,
          "cdd": 16,
          "pjt": 1,
          "dbiv": 0,
          "dbcdd": 0,
          "revenue": 0,
          "net_revenue": 0
        }
      },
      {
        "month": "202410",
        "stats": {
          "cr": 58,
          "iv": 32,
          "cdd": 44,
          "pjt": 2,
          "dbiv": 17,
          "dbcdd": 0,
          "revenue": 19389.25,
          "net_revenue": 10665.8276747856
        }
      },
      {
        "month": "202411",
        "stats": {
          "cr": 14,
          "iv": 30,
          "cdd": 20,
          "pjt": 3,
          "dbiv": 14,
          "dbcdd": 0,
          "revenue": 15810,
          "net_revenue": 8799.49385979735
        }
      }
    ],
    "ytd_totals": {
      "year": "2024",
      "stats": {
        "cr": 281556,
        "iv": 43945,
        "cdd": 117876,
        "pjt": 20856,
        "dbiv": 19646,
        "dbcdd": 0,
        "revenue": 24253374.75,
        "net_revenue": 13862108.224777
      }
    }
  }
]