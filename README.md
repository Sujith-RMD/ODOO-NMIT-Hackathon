# Dayflow HRMS 🌊

Dayflow is a modern, comprehensive Human Resource Management System (HRMS) designed to streamline employee management, attendance tracking, leave requests, and payroll processing. Built with a sleek interface and powerful backend, Dayflow simplifies HR operations for both administrators and employees.

## 🚀 Features

### For Administrators
* **Employee Management**: Seamlessly add, update, and organize employee records, track departments, positions, and managers.
* **Time Off & Leave Approval**: Review and manage employee leave requests with a simple approve/reject workflow.
* **Attendance Oversight**: Monitor check-ins, check-outs, work hours, and overtime across the organization.
* **Salary Structures**: Configure flexible salary components, track monthly wages, and calculate automated payroll deductions/earnings.
* **Live Analytics Dashboard**: (In Progress) Get a bird's-eye view of organizational health, pending tasks, and recent activities.

### For Employees
* **Self-Service Portal**: View personal information, manager details, and company policies.
* **Time Tracking**: Clock in and clock out daily, and review personal attendance history.
* **Leave Requests**: Easily request paid time off (PTO) or sick leave, track approval status, and monitor remaining leave balances.
* **Salary Slips**: Review monthly salary components, deductions, and total net pay.

## 🛠️ Technology Stack

**Frontend (React/Vite)**
* React 18
* TypeScript
* Vite
* Tailwind CSS
* Radix UI / Lucide Icons
* Zustand (State Management)
* React Hook Form + Zod (Validation)

**Backend (FastAPI)**
* Python 3
* FastAPI
* SQLAlchemy (ORM)
* SQLite (Database)
* PyJWT & Passlib (Authentication)

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Sujith-RMD/ODOO-NMIT-Hackathon.git
cd ODOO-NMIT-Hackathon
```

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Initialize the database with seed data:
```bash
python seed.py
```

Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Access the Application
The frontend will be available at `http://localhost:5173`. 
The backend API and Swagger documentation will be available at `http://localhost:8000/docs`.

### 🔑 Default Login Credentials
Once the database is seeded, you can log in using the following test accounts:

**Admin Account**
* **Login ID:** `OIADHR20240001`
* **Password:** `admin123`

**Employee Account**
* **Login ID:** `OIJODO20240001`
* **Password:** `emp12345`

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
*Built for the NMIT Hackathon.*