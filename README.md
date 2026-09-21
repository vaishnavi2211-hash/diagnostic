# AI-Based Medical Diagnostic Platform

A full-stack healthcare platform designed to connect patients and laboratory staff through a unified digital workflow. The application provides patient diagnostic tracking, laboratory-side patient information access, AI-powered functionality, real-time communication, and supporting healthcare utilities.

## Features

- Patient and laboratory staff workflows
- Mobile-number-based patient authentication
- Diagnostic order and status tracking
- Laboratory-side access to patient information
- AI-powered functionality using Google Gemini API
- Real-time communication using Socket.io
- Search functionality
- Google Maps integration
- Voice-assistant functionality
- WhatsApp communication support
- Responsive web interface

## Tech Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL

### APIs & Communication
- Google Gemini API
- Socket.io
- Google Maps integration
- WhatsApp integration

## System Overview

The platform provides separate workflows for patients and laboratory staff.

### Patient Workflow

1. Patient accesses the platform using their mobile number.
2. Patient can view diagnostic order and status information.
3. Search and supporting healthcare utilities are available within the platform.
4. Patients can use integrated communication and location-based features.

### Laboratory Workflow

1. Laboratory staff access the laboratory-side interface.
2. Relevant patient information can be viewed through the application.
3. Diagnostic workflow information can be managed through the platform.

##  AI Integration

The application integrates the **Google Gemini API** to provide AI-powered functionality within the healthcare workflow.

The AI component is integrated into the web application through the backend/API architecture.

##  Real-Time Communication

**Socket.io** is used to support real-time communication between application components, enabling information to be exchanged without requiring continuous manual page refreshes.

## 🗄️ Backend & Database

The backend is developed using **Node.js and Express.js**, with **PostgreSQL** used for application data management.

The backend handles application requests, API communication, and interaction with the database.

##  Additional Integrations

The platform includes:

- Google Maps for location-related functionality
- Voice-assistant capabilities
- Search functionality
- WhatsApp communication support
- Add to cart
- book your oppointment
- directly reach to the doctor

## 📂 Project Architecture

```text
Frontend (React.js)
        |
        v
Backend API (Node.js + Express.js)
        |
   +----+----+
   |         |
   v         v
PostgreSQL  External APIs
             |
       +-----+-----+
       |     |     |
    Gemini Maps WhatsApp
       |
    Socket.io
