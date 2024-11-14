create table
  public."Tenants" (
    id uuid not null default gen_random_uuid (),
    name character varying(255) not null,
    subdomain character varying(100) not null,
    plan character varying(50) not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    is_active boolean not null default true,
    is_deleted boolean not null default false,
    constraint tenants_pkey primary key (id),
    constraint unique_subdomain unique (subdomain)
  ) tablespace pg_default;

create table
  public."UserTenants" (
    id uuid not null default gen_random_uuid (),
    user_id uuid not null,
    tenant_id uuid not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint usertenants_pkey primary key (id),
    constraint unique_user_tenant unique (user_id, tenant_id),
    constraint UserTenants_tenant_id_fkey foreign key (tenant_id) references "Tenants" (id) on delete cascade,
    constraint UserTenants_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

create table
  public."Employees" (
    id uuid not null default gen_random_uuid (),
    company_email character varying(200) not null,
    personal_email character varying(200) not null,
    given_name character varying(150) not null,
    surname character varying(100) null,
    citizenship character varying(2) null,
    tax_residence character varying(2) null,
    location character varying(2) null,
    mobile_number character varying(50) null,
    home_address character varying(250) null,
    birth_date date null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    is_active boolean not null default true,
    is_deleted boolean not null default false,
    tenant_id uuid not null,
    constraint employees_pkey primary key (id),
    constraint Employees_tenant_id_fkey foreign key (tenant_id) references "Tenants" (id) on delete cascade
  ) tablespace pg_default;

create index if not exists "Employees_tenant_id_idx" on public."Employees" using btree (tenant_id) tablespace pg_default;

create unique index if not exists idx_company_email on public."Employees" using btree (company_email) tablespace pg_default;

create table
  public."Clients" (
    id uuid not null default gen_random_uuid (),
    name character varying(255) not null,
    client_code character varying(8) not null,
    address character varying(255) null,
    postal_code character varying(8) null,
    country_code_iso_2 character varying(2) null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    is_active boolean not null default true,
    is_deleted boolean not null default false,
    tenant_id uuid null,
    constraint clients_pkey primary key (id),
    constraint Clients_tenant_id_fkey foreign key (tenant_id) references "Tenants" (id) on delete cascade
  ) tablespace pg_default;

create index if not exists "Clients_tenant_id_idx" on public."Clients" using btree (tenant_id) tablespace pg_default;

create unique index if not exists idx_client_code on public."Clients" using btree (client_code) tablespace pg_default;

create unique index if not exists idx_name_country_code on public."Clients" using btree (name, country_code_iso_2) tablespace pg_default;

create table
  public."Projects" (
    id uuid not null default gen_random_uuid (),
    code character varying(50) not null,
    client_id uuid not null,
    currency character varying(6) null,
    contract_owner character varying(50) not null,
    start_date date null,
    end_date date null,
    name character varying(255) not null,
    deal_status text not null,
    billable boolean not null default false,
    engagement_manager_email character varying(255) not null,
    note text null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    tenant_id uuid not null,
    constraint projects_pkey primary key (id),
    constraint Projects_tenant_id_fkey foreign key (tenant_id) references "Tenants" (id) on delete cascade,
    constraint client_fk foreign key (client_id) references "Clients" (id) on delete cascade
  ) tablespace pg_default;

create index if not exists "Projects_tenant_id_idx" on public."Projects" using btree (tenant_id) tablespace pg_default;

create unique index if not exists idx_code on public."Projects" using btree (code) tablespace pg_default;

create table
  public."Departments" (
    id uuid not null default gen_random_uuid (),
    name character varying(255) not null,
    parent_department_id uuid null,
    tenant_id uuid not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    is_active boolean not null default true,
    is_deleted boolean not null default false,
    constraint departments_pkey primary key (id),
    constraint unique_department_name_per_tenant unique (name, tenant_id),
    constraint departments_parent_department_id_fkey foreign key (parent_department_id) references "Departments" (id) on delete cascade,
    constraint departments_tenant_id_fkey foreign key (tenant_id) references "Tenants" (id) on delete cascade
  ) tablespace pg_default;

create index if not exists "Departments_tenant_id_idx" on public."Departments" using btree (tenant_id) tablespace pg_default;

create index if not exists "Departments_parent_department_id_idx" on public."Departments" using btree (parent_department_id) tablespace pg_default;

create table
  public."EmployeeDepartments" (
    employee_id uuid not null,
    department_id uuid not null,
    assigned_at timestamp with time zone not null default now(),
    constraint employee_departments_pkey primary key (employee_id, department_id),
    constraint employee_departments_department_id_fkey foreign key (department_id) references "Departments" (id) on delete cascade,
    constraint employee_departments_employee_id_fkey foreign key (employee_id) references "Employees" (id) on delete cascade
  ) tablespace pg_default;

create index if not exists "EmployeeDepartments_department_id_idx" on public."EmployeeDepartments" using btree (department_id) tablespace pg_default;

create index if not exists "EmployeeDepartments_employee_id_idx" on public."EmployeeDepartments" using btree (employee_id) tablespace pg_default;

create table
  public."Knowledges" (
    id uuid not null default gen_random_uuid (),
    title character varying(255) not null,
    description text null,
    tenant_id uuid not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    is_active boolean not null default true,
    is_deleted boolean not null default false,
    constraint knowledges_pkey primary key (id),
    constraint unique_knowledge_title_per_tenant unique (title, tenant_id),
    constraint knowledges_tenant_id_fkey foreign key (tenant_id) references "Tenants" (id) on delete cascade
  ) tablespace pg_default;

create index if not exists "Knowledges_tenant_id_idx" on public."Knowledges" using btree (tenant_id) tablespace pg_default;

create table
  public."EmployeeKnowledges" (
    employee_id uuid not null,
    knowledge_id uuid not null,
    acquired_at timestamp with time zone not null default now(),
    constraint employee_knowledges_pkey primary key (employee_id, knowledge_id),
    constraint employee_knowledges_employee_id_fkey foreign key (employee_id) references "Employees" (id) on delete cascade,
    constraint employee_knowledges_knowledge_id_fkey foreign key (knowledge_id) references "Knowledges" (id) on delete cascade
  ) tablespace pg_default;

create index if not exists "EmployeeKnowledges_employee_id_idx" on public."EmployeeKnowledges" using btree (employee_id) tablespace pg_default;

create index if not exists "EmployeeKnowledges_knowledge_id_idx" on public."EmployeeKnowledges" using btree (knowledge_id) tablespace pg_default;

create table
  public."ProjectKnowledges" (
    project_id uuid not null,
    knowledge_id uuid not null,
    assigned_at timestamp with time zone not null default now(),
    constraint project_knowledges_pkey primary key (project_id, knowledge_id),
    constraint project_knowledges_knowledge_id_fkey foreign key (knowledge_id) references "Knowledges" (id) on delete cascade,
    constraint project_knowledges_project_id_fkey foreign key (project_id) references "Projects" (id) on delete cascade
  ) tablespace pg_default;

create index if not exists "ProjectKnowledges_project_id_idx" on public."ProjectKnowledges" using btree (project_id) tablespace pg_default;

create index if not exists "ProjectKnowledges_knowledge_id_idx" on public."ProjectKnowledges" using btree (knowledge_id) tablespace pg_default;

create table
  public."Allocations" (
    id uuid not null default gen_random_uuid (),
    employee_id uuid not null,
    project_id uuid not null,
    start_date date not null,
    end_date date not null,
    allocation_percentage numeric(5, 2) not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    is_deleted boolean not null default false,
    tenant_id uuid not null,
    constraint allocations_pkey primary key (id),
    constraint Allocations_tenant_id_fkey foreign key (tenant_id) references "Tenants" (id) on delete cascade,
    constraint employee_fk foreign key (employee_id) references "Employees" (id) on delete cascade,
    constraint project_fk foreign key (project_id) references "Projects" (id) on delete cascade,
    constraint Allocations_allocation_percentage_check check (
      (
        (allocation_percentage > (0)::numeric)
        and (allocation_percentage <= (100)::numeric)
      )
    )
  ) tablespace pg_default;

create index if not exists "Allocations_tenant_id_idx" on public."Allocations" using btree (tenant_id) tablespace pg_default;

create index if not exists idx_employee_allocation on public."Allocations" using btree (employee_id, start_date, end_date) tablespace pg_default;

create index if not exists idx_project_allocation on public."Allocations" using btree (project_id, start_date, end_date) tablespace pg_default;
