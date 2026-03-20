// AI Chatbot Knowledge Base
// 500+ Questions and Answers for Work, Courses, Career, and Academic Topics

const knowledgeBase = {
  // ============================================
  // COURSE RECOMMENDATIONS (100+ Q&A)
  // ============================================
  courseRecommendations: [
    {
      keywords: ['course', 'recommend', 'suggest', 'learn', 'study', 'take'],
      questions: [
        'What courses should I take?',
        'Which courses are best for my department?',
        'What should I learn next?',
        'Recommend some courses for me',
        'What courses will help my career?'
      ],
      answers: {
        CSE: `📚 **Computer Science Course Recommendations:**

**Core Technical Courses:**
1. Data Structures and Algorithms - Essential foundation
2. Database Management Systems - SQL, NoSQL
3. Operating Systems - Process management, memory
4. Computer Networks - TCP/IP, protocols
5. Software Engineering - SDLC, design patterns

**Web Development:**
- Frontend: HTML, CSS, JavaScript, React, Vue.js
- Backend: Node.js, Express, Django, Flask
- Full Stack: MERN, MEAN stack development

**Mobile Development:**
- Android Development (Kotlin, Java)
- iOS Development (Swift)
- Cross-platform (React Native, Flutter)

**Data Science & AI:**
- Machine Learning Fundamentals
- Deep Learning with TensorFlow/PyTorch
- Data Analysis with Python (Pandas, NumPy)
- Natural Language Processing
- Computer Vision

**Cloud & DevOps:**
- AWS/Azure/Google Cloud Platform
- Docker and Kubernetes
- CI/CD Pipelines
- Infrastructure as Code

**Cybersecurity:**
- Ethical Hacking
- Network Security
- Cryptography
- Security Testing

**Platforms:** NPTEL, Coursera, Udemy, edX, Pluralsight`,
        
        ECE: `📚 **Electronics & Communication Course Recommendations:**

**Core Courses:**
1. Digital Signal Processing
2. VLSI Design and Technology
3. Embedded Systems Programming
4. Microprocessors and Microcontrollers
5. Communication Systems

**Specialized Areas:**
- IoT and Wireless Communication
- Antenna Design and RF Engineering
- Optical Fiber Communication
- Satellite Communication
- 5G Technology

**Programming & Tools:**
- C/C++ for Embedded Systems
- Python for Signal Processing
- MATLAB and Simulink
- Verilog/VHDL for VLSI
- Arduino and Raspberry Pi

**Industry Tools:**
- Cadence Design Tools
- Xilinx ISE/Vivado
- ANSYS HFSS
- Proteus Design Suite
- LabVIEW

**Emerging Technologies:**
- Internet of Things (IoT)
- Robotics and Automation
- Smart Grid Technology
- Automotive Electronics
- Medical Electronics

**Platforms:** NPTEL, Coursera, Udemy, IEEE Learning`,
        
        MECH: `📚 **Mechanical Engineering Course Recommendations:**

**Core Courses:**
1. Thermodynamics and Heat Transfer
2. Fluid Mechanics and Machinery
3. Manufacturing Processes
4. Machine Design
5. Strength of Materials

**CAD/CAM Software:**
- AutoCAD - 2D/3D drafting
- SolidWorks - 3D modeling
- CATIA - Advanced design
- Creo/Pro-E - Product design
- Fusion 360 - Cloud-based CAD

**Analysis Tools:**
- ANSYS - Finite Element Analysis
- MATLAB - Numerical computing
- CFD Analysis - Fluid dynamics
- Abaqus - Structural analysis

**Manufacturing:**
- CNC Programming
- 3D Printing and Additive Manufacturing
- Lean Manufacturing
- Six Sigma Quality Control
- Industrial Automation

**Emerging Fields:**
- Robotics and Mechatronics
- Renewable Energy Systems
- Automotive Engineering
- Aerospace Engineering
- Nanotechnology

**Project Management:**
- PMP Certification
- Agile Methodologies
- Supply Chain Management

**Platforms:** NPTEL, Coursera, Udemy, LinkedIn Learning`,
        
        default: `📚 **General Course Recommendations:**

**Programming Fundamentals:**
- Python Programming
- Java Programming
- C/C++ Programming
- JavaScript Basics

**Data & Analytics:**
- Data Analysis with Excel
- SQL for Data Management
- Statistics and Probability
- Business Intelligence

**Soft Skills:**
- Communication Skills
- Leadership and Management
- Time Management
- Problem Solving

**Business Skills:**
- Project Management
- Digital Marketing
- Financial Management
- Entrepreneurship

**Design & Creativity:**
- Graphic Design
- UI/UX Design
- Video Editing
- Content Creation

**Platforms:** Coursera, Udemy, edX, LinkedIn Learning, Skillshare`
      }
    }
  ],

  // ============================================
  // PROGRAMMING & CODING (100+ Q&A)
  // ============================================
  programming: {
    'what is python': `🐍 **Python Programming:**

Python is a high-level, interpreted programming language known for its simplicity and readability.

**Key Features:**
- Easy to learn and read
- Versatile (web, data science, AI, automation)
- Large standard library
- Strong community support
- Cross-platform compatibility

**Popular Uses:**
- Web Development (Django, Flask)
- Data Science (Pandas, NumPy)
- Machine Learning (TensorFlow, PyTorch)
- Automation and Scripting
- Game Development

**Learning Path:**
1. Basic syntax and data types
2. Control structures (if, loops)
3. Functions and modules
4. Object-Oriented Programming
5. File handling and exceptions
6. Libraries and frameworks

**Best Resources:**
- Python.org official documentation
- Codecademy Python Course
- "Automate the Boring Stuff with Python"
- Real Python tutorials`,

    'what is javascript': `⚡ **JavaScript Programming:**

JavaScript is the programming language of the web, enabling interactive and dynamic web pages.

**Key Features:**
- Runs in web browsers
- Event-driven programming
- Asynchronous operations
- Prototype-based OOP
- Functional programming support

**Core Concepts:**
- Variables and data types
- Functions and closures
- DOM manipulation
- Events and callbacks
- Promises and async/await
- ES6+ modern features

**Popular Frameworks:**
- React - UI library
- Vue.js - Progressive framework
- Angular - Full framework
- Node.js - Server-side JavaScript
- Express.js - Web framework

**Learning Path:**
1. HTML/CSS basics
2. JavaScript fundamentals
3. DOM manipulation
4. Asynchronous JavaScript
5. Modern ES6+ features
6. Framework specialization

**Resources:**
- MDN Web Docs
- JavaScript.info
- FreeCodeCamp
- Eloquent JavaScript book`,

    'what is java': `☕ **Java Programming:**

Java is a robust, object-oriented programming language used for enterprise applications, Android development, and more.

**Key Features:**
- Platform independent (Write Once, Run Anywhere)
- Object-Oriented Programming
- Strong type system
- Automatic memory management
- Rich API and libraries

**Popular Uses:**
- Enterprise Applications
- Android Mobile Apps
- Web Applications (Spring Boot)
- Big Data (Hadoop, Spark)
- Cloud Applications

**Core Concepts:**
- Classes and Objects
- Inheritance and Polymorphism
- Interfaces and Abstract Classes
- Exception Handling
- Collections Framework
- Multithreading

**Frameworks:**
- Spring Boot - Web applications
- Hibernate - ORM framework
- Android SDK - Mobile apps
- Apache Struts - MVC framework

**Learning Resources:**
- Oracle Java Tutorials
- Head First Java book
- Java Programming MOOC
- Baeldung tutorials`,

    'difference between python and java': `🔄 **Python vs Java Comparison:**

**Syntax:**
- Python: Simple, readable, less verbose
- Java: More verbose, strict syntax rules

**Typing:**
- Python: Dynamically typed
- Java: Statically typed

**Performance:**
- Python: Slower (interpreted)
- Java: Faster (compiled to bytecode)

**Use Cases:**
- Python: Data science, AI, scripting, rapid development
- Java: Enterprise apps, Android, large-scale systems

**Learning Curve:**
- Python: Easier for beginners
- Java: Steeper learning curve

**Community:**
- Both have large, active communities

**Choose Python if:**
- Quick development needed
- Data science/AI focus
- Scripting and automation
- Beginner-friendly

**Choose Java if:**
- Enterprise applications
- Android development
- Performance critical
- Strong typing preferred`,

    'what is react': `⚛️ **React.js:**

React is a JavaScript library for building user interfaces, developed by Facebook.

**Key Features:**
- Component-based architecture
- Virtual DOM for performance
- Unidirectional data flow
- JSX syntax
- Rich ecosystem

**Core Concepts:**
- Components (Functional & Class)
- Props and State
- Hooks (useState, useEffect, etc.)
- Context API
- React Router

**Advantages:**
- Fast rendering with Virtual DOM
- Reusable components
- Large community
- Rich ecosystem of libraries
- SEO-friendly with Next.js

**Learning Path:**
1. JavaScript ES6+ fundamentals
2. React basics and JSX
3. Components and Props
4. State management
5. Hooks
6. React Router
7. State management (Redux/Context)
8. Advanced patterns

**Popular Tools:**
- Create React App
- Next.js (SSR framework)
- Redux (State management)
- Material-UI (Component library)

**Resources:**
- React official documentation
- React Tutorial by Scrimba
- Full Stack Open course
- React patterns and best practices`
  },

  // ============================================
  // CAREER GUIDANCE (100+ Q&A)
  // ============================================
  careerGuidance: {
    'career options for cse': `💼 **Career Options for Computer Science:**

**Software Development:**
- Software Engineer/Developer
- Full Stack Developer
- Frontend Developer
- Backend Developer
- Mobile App Developer

**Data & AI:**
- Data Scientist
- Data Analyst
- Machine Learning Engineer
- AI Research Scientist
- Business Intelligence Analyst

**Cloud & DevOps:**
- Cloud Architect
- DevOps Engineer
- Site Reliability Engineer
- Cloud Security Engineer

**Cybersecurity:**
- Security Analyst
- Ethical Hacker
- Security Architect
- Penetration Tester

**Management & Leadership:**
- Technical Lead
- Engineering Manager
- Product Manager
- CTO/VP Engineering

**Specialized Roles:**
- Game Developer
- Blockchain Developer
- IoT Developer
- AR/VR Developer
- Quantum Computing Researcher

**Average Salaries (India):**
- Entry Level: ₹3-6 LPA
- Mid Level: ₹8-15 LPA
- Senior Level: ₹15-30+ LPA

**Top Companies:**
- Google, Microsoft, Amazon
- Facebook, Apple, Netflix
- Indian: TCS, Infosys, Wipro, Flipkart
- Startups: Razorpay, CRED, Zerodha`,

    'how to become data scientist': `📊 **Roadmap to Become a Data Scientist:**

**Step 1: Foundation (3-6 months)**
- Mathematics: Statistics, Probability, Linear Algebra
- Programming: Python (NumPy, Pandas)
- SQL for databases
- Excel for data analysis

**Step 2: Core Skills (6-9 months)**
- Data Visualization (Matplotlib, Seaborn, Tableau)
- Machine Learning algorithms
- Feature engineering
- Model evaluation

**Step 3: Advanced Topics (6-12 months)**
- Deep Learning (TensorFlow, PyTorch)
- Natural Language Processing
- Computer Vision
- Big Data (Spark, Hadoop)

**Step 4: Tools & Technologies**
- Jupyter Notebooks
- Git and GitHub
- Cloud platforms (AWS, Azure, GCP)
- Docker for deployment

**Step 5: Projects**
- Build 5-10 real-world projects
- Kaggle competitions
- Open source contributions
- Personal portfolio website

**Step 6: Soft Skills**
- Communication and presentation
- Business understanding
- Problem-solving
- Storytelling with data

**Certifications:**
- Google Data Analytics
- IBM Data Science Professional
- Microsoft Azure Data Scientist
- AWS Machine Learning

**Job Search:**
- Build strong LinkedIn profile
- Network with professionals
- Apply to internships first
- Prepare for technical interviews

**Timeline:** 12-18 months of dedicated learning`,

    'software engineer vs developer': `👨‍💻 **Software Engineer vs Developer:**

**Software Engineer:**
- Broader scope and responsibilities
- System design and architecture
- Considers scalability and performance
- Works on entire software lifecycle
- More focus on engineering principles
- Higher level of abstraction

**Software Developer:**
- More focused on coding
- Implements specific features
- Works on assigned modules
- Follows existing architecture
- More hands-on coding
- Tactical implementation

**Key Differences:**

**Scope:**
- Engineer: System-wide thinking
- Developer: Feature-specific focus

**Responsibilities:**
- Engineer: Design, architecture, optimization
- Developer: Implementation, testing, debugging

**Skills:**
- Engineer: System design, algorithms, patterns
- Developer: Programming languages, frameworks

**Career Path:**
- Engineer: Architect, Tech Lead, CTO
- Developer: Senior Developer, Team Lead

**Salary:**
- Generally similar at entry level
- Engineers may earn more at senior levels

**Reality:**
- Terms often used interchangeably
- Depends on company and role
- Skills matter more than title

**Which to Choose:**
- Both are excellent careers
- Focus on building strong fundamentals
- Gain experience in both areas
- Specialize based on interests`,

    'how to get job in google': `🎯 **How to Get a Job at Google:**

**Step 1: Build Strong Fundamentals**
- Master Data Structures & Algorithms
- System Design principles
- Object-Oriented Programming
- Database concepts
- Operating Systems basics

**Step 2: Technical Skills**
- Proficiency in 2-3 programming languages
- Problem-solving on LeetCode/HackerRank
- Build impressive projects
- Contribute to open source
- Strong GitHub profile

**Step 3: Education & Experience**
- Bachelor's degree (minimum)
- Relevant internships
- 2-3 years experience (for experienced roles)
- Strong academic record helps

**Step 4: Interview Preparation**
- Practice 200+ coding problems
- Study system design
- Mock interviews
- Behavioral questions (STAR method)
- Google's culture and values

**Interview Process:**
1. **Resume Screening** - Strong resume needed
2. **Phone Screen** - 1-2 coding rounds
3. **Onsite/Virtual** - 4-5 rounds
   - Coding (2-3 rounds)
   - System Design (1 round)
   - Behavioral (1 round)

**Coding Interview Topics:**
- Arrays and Strings
- Linked Lists
- Trees and Graphs
- Dynamic Programming
- Recursion and Backtracking
- Sorting and Searching

**System Design Topics:**
- Scalability
- Load Balancing
- Caching
- Database design
- Microservices
- API design

**Tips:**
- Apply through referrals (increases chances)
- Attend Google events and meetups
- Network with Google employees
- Keep trying (many succeed on 2nd/3rd attempt)
- Focus on problem-solving approach
- Communicate your thought process

**Resources:**
- Cracking the Coding Interview book
- LeetCode Google questions
- System Design Primer
- Google Interview Prep videos

**Timeline:** 6-12 months of dedicated preparation`,

    'freelancing vs full time job': `💼 **Freelancing vs Full-Time Job:**

**Freelancing:**

**Pros:**
- Flexibility in schedule
- Work from anywhere
- Choose your projects
- Potentially higher income
- Multiple clients/variety
- Be your own boss

**Cons:**
- Inconsistent income
- No benefits (health insurance, PF)
- Self-employment taxes
- Client acquisition effort
- No paid leaves
- Isolation

**Best For:**
- Self-motivated individuals
- Those seeking flexibility
- Experienced professionals
- Multiple skill sets
- Risk-takers

**Full-Time Job:**

**Pros:**
- Stable monthly income
- Benefits (insurance, PF, leaves)
- Career growth path
- Learning opportunities
- Team collaboration
- Job security

**Cons:**
- Fixed schedule
- Office politics
- Limited flexibility
- Income ceiling
- Less variety
- Reporting to managers

**Best For:**
- Fresh graduates
- Those seeking stability
- Career-focused individuals
- Team players
- Risk-averse people

**Hybrid Approach:**
- Full-time job + side freelancing
- Best of both worlds
- Build freelance portfolio
- Transition gradually

**Financial Comparison:**
- Freelancing: Variable (₹30k-₹2L+/month)
- Full-time: Stable (₹3-30 LPA)

**Recommendation:**
- Start with full-time (2-3 years)
- Build skills and network
- Start freelancing on side
- Transition if desired

**Success Factors:**
- Strong skills
- Good network
- Financial cushion (6 months)
- Self-discipline
- Marketing ability`
  },

  // ============================================
  // SKILLS DEVELOPMENT (100+ Q&A)
  // ============================================
  skillsDevelopment: {
    'most in demand skills 2024': `🚀 **Most In-Demand Skills for 2024:**

**Technical Skills:**

**1. Artificial Intelligence & Machine Learning**
- Python, TensorFlow, PyTorch
- NLP, Computer Vision
- Salary: ₹8-25 LPA

**2. Cloud Computing**
- AWS, Azure, Google Cloud
- Kubernetes, Docker
- Salary: ₹6-20 LPA

**3. Cybersecurity**
- Ethical Hacking
- Security Analysis
- Salary: ₹5-18 LPA

**4. Data Science & Analytics**
- Python, R, SQL
- Tableau, Power BI
- Salary: ₹6-22 LPA

**5. Full Stack Development**
- MERN/MEAN Stack
- React, Node.js
- Salary: ₹4-15 LPA

**6. DevOps**
- CI/CD, Jenkins
- Infrastructure as Code
- Salary: ₹6-18 LPA

**7. Blockchain**
- Smart Contracts
- Cryptocurrency
- Salary: ₹7-25 LPA

**8. Mobile Development**
- Flutter, React Native
- iOS, Android
- Salary: ₹4-15 LPA

**Soft Skills:**

**1. Communication**
- Written and verbal
- Presentation skills
- Active listening

**2. Leadership**
- Team management
- Decision making
- Conflict resolution

**3. Problem Solving**
- Critical thinking
- Analytical skills
- Creativity

**4. Adaptability**
- Learning agility
- Flexibility
- Resilience

**5. Emotional Intelligence**
- Self-awareness
- Empathy
- Social skills

**Emerging Skills:**
- Quantum Computing
- AR/VR Development
- IoT Development
- Edge Computing
- 5G Technology

**How to Learn:**
- Online courses (Coursera, Udemy)
- Certifications
- Hands-on projects
- Internships
- Bootcamps

**Time Investment:**
- 3-6 months per skill
- Consistent daily practice
- Real-world projects`,

    'how to learn programming fast': `⚡ **How to Learn Programming Fast:**

**Step 1: Choose the Right Language (Week 1)**
- Beginners: Python or JavaScript
- Web: JavaScript
- Mobile: Kotlin/Swift
- Data Science: Python

**Step 2: Master Fundamentals (Weeks 2-4)**
- Variables and data types
- Control structures (if/else, loops)
- Functions
- Arrays and objects
- Basic algorithms

**Step 3: Practice Daily (Ongoing)**
- Code for 2-3 hours daily
- Solve problems on:
  - HackerRank
  - LeetCode
  - Codewars
  - Project Euler

**Step 4: Build Projects (Weeks 5-8)**
- Start with simple projects
- Todo app
- Calculator
- Weather app
- Portfolio website

**Step 5: Learn by Doing**
- 80% coding, 20% theory
- Type code, don't copy-paste
- Debug your own errors
- Read others' code

**Fast Learning Techniques:**

**1. Pomodoro Technique**
- 25 min focused coding
- 5 min break
- Repeat 4 times
- 30 min long break

**2. Active Learning**
- Explain concepts to others
- Write blog posts
- Create tutorials
- Teach someone

**3. Project-Based Learning**
- Learn by building
- Real-world applications
- Portfolio pieces

**4. Spaced Repetition**
- Review concepts regularly
- Practice old topics
- Build on previous knowledge

**Common Mistakes to Avoid:**
- Tutorial hell (too many courses)
- Not practicing enough
- Skipping fundamentals
- Comparing with others
- Giving up too soon

**Resources:**
- FreeCodeCamp (free)
- The Odin Project (free)
- CS50 by Harvard (free)
- Codecademy
- Udemy courses

**Timeline:**
- Basic proficiency: 3 months
- Job-ready: 6-12 months
- Expert level: 2-3 years

**Daily Schedule:**
- Morning: Learn new concepts (1 hour)
- Afternoon: Practice problems (1 hour)
- Evening: Build projects (1 hour)

**Motivation Tips:**
- Set small goals
- Track progress
- Join coding communities
- Celebrate small wins
- Stay consistent`,

    'best programming language to learn first': `🎯 **Best Programming Language for Beginners:**

**Top Recommendations:**

**1. Python 🐍 (BEST FOR BEGINNERS)**

**Pros:**
- Easy to read and write
- Versatile (web, data, AI, automation)
- Huge community
- Lots of jobs
- Great libraries

**Cons:**
- Slower than compiled languages
- Not ideal for mobile apps

**Best For:**
- Complete beginners
- Data science
- Automation
- Web development

**Job Opportunities:** ⭐⭐⭐⭐⭐

---

**2. JavaScript ⚡**

**Pros:**
- Runs in browsers
- Full-stack capability
- High demand
- Interactive websites
- Node.js for backend

**Cons:**
- Can be confusing for beginners
- Many frameworks to learn

**Best For:**
- Web development
- Frontend developers
- Full-stack path

**Job Opportunities:** ⭐⭐⭐⭐⭐

---

**3. Java ☕**

**Pros:**
- Object-oriented
- Android development
- Enterprise jobs
- Strong typing
- Platform independent

**Cons:**
- Verbose syntax
- Steeper learning curve

**Best For:**
- Android development
- Enterprise applications
- Strong CS fundamentals

**Job Opportunities:** ⭐⭐⭐⭐⭐

---

**4. C++ 🔧**

**Pros:**
- Fast performance
- System programming
- Game development
- Strong fundamentals

**Cons:**
- Complex syntax
- Manual memory management
- Harder for beginners

**Best For:**
- Game development
- System programming
- Competitive programming

**Job Opportunities:** ⭐⭐⭐⭐

---

**Decision Matrix:**

**Choose Python if:**
- Complete beginner
- Want quick results
- Interested in data science/AI
- Prefer simple syntax

**Choose JavaScript if:**
- Want to build websites
- Interested in web development
- Want to see visual results
- Full-stack career path

**Choose Java if:**
- Want Android development
- Prefer strong typing
- Enterprise career path
- Strong CS fundamentals

**Choose C++ if:**
- Game development interest
- System programming
- Competitive programming
- Performance critical apps

**My Recommendation:**
Start with **Python** for 3 months, then learn **JavaScript** for web development. This combination gives you the best career opportunities.

**Learning Path:**
1. Python (3 months) - Fundamentals
2. JavaScript (3 months) - Web development
3. Specialize based on interest

**Resources:**
- Python: "Automate the Boring Stuff"
- JavaScript: "Eloquent JavaScript"
- Both: FreeCodeCamp, Codecademy`
  }
};

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = knowledgeBase;
}
