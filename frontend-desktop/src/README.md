# Project Structure

This project follows a scalable, role-based structure designed for clean separation of concerns.

## `src/` Folder Structure

### 📂 **assets/**
- Stores static assets like images, fonts, and global styles.

### 📂 **components/**
- **`common/`**: Business-agnostic reusable components (e.g., Header, Footer, Sidebar).
- **`ui/`**: Atomic UI components (e.g., Button, Input, Modal, Card).

### 📂 **constants/**
- **`roles.js`**: Defines user roles and permissions.
- **`routes.js`**: Centralized route paths to prevent hardcoding strings.

### 📂 **context/**
- **`AuthContext.js`**: Manages authentication state.
- **`RoleContext.js`**: Handles role-based access control logic.

### 📂 **hooks/**
- Custom React hooks (e.g., `useAuth`, `useRole`, `useFetch`).

### 📂 **layouts/**
- **`MainLayout.jsx`**: Layout for authenticated users (Sidebar + Header + Content).
- **`AuthLayout.jsx`**: Layout for public pages like Login/Register.
- **`DashboardLayout.jsx`**: Role-specific dashboard layouts if needed.

### 📂 **pages/**
- **`public/`**: Accessible to everyone (Login, 404, Unauthorized).
- **`super-admin/`**: Pages exclusive to Super Admin.
- **`admin/`**: Pages specific to Admin role.
- **`manager/`**: Pages for Managers.
- **`team-lead/`**: Pages for Team Leads.

### 📂 **routes/**
- **`AppRouter.jsx`**: Main router configuration.
- **`ProtectedRoutes.jsx`**: Higher-Order Component (HOC) or wrapper to handle RBAC.
- **`PublicRoutes.jsx`**: Routes accessible without authentication.

### 📂 **services/**
- API integration layer (e.g., `api.js`, `authService.js`, `userService.js`).

### 📂 **utils/**
- Helper functions and utilities (e.g., `formatDate`, `validateEmail`, `localStorageHelper`).
