export function formatPJTForClipboard(pjt: any): string {
  return `PJT Code: ${pjt.pjt_code}
Status: ${pjt.status}

Project Topic:
${pjt.project_topic}

Project Brief:
${pjt.project_brief}

Research Priorities:
${pjt.research_priorities}

Client: ${pjt.client}
Contract Type: ${pjt.contract_type}

Client PIC:
${pjt.client_pic_name}
${pjt.client_pic_email}

Inquiry Date: ${pjt.inquiry_date ? new Date(pjt.inquiry_date).toLocaleDateString() : '-'}
Proposal Date: ${pjt.proposal_date ? new Date(pjt.proposal_date).toLocaleDateString() : '-'}

Required Number of Calls: ${pjt.required_nr_of_calls}`;
}

export function formatExpertForClipboard(expert: any): string {
  const careers = expert.careers.map((career: any) => 
    `${career.job_from} ~ ${career.job_to}
${career.company}
${career.title}`
  ).join('\n\n');

  return `Name: ${expert.name}
Email: ${expert.email}

Career History:
${careers}

Experience:
${expert.experience}

Description:
${expert.description}`;
} 