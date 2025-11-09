# NBA OBE Portal

A comprehensive web application for educational institutions to manage, track, and calculate learning outcomes in accordance with the National Board of Accreditation (NBA) guidelines.

## Features

### 🔐 Authentication & Authorization
- Role-based access control (Admin, University, Department Head, Program Coordinator, Teacher)
- Secure login with JWT tokens
- College-specific access control

### 🏫 Academic Structure Management
- **Admin Only**: Create and manage colleges, programs, and batches
- **Department Head**: Manage student sections
- Hierarchical organization structure

### 👥 User Management
- **Admin**: Create and manage all user accounts
- **Department Head**: Assign Program Coordinators and Teachers
- Role-specific permissions and access levels

### 📚 Course Management
- **Program Coordinators**: Create and manage courses
- Define Course Outcomes (COs) and Program Outcomes (POs)
- CO-PO mapping matrix
- Faculty assignment to courses

### 📝 Assessment & Grading
- Create assessments for specific course sections
- Question management with CO mapping
- Student marks upload and management
- Internal and External assessment types

### 📊 Reporting & Analytics
- Course Attainment Summary reports
- Assessment Comparison reports
- Program Outcome attainment analysis
- PDF report generation

### 🎯 Attainment Calculation Engine
- Automated CO attainment calculation
- Program-level PO attainment aggregation
- Target-based performance evaluation
- Multi-level attainment thresholds

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Accounts

The following demo accounts are available (password: `password` for all):

- **Admin**: `admin` - Full system access
- **University**: `university` - Read-only access to all data
- **Department Head**: `dept_head` - Manage department and faculty
- **Program Coordinator (CSE)**: `pc_cse` - Manage CSE program
- **Program Coordinator (ECE)**: `pc_ece` - Manage ECE program
- **Teacher**: `teacher1` - Manage assigned courses

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin-only pages
│   ├── courses/           # Course management
│   ├── assessments/       # Assessment management
│   ├── reports/           # Reports and analytics
│   └── dashboard/         # Main dashboard
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts
├── lib/                  # Utility functions
└── hooks/                # Custom React hooks
```

## User Roles & Permissions

### Administrator (ADMIN)
- Full system access
- Manage colleges, programs, batches
- Create and manage all user accounts
- System-wide configuration

### University (UNIVERSITY)
- Read-only access to all data
- View reports across all colleges
- No modification permissions

### Department Head (DEPARTMENT)
- Manage student sections
- Assign Program Coordinators and Teachers
- View department-level reports

### Program Coordinator (PC)
- Manage program courses and outcomes
- Define COs and POs
- Create CO-PO mappings
- Assign teachers to courses

### Teacher (TEACHER)
- Manage assigned courses
- Create assessments and questions
- Upload student marks
- View course-specific reports

## Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users & Authentication**: User accounts with role-based permissions
- **Academic Structure**: Colleges, Departments, Programs, Batches, Sections
- **Course Management**: Courses, Course Outcomes, Program Outcomes
- **Assessment System**: Assessments, Questions, Marks
- **Student Management**: Students, Enrollments, Sections

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Academic Structure
- `GET /api/colleges` - List colleges
- `POST /api/colleges` - Create college
- `GET /api/programs` - List programs
- `POST /api/programs` - Create program
- `GET /api/batches` - List batches
- `POST /api/batches` - Create batch

### User Management
- `GET /api/users` - List users
- `POST /api/users` - Create user

### Course Management
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team."# glm-prd-zai" 
