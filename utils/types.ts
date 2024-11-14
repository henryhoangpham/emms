export enum AuthState {
  Signin = 'signin',
  ForgotPassword = 'forgot_password',
  Signup = 'signup',
  UpdatePassword = 'update_password'
}

export type StateInfo = {
  title: string;
  description?: string;
  submitText: string;
  onSubmit: () => void;
  hasEmailField: boolean;
  hasPasswordField: boolean;
  hasOAuth: boolean;
};

export type Employee = {
  id: string;
  company_email: string;
  personal_email: string;
  given_name: string;
  surname?: string;
  citizenship?: string;
  tax_residence?: string;
  location?: string;
  mobile_number?: string;
  home_address?: string;
  birth_date?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export type Client = {
  id: string;
  name: string;
  client_code: string;
  address?: string;
  postal_code?: string;
  country_code_iso_2: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export type Project = {
  id: string;
  code: string;
  name: string;
  client_id: string;
  currency: string;
  contract_owner: string;
  start_date: string;
  end_date?: string;
  deal_status: string;
  billable: boolean;
  engagement_manager_email: string;
  note?: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
}

export type UserTenant = {
  id: string;
  user_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
}

export type Department = {
  id: string;
  name: string;
  parent_department_id?: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
  parent_department?: Department;
  child_departments?: Department[];
}

export type Knowledge = {
  id: string;
  title: string;
  description?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
}

export type EmployeeKnowledge = {
  employee_id: string;
  knowledge_id: string;
  acquired_at: string;
}