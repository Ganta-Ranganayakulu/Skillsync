
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Job = require('./models/Job');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillsync';

const jobs = [
  { title: 'Senior React Developer', company_name: 'TechCorp India', location: 'Hyderabad', job_type: 'full_time', experience_level: 'senior', salary_min: 1800000, salary_max: 2400000, salary_currency: 'INR', skills_required: 'React, TypeScript, Redux, Node.js, REST API, Git', description: 'We are looking for a Senior React Developer to build high-quality web applications. You will work with a team of experienced engineers to deliver world-class products.', requirements: '5+ years of experience with React\nStrong TypeScript skills\nExperience with state management (Redux/Zustand)\nFamiliarity with REST APIs and Git' },
  { title: 'Full Stack MERN Developer', company_name: 'StartupXYZ', location: 'Bangalore', job_type: 'full_time', experience_level: 'mid', salary_min: 1200000, salary_max: 1800000, salary_currency: 'INR', skills_required: 'React, Node.js, MongoDB, Express, JavaScript, Git, Docker', description: 'Join our fast-growing startup to build scalable web applications using the MERN stack. You will own features end-to-end.', requirements: '3+ years of MERN stack experience\nGood understanding of MongoDB\nExperience with Docker is a plus' },
  { title: 'Python Machine Learning Engineer', company_name: 'DataDriven Co', location: 'Pune', job_type: 'full_time', experience_level: 'mid', salary_min: 1500000, salary_max: 2200000, salary_currency: 'INR', skills_required: 'Python, Machine Learning, TensorFlow, Pandas, NumPy, Scikit-learn, SQL', description: 'Build and deploy machine learning models to solve real business problems at scale.', requirements: '3+ years Python experience\nHands-on ML model building\nExperience with TensorFlow or PyTorch' },
  { title: 'DevOps Engineer', company_name: 'CloudBase Solutions', location: 'Remote', job_type: 'remote', experience_level: 'mid', salary_min: 1400000, salary_max: 2000000, salary_currency: 'INR', skills_required: 'Docker, Kubernetes, AWS, CI/CD, Linux, Terraform, Git', description: 'Manage and improve our cloud infrastructure, CI/CD pipelines, and deployment processes.', requirements: 'Strong AWS or GCP experience\nDocker and Kubernetes proficiency\nExperience with Terraform' },
  { title: 'Frontend Developer (Vue.js)', company_name: 'DesignStudio', location: 'Chennai', job_type: 'full_time', experience_level: 'entry', salary_min: 600000, salary_max: 1000000, salary_currency: 'INR', skills_required: 'Vue, JavaScript, HTML, CSS, Tailwind CSS, Git', description: 'Create beautiful and responsive user interfaces for our design platform using Vue.js.', requirements: '1-2 years of Vue.js experience\nStrong HTML/CSS fundamentals\nKnowledge of Tailwind CSS is a plus' },
  { title: 'Backend Java Developer', company_name: 'EnterpriseApp Ltd', location: 'Mumbai', job_type: 'full_time', experience_level: 'senior', salary_min: 2000000, salary_max: 3000000, salary_currency: 'INR', skills_required: 'Java, Spring Boot, Microservices, SQL, Docker, REST API, Git', description: 'Design and build scalable microservices backend systems for enterprise clients.', requirements: '6+ years Java development\nStrong Spring Boot skills\nMicroservices architecture experience' },
  { title: 'UI/UX Designer', company_name: 'CreativeAgency', location: 'Delhi', job_type: 'full_time', experience_level: 'mid', salary_min: 900000, salary_max: 1400000, salary_currency: 'INR', skills_required: 'Figma, UI/UX, Prototyping, CSS, Adobe Photoshop, Communication', description: 'Design intuitive and visually appealing interfaces for web and mobile applications.', requirements: 'Strong portfolio required\nFigma proficiency\nUnderstanding of design systems' },
  { title: 'Data Analyst', company_name: 'Analytics Hub', location: 'Hyderabad', job_type: 'full_time', experience_level: 'entry', salary_min: 700000, salary_max: 1100000, salary_currency: 'INR', skills_required: 'SQL, Python, Pandas, Excel, Data Analysis, Communication', description: 'Analyze large datasets to provide actionable business insights and reports.', requirements: '1+ year data analysis experience\nSQL and Python proficiency\nExcellent communication skills' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing seed data
  await User.deleteMany({ email: { $in: ['jobseeker@demo.com', 'employer@demo.com'] } });

  // Create demo job seeker
  const seeker = await User.create({
    username: 'demo_seeker', email: 'jobseeker@demo.com', password: 'Demo@1234',
    first_name: 'Ravi', last_name: 'Kumar', role: 'jobseeker',
    jobseeker_profile: {
      skills: 'React, JavaScript, Node.js, MongoDB, CSS, Git, REST API',
      experience_years: 3, education: 'B.Tech Computer Science',
      location: 'Hyderabad', is_available: true
    }
  });

  // Create demo job provider
  const provider = await User.create({
    username: 'demo_employer', email: 'employer@demo.com', password: 'Demo@1234',
    first_name: 'HR', last_name: 'Manager', role: 'jobprovider',
    company_profile: {
      company_name: 'TechCorp India', industry: 'Technology',
      company_size: '201-500', headquarters: 'Hyderabad',
      company_description: 'A leading technology company building innovative products.'
    }
  });

  // Create sample jobs
  await Job.deleteMany({ job_provider: provider._id });
  for (const j of jobs) {
    await Job.create({ ...j, job_provider: provider._id });
  }

  console.log('\n Seed data created successfully!');
  console.log('─────────────────────────────────────');
  console.log('Job Seeker  → jobseeker@demo.com  / Demo@1234');
  console.log('Employer    → employer@demo.com   / Demo@1234');
  console.log(`Jobs created: ${jobs.length}`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
