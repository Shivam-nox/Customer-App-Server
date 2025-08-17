# Zapygo - Doorstep Diesel Delivery Platform

## Overview

Zapygo is a comprehensive doorstep diesel delivery platform designed for businesses in India. The application provides a complete fuel ordering and delivery ecosystem, featuring real-time order tracking, secure payment processing, KYC verification, and an integrated mobile-first Progressive Web Application (PWA). The platform connects businesses with fuel suppliers through a streamlined digital interface, eliminating the need for traditional fuel procurement methods.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built using **React 18** with **TypeScript** and follows a mobile-first design approach. The architecture leverages:

- **Vite** as the build tool for fast development and optimized production builds
- **React Router (Wouter)** for lightweight client-side routing with a page-based structure
- **Tailwind CSS** with **shadcn/ui** components for consistent, responsive design
- **TanStack Query** for efficient server state management and API caching
- **React Hook Form** with **Zod validation** for type-safe form handling
- **Progressive Web App (PWA)** capabilities with service worker for offline functionality

The frontend follows a modular component structure with reusable UI components, custom hooks, and centralized state management for authentication and user data.

### Backend Architecture
The server implements a **REST API** using **Express.js** with TypeScript in an ESM (ES Modules) environment. Key architectural decisions include:

- **Layered architecture** with separate concerns for routing, business logic, and data access
- **Storage abstraction layer** (IStorage interface) providing a clean API for database operations
- **Authentication middleware** using header-based user identification
- **Express middleware** for request logging, JSON parsing, and error handling
- **Development/production environment detection** with conditional Vite integration

### Database Design
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations. The schema includes:

- **Users table** with role-based access (customer, driver, admin), KYC status tracking, and business information
- **Orders table** with comprehensive order lifecycle management, pricing calculations, and delivery scheduling
- **Payments table** supporting multiple payment methods (UPI, cards, netbanking, wallet)
- **Deliveries table** for real-time tracking with GPS coordinates and proof of delivery
- **Notifications table** for user communication and order updates
- **OTP verification table** for secure authentication flows

The database uses **Neon serverless PostgreSQL** with connection pooling for scalability and performance.

### Authentication System
The platform implements a **username/password authentication** system with secure user registration:

- **User registration** with username, email, and password (minimum 6 characters)
- **Password hashing** using bcryptjs for secure storage
- **Session management** using localStorage for user persistence
- **Role-based access control** with customer, driver, and admin roles
- **KYC verification workflow** with document upload and approval status tracking
- **Business information** capture during registration (optional)

### File Storage and Management
The application integrates **Google Cloud Storage** for document and file management:

- **Object-based ACL (Access Control List)** system for fine-grained permission control
- **Secure file upload** with presigned URLs for direct-to-cloud uploads
- **Multiple file type support** for KYC documents (GST certificates, PAN cards, business licenses)
- **Replit sidecar integration** for seamless cloud storage authentication in development

### Payment Processing
The payment system supports multiple Indian payment methods:

- **UPI integration** for instant payments
- **Card payments** with secure tokenization
- **Net banking** support for major Indian banks
- **Digital wallet** integration
- **Invoice generation** with PDF creation using jsPDF library

### Real-time Features
The platform includes several real-time capabilities:

- **Order tracking** with live GPS coordinates
- **Push notifications** via service worker
- **Real-time delivery updates** with driver location tracking
- **Live order status updates** throughout the delivery lifecycle

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Google Cloud Storage**: Object storage for file uploads and document management
- **Replit Environment**: Development and deployment platform with integrated services

### Payment Integration
- **Multiple Payment Gateways**: Support for UPI, cards, netbanking, and wallet payments
- **Indian Payment Standards**: Compliance with local payment regulations and methods

### Frontend Libraries
- **Radix UI**: Accessible, unstyled UI primitives for building the design system
- **Uppy**: Advanced file uploader with dashboard, progress tracking, and cloud integration
- **Lucide React**: Comprehensive icon library for consistent visual elements
- **date-fns**: Date manipulation and formatting utilities

### Development Tools
- **TypeScript**: Type safety across the entire application stack
- **ESLint/Prettier**: Code quality and formatting standards
- **Vite Plugins**: Development enhancements including error overlay and cartographer integration