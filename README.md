# 🏥 MediCare 2.0 — AI Powered Digital Healthcare Assistant

> Smart Health Management System powered by AI, Voice Assistance, and Modern Web Technologies.

---

## 📌 Overview

MediCare 2.0 is a full-stack AI-powered healthcare web application designed to simplify everyday health management.
The platform helps users manage medicines, appointments, fitness activities, and health guidance in one place.

The main goal of this project is to make healthcare support more accessible, organized, and user-friendly using modern technologies like AI, voice interaction, and smart reminders.

---

## 🚀 Features

### 💊 Medicine Reminder System

* Add medicines with details
* Set reminder time and frequency
* Smart notifications and voice alerts
* Background reminder support

### 🩺 Symptom Checker

* Enter or select symptoms
* Get basic health suggestions
* Early awareness support

### 📅 Appointment Booking

* Select doctor category
* Choose city and time
* Manage appointments easily

### 🏃 Fitness Tracking

* Step counter
* Water intake monitoring
* BMI calculator
* Weekly fitness insights

### 🤖 AI Assistant (Gemini AI)

* Chat-based AI assistant
* Smart health-related responses
* Context-aware suggestions

### 🎙️ Voice Support

* Voice commands
* Voice navigation
* Text-to-Speech support
* Multi-language interaction

### 🌍 Multi-language Support

* English
* Hindi
* Gujarati

### 🔔 Smart Notifications

* Real-time reminders
* Background alerts
* Sound and vibration support

---

# 🛠️ Tech Stack

## Frontend

* HTML
* CSS
* JavaScript

## Backend

* Node.js
* Express.js

## Database

* JSON-based local storage

## Authentication

* JWT (JSON Web Tokens)
* bcryptjs

## AI Integration

* Google Gemini API
* gemini-2.5-flash

## Voice System

* Web Speech API
* Speech Recognition
* Text-to-Speech

## Notifications

* Service Worker
* Browser Notification API
* PWA Support

---

# 🧠 System Architecture

MediCare 2.0 follows a layered architecture:

1. **Presentation Layer**
   Handles UI and user interactions.

2. **Application Layer**
   Processes business logic and APIs.

3. **Data Layer**
   Stores and retrieves application data.

4. **AI Layer**
   Handles Gemini AI responses and intelligence.

---

# 📂 Project Structure

```bash
MediCare-2.0/
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── middleware/
│   ├── database/
│   └── .env
│
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/medicare-2.0.git
```

---

## 2️⃣ Open Project

```bash
cd medicare-2.0
```

---

## 3️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 4️⃣ Create `.env` File

```env
PORT=5000
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 5️⃣ Start Backend Server

```bash
npm start
```

Server runs on:

```bash
http://localhost:5000
```

---

## 6️⃣ Run Frontend

Open `index.html` using:

* VS Code Live Server
  OR
* Any browser

---

# 🔐 Authentication Flow

1. User registers/logs in
2. JWT token is generated
3. Token stored in localStorage
4. Protected routes verify token
5. Authorized access granted

---

# 🤖 AI Integration

MediCare 2.0 uses **Google Gemini AI** to:

* Answer health-related queries
* Provide smart suggestions
* Support conversational interaction

---

# 📸 Screenshots

## 🔐 Login Page

<img src="https://github.com/Jigar-Chaudhary-137/MediCare/blob/main/screenshots/Screenshot%202026-04-11%20212030.png?raw=true" width="100%"/>

## 🏠 Home Page

<img src="https://github.com/Jigar-Chaudhary-137/MediCare/blob/main/screenshots/Screenshot%202026-04-11%20212317.png?raw=true" width="100%"/>

---

## 🤖 AI Assistant

<img src="https://github.com/Jigar-Chaudhary-137/MediCare/blob/main/screenshots/Screenshot%202026-04-11%20213537.png?raw=true" width="100%"/>

---

## 🩺 Symptom Checker

<img src="https://github.com/Jigar-Chaudhary-137/MediCare/blob/main/screenshots/Screenshot%202026-04-11%20212745.png?raw=true" width="100%"/>

---

## 💊 Medicine Reminder

<img src="https://github.com/Jigar-Chaudhary-137/MediCare/blob/main/screenshots/Screenshot%202026-04-11%20212623.png?raw=true" width="100%"/>

---

## 📅 Appontment Booking

<img src="https://github.com/Jigar-Chaudhary-137/MediCare/blob/main/screenshots/Screenshot%202026-04-11%20213041.png?raw=true" width="100%"/>
<img src="https://github.com/Jigar-Chaudhary-137/MediCare/blob/main/screenshots/Screenshot%202026-04-11%20213119.png?raw=true" width="100%"/>

---


## 🏃 Fitness

<img src="https://github.com/Jigar-Chaudhary-137/MediCare/blob/main/screenshots/Screenshot%202026-04-11%20213332.png?raw=true" width="100%"/>
<img src="https://github.com/Jigar-Chaudhary-137/MediCare/blob/main/screenshots/Screenshot%202026-04-11%20213449.png?raw=true" width="100%"/>


---


# ⚠️ Limitations

* Not a replacement for doctors
* AI responses are general
* Requires internet for full functionality
* Uses local JSON storage

---

# 🚀 Future Enhancements

* Cloud database integration
* Mobile application
* Video consultation support
* Wearable device integration
* Advanced AI recommendations

---

# 👨‍💻 Team Members

* **Jigar Chaudhary**
* **Jitaan Rathod**
* **Ved Patel**

---

# 📚 Learning Outcomes

Through this project, we learned:

* Full-stack web development
* REST API development
* JWT authentication
* AI integration using Gemini API
* Voice interaction systems
* PWA and notification handling
* UI/UX design principles

---

# 🌟 Conclusion

MediCare 2.0 demonstrates how AI, voice technology, and modern web development can be combined to build a smart and practical healthcare solution for real-world use.

---

# 📌 License

This project is developed for educational and learning purposes.

---

# 🔗 Connect

## GitHub

https://github.com/Jigar-Chaudhary-137/MediCare

## Live Demo

https://medicare-2-0.onrender.com

---

⭐ If you like this project, consider giving it a star on GitHub!
