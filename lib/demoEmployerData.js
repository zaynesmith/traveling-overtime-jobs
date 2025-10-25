export const employerJobs = [
  {
    id: "job-001",
    title: "Journeyman Electrician",
    location: "Houston, TX",
    hourly_pay: "$36/hr",
    per_diem: "$100/day",
    description:
      "Industrial electrical work at refinery. 6x10s schedule, PPE required.",
    postedAt: "2025-09-30",
    applicants: [
      {
        id: "app-001",
        name: "Carmen Salas",
        trade: "Industrial Electrician",
        yearsExperience: 8,
        status: "Phone Screen Scheduled",
      },
      {
        id: "app-002",
        name: "Marcus Glenn",
        trade: "Electrical Foreman",
        yearsExperience: 12,
        status: "Submitted",
      },
    ],
  },
  {
    id: "job-002",
    title: "Electrical Foreman",
    location: "Corpus Christi, TX",
    hourly_pay: "$45/hr",
    per_diem: "$120/day",
    description: "Supervise crews at petrochemical site. Long-term project.",
    postedAt: "2025-10-01",
    applicants: [
      {
        id: "app-003",
        name: "Alicia Wu",
        trade: "Electrical Foreman",
        yearsExperience: 10,
        status: "Interviewing",
      },
      {
        id: "app-004",
        name: "Jose Martinez",
        trade: "Instrumentation Technician",
        yearsExperience: 7,
        status: "Submitted",
      },
    ],
  },
  {
    id: "job-003",
    title: "PLC Technician",
    location: "Lake Charles, LA",
    hourly_pay: "$40/hr",
    per_diem: "$110/day",
    description:
      "Maintain and troubleshoot PLC systems for turnaround work. Night shift available.",
    postedAt: "2025-10-04",
    applicants: [
      {
        id: "app-005",
        name: "Erin Patel",
        trade: "PLC Technician",
        yearsExperience: 6,
        status: "Under Review",
      },
    ],
  },
];

export const resumeDatabase = [
  {
    id: "cand-001",
    name: "Latasha McConnell",
    trade: "Journeyman Electrician",
    location: "Mobile, AL",
    yearsExperience: 9,
    availability: "Available in 2 weeks",
    skills: ["Industrial", "PLC", "Blueprint Reading"],
  },
  {
    id: "cand-002",
    name: "Patrick O'Neil",
    trade: "Electrical Foreman",
    location: "Tulsa, OK",
    yearsExperience: 14,
    availability: "Immediate",
    skills: ["Crew Leadership", "QA/QC", "Refinery"],
  },
  {
    id: "cand-003",
    name: "Riya Mehta",
    trade: "PLC Technician",
    location: "Baton Rouge, LA",
    yearsExperience: 5,
    availability: "Interviewing",
    skills: ["Allen-Bradley", "HMI", "Troubleshooting"],
  },
  {
    id: "cand-004",
    name: "Zachary Williams",
    trade: "Controls Engineer",
    location: "Houston, TX",
    yearsExperience: 11,
    availability: "Available in 1 month",
    skills: ["SCADA", "PLC", "Project Management"],
  },
];
