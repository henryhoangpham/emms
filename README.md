# Next.js Supabase Resource Management System

A comprehensive resource management system built with Next.js and Supabase, featuring employee allocation tracking, project management, and skill tracking.

## Features

### Core Functionality
- 🔐 Authentication with Supabase
- 👥 Multi-tenant support
- 🌓 Light/Dark mode
- 📱 Responsive design

### Resource Management
1. **Employee Management**
   - Basic employee information
   - Department assignments
   - Knowledge/Skills tracking
   - Active/Inactive status

2. **Department Management**
   - Hierarchical department structure
   - Department-specific knowledge requirements
   - Employee assignments

3. **Client Management**
   - Client information tracking
   - Client code management
   - Address and location tracking

4. **Project Management**
   - Project details and status
   - Client association
   - Required knowledge/skills
   - Project timeline tracking

5. **Knowledge/Skills Management**
   - Skill definition and tracking
   - Employee skill assignments
   - Project skill requirements

6. **Resource Allocation**
   - Employee project assignments
   - Allocation percentage tracking
   - Multiple view options:
     - List view with pagination
     - Calendar view with daily allocations
     - Heatmap view for workload visualization
   - Workload monitoring and overallocation detection

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Context
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── account/           # Account management
│   ├── employees/         # Employee management
│   ├── departments/       # Department management
│   ├── clients/          # Client management
│   ├── projects/         # Project management
│   └── allocations/      # Resource allocation
├── components/
│   ├── landing/          # Landing page components
│   ├── layout/           # Layout components
│   ├── misc/             # Feature-specific components
│   └── ui/               # Reusable UI components
├── utils/
│   ├── supabase/         # Supabase utilities
│   └── types.ts          # TypeScript definitions
└── public/               # Static assets
```

## Getting Started

1. **Prerequisites**
   - Node.js 18+ installed
   - Supabase account
   - Git

2. **Clone and Setup**
   ```bash
   git clone https://github.com/henryfmcom/nextjs.git
   cd nextjs
   npm install
   ```

3. **Supabase Setup**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Database Setup**
   - Go to Supabase SQL Editor
   - Copy contents of `schema.sql`
   - Run the SQL to create all tables
   - Initial tables:
     - Tenants
     - UserTenants
     - Employees
     - Departments
     - EmployeeDepartments
     - Clients
     - Projects
     - Knowledges
     - EmployeeKnowledges
     - ProjectKnowledges
     - Allocations

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Default Login**
   - Email: admin@test.com
   - Password: Aa123456@

## Database Schema

### Key Tables
1. **Tenants**: Multi-tenant support
   - id, name, subdomain, plan

2. **Employees**: Employee information
   - id, name, email, department, skills

3. **Departments**: Organizational structure
   - id, name, parent_department_id

4. **Projects**: Project tracking
   - id, name, client, status, timeline

5. **Allocations**: Resource assignments
   - id, employee_id, project_id, percentage

6. **Knowledges**: Skills tracking
   - id, title, description

See `schema.sql` for complete database structure.

## Environment Variables

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```


## License

This project is licensed under the MIT License.
