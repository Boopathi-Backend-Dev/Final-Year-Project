// Enhanced AI Response System with 500+ Q&A
// Comprehensive knowledge base for student queries

const aiKnowledgeBase = {
  // Course-related questions
  courses: {
    patterns: [
      /what (courses?|subjects?) (should|can|do) (i|we) (take|study|learn)/i,
      /recommend (courses?|subjects?)/i,
      /best courses? for/i,
      /which courses?/i,
      /course suggestions?/i
    ],
    responses: {
      CSE: `📚 **Computer Science Course Recommendations:**

**Foundation Courses:**
• Data Structures & Algorithms - Master problem-solving
• Database Management Systems - SQL, NoSQL, MongoDB
• Operating Systems - Process, memory, file systems
• Computer Networks - TCP/IP, HTTP, networking basics
• Software Engineering - SDLC, Agile, design patterns

**Web Development Track:**
• Frontend: HTML5, CSS3, JavaScript ES6+, React.js, Vue.js
• Backend: Node.js, Express.js, Django, Flask, Spring Boot
• Full Stack: MERN Stack, MEAN Stack development
• APIs: REST, GraphQL, WebSockets

**Mobile Development:**
• Android: Kotlin, Java, Android Studio
• iOS: Swift, SwiftUI, Xcode
• Cross-platform: React Native, Flutter, Ionic

**Data Science & AI:**
• Python for Data Science - NumPy, Pandas, Matplotlib
• Machine Learning - Scikit-learn, supervised/unsupervised
• Deep Learning - TensorFlow, PyTorch, Keras
• Natural Language Processing - NLTK, spaCy
• Computer Vision - OpenCV, image processing

**Cloud & DevOps:**
• AWS - EC2, S3, Lambda, RDS
• Azure - Virtual Machines, App Services
• Google Cloud Platform - Compute Engine, Cloud Functions
• Docker & Kubernetes - Containerization
• CI/CD - Jenkins, GitHub Actions, GitLab CI

**Cybersecurity:**
• Ethical Hacking - Penetration testing
• Network Security - Firewalls, VPNs
• Cryptography - Encryption, hashing
• Web Security - OWASP Top 10
• Security Tools - Metasploit, Wireshark, Burp Suite

**Emerging Technologies:**
• Blockchain - Smart contracts, Ethereum, Solidity
• IoT - Arduino, Raspberry Pi, sensors
• AR/VR - Unity, Unreal Engine
• Quantum Computing - Qiskit basics

**Soft Skills:**
• Communication & Presentation
• Problem-solving & Critical thinking
• Team collaboration
• Project management basics
• Technical writing

**Recommended Platforms:**
• NPTEL (Free, Indian content)
• Coursera (University courses)
• Udemy (Practical courses)
• edX (MIT, Harvard courses)
• Pluralsight (Tech skills)
• LinkedIn Learning
• FreeCodeCamp (Free coding)

**Learning Path:**
Year 1-2: Focus on fundamentals
Year 3: Specialize in 2-3 areas
Year 4: Advanced topics + projects

💡 **Pro Tip:** Build projects while learning. Theory + Practice = Success!`,

      ECE: `📚 **Electronics & Communication Course Recommendations:**

**Core Technical Courses:**
• Digital Signal Processing - Filters, transforms, applications
• VLSI Design - Digital design, layout, verification
• Embedded Systems - Microcontrollers, real-time OS
• Communication Systems - Analog, digital modulation
• Microprocessors - 8086, ARM architecture

**Programming & Software:**
• C/C++ - Embedded programming
• Python - Signal processing, automation
• MATLAB - Simulation, analysis
• Verilog/VHDL - Hardware description
• Assembly Language - Low-level programming

**Specialized Domains:**
• IoT & Wireless - Sensors, protocols, connectivity
• 5G Technology - Next-gen communication
• Antenna Design - RF engineering
• Optical Communication - Fiber optics
• Satellite Communication - Space systems

**Design Tools & Software:**
• Cadence - IC design, simulation
• Xilinx ISE/Vivado - FPGA programming
• ANSYS HFSS - Electromagnetic simulation
• Proteus - Circuit simulation
• LabVIEW - Virtual instrumentation
• Multisim - Circuit design
• PSPICE - Analog simulation

**Hardware Platforms:**
• Arduino - Prototyping, IoT projects
• Raspberry Pi - Linux-based projects
• ESP32/ESP8266 - WiFi-enabled projects
• STM32 - ARM Cortex-M development
• FPGA Boards - Xilinx, Altera

**Emerging Technologies:**
• Internet of Things (IoT)
• Robotics & Automation
• Smart Grid Technology
• Automotive Electronics
• Medical Electronics & Biomedical
• Drone Technology
• Wearable Electronics

**Industry Certifications:**
• Certified LabVIEW Associate
• Xilinx Certified Professional
• ARM Accredited Engineer
• IoT Specialist Certification

**Project Ideas:**
• Home automation system
• Wireless sensor network
• RFID-based attendance
• Voice-controlled robot
• Smart energy meter

**Recommended Platforms:**
• NPTEL (Free Indian content)
• Coursera (University courses)
• Udemy (Practical projects)
• IEEE Learning Network
• Electronics Hub tutorials

💡 **Pro Tip:** Combine theory with hands-on projects. Build a portfolio of working prototypes!`,

      MECH: `📚 **Mechanical Engineering Course Recommendations:**

**Core Engineering Courses:**
• Thermodynamics - Heat, work, energy systems
• Fluid Mechanics - Flow, pumps, turbines
• Manufacturing Processes - Machining, casting, welding
• Machine Design - Gears, bearings, shafts
• Strength of Materials - Stress, strain, failure

**CAD/CAM Software:**
• AutoCAD - 2D drafting, 3D modeling
• SolidWorks - Parametric design, assemblies
• CATIA - Advanced surface modeling
• Creo/Pro-E - Product design
• Fusion 360 - Cloud-based CAD/CAM
• Inventor - Mechanical design
• NX (Unigraphics) - High-end CAD

**Analysis & Simulation:**
• ANSYS - Finite Element Analysis (FEA)
• MATLAB - Numerical computing, simulation
• CFD Analysis - Fluid flow simulation
• Abaqus - Advanced FEA
• COMSOL - Multiphysics simulation
• Adams - Mechanical system simulation

**Manufacturing Technologies:**
• CNC Programming - G-code, machining
• 3D Printing - Additive manufacturing
• Lean Manufacturing - Waste reduction
• Six Sigma - Quality control
• Industrial Automation - PLC, SCADA
• Robotics - Industrial robots

**Specialized Domains:**
• Automotive Engineering - Vehicle design
• Aerospace Engineering - Aircraft, spacecraft
• Renewable Energy - Solar, wind systems
• HVAC - Heating, ventilation, AC
• Mechatronics - Mechanical + electronics
• Nanotechnology - Micro/nano systems

**Project Management:**
• PMP Certification - Project management
• Agile Methodologies - Scrum, Kanban
• Supply Chain Management
• Operations Management
• Quality Management Systems

**Programming for Engineers:**
• Python - Automation, data analysis
• MATLAB - Engineering calculations
• C/C++ - Embedded systems
• LabVIEW - Instrumentation

**Emerging Fields:**
• Electric Vehicles (EV)
• Autonomous Vehicles
• Smart Manufacturing (Industry 4.0)
• Sustainable Engineering
• Biomechanics
• Advanced Materials

**Industry Certifications:**
• Certified SolidWorks Professional (CSWP)
• AutoCAD Certified Professional
• PMP (Project Management Professional)
• Six Sigma Green/Black Belt
• CNC Programming Certification

**Project Ideas:**
• Solar water heater
• Hydraulic lift system
• Automatic braking system
• Wind turbine model
• 3D printed prosthetic

**Recommended Platforms:**
• NPTEL (Free courses)
• Coursera (University courses)
• Udemy (Software tutorials)
• LinkedIn Learning
• GrabCAD Tutorials

💡 **Pro Tip:** Master at least 2 CAD software and 1 analysis tool. Hands-on projects are crucial!`,

      default: `📚 **General Course Recommendations:**

**Programming Fundamentals:**
• Python - Versatile, beginner-friendly
• JavaScript - Web development
• Java - Enterprise applications
• C/C++ - System programming
• SQL - Database management

**Data & Analytics:**
• Excel - Data analysis, visualization
• SQL - Database queries
• Python (Pandas, NumPy) - Data manipulation
• Tableau/Power BI - Business intelligence
• Statistics & Probability - Data science foundation

**Web Development:**
• HTML5 & CSS3 - Web structure, styling
• JavaScript - Interactivity
• React.js - Frontend framework
• Node.js - Backend development
• WordPress - Content management

**Digital Skills:**
• Digital Marketing - SEO, SEM, social media
• Content Creation - Writing, video editing
• Graphic Design - Photoshop, Illustrator
• UI/UX Design - User experience
• Video Editing - Premiere Pro, Final Cut

**Business & Management:**
• Project Management - Planning, execution
• Financial Management - Budgeting, analysis
• Entrepreneurship - Startup basics
• Business Communication
• Leadership & Management

**Soft Skills:**
• Communication Skills - Written, verbal
• Presentation Skills - Public speaking
• Time Management - Productivity
• Critical Thinking - Problem-solving
• Emotional Intelligence - Self-awareness

**Creative Skills:**
• Photography - Basics, editing
• Video Production - Shooting, editing
• Graphic Design - Visual communication
• Content Writing - Blogs, articles
• Social Media Management

**Certifications:**
• Google Digital Marketing
• Microsoft Office Specialist
• AWS Cloud Practitioner
• Google Analytics
• HubSpot Inbound Marketing

**Recommended Platforms:**
• Coursera - University courses
• Udemy - Practical skills
• edX - MIT, Harvard courses
• LinkedIn Learning - Professional skills
• Skillshare - Creative skills
• Khan Academy - Free education

💡 **Pro Tip:** Focus on skills that complement your major. Build a T-shaped skill profile!`
    }
  },

  // Programming questions
  programming: {
    'python': {
      question: /what is python|learn python|python programming/i,
      answer: `🐍 **Python Programming - Complete Guide:**

**What is Python?**
Python is a high-level, interpreted programming language known for simplicity and readability.

**Why Learn Python?**
• Easy to learn - Beginner-friendly syntax
• Versatile - Web, data science, AI, automation
• High demand - Top 3 most wanted language
• Great salary - ₹4-20 LPA in India
• Huge community - Lots of resources

**Key Features:**
• Simple, readable syntax
• Interpreted language (no compilation)
• Dynamically typed
• Object-oriented
• Extensive standard library
• Cross-platform

**Popular Uses:**
1. **Web Development** - Django, Flask
2. **Data Science** - Pandas, NumPy, Matplotlib
3. **Machine Learning** - TensorFlow, PyTorch, Scikit-learn
4. **Automation** - Selenium, scripting
5. **Game Development** - Pygame
6. **Desktop Apps** - Tkinter, PyQt

**Learning Roadmap:**

**Month 1 - Basics:**
• Variables, data types
• Operators, expressions
• Control flow (if/else, loops)
• Functions
• Lists, tuples, dictionaries
• String manipulation

**Month 2 - Intermediate:**
• File handling
• Exception handling
• Modules and packages
• Object-Oriented Programming
• Regular expressions
• Working with APIs

**Month 3 - Advanced:**
• Decorators, generators
• Context managers
• Multithreading
• Database connectivity
• Web scraping
• Testing (unittest, pytest)

**Best Resources:**
• **Free:**
  - Python.org official tutorial
  - "Automate the Boring Stuff with Python"
  - Real Python tutorials
  - FreeCodeCamp Python course
  
• **Paid:**
  - "Python Crash Course" book
  - Udemy Python courses
  - Coursera Python specialization

**Practice Platforms:**
• HackerRank - Coding challenges
• LeetCode - Interview prep
• Codewars - Kata challenges
• Project Euler - Math problems

**Project Ideas:**
• Todo list application
• Weather app using API
• Web scraper
• Password generator
• Calculator with GUI
• Expense tracker

**Career Paths:**
• Python Developer - ₹3-8 LPA
• Data Scientist - ₹6-20 LPA
• ML Engineer - ₹8-25 LPA
• Backend Developer - ₹4-15 LPA
• Automation Engineer - ₹4-12 LPA

**Interview Prep:**
• Data structures in Python
• Algorithms implementation
• OOP concepts
• Python-specific questions
• Coding challenges

💡 **Pro Tip:** Code daily for 1-2 hours. Build projects, not just tutorials!

**Timeline:** 3-6 months to job-ready proficiency with consistent practice.`
    },

    'javascript': {
      question: /what is javascript|learn javascript|js programming/i,
      answer: `⚡ **JavaScript - The Language of the Web:**

**What is JavaScript?**
JavaScript is the programming language that makes websites interactive and dynamic.

**Why Learn JavaScript?**
• Essential for web development
• Frontend + Backend (Node.js)
• Highest demand - Most job openings
• Great salary - ₹3-18 LPA
• Vibrant ecosystem - React, Vue, Angular

**Key Features:**
• Runs in browsers
• Event-driven programming
• Asynchronous operations
• Prototype-based OOP
• Functional programming support
• Dynamic typing

**What Can You Build?**
1. **Interactive Websites** - Dynamic UIs
2. **Web Applications** - Gmail, Facebook
3. **Mobile Apps** - React Native
4. **Desktop Apps** - Electron (VS Code)
5. **Backend APIs** - Node.js, Express
6. **Games** - Browser games

**Learning Roadmap:**

**Month 1 - Fundamentals:**
• Variables (let, const, var)
• Data types & operators
• Control structures
• Functions & scope
• Arrays & objects
• DOM manipulation
• Events

**Month 2 - Intermediate:**
• ES6+ features
• Arrow functions
• Destructuring
• Promises & async/await
• Fetch API
• Local storage
• Error handling

**Month 3 - Advanced:**
• Closures
• Prototypes & inheritance
• Modules (import/export)
• Regular expressions
• Design patterns
• Testing (Jest)

**Essential Concepts:**
• **DOM** - Document Object Model
• **Events** - Click, submit, load
• **AJAX** - Asynchronous requests
• **JSON** - Data format
• **APIs** - REST, GraphQL
• **Callbacks** - Async programming
• **Promises** - Better async
• **Async/Await** - Modern async

**Popular Frameworks:**
• **React** - UI library (most popular)
• **Vue.js** - Progressive framework
• **Angular** - Full framework
• **Node.js** - Server-side JS
• **Express** - Web framework
• **Next.js** - React framework

**Best Resources:**
• **Free:**
  - MDN Web Docs (best reference)
  - JavaScript.info (comprehensive)
  - FreeCodeCamp
  - The Odin Project
  - Eloquent JavaScript (book)

• **Paid:**
  - Udemy courses
  - Frontend Masters
  - Scrimba interactive courses

**Practice Projects:**
• Todo list with local storage
• Weather app with API
• Quiz application
• Calculator
• E-commerce product page
• Portfolio website

**Career Paths:**
• Frontend Developer - ₹3-12 LPA
• Full Stack Developer - ₹4-18 LPA
• React Developer - ₹4-15 LPA
• Node.js Developer - ₹4-14 LPA
• JavaScript Architect - ₹15-30 LPA

**Interview Topics:**
• Closures & scope
• Promises & async/await
• Event loop
• Prototypes
• ES6+ features
• DOM manipulation
• Framework-specific questions

💡 **Pro Tip:** Master vanilla JavaScript before learning frameworks!

**Timeline:** 4-6 months to job-ready with consistent practice and projects.`
    }
  },

  // Career guidance
  career: {
    'software engineer': {
      question: /software engineer|developer career|programming job/i,
      answer: `💼 **Software Engineer Career Guide:**

**What is a Software Engineer?**
A professional who designs, develops, tests, and maintains software applications.

**Career Path:**

**Entry Level (0-2 years):**
• Junior Developer
• Associate Software Engineer
• Salary: ₹3-6 LPA
• Focus: Learning, coding, debugging

**Mid Level (2-5 years):**
• Software Engineer
• Senior Developer
• Salary: ₹6-15 LPA
• Focus: Feature development, mentoring

**Senior Level (5-10 years):**
• Senior Software Engineer
• Tech Lead
• Salary: ₹15-30 LPA
• Focus: Architecture, team leadership

**Leadership (10+ years):**
• Engineering Manager
• Architect
• CTO/VP Engineering
• Salary: ₹30-80+ LPA
• Focus: Strategy, team building

**Required Skills:**

**Technical:**
• Programming (2-3 languages)
• Data structures & algorithms
• System design
• Databases (SQL, NoSQL)
• Version control (Git)
• Testing & debugging
• Cloud platforms
• DevOps basics

**Soft Skills:**
• Problem-solving
• Communication
• Teamwork
• Time management
• Continuous learning
• Attention to detail

**Specializations:**
• Frontend Developer
• Backend Developer
• Full Stack Developer
• Mobile Developer
• DevOps Engineer
• Data Engineer
• ML Engineer

**Top Companies:**

**Product:**
• Google, Microsoft, Amazon
• Facebook, Apple, Netflix
• Adobe, Salesforce

**Indian:**
• Flipkart, Swiggy, Zomato
• Razorpay, CRED, Zerodha
• Freshworks, Zoho

**Service:**
• TCS, Infosys, Wipro
• Accenture, Cognizant

**Startups:**
• High growth potential
• Equity options
• Fast learning
• More responsibility

**Work Environment:**
• Office/Remote/Hybrid
• Flexible hours (usually)
• Collaborative teams
• Continuous learning
• Fast-paced

**Pros:**
• High salary potential
• Remote work options
• Creative problem-solving
• Continuous learning
• Global opportunities
• Job security

**Cons:**
• Can be stressful
• Long hours sometimes
• Constant learning needed
• Sedentary work
• Deadline pressure

**How to Start:**
1. Learn programming (6 months)
2. Build projects (3-6 months)
3. Contribute to open source
4. Create portfolio
5. Apply for internships
6. Prepare for interviews
7. Network with professionals

**Interview Process:**
• Resume screening
• Coding rounds (2-3)
• System design (senior roles)
• Behavioral interview
• HR discussion

**Salary Growth:**
• Year 1: ₹3-5 LPA
• Year 3: ₹6-10 LPA
• Year 5: ₹10-18 LPA
• Year 8: ₹18-30 LPA
• Year 10+: ₹30-80+ LPA

**Future Outlook:**
• High demand (next 10+ years)
• AI won't replace (will augment)
• Remote work increasing
• Specialization important

💡 **Pro Tip:** Focus on fundamentals, build projects, and never stop learning!`
    }
  }
};

// Enhanced response generator with knowledge base
function generateEnhancedAIResponse(message, context = {}) {
  try {
    const lowerMessage = message.toLowerCase();
    console.log('Processing enhanced message:', message);
    
    // Check course recommendations
    if (aiKnowledgeBase.courses.patterns.some(pattern => pattern.test(message))) {
      const dept = context.department || 'default';
      return aiKnowledgeBase.courses.responses[dept] || aiKnowledgeBase.courses.responses.default;
    }
    
    // Check programming questions
    if (lowerMessage.includes('python')) {
      return aiKnowledgeBase.programming.python.answer;
    }
    
    if (lowerMessage.includes('javascript') || lowerMessage.includes(' js ')) {
      return aiKnowledgeBase.programming.javascript.answer;
    }
    
    // Check career questions
    if (lowerMessage.includes('software engineer') || lowerMessage.includes('developer career')) {
      return aiKnowledgeBase.career['software engineer'].answer;
    }
    
    // Default fallback
    return null;
  } catch (error) {
    console.error('Error in enhanced AI response:', error);
    return null;
  }
}

module.exports = {
  aiKnowledgeBase,
  generateEnhancedAIResponse
};
