import { SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

export const getUser = async (supabase: SupabaseClient) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
};

export async function getEmployees(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Employees')
    .select(`
      *,
      departments:EmployeeDepartments(
        department:Departments(*)
      )
    `, { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('surname', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: employees, error, count } = await query;

  if (error) {
    console.error('Error fetching employees:', error);
    return { employees: null, count: 0 };
  }

  return { employees, count };
}

export async function getEmployee(supabase: SupabaseClient, id: string) {
  const { data: employee, error } = await supabase
    .from('Employees')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching employee:', error);
    return null;
  }

  return employee;
}

export async function addEmployee(supabase: SupabaseClient, employeeData: any) {
  const { data, error } = await supabase
    .from('Employees')
    .insert([{
      ...employeeData,
      is_deleted: false
    }])
    .select();

  if (error) {
    console.error('Error adding employee:', error);
    throw error;
  }

  return data;
}

export async function updateEmployee(supabase: SupabaseClient, employeeData: any) {
  const { data, error } = await supabase
    .from('Employees')
    .update([{
      ...employeeData,
      updated_at: new Date().toISOString()
    }])
    .eq('id', employeeData.id)
    .select();

  if (error) {
    console.error('Error updating employee:', error);
    throw error;
  }

  return data;
}

export async function getClients(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Clients')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: clients, error, count } = await query;

  if (error) {
    console.error('Error fetching clients:', error);
    return { clients: null, count: 0 };
  }

  return { clients, count };
}

export async function getClient(supabase: SupabaseClient, id: string) {
  const { data: client, error } = await supabase
    .from('Clients')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }

  return client;
}

export async function addClient(supabase: SupabaseClient, clientData: any) {
  const { data, error } = await supabase
    .from('Clients')
    .insert([clientData])
    .select();

  if (error) {
    console.error('Error adding client:', error);
    throw error;
  }

  return data;
}

export async function updateClient(supabase: SupabaseClient, clientData: any) {
  const { data, error } = await supabase
    .from('Clients')
    .update([clientData])
    .eq('id', clientData.id)
    .select();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  return data;
}

export async function getProjects(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Projects')
    .select('*, Clients(name)', { count: 'exact' })
    // .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: projects, error, count } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    return { projects: null, count: 0 };
  }

  const projectsWithClientName = projects?.map((project) => ({ 
    ...project,
    client_name: project.Clients ? project.Clients.name : 'Unknown Client',
  }));

  return { projects: projectsWithClientName, count };
}

export async function getProject(supabase: SupabaseClient, id: string) {
  const { data: project, error } = await supabase
    .from('Projects')
    .select('*')
    .eq('id', id)
    // .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }

  return project;
}
    
export async function addProject(supabase: SupabaseClient, projectData: any) {
  const { data, error } = await supabase
    .from('Projects')
    .insert([projectData])
    .select();

  if (error) {
    console.error('Error adding project:', error);
    throw error;
  }

  return data;
}

export async function updateProject(supabase: SupabaseClient, projectData: any) {
  const { data, error } = await supabase
    .from('Projects')
    .update([projectData])
    .eq('id', projectData.id)
    .select();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data;
}

// Add a new function specifically for searching clients
export async function searchClients(
  supabase: SupabaseClient,
  searchTerm: string
) {
  const { data: clients, error } = await supabase
    .from('Clients')
    .select('*')
    .eq('is_deleted', false)
    .ilike('name', `%${searchTerm}%`)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error searching clients:', error);
    return null;
  }

  return clients;
}

export async function getAllocations(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Allocations')
    .select(`
      *,
      Employees(given_name, surname),
      Projects(name, code)
    `, { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('start_date', { ascending: false });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: allocations, error, count } = await query;

  if (error) {
    console.error('Error fetching allocations:', error);
    return { allocations: null, count: 0 };
  }

  const formattedAllocations = allocations?.map(allocation => ({
    ...allocation,
    employee_name: `${allocation.Employees.given_name} ${allocation.Employees.surname}`,
    project_name: `${allocation.Projects.code} - ${allocation.Projects.name}`
  }));

  return { allocations: formattedAllocations, count };
}

export async function getAllocation(supabase: SupabaseClient, id: string) {
  // First, get the basic allocation data
  const { data: allocation, error: allocationError } = await supabase
    .from('Allocations')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (allocationError) {
    console.error('Error fetching allocation:', allocationError);
    return null;
  }

  // Then get the employee and project details separately
  const { data: employee } = await supabase
    .from('Employees')
    .select('given_name, surname')
    .eq('id', allocation.employee_id)
    .single();

  const { data: project } = await supabase
    .from('Projects')
    .select('name, code')
    .eq('id', allocation.project_id)
    .single();

  return {
    ...allocation,
    Employees: employee,
    Projects: project
  };
}

export async function addAllocation(supabase: SupabaseClient, allocationData: any) {
  const { data, error } = await supabase
    .from('Allocations')
    .insert([{
      ...allocationData,
      is_deleted: false
    }])
    .select();

  if (error) {
    console.error('Error adding allocation:', error);
    throw error;
  }

  return data;
}

export async function updateAllocation(supabase: SupabaseClient, allocationData: any) {
  // Remove nested objects before update
  const { Employees, Projects, employee_name, project_name, ...updateData } = allocationData;
  
  const { data, error } = await supabase
    .from('Allocations')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', updateData.id)
    .select();

  if (error) {
    console.error('Error updating allocation:', error);
    throw error;
  }

  return data;
}

export async function getUserTenants(supabase: SupabaseClient, userId: string) {
  const { data: userTenants, error } = await supabase
    .from('UserTenants')
    .select(`
      *,
      tenant:Tenants(*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user tenants:', error);
    return null;
  }

  return userTenants;
}

export async function getDepartments(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Departments')
    .select(`
      *,
      parent_department:parent_department_id(*)
    `, { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: departments, error, count } = await query;

  if (error) {
    console.error('Error fetching departments:', error);
    return { departments: null, count: 0 };
  }

  return { departments, count };
}

export async function getDepartment(supabase: SupabaseClient, id: string) {
  const { data: department, error } = await supabase
    .from('Departments')
    .select(`
      *,
      parent_department:parent_department_id(*)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching department:', error);
    return null;
  }

  return department;
}

export async function addDepartment(supabase: SupabaseClient, departmentData: any) {
  const { data, error } = await supabase
    .from('Departments')
    .insert([{
      ...departmentData,
      is_deleted: false
    }])
    .select();

  if (error) {
    console.error('Error adding department:', error);
    throw error;
  }

  return data;
}

export async function updateDepartment(supabase: SupabaseClient, departmentData: any) {
  const { id, parent_department, ...updateData } = departmentData;
  
  const { data, error } = await supabase
    .from('Departments')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating department:', error);
    throw error;
  }

  return data;
}

export async function addEmployeeDepartments(
  supabase: SupabaseClient, 
  employeeId: string, 
  departmentIds: string[]
) {
  const { error } = await supabase
    .from('EmployeeDepartments')
    .upsert(
      departmentIds.map(departmentId => ({
        employee_id: employeeId,
        department_id: departmentId,
        assigned_at: new Date().toISOString()
      }))
    );

  if (error) {
    console.error('Error adding employee departments:', error);
    throw error;
  }
}

export async function removeEmployeeDepartments(
  supabase: SupabaseClient, 
  employeeId: string
) {
  const { error } = await supabase
    .from('EmployeeDepartments')
    .delete()
    .eq('employee_id', employeeId);

  if (error) {
    console.error('Error removing employee departments:', error);
    throw error;
  }
}

export async function getKnowledges(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Knowledges')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('title', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: knowledges, error, count } = await query;

  if (error) {
    console.error('Error fetching knowledges:', error);
    return { knowledges: null, count: 0 };
  }

  return { knowledges, count };
}

export async function getKnowledge(supabase: SupabaseClient, id: string) {
  const { data: knowledge, error } = await supabase
    .from('Knowledges')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching knowledge:', error);
    return null;
  }

  return knowledge;
}

export async function addKnowledge(supabase: SupabaseClient, knowledgeData: any) {
  const { data, error } = await supabase
    .from('Knowledges')
    .insert([{
      ...knowledgeData,
      is_deleted: false
    }])
    .select();

  if (error) {
    console.error('Error adding knowledge:', error);
    throw error;
  }

  return data;
}

export async function updateKnowledge(supabase: SupabaseClient, knowledgeData: any) {
  const { id, ...updateData } = knowledgeData;
  
  const { data, error } = await supabase
    .from('Knowledges')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating knowledge:', error);
    throw error;
  }

  return data;
}

export async function getEmployeeKnowledge(
  supabase: SupabaseClient,
  employeeId: string
) {
  const { data, error } = await supabase
    .from('EmployeeKnowledges')
    .select(`
      *,
      knowledge:Knowledges(*)
    `)
    .eq('employee_id', employeeId);

  if (error) {
    console.error('Error fetching employee knowledges:', error);
    return null;
  }

  return data;
}

export async function addEmployeeKnowledge(
  supabase: SupabaseClient,
  employeeId: string,
  knowledgeIds: string[]
) {
  const { error } = await supabase
    .from('EmployeeKnowledges')
    .insert(
      knowledgeIds.map(knowledgeId => ({
        employee_id: employeeId,
        knowledge_id: knowledgeId,
        acquired_at: new Date().toISOString()
      }))
    );

  if (error) {
    console.error('Error adding employee knowledge:', error);
    throw error;
  }
}

export async function removeEmployeeKnowledge(
  supabase: SupabaseClient,
  employeeId: string,
) {
  const { error } = await supabase
    .from('EmployeeKnowledges')
    .delete()
    .eq('employee_id', employeeId);

  if (error) {
    console.error('Error removing employee knowledge:', error);
    throw error;
  }
}

export async function getProjectKnowledges(
  supabase: SupabaseClient,
  projectId: string
) {
  const { data, error } = await supabase
    .from('ProjectKnowledges')
    .select(`
      *,
      knowledge:Knowledges(*)
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching project knowledges:', error);
    return null;
  }

  return data;
}

export async function addProjectKnowledge(
  supabase: SupabaseClient,
  projectId: string,
  knowledgeIds: string[]
) {
  const { error } = await supabase
    .from('ProjectKnowledges')
    .insert(
      knowledgeIds.map(knowledgeId => ({
        project_id: projectId,
        knowledge_id: knowledgeId,
        assigned_at: new Date().toISOString()
      }))
    );

  if (error) {
    console.error('Error adding project knowledge:', error);
    throw error;
  }
}

export async function removeProjectKnowledge(
  supabase: SupabaseClient,
  projectId: string,
) {
  const { error } = await supabase
    .from('ProjectKnowledges')
    .delete()
    .eq('project_id', projectId);

  if (error) {
    console.error('Error removing project knowledge:', error);
    throw error;
  }
}

export async function getEmployeeSuggestions(
  supabase: SupabaseClient,
  tenantId: string,
  selectedKnowledges: string[]
) {
  if (!selectedKnowledges.length) return [];

  const { data: employees, error } = await supabase
    .from('Employees')
    .select(`
      id,
      given_name,
      surname,
      EmployeeKnowledges!inner (
        knowledge_id
      ),
      Allocations (
        allocation_percentage,
        start_date,
        end_date
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .in('EmployeeKnowledges.knowledge_id', selectedKnowledges);

  if (error) {
    console.error('Error fetching employee suggestions:', error);
    throw error;
  }

  return employees || [];
}

interface MasterData {
  id: string;
  exlink_expert_id: number;
  recruiter: string;
  date: string;
  candidate_expert: string;
  pjt: string;
  channel: string;
  name: string;
  period_of_enrollment: string;
  position: string;
  linkedin: string;
  proposed_currency: string;
  duration: number;
  item_id: string;
  currency_id: string;
  expert_billing_data: string;
  expert_billing_currency: string;
  monthly_id: string;
  total_count: number;
  actual_expert_fee: number;
  usd_actual_expert_fee: number;
  usd_actual_client_fee: number;
  usd_actual_net_revenue: number;
  true_client: string;
  status: string;
}

export async function getMasterData(
  supabase: SupabaseClient,
  page: number = 1,
  limit: number = 10,
  dateFrom?: string | null,
  dateTo?: string | null,
  candidateExperts?: string[] | null,
  searchString: string = ''
) {
  const offset = (page - 1) * limit;

  // Validate dates before sending to API
  const validDateFrom = dateFrom && dateFrom.trim() !== '' ? dateFrom : null;
  const validDateTo = dateTo && dateTo.trim() !== '' ? dateTo : null;

  const { data, error } = await supabase
    .rpc('search_masternew2024', {
      p_limit: limit,
      p_offset: offset,
      p_date_from: validDateFrom,
      p_date_to: validDateTo,
      p_candidate_expert: candidateExperts,
      p_search_string: searchString
    });

  if (error) throw error;

  return {
    masterData: data as MasterData[],
    count: data?.[0]?.total_count || 0
  };
}

interface PJTMasterData {
  id: number;
  pjt_code: string;
  project_topic: string;
  client: string;
  client_pic_name: string;
  client_pic_email: string;
  contract_type: string;
  inquiry_date: string;
  proposal_date: string;
  status: string;
  required_nr_of_calls: number;
  total_count: number;
}

export async function getPJTMasterData(
  supabase: SupabaseClient,
  page: number = 1,
  limit: number = 10,
  searchString: string = '',
  contractType: string = 'All',
  statuses: string[] = ['0.Proposal', '1. On going']
) {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .rpc('search_pjt_master', {
      p_limit: limit,
      p_offset: offset,
      p_search_string: searchString,
      p_contract_type: contractType,
      p_status: statuses
    });

  if (error) throw error;

  return {
    pjtData: data as PJTMasterData[],
    count: data?.[0]?.total_count || 0
  };
}

export interface OperationalClientData {
  id: number;
  client_code_name: string;
  company_name: string;
  contract_type: string;
  country_code: string;
  invoice_address: string;
  invoice_currency: string;
  invoice_entity: string;
  client_id: string;
  account_manager: string;
  client_facing: string;
  geo: string;
  am: string;
  pm: string;
  company_segment: string;
  existing_account_priority: number;
  total_count: number;
}

export async function getOperationalClients(
  supabase: SupabaseClient,
  page: number = 1,
  limit: number = 10,
  invoiceEntity: string = 'All',
  contractType: string = 'All',
  searchString: string = '',
  priorities: number[] = [],
  segments: string[] = []
) {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .rpc('search_operational_clients', {
      p_limit: limit,
      p_offset: offset,
      p_invoice_entity: invoiceEntity,
      p_contract_type: contractType,
      p_search_string: searchString,
      p_priorities: priorities.length > 0 ? priorities : null,
      p_segments: segments.length > 0 ? segments : null
    });

  if (error) throw error;

  return {
    operationalClients: data as OperationalClientData[],
    count: data?.[0]?.total_count || 0
  };
}

export interface ClientCombineStatsResponse {
  client_code: string;
  monthly_data: {
    month: string;
    stats: {
      iv: number;
      dbiv: number;
      cdd: number;
      dbcdd: number;
      revenue: number;
      net_revenue: number;
      pjt: number;
      cr: number;
      total_duration: number;
    };
  }[];
  ytd_totals: {
    year: string;
    stats: {
      iv: number;
      dbiv: number;
      cdd: number;
      dbcdd: number;
      revenue: number;
      net_revenue: number;
      pjt: number;
      cr: number;
      total_duration: number;
    };
  };
}

export async function getClientCombineStats(
  supabase: SupabaseClient,
  clientCodes: string[],
  year: string = new Date().getFullYear().toString()
) {
  const { data, error } = await supabase
    .rpc('get_client_combine_stats', {
      p_client_codes: clientCodes,
      p_year: year
    });

  if (error) throw error;

  return data as ClientCombineStatsResponse[];
}


export async function getClientCombineStats2023(
  supabase: SupabaseClient,
  clientCodes: string[],
  year: string = new Date().getFullYear().toString()
) {
  const { data, error } = await supabase
    .rpc('get_client_combine_stats_2023', {
      p_client_codes: clientCodes,
      p_year: year
    });

  if (error) throw error;

  return data as ClientCombineStatsResponse[];
}

export async function getClientCombineStatsUnified(
  supabase: SupabaseClient,
  clientCodes: string[],
  year: string = new Date().getFullYear().toString()
) {
  const { data, error } = await supabase
    .rpc('get_client_combine_stats_unified', {
      p_client_codes: clientCodes,
      p_year: year
    });

  if (error) throw error;

  return data as ClientCombineStatsResponse[];
}


export async function getMasterDataUnified(
  supabase: SupabaseClient,
  page: number = 1,
  limit: number = 10,
  dateFrom?: string | null,
  dateTo?: string | null,
  candidateExperts?: string[] | null,
  searchString: string = '',
  year: string = new Date().getFullYear().toString()
) {
  const offset = (page - 1) * limit;

  // Validate dates before sending to API
  const validDateFrom = dateFrom && dateFrom.trim() !== '' ? dateFrom : null;
  const validDateTo = dateTo && dateTo.trim() !== '' ? dateTo : null;

  const { data, error } = await supabase
    .rpc('search_masternew_unified', {
      p_limit: limit,
      p_offset: offset,
      p_date_from: validDateFrom,
      p_date_to: validDateTo,
      p_candidate_expert: candidateExperts,
      p_search_string: searchString,
      p_year: year
    });

  if (error) throw error;

  return {
    masterData: data as MasterData[],
    count: data?.[0]?.total_count || 0
  };
}

// KPI Report Interfaces
export interface CompanyKPIResponse {
  date: string;
  call_request_all: number;
  call_request_actual: number;
  // call_request_actual_accum: number;
  // call_request_achievement: number;
  candidate_actual: number;
  candidate_actual_from_db: number;
  // candidate_actual_accum: number;
  // candidate_achievement: number;
  expert_actual: number;
  // expert_actual_accum: number;
  // expert_achievement: number;
  revenue: number;
  // revenue_accum: number;
  // revenue_achievement: number;
  net_revenue: number;
  // net_revenue_accum: number;
  // net_revenue_achievement: number;
}

export interface MemberKPIResponse {
  member_name: string;
  department: string;
  target: number;
  actual: number;
  achievement_rate: number;
  ytd_target: number;
  ytd_actual: number;
  ytd_achievement_rate: number;
}

export interface RecMngtKPIResponse {
  recruiter: string;
  target_interviews: number;
  actual_interviews: number;
  achievement_rate: number;
  conversion_rate: number;
  ytd_target: number;
  ytd_actual: number;
  ytd_achievement_rate: number;
}

export interface AccountKPIResponse {
  account_manager: string;
  target_revenue: number;
  actual_revenue: number;
  achievement_rate: number;
  client_satisfaction: number;
  ytd_target: number;
  ytd_actual: number;
  ytd_achievement_rate: number;
}

// KPI Report Queries
export async function getCompanyKPI(
  supabase: SupabaseClient,
  yyyymm: string
): Promise<CompanyKPIResponse[]> {
  const { data, error } = await supabase
    .rpc('get_company_kpi', {
      p_yyyymm: yyyymm
    });

  if (error) throw error;
  return data;
}

export async function getMemberKPI(
  supabase: SupabaseClient,
  yyyymm: string
): Promise<MemberKPIResponse[]> {
  const { data, error } = await supabase
    .rpc('get_member_kpi', {
      p_yyyymm: yyyymm
    });

  if (error) throw error;
  return data;
}

export async function getRecMngtKPI(
  supabase: SupabaseClient,
  yyyymm: string
): Promise<RecMngtKPIResponse[]> {
  const { data, error } = await supabase
    .rpc('get_rec_mngt_kpi', {
      p_yyyymm: yyyymm
    });

  if (error) throw error;
  return data;
}

export async function getAccountKPI(
  supabase: SupabaseClient,
  yyyymm: string
): Promise<AccountKPIResponse[]> {
  const { data, error } = await supabase
    .rpc('get_account_kpi', {
      p_yyyymm: yyyymm
    });

  if (error) throw error;
  return data;
}

export interface TeamMember {
  email: string;
  nick: string;
  name: string;
  badge: boolean;
  region: 'Global' | 'JP';
  pm: string;
  resource_allocation: number;
}

export async function getTeamMembers(supabase: SupabaseClient, page: number, itemsPerPage: number) {
  const start = (page - 1) * itemsPerPage;
  
  const { data: members, error, count } = await supabase
    .from('TeamMembers')
    .select('*', { count: 'exact' })
    .range(start, start + itemsPerPage - 1)
    .order('email');

  if (error) throw error;
  
  return { members, count };
}

export async function getTeamMember(
  supabase: SupabaseClient,
  email: string
): Promise<TeamMember | null> {
  const { data, error } = await supabase
    .from('TeamMembers')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeamMember(
  supabase: SupabaseClient,
  email: string,
  updates: Partial<TeamMember>
): Promise<void> {
  const { error } = await supabase
    .from('TeamMembers')
    .update(updates)
    .eq('email', email);

  if (error) throw error;
}

export async function deleteTeamMember(
  supabase: SupabaseClient,
  email: string
): Promise<void> {
  const { error } = await supabase
    .from('TeamMembers')
    .delete()
    .eq('email', email);

  if (error) throw error;
}

export async function updateTeamMembers(supabase: SupabaseClient, updates: Partial<TeamMember>[]) {
  const { error } = await supabase
    .from('TeamMembers')
    .upsert(updates, { onConflict: 'email' });

  if (error) throw error;
}

interface ExpertData {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  linkedin_url: string;
  description: string;
  experience: string;
  rate: string;
  job_from: string;
  job_to: string;
  company: string;
  title: string;
  recruiter: string;
  total_count: number;
}

export async function getExpertsData(
  supabase: SupabaseClient,
  page: number = 1,
  limit: number = 10,
  searchString: string = ''
) {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .rpc('search_experts', {
      p_limit: limit,
      p_offset: offset,
      p_search_string: searchString
    });

  if (error) throw error;

  return {
    expertsData: data as ExpertData[],
    count: data?.[0]?.total_count || 0
  };
}

// Add interface for BIO history data
interface BIOHistoryData {
  user_email: string;
  llm_type: string;
  language: string;
  prompt: string;
  project_info: string;
  expert_info: string;
  sample_output: string;
  generated_bio: string;
}

// Add the new query function
export async function saveBIOHistory(
  supabase: any,
  bioData: BIOHistoryData
) {
  const { data, error } = await supabase
    .from('BIOHistory')
    .insert(bioData)
    .select();

  if (error) {
    throw error;
  }

  return { data };
}

interface BIOHistorySearchParams {
  page?: number;
  limit?: number;
  searchText?: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  userEmail?: string | '';
}

export async function searchBIOHistory(
  supabase: SupabaseClient,
  {
    page = 1,
    limit = 10,
    searchText = '',
    dateFrom = null,
    dateTo = null,
    userEmail = ''
  }: BIOHistorySearchParams
) {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .rpc('search_bio_history', {
      p_limit: limit,
      p_offset: offset,
      p_search_text: searchText,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_user_email: userEmail
    });

  if (error) throw error;

  return {
    histories: data,
    count: data?.[0]?.total_count || 0
  };
}

export interface PhoneRecording {
  id: string;
  caller_name: string;
  caller_number: string;
  callee_name: string;
  callee_number: string;
  duration: number;
  recording_type: string;
  date_time: string;
  end_time: string;
  direction: 'inbound' | 'outbound';
  download_url: string;
  access_token?: string;
  auto_delete_policy: string;
  owner: {
    name: string;
    extension_number: number;
  };
  site: {
    name: string;
  };
}

export interface ZoomPhoneRecordingsResponse {
  phone_recordings: PhoneRecording[];
  total_records: number;
  page_size: number;
  next_page_token: string;
}

export interface PhoneRecordingFilters {
  dateFrom?: Date;
  dateTo?: Date;
}

export async function getZoomPhoneRecordings(
  nextPageToken: string = '',
  pageSize: number = 30,
  filters?: PhoneRecordingFilters
): Promise<ZoomPhoneRecordingsResponse> {
  // Build query parameters
  const params = new URLSearchParams({
    next_page_token: nextPageToken,
    page_size: pageSize.toString()
  });

  // Add filters to query parameters with correct date format
  if (filters) {
    if (filters.dateFrom) {
      // Format: yyyy-MM-dd'T'HH:mm:ss'Z'
      params.append('from', format(filters.dateFrom, "yyyy-MM-dd'T'HH:mm:ss'Z'"));
    }
    if (filters.dateTo) {
      params.append('to', format(filters.dateTo, "yyyy-MM-dd'T'HH:mm:ss'Z'"));
    }
  }

  const response = await fetch(
    `/api/zoom/phone-recordings?${params.toString()}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch phone recordings');
  }

  const data = await response.json();
  
  // Add access token to each recording
  data.phone_recordings = data.phone_recordings.map((recording: PhoneRecording) => ({
    ...recording,
    access_token: data.access_token
  }));

  return data;
}

export interface KPIMemberData {
  email: string;
  nick: string;
  badge: boolean;
  region: string;
  pm: string;
  resource_allocation: number;
}

export async function getKPITeamMembers(
  supabase: SupabaseClient
): Promise<KPIMemberData[]> {
  const { data, error } = await supabase
    .from('TeamMembers')
    .select(`
      email,
      nick,
      badge,
      region,
      pm,
      resource_allocation
    `)
    .order('pm', { ascending: false })  // Order by PM first
    .order('nick');  // Then by nick name

  if (error) {
    console.error('Error fetching KPI team members:', error);
    throw error;
  }

  return data.filter((member: KPIMemberData) => member.pm !== '') || [];
}

export interface Prompt {
  id: number;
  name: string;
  prompt: string;
}

export async function getPrompts(supabase: SupabaseClient): Promise<Prompt[]> {
  const { data, error } = await supabase
    .from('Prompts')
    .select('*')
    .order('id');

  if (error) {
    console.error('Error fetching prompts:', error);
    throw error;
  }

  return data || [];
}

export interface ExampleOutput {
  id: number;
  name: string;
  output: string;
}

export async function getExampleOutputs(supabase: SupabaseClient): Promise<ExampleOutput[]> {
  const { data, error } = await supabase
    .from('Example_Outputs')
    .select('*')
    .order('id');

  if (error) {
    console.error('Error fetching example outputs:', error);
    throw error;
  }

  return data || [];
}