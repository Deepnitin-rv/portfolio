import linearRegressionImg from '../assets/images/linear_regression_ml_1794661674152.jpg';

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  status: string;
}

export interface SkillItem {
  id: 'python' | 'c' | 'cpp' | 'java';
  name: string;
  category: string;
  focus: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  technologies: string[];
  description: string;
  image: string;
  imageAlt: string;
  githubUrl?: string;
  liveUrl?: string;
  interactiveDemo?: 'linear-regression';
}

export interface SpokenLanguage {
  id: string;
  name: string;
  scriptLabel: string;
}

export const PORTFOLIO_DATA = {
  profile: {
    name: 'Deepnitin R V',
    heroHeading: "Hi, I'm Deepnitin R V",
    subtitle: 'AI & ML Student | Aspiring Software Developer',
    heroDescription:
      "I'm a passionate Computer Science student interested in programming, artificial intelligence, and building practical technology solutions. I enjoy learning new technologies and turning ideas into projects.",
    aboutHeading: 'About Me',
    aboutContent:
      "I'm a second-year B.Tech Computer Science and Engineering student specializing in Artificial Intelligence and Machine Learning at Jain University. I have a strong interest in programming and artificial intelligence. I'm comfortable working with Python, C, C++, and Java. I'm always eager to learn new technologies, develop practical projects, and grow as a developer.",
  },

  education: [
    {
      id: 'jain-btech-aiml',
      degree: 'B.Tech in Computer Science and Engineering (AI & ML)',
      institution: 'Jain University',
      status: 'Currently in 2nd Year',
    },
  ] as EducationItem[],

  skills: [
    {
      id: 'python',
      name: 'Python',
      category: 'Programming Language',
      focus: 'Algorithm implementation & Machine Learning foundations',
    },
    {
      id: 'c',
      name: 'C',
      category: 'Programming Language',
      focus: 'Structured programming & core memory fundamentals',
    },
    {
      id: 'cpp',
      name: 'C++',
      category: 'Programming Language',
      focus: 'Object-oriented design & problem solving',
    },
    {
      id: 'java',
      name: 'Java',
      category: 'Programming Language',
      focus: 'Object-oriented software development',
    },
  ] as SkillItem[],

  // Add new projects here to automatically expand the My Projects section.
  projects: [
    {
      id: 'linear-regression-scratch',
      title: 'Linear Regression Model from Scratch',
      category: 'Machine Learning',
      technologies: ['Python'],
      description:
        'Built a linear regression model from scratch, implementing the core algorithm myself instead of relying on a ready-made library.',
      image: linearRegressionImg,
      imageAlt:
        'Isometric 3D coordinate visualization of a linear regression line fitting scattered data points',
      // Add your real GitHub repository URL below when ready:
      githubUrl: '',
      interactiveDemo: 'linear-regression',
    },
  ] as ProjectItem[],

  languages: [
    { id: 'tamil', name: 'Tamil', scriptLabel: 'தமிழ்' },
    { id: 'english', name: 'English', scriptLabel: 'English' },
    { id: 'hindi', name: 'Hindi', scriptLabel: 'हिन्दी' },
  ] as SpokenLanguage[],

  contact: {
    heading: "Let's Connect",
    description:
      "I'm always interested in learning, collaborating, and exploring new opportunities.",
    email: 'deepnitinrv@gmail.com',
    // Add your real profile URLs below when ready:
    linkedinUrl: '',
    githubUrl: '',
  },
};
