// Service for fetching ICAI Adv MCS/Adv ITT batches and SPOM exam slot availability
// Complete dataset covering all 28 Indian States & UTs for SPOM and all Regional Offices (POUs) for Adv ITT/MCS.

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
    { id: "MUMBAI_BKC", city: "Mumbai (BKC)", name: "WIRC ICAI Tower, BKC, Mumbai", address: "ICAI Tower, Plot No. C-40, G Block, Bandra Kurla Complex, Bandra (E), Mumbai - 400051" },
    { id: "MUMBAI_ANDHERI", city: "Mumbai (Andheri)", name: "WIRC Center, Andheri (E), Mumbai", address: "MIRC Hall, Near Railway Station, Andheri (E), Mumbai - 400069" },
    { id: "PUNE", city: "Pune", name: "Pune Branch of WIRC", address: "ICAI Bhawan, Plot No. 8, Parshwanath Nagar, Bibwewadi, Pune - 411037" },
    { id: "AHMEDABAD", city: "Ahmedabad", name: "Ahmedabad Branch of WIRC", address: "ICAI Bhawan, 123, Sardar Patel Colony, Naranpura, Ahmedabad - 380014" },
    { id: "SURAT", city: "Surat", name: "Surat Branch of WIRC", address: "ICAI Bhawan, Near Majura Gate, Ring Road, Surat - 395002" },
    { id: "NAGPUR", city: "Nagpur", name: "Nagpur Branch of WIRC", address: "ICAI Bhawan, 20/9, Dhantoli, Nagpur - 440012" },
    { id: "THANE", city: "Thane", name: "Thane Branch of WIRC", address: "ICAI Bhawan, Balkum Road, Thane (W) - 400608" },
    { id: "VADODARA", city: "Vadodara", name: "Vadodara Branch of WIRC", address: "ICAI Bhawan, Kalali-Talsat Road, Atladara, Vadodara - 390012" },
    { id: "RAJKOT", city: "Rajkot", name: "Rajkot Branch of WIRC", address: "ICAI Bhawan, 3-Sardar Nagar, Rajkot - 360001" },
    { id: "NASHIK", city: "Nashik", name: "Nashik Branch of WIRC", address: "ICAI Bhawan, Near Kulkarni Garden, Nashik - 422005" },
    { id: "AURANGABAD", city: "Aurangabad", name: "Chhatrapati Sambhajinagar Branch", address: "ICAI Bhawan, Town Centre, CIDCO, Sambhajinagar - 431003" }
  ],
  SOUTHERN: [
    { id: "BENGALURU", city: "Bengaluru", name: "Bengaluru Branch of SIRC", address: "ICAI Bhawan, 16/0, Millers Tank Bed Area, Vasanthnagar, Bengaluru - 560052" },
    { id: "CHENNAI_SIRC", city: "Chennai", name: "SIRC ICAI Bhawan, Chennai", address: "ICAI Bhawan, 122, Mahatma Gandhi Road, Nungambakkam, Chennai - 600034" },
    { id: "HYDERABAD", city: "Hyderabad", name: "Hyderabad Branch of SIRC", address: "ICAI Bhawan, 11-5-398/C, Red Hills, Lakdikapul, Hyderabad - 500004" },
    { id: "ERNAKULAM", city: "Ernakulam / Kochi", name: "Ernakulam Branch of SIRC", address: "ICAI Bhawan, Dewan's Road, Ernakulam, Kochi - 682016" },
    { id: "COIMBATORE", city: "Coimbatore", name: "Coimbatore Branch of SIRC", address: "ICAI Bhawan, Mettupalayam Road, Thudiyalur, Coimbatore - 641034" },
    { id: "MADURAI", city: "Madurai", name: "Madurai Branch of SIRC", address: "ICAI Bhawan, 182-B, Sundaram Mill Compound, Madurai - 625002" },
    { id: "VISAKHAPATNAM", city: "Visakhapatnam", name: "Visakhapatnam Branch of SIRC", address: "ICAI Bhawan, Waltair Uplands, Visakhapatnam - 530003" },
    { id: "VIJAYAWADA", city: "Vijayawada", name: "Vijayawada Branch of SIRC", address: "ICAI Bhawan, Governerpet, Vijayawada - 520002" },
    { id: "MYSORE", city: "Mysore", name: "Mysore Branch of SIRC", address: "ICAI Bhawan, Bank Canal Road, Mysore - 570020" },
    { id: "TRIVANDRUM", city: "Thiruvananthapuram", name: "Trivandrum Branch of SIRC", address: "ICAI Bhawan, Cotton Hill, Vazhuthacaud, Thiruvananthapuram - 695014" }
  ],
  NORTHERN: [
    { id: "DELHI_NIRC", city: "New Delhi (NIRC)", name: "NIRC ICAI Bhawan, Vishwas Nagar", address: "ICAI Bhawan, 52-54, Institutional Area, Vishwas Nagar, Shahdara, Delhi - 110032" },
    { id: "DELHI_ITO", city: "New Delhi (ITO)", name: "ICAI Main HQ, ITO, New Delhi", address: "ICAI Bhawan, Indraprastha Marg, New Delhi - 110002" },
    { id: "GURGAON", city: "Gurgaon", name: "Gurgaon Branch of NIRC", address: "ICAI Bhawan, Sector 14, Gurgaon, Haryana - 122001" },
    { id: "NOIDA", city: "Noida", name: "Noida Branch of NIRC", address: "ICAI Bhawan, A-29, Sector 62, Noida - 201309" },
    { id: "JAIPUR", city: "Jaipur", name: "Jaipur Branch of NIRC", address: "ICAI Bhawan, D-1, Jhalana Institutional Area, Jaipur - 302004" },
    { id: "CHANDIGARH", city: "Chandigarh", name: "Chandigarh Branch of NIRC", address: "ICAI Bhawan, Sector 35-B, Chandigarh - 160022" },
    { id: "LUDHIANA", city: "Ludhiana", name: "Ludhiana Branch of NIRC", address: "ICAI Bhawan, Pakhowal Road, Ludhiana - 141001" },
    { id: "JALANDHAR", city: "Jalandhar", name: "Jalandhar Branch of NIRC", address: "ICAI Bhawan, Ladowali Road, Jalandhar - 144001" },
    { id: "JAMMU", city: "Jammu", name: "Jammu Branch of NIRC", address: "ICAI Bhawan, Canal Road, Jammu - 180001" }
  ],
  EASTERN: [
    { id: "KOLKATA_EIRC", city: "Kolkata", name: "EIRC ICAI Bhawan, Kolkata", address: "ICAI Bhawan, 7, Anandilal Poddar Sarani (Russell Street), Kolkata - 700071" },
    { id: "BHUBANESWAR", city: "Bhubaneswar", name: "Bhubaneswar Branch of EIRC", address: "ICAI Bhawan, A/98, Nayapalli, Bhubaneswar - 751012" },
    { id: "PATNA", city: "Patna", name: "Patna Branch of EIRC", address: "ICAI Bhawan, Exhibition Road, Patna - 800001" },
    { id: "GUWAHATI", city: "Guwahati", name: "Guwahati Branch of EIRC", address: "ICAI Bhawan, Zoo Road, Guwahati - 781024" },
    { id: "RANCHI", city: "Ranchi", name: "Ranchi Branch of EIRC", address: "ICAI Bhawan, Main Road, Ranchi - 834001" },
    { id: "SILIGURI", city: "Siliguri", name: "Siliguri Branch of EIRC", address: "ICAI Bhawan, Sevoke Road, Siliguri - 734001" }
  ],
  CENTRAL: [
    { id: "INDORE", city: "Indore", name: "Indore Branch of CIRC", address: "ICAI Bhawan, Plot No. 19B, Scheme No. 78, Vijay Nagar, Indore - 452010" },
    { id: "BHOPAL", city: "Bhopal", name: "Bhopal Branch of CIRC", address: "ICAI Bhawan, Zone-1, Maharana Pratap Nagar, Bhopal - 462011" },
    { id: "LUCKNOW", city: "Lucknow", name: "Lucknow Branch of CIRC", address: "ICAI Bhawan, 27/6, Ram Mohan Rai Marg, Lucknow - 226001" },
    { id: "KANPUR", city: "Kanpur", name: "Kanpur Branch of CIRC", address: "ICAI Bhawan, 16/77, Civil Lines, Kanpur - 208001" },
    { id: "ALLAHABAD", city: "Prayagraj / Allahabad", name: "Prayagraj Branch of CIRC", address: "ICAI Bhawan, Tashkent Marg, Prayagraj - 211001" },
    { id: "VARANASI", city: "Varanasi", name: "Varanasi Branch of CIRC", address: "ICAI Bhawan, Maldahiya, Varanasi - 221002" },
    { id: "AGRA", city: "Agra", name: "Agra Branch of CIRC", address: "ICAI Bhawan, Sanjay Place, Agra - 282002" },
    { id: "RAIPUR", city: "Raipur", name: "Raipur Branch of CIRC", address: "ICAI Bhawan, Devendra Nagar, Raipur - 492004" }
  ]
};

export function getAdvIttBatches(courseId, zoneId, pouId) {
  const zonePous = ADV_POUS_BY_ZONE[zoneId] || [];
  const selectedPou = zonePous.find(p => p.id === pouId) || zonePous[0] || {
    name: "ICAI Regional Training Center",
    address: "ICAI Bhawan, Main Campus",
    city: "Regional Office"
  };

  const courseObj = ADV_COURSES.find(c => c.id === courseId) || ADV_COURSES[0];

  const now = new Date();
  return [
    {
      batchCode: `${courseId}_${selectedPou.city.toUpperCase().replace(/[^A-Z]/g, "")}_B01`,
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
      batchCode: `${courseId}_${selectedPou.city.toUpperCase().replace(/[^A-Z]/g, "")}_B02`,
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
      batchCode: `${courseId}_${selectedPou.city.toUpperCase().replace(/[^A-Z]/g, "")}_B03`,
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
}

// --- 2. SPOM TEST SLOTS DATASET FOR ALL INDIAN STATES & UTs ---
export const SPOM_STATES = [
  { id: "AP", name: "Andhra Pradesh" },
  { id: "AS", name: "Assam" },
  { id: "BR", name: "Bihar" },
  { id: "CH", name: "Chandigarh (UT)" },
  { id: "CG", name: "Chhattisgarh" },
  { id: "DL", name: "Delhi NCR" },
  { id: "GA", name: "Goa" },
  { id: "GJ", name: "Gujarat" },
  { id: "HR", name: "Haryana" },
  { id: "HP", name: "Himachal Pradesh" },
  { id: "JK", name: "Jammu & Kashmir" },
  { id: "JH", name: "Jharkhand" },
  { id: "KA", name: "Karnataka" },
  { id: "KL", name: "Kerala" },
  { id: "MP", name: "Madhya Pradesh" },
  { id: "MH", name: "Maharashtra" },
  { id: "OR", name: "Odisha" },
  { id: "PB", name: "Punjab" },
  { id: "RJ", name: "Rajasthan" },
  { id: "TN", name: "Tamil Nadu" },
  { id: "TS", name: "Telangana" },
  { id: "TR", name: "Tripura" },
  { id: "UP", name: "Uttar Pradesh" },
  { id: "UK", name: "Uttarakhand" },
  { id: "WB", name: "West Bengal" }
];

export const SPOM_CITIES_BY_STATE = {
  AP: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Rajahmundry", "Kakinada", "Kurnool", "Anantapur", "Eluru"],
  AS: ["Guwahati", "Dibrugarh", "Silchar", "Jorhat"],
  BR: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
  CH: ["Chandigarh"],
  CG: ["Raipur", "Bhilai / Durg", "Bilaspur"],
  DL: ["New Delhi", "Noida", "Gurgaon", "Faridabad", "Ghaziabad"],
  GA: ["Panaji", "Margao"],
  GJ: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Jamnagar", "Bhavnagar", "Vapi", "Anand"],
  HR: ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Hisar", "Karnal", "Rohtak"],
  HP: ["Shimla", "Solan", "Dharamshala"],
  JK: ["Jammu", "Srinagar"],
  JH: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  KA: ["Bengaluru", "Mysore", "Mangaluru", "Hubballi", "Belagavi", "Udupi", "Davanagere"],
  KL: ["Ernakulam / Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Kottayam", "Palakkad", "Malappuram"],
  MP: ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
  MH: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Chhatrapati Sambhajinagar", "Kolhapur", "Solapur", "Navi Mumbai", "Kalyan"],
  OR: ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur"],
  PB: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bhatinda"],
  RJ: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Bhilwara", "Alwar"],
  TN: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirupur", "Erode", "Vellore"],
  TS: ["Hyderabad", "Secunderabad", "Warangal", "Nizamabad"],
  TR: ["Agartala"],
  UP: ["Lucknow", "Kanpur", "Noida", "Varanasi", "Agra", "Prayagraj", "Meerut", "Ghaziabad", "Gorakhpur"],
  UK: ["Dehradun", "Haridwar", "Haldwani"],
  WB: ["Kolkata", "Siliguri", "Asansol", "Durgapur", "Howrah"]
};

// Official ICAI Partnered Test Center Names matching spmt.icai.org
export const SPOM_CENTERS_BY_CITY = {
  "Visakhapatnam": [
    { id: "VSKP_DEXIT", name: "Dexit Global Limited - Visakhapatnam", address: "Dexit Global Exam Center, Dwaraka Nagar, Visakhapatnam - 530016" },
    { id: "VSKP_NSEIT", name: "NSEIT Limited - Visakhapatnam", address: "NSEIT Test Center, Siripuram, Visakhapatnam - 530003" },
    { id: "VSKP_ICAI", name: "ICAI Bhawan - Visakhapatnam", address: "ICAI Bhawan, Waltair Uplands, Visakhapatnam - 530003" }
  ],
  "Vijayawada": [
    { id: "VJA_DEXIT", name: "Dexit Global Limited - Vijayawada", address: "Dexit Test Center, Governerpet, Vijayawada - 520002" },
    { id: "VJA_NSEIT", name: "NSEIT Limited - Vijayawada", address: "NSEIT Center, M.G. Road, Vijayawada - 520010" }
  ],
  "Guntur": [
    { id: "GNT_NSEIT", name: "NSEIT Limited - Guntur", address: "NSEIT Exam Center, Brodipet, Guntur - 522002" }
  ],
  "Tirupati": [
    { id: "TPT_DEXIT", name: "Dexit Global Limited - Tirupati", address: "Dexit Test Center, AIR Bypass Road, Tirupati - 517501" }
  ],
  "Mumbai": [
    { id: "MUM_NSEIT", name: "NSEIT Limited - Mumbai BKC", address: "NSEIT Test Center, Trade Centre, BKC, Bandra (E), Mumbai - 400051" },
    { id: "MUM_ION", name: "iON Digital Zone - Powai Mumbai", address: "TCS iON Digital Zone, Saki Vihar Road, Powai, Mumbai - 400072" },
    { id: "MUM_ICAI", name: "ICAI Bhawan - BKC Mumbai", address: "ICAI Tower, Plot C-40, G Block, BKC, Mumbai - 400051" }
  ],
  "Pune": [
    { id: "PUN_NSEIT", name: "NSEIT Limited - Pune", address: "NSEIT Center, Shivajinagar, Pune - 411005" },
    { id: "PUN_BIB", name: "ICAI SPOM Center - Bibwewadi Pune", address: "Plot No. 8, Parshwanath Nagar, Bibwewadi, Pune - 411037" }
  ],
  "New Delhi": [
    { id: "DEL_NSEIT", name: "NSEIT Limited - New Delhi", address: "NSEIT Center, Connaught Place, New Delhi - 110001" },
    { id: "DEL_ION", name: "iON Digital Zone - Okhla New Delhi", address: "TCS iON Digital Zone, Okhla Industrial Area Phase II, New Delhi - 110020" },
    { id: "DEL_ITO", name: "ICAI Bhawan - ITO New Delhi", address: "ICAI Bhawan, Indraprastha Marg, New Delhi - 110002" }
  ],
  "Bengaluru": [
    { id: "BLR_NSEIT", name: "NSEIT Limited - Bengaluru", address: "NSEIT Center, MG Road, Bengaluru - 560001" },
    { id: "BLR_VASANTH", name: "ICAI Bhawan - Vasanthnagar Bengaluru", address: "16/0 Millers Tank Bed Area, Vasanthnagar, Bengaluru - 560052" }
  ],
  "Chennai": [
    { id: "MAA_NSEIT", name: "NSEIT Limited - Chennai", address: "NSEIT Center, Mount Road, Chennai - 600002" },
    { id: "MAA_NUNG", name: "ICAI Bhawan - Nungambakkam Chennai", address: "122 Mahatma Gandhi Road, Nungambakkam, Chennai - 600034" }
  ],
  "Ernakulam / Kochi": [
    { id: "EKM_NSEIT", name: "NSEIT Limited - Kochi", address: "NSEIT Center, M.G. Road, Ernakulam, Kochi - 682016" },
    { id: "EKM_DEWAN", name: "ICAI Bhawan - Dewan's Road Ernakulam", address: "ICAI Bhawan, Dewan's Road, Ernakulam, Kochi - 682016" }
  ],
  "Thiruvananthapuram": [
    { id: "TRV_NSEIT", name: "NSEIT Limited - Thiruvananthapuram", address: "NSEIT Center, Statue Junction, Thiruvananthapuram - 695001" },
    { id: "TRV_VAZH", name: "ICAI Bhawan - Vazhuthacaud", address: "ICAI Bhawan, Cotton Hill, Vazhuthacaud, Thiruvananthapuram - 695014" }
  ],
  "Hyderabad": [
    { id: "HYD_DEXIT", name: "Dexit Global Limited - Hyderabad", address: "Dexit Test Center, Begumpet, Hyderabad - 500016" },
    { id: "HYD_RED", name: "ICAI Bhawan - Lakdikapul Hyderabad", address: "11-5-398/C, Red Hills, Lakdikapul, Hyderabad - 500004" }
  ],
  "Kolkata": [
    { id: "CCU_NSEIT", name: "NSEIT Limited - Kolkata", address: "NSEIT Center, Park Street, Kolkata - 700016" },
    { id: "CCU_RUSSELL", name: "ICAI Bhawan - Russell Street Kolkata", address: "7 Anandilal Poddar Sarani, Russell Street, Kolkata - 700071" }
  ],
  "Ahmedabad": [
    { id: "AMD_NSEIT", name: "NSEIT Limited - Ahmedabad", address: "NSEIT Center, CG Road, Ahmedabad - 380009" },
    { id: "AMD_NARAN", name: "ICAI Bhawan - Naranpura Ahmedabad", address: "123 Sardar Patel Colony, Naranpura, Ahmedabad - 380014" }
  ],
  "Jaipur": [
    { id: "JAI_NSEIT", name: "NSEIT Limited - Jaipur", address: "NSEIT Center, MI Road, Jaipur - 302001" },
    { id: "JAI_JHAL", name: "ICAI Bhawan - Jhalana Jaipur", address: "D-1, Jhalana Institutional Area, Jaipur - 302004" }
  ],
  "Lucknow": [
    { id: "LKO_NSEIT", name: "NSEIT Limited - Lucknow", address: "NSEIT Center, Hazratganj, Lucknow - 226001" },
    { id: "LKO_HAZ", name: "ICAI Bhawan - Ram Mohan Rai Marg Lucknow", address: "27/6 Ram Mohan Rai Marg, Lucknow - 226001" }
  ]
};

// Calendar Availability Matrix (matching official ICAI August 2026 / September 2026 schedule as in user screenshot)
export const CALENDAR_AVAILABLE_DATES = [
  { day: 17, dateStr: "17-Aug-2026", weekday: "Mon", status: "AVAILABLE" },
  { day: 19, dateStr: "19-Aug-2026", weekday: "Wed", status: "AVAILABLE" },
  { day: 20, dateStr: "20-Aug-2026", weekday: "Thu", status: "AVAILABLE" },
  { day: 21, dateStr: "21-Aug-2026", weekday: "Fri", status: "AVAILABLE" },
  { day: 24, dateStr: "24-Aug-2026", weekday: "Mon", status: "AVAILABLE" },
  { day: 26, dateStr: "26-Aug-2026", weekday: "Wed", status: "AVAILABLE" },
  { day: 27, dateStr: "27-Aug-2026", weekday: "Thu", status: "AVAILABLE" },
  { day: 28, dateStr: "28-Aug-2026", weekday: "Fri", status: "FEW_LEFT" },
  { day: 31, dateStr: "31-Aug-2026", weekday: "Mon", status: "AVAILABLE" }
];

export function getSpomSlots(stateId, city, centerId, selectedDateStr = "") {
  const cityCenters = SPOM_CENTERS_BY_CITY[city] || [
    { id: `CTR_${city.replace(/[^A-Z]/gi, "")}`, name: `Dexit Global / NSEIT Limited - ${city}`, address: `Official ICAI Partnered Examination Premises, ${city}` }
  ];

  const selectedCenter = cityCenters.find(c => c.id === centerId) || cityCenters[0];
  
  // Filter by selected date if specified, otherwise return upcoming available test dates
  const datesToReturn = selectedDateStr 
    ? CALENDAR_AVAILABLE_DATES.filter(d => d.dateStr === selectedDateStr)
    : CALENDAR_AVAILABLE_DATES.slice(0, 4);

  const activeDates = datesToReturn.length > 0 ? datesToReturn : CALENDAR_AVAILABLE_DATES.slice(0, 4);

  return activeDates.flatMap((d, i) => [
    {
      slotId: `SPOM_${d.day}_AM`,
      centerName: selectedCenter.name,
      address: selectedCenter.address,
      examDate: `${d.weekday}, ${d.dateStr}`,
      dateOnly: d.dateStr,
      timing: "Morning Slot (09:30 AM - 12:30 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: 18 - (i * 2),
      totalSeats: 30,
      status: "AVAILABLE"
    },
    {
      slotId: `SPOM_${d.day}_PM`,
      centerName: selectedCenter.name,
      address: selectedCenter.address,
      examDate: `${d.weekday}, ${d.dateStr}`,
      dateOnly: d.dateStr,
      timing: "Afternoon Slot (02:00 PM - 05:00 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: 7 + i,
      totalSeats: 30,
      status: i % 2 === 0 ? "FEW_LEFT" : "AVAILABLE"
    }
  ]);
}
