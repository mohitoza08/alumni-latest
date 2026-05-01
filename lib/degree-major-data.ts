export const DEGREE_CATEGORIES = {
  BACHELOR: "Bachelor's Degree",
  MASTER: "Master's Degree",
  DOCTORATE: "Doctorate/PhD",
  ASSOCIATE: "Associate Degree",
  DIPLOMA: "Diploma",
  CERTIFICATE: "Certificate",
} as const

export const DEGREES = [
  { value: "B.A.", label: "Bachelor of Arts (B.A.)", category: "BACHELOR" },
  { value: "B.Sc.", label: "Bachelor of Science (B.Sc.)", category: "BACHELOR" },
  { value: "BBA", label: "Bachelor of Business Administration (BBA)", category: "BACHELOR" },
  { value: "B.Com", label: "Bachelor of Commerce (B.Com)", category: "BACHELOR" },
  { value: "BE", label: "Bachelor of Engineering (BE)", category: "BACHELOR" },
  { value: "B.Tech", label: "Bachelor of Technology (B.Tech)", category: "BACHELOR" },
  { value: "BCA", label: "Bachelor of Computer Applications (BCA)", category: "BACHELOR" },
  { value: "B.Ed.", label: "Bachelor of Education (B.Ed.)", category: "BACHELOR" },
  { value: "LLB", label: "Bachelor of Law (LLB)", category: "BACHELOR" },
  { value: "MBBS", label: "Bachelor of Medicine (MBBS)", category: "BACHELOR" },
  { value: "B.Pharm", label: "Bachelor of Pharmacy (B.Pharm)", category: "BACHELOR" },
  { value: "BJN", label: "Bachelor of Journalism (BJN)", category: "BACHELOR" },
  { value: "M.A.", label: "Master of Arts (M.A.)", category: "MASTER" },
  { value: "M.Sc.", label: "Master of Science (M.Sc.)", category: "MASTER" },
  { value: "MBA", label: "Master of Business Administration (MBA)", category: "MASTER" },
  { value: "M.Com", label: "Master of Commerce (M.Com)", category: "MASTER" },
  { value: "ME", label: "Master of Engineering (ME)", category: "MASTER" },
  { value: "M.Tech", label: "Master of Technology (M.Tech)", category: "MASTER" },
  { value: "MCA", label: "Master of Computer Applications (MCA)", category: "MASTER" },
  { value: "M.Ed.", label: "Master of Education (M.Ed.)", category: "MASTER" },
  { value: "LLM", label: "Master of Law (LLM)", category: "MASTER" },
  { value: "MPH", label: "Master of Public Health (MPH)", category: "MASTER" },
  { value: "M.Pharm", label: "Master of Pharmacy (M.Pharm)", category: "MASTER" },
  { value: "PhD", label: "Doctor of Philosophy (PhD)", category: "DOCTORATE" },
  { value: "MD", label: "Doctor of Medicine (MD)", category: "DOCTORATE" },
  { value: "DDS", label: "Doctor of Dental Surgery (DDS)", category: "DOCTORATE" },
  { value: "D.Pharm", label: "Doctor of Pharmacy (D.Pharm)", category: "DOCTORATE" },
  { value: "A.Sc.", label: "Associate of Science (A.Sc.)", category: "ASSOCIATE" },
  { value: "A.A.", label: "Associate of Arts (A.A.)", category: "ASSOCIATE" },
  { value: "Diploma", label: "Diploma", category: "DIPLOMA" },
  { value: "Certificate", label: "Certificate", category: "CERTIFICATE" },
] as const

export const MAJORS_BY_CATEGORY = {
  STEM: {
    label: "Science & Technology",
    majors: [
      "Computer Science",
      "Information Technology",
      "Software Engineering",
      "Data Science",
      "Artificial Intelligence",
      "Cybersecurity",
      "Computer Engineering",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Chemical Engineering",
      "Electronics Engineering",
      "Biomedical Engineering",
      "Aerospace Engineering",
      "Automobile Engineering",
      "Biotechnology",
      "Physics",
      "Chemistry",
      "Biology",
      "Mathematics",
      "Statistics",
      "Environmental Science",
      "Geology",
      "Zoology",
      "Botany",
      "Microbiology",
      "Biochemistry",
      "Nursing",
      "Pharmacy",
      "Medical Laboratory Technology",
      "Radiology",
      "Physiotherapy",
    ],
  },
  BUSINESS: {
    label: "Business & Management",
    majors: [
      "Business Administration",
      "Accounting",
      "Finance",
      "Marketing",
      "Human Resources",
      "Operations Management",
      "International Business",
      "Supply Chain Management",
      "Entrepreneurship",
      "Economics",
      "Banking & Insurance",
      "Hotel Management",
      "Event Management",
      "Retail Management",
      "Project Management",
      "Business Analytics",
    ],
  },
  ARTS: {
    label: "Arts & Humanities",
    majors: [
      "Psychology",
      "Sociology",
      "History",
      "Philosophy",
      "English Literature",
      "Political Science",
      "Social Work",
      "Journalism & Mass Communication",
      "Filmmaking",
      "Graphic Design",
      "Fashion Design",
      "Interior Design",
      "Fine Arts",
      "Music",
      "Theatre Arts",
      "Photography",
      "Creative Writing",
      "Languages & Linguistics",
      "Religious Studies",
    ],
  },
  LAW: {
    label: "Law",
    majors: [
      "Constitutional Law",
      "Criminal Law",
      "Corporate Law",
      "International Law",
      "Intellectual Property Law",
      "Cyber Law",
      "Human Rights Law",
      "Tax Law",
    ],
  },
  EDUCATION: {
    label: "Education",
    majors: [
      "Primary Education",
      "Secondary Education",
      "Special Education",
      "Physical Education",
      "Education Management",
      "Counseling Psychology",
    ],
  },
  OTHER: {
    label: "Other Fields",
    majors: [
      "Agriculture",
      "Architecture",
      "Astronomy",
      "Cartography",
      "Criminology",
      "Forestry",
      "Geography",
      "Health Sciences",
      "Homeland Security",
      "Hospital Administration",
      "Library Science",
      "Public Administration",
      "Public Relations",
      "Urban Planning",
      "Veterinary Science",
    ],
  },
} as const

export const MAJORS = [
  ...MAJORS_BY_CATEGORY.STEM.majors,
  ...MAJORS_BY_CATEGORY.BUSINESS.majors,
  ...MAJORS_BY_CATEGORY.ARTS.majors,
  ...MAJORS_BY_CATEGORY.LAW.majors,
  ...MAJORS_BY_CATEGORY.EDUCATION.majors,
  ...MAJORS_BY_CATEGORY.OTHER.majors,
].sort()

export const getMajorsByDegree = (degreeValue: string): string[] => {
  const degree = DEGREES.find((d) => d.value === degreeValue)
  if (!degree) return MAJORS

  switch (degree.category) {
    case "BACHELOR":
    case "MASTER":
      return [
        ...MAJORS_BY_CATEGORY.STEM.majors,
        ...MAJORS_BY_CATEGORY.BUSINESS.majors,
        ...MAJORS_BY_CATEGORY.ARTS.majors,
      ]
    case "DOCTORATE":
      return [
        "Computer Science",
        "Engineering",
        "Physics",
        "Chemistry",
        "Biology",
        "Mathematics",
        "Management",
        "Economics",
        "Psychology",
        "Philosophy",
      ]
    case "ASSOCIATE":
      return [
        "Computer Science",
        "Business",
        "Accounting",
        "Nursing",
        "Engineering Technology",
        "Liberal Arts",
      ]
    case "DIPLOMA":
    case "CERTIFICATE":
      return [
        "Computer Hardware",
        "Networking",
        "Web Development",
        "Graphic Design",
        "Fashion Designing",
        "Hotel Management",
        "Automobile Engineering",
        "Electrical Engineering",
      ]
    default:
      return MAJORS
  }
}