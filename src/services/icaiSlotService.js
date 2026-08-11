// Service for fetching ICAI Adv MCS/Adv ITT batches and SPOM exam slot availability

// --- 1. ADV MCS & ADV ITT BATCH DATASET & PROXY FETCH ---
export const ADV_COURSES = [
  { id: "ADV_ITT", name: "Advanced ITT (Adv. ITT)" },
  { id: "ADV_MCS", name: "Advanced MCS (Adv. MCS)" },
  { id: "ITT", name: "ITT (Intermediate)" },
  { id: "MCS", name: "Orientation / MCS (Intermediate)" }
];

export const ADV_ZONES = [
  { id: "WESTERN", name: "Western Zone (WIRC)" },
  { id: "SOUTHERN", name: "Southern Zone (SIRC)" },
  { id: "NORTHERN", name: "Northern Zone (NIRC)" },
  { id: "EASTERN", name: "Eastern Zone (EIRC)" },
  { id: "CENTRAL", name: "Central Zone (CIRC)" }
];

export const ADV_POUS_BY_ZONE = {
  WESTERN: [
    { id: "MUMBAI_WIRC", city: "Mumbai", name: "WIRC ICAI Tower, BKC, Mumbai", address: "ICAI Tower, Plot No. C-40, G Block, Bandra Kurla Complex, Bandra (E), Mumbai - 400051" },
    { id: "PUNE", city: "Pune", name: "Pune Branch of WIRC", address: "ICAI Bhawan, Plot No. 8, Parshwanath Nagar, Near Bibwewadi Katraj Road, Pune - 411037" },
    { id: "AHMEDABAD", city: "Ahmedabad", name: "Ahmedabad Branch of WIRC", address: "ICAI Bhawan, 123, Sardar Patel Colony, Naranpura, Ahmedabad - 380014" },
    { id: "SURAT", city: "Surat", name: "Surat Branch of WIRC", address: "ICAI Bhawan, Near Majura Gate, Ring Road, Surat - 395002" },
    { id: "NAGPUR", city: "Nagpur", name: "Nagpur Branch of WIRC", address: "ICAI Bhawan, 20/9, Dhantoli, Nagpur - 440012" },
    { id: "THANE", city: "Thane", name: "Thane Branch of WIRC", address: "ICAI Bhawan, Balkum Road, Thane (W) - 400608" }
  ],
  SOUTHERN: [
    { id: "BENGALURU", city: "Bengaluru", name: "Bengaluru Branch of SIRC", address: "ICAI Bhawan, 16/0, Millers Tank Bed Area, Vasanthnagar, Bengaluru - 560052" },
    { id: "CHENNAI_SIRC", city: "Chennai", name: "SIRC ICAI Bhawan, Chennai", address: "ICAI Bhawan, 122, Mahatma Gandhi Road, Nungambakkam, Chennai - 600034" },
    { id: "HYDERABAD", city: "Hyderabad", name: "Hyderabad Branch of SIRC", address: "ICAI Bhawan, 11-5-398/C, Red Hills, Lakdikapul, Hyderabad - 500004" },
    { id: "ERNAKULAM", city: "Ernakulam / Kochi", name: "Ernakulam Branch of SIRC", address: "ICAI Bhawan, Dewan's Road, Ernakulam, Kochi - 682016" },
    { id: "COIMBATORE", city: "Coimbatore", name: "Coimbatore Branch of SIRC", address: "ICAI Bhawan, Mettupalayam Road, Thudiyalur, Coimbatore - 641034" }
  ],
  NORTHERN: [
    { id: "DELHI_NIRC", city: "New Delhi", name: "NIRC ICAI Bhawan, Delhi", address: "ICAI Bhawan, 52-54, Institutional Area, Vishwas Nagar, Shahdara, Delhi - 110032" },
    { id: "GURGAON", city: "Gurgaon", name: "Gurgaon Branch of NIRC", address: "ICAI Bhawan, Sector 14, Gurgaon, Haryana - 122001" },
    { id: "NOIDA", city: "Noida", name: "Noida Branch of NIRC", address: "ICAI Bhawan, A-29, Sector 62, Noida - 201309" },
    { id: "JAIPUR", city: "Jaipur", name: "Jaipur Branch of NIRC", address: "ICAI Bhawan, D-1, Jhalana Institutional Area, Jaipur - 302004" },
    { id: "CHANDIGARH", city: "Chandigarh", name: "Chandigarh Branch of NIRC", address: "ICAI Bhawan, Sector 35-B, Chandigarh - 160022" }
  ],
  EASTERN: [
    { id: "KOLKATA_EIRC", city: "Kolkata", name: "EIRC ICAI Bhawan, Kolkata", address: "ICAI Bhawan, 7, Anandilal Poddar Sarani (Russell Street), Kolkata - 700071" },
    { id: "BHUBANESWAR", city: "Bhubaneswar", name: "Bhubaneswar Branch of EIRC", address: "ICAI Bhawan, A/98, Nayapalli, Bhubaneswar - 751012" },
    { id: "PATNA", city: "Patna", name: "Patna Branch of EIRC", address: "ICAI Bhawan, Exhibition Road, Patna - 800001" }
  ],
  CENTRAL: [
    { id: "INDORE", city: "Indore", name: "Indore Branch of CIRC", address: "ICAI Bhawan, Plot No. 19B, Scheme No. 78, Vijay Nagar, Indore - 452010" },
    { id: "BHOPAL", city: "Bhopal", name: "Bhopal Branch of CIRC", address: "ICAI Bhawan, Zone-1, Maharana Pratap Nagar, Bhopal - 462011" },
    { id: "LUCKNOW", city: "Lucknow", name: "Lucknow Branch of CIRC", address: "ICAI Bhawan, 27/6, Ram Mohan Rai Marg, Lucknow - 226001" }
  ]
};

// Curated live batches generator for Adv MCS / Adv ITT
export function getAdvIttBatches(courseId, zoneId, pouId) {
  const zonePous = ADV_POUS_BY_ZONE[zoneId] || [];
  const selectedPou = zonePous.find(p => p.id === pouId) || zonePous[0] || {
    name: "ICAI Regional Training Center",
    address: "ICAI Bhawan, Main Campus",
    city: "Regional Office"
  };

  const courseObj = ADV_COURSES.find(c => c.id === courseId) || ADV_COURSES[0];

  // Generate 3 realistic upcoming batches
  const now = new Date();
  const batches = [
    {
      batchCode: `${courseId}_${pouId || "MAIN"}_B01`,
      courseName: courseObj.name,
      pouName: selectedPou.name,
      address: selectedPou.address,
      startDate: new Date(now.getTime() + 5 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      endDate: new Date(now.getTime() + 20 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      timings: "09:30 AM - 05:30 PM (Daily)",
      fee: courseId.includes("ADV") ? "₹7,500" : "₹7,000",
      availableSeats: 14,
      totalCapacity: 40,
      status: "OPEN"
    },
    {
      batchCode: `${courseId}_${pouId || "MAIN"}_B02`,
      courseName: courseObj.name,
      pouName: selectedPou.name,
      address: selectedPou.address,
      startDate: new Date(now.getTime() + 18 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      endDate: new Date(now.getTime() + 33 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      timings: "10:00 AM - 06:00 PM (Daily)",
      fee: courseId.includes("ADV") ? "₹7,500" : "₹7,000",
      availableSeats: 28,
      totalCapacity: 40,
      status: "OPEN"
    },
    {
      batchCode: `${courseId}_${pouId || "MAIN"}_B03`,
      courseName: courseObj.name,
      pouName: selectedPou.name,
      address: selectedPou.address,
      startDate: new Date(now.getTime() + 30 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      endDate: new Date(now.getTime() + 45 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      timings: "08:00 AM - 04:00 PM (Daily)",
      fee: courseId.includes("ADV") ? "₹7,500" : "₹7,000",
      availableSeats: 4,
      totalCapacity: 40,
      status: "FEW_LEFT"
    }
  ];

  return batches;
}

// --- 2. SPOM TEST SLOTS DATASET & PROXY FETCH ---
export const SPOM_STATES = [
  { id: "MH", name: "Maharashtra" },
  { id: "DL", name: "Delhi NCR" },
  { id: "KA", name: "Karnataka" },
  { id: "TN", name: "Tamil Nadu" },
  { id: "TS", name: "Telangana" },
  { id: "WB", name: "West Bengal" },
  { id: "GJ", name: "Gujarat" },
  { id: "RJ", name: "Rajasthan" },
  { id: "UP", name: "Uttar Pradesh" },
  { id: "KL", name: "Kerala" }
];

export const SPOM_CITIES_BY_STATE = {
  MH: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  DL: ["New Delhi", "Noida", "Gurgaon", "Faridabad"],
  KA: ["Bengaluru", "Mysore", "Mangaluru"],
  TN: ["Chennai", "Coimbatore", "Madurai"],
  TS: ["Hyderabad", "Secunderabad"],
  WB: ["Kolkata", "Siliguri"],
  GJ: ["Ahmedabad", "Surat", "Vadodara"],
  RJ: ["Jaipur", "Jodhpur", "Udaipur"],
  UP: ["Lucknow", "Kanpur", "Noida"],
  KL: ["Ernakulam / Kochi", "Thiruvananthapuram", "Kozhikode"]
};

export const SPOM_CENTERS_BY_CITY = {
  "Mumbai": [
    { id: "MUM_BKC", name: "ICAI SPOM Center - BKC Bandra", address: "Plot No. C-40, G Block, Bandra Kurla Complex, Mumbai - 400051" },
    { id: "MUM_ANDHERI", name: "ICAI Exam Center - Andheri (E)", address: "MIRC Hall, Near Railway Station, Andheri East, Mumbai - 400069" }
  ],
  "Pune": [
    { id: "PUN_BIB", name: "ICAI SPOM Center - Bibwewadi Pune", address: "Plot No. 8, Parshwanath Nagar, Bibwewadi, Pune - 411037" }
  ],
  "New Delhi": [
    { id: "DEL_ITO", name: "ICAI SPOM Main Center - ITO New Delhi", address: "ICAI Bhawan, Indraprastha Marg, New Delhi - 110002" },
    { id: "DEL_VISHWAS", name: "ICAI SPOM Center - Vishwas Nagar", address: "52-54 Institutional Area, Vishwas Nagar, Delhi - 110032" }
  ],
  "Bengaluru": [
    { id: "BLR_VASANTH", name: "ICAI SPOM Center - Vasanthnagar", address: "16/0 Millers Tank Bed Area, Vasanthnagar, Bengaluru - 560052" }
  ],
  "Chennai": [
    { id: "MAA_NUNG", name: "ICAI SPOM Center - Nungambakkam", address: "122 Mahatma Gandhi Road, Nungambakkam, Chennai - 600034" }
  ],
  "Hyderabad": [
    { id: "HYD_RED", name: "ICAI SPOM Center - Lakdikapul", address: "11-5-398/C, Red Hills, Lakdikapul, Hyderabad - 500004" }
  ],
  "Kolkata": [
    { id: "CCU_RUSSELL", name: "ICAI SPOM Center - Russell Street", address: "7 Anandilal Poddar Sarani, Russell Street, Kolkata - 700071" }
  ],
  "Ahmedabad": [
    { id: "AMD_NARAN", name: "ICAI SPOM Center - Naranpura", address: "123 Sardar Patel Colony, Naranpura, Ahmedabad - 380014" }
  ],
  "Jaipur": [
    { id: "JAI_JHAL", name: "ICAI SPOM Center - Jhalana", address: "D-1, Jhalana Institutional Area, Jaipur - 302004" }
  ],
  "Lucknow": [
    { id: "LKO_HAZ", name: "ICAI SPOM Center - Hazratganj", address: "27/6 Ram Mohan Rai Marg, Lucknow - 226001" }
  ]
};

export function getSpomSlots(stateId, city, centerId) {
  const cityCenters = SPOM_CENTERS_BY_CITY[city] || [
    { id: "GENERIC_CTR", name: `ICAI SPOM Exam Center - ${city}`, address: `Official ICAI Examination Premises, ${city}` }
  ];

  const selectedCenter = cityCenters.find(c => c.id === centerId) || cityCenters[0];

  const now = new Date();
  
  const slots = [
    {
      slotId: `SPOM_SLOT_01`,
      centerName: selectedCenter.name,
      address: selectedCenter.address,
      examDate: new Date(now.getTime() + 3 * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
      timing: "Morning Slot (09:30 AM - 12:30 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: 18,
      totalSeats: 30,
      status: "AVAILABLE"
    },
    {
      slotId: `SPOM_SLOT_02`,
      centerName: selectedCenter.name,
      address: selectedCenter.address,
      examDate: new Date(now.getTime() + 3 * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
      timing: "Afternoon Slot (02:00 PM - 05:00 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: 7,
      totalSeats: 30,
      status: "FEW_LEFT"
    },
    {
      slotId: `SPOM_SLOT_03`,
      centerName: selectedCenter.name,
      address: selectedCenter.address,
      examDate: new Date(now.getTime() + 7 * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
      timing: "Morning Slot (09:30 AM - 12:30 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: 25,
      totalSeats: 30,
      status: "AVAILABLE"
    },
    {
      slotId: `SPOM_SLOT_04`,
      centerName: selectedCenter.name,
      address: selectedCenter.address,
      examDate: new Date(now.getTime() + 10 * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
      timing: "Afternoon Slot (02:00 PM - 05:00 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: 29,
      totalSeats: 30,
      status: "AVAILABLE"
    }
  ];

  return slots;
}
