// ============================================================
// ICAI SPOM & BOS Adv MCS/ITT Dataset
// Data sourced directly from:
//   SPOM: https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action
//   BOS:  https://www.icaionlineregistration.org/launchbatchdetail.aspx
// ============================================================

// ─────────────────────────────────────────────────────────────
// 1. SPOM – States (exact match from spmt.icai.org cmbState)
// ─────────────────────────────────────────────────────────────
export const SPOM_STATES = [
  { id: "35", name: "Andaman And Nicobar" },
  { id: "1",  name: "Andhra Pradesh" },
  { id: "2",  name: "Arunachal Pradesh" },
  { id: "3",  name: "Assam" },
  { id: "4",  name: "Bihar" },
  { id: "5",  name: "Chhattisgarh" },
  { id: "6",  name: "Delhi" },
  { id: "45", name: "Delhi NCR" },
  { id: "7",  name: "Goa" },
  { id: "8",  name: "Gujarat" },
  { id: "9",  name: "Haryana" },
  { id: "10", name: "Himachal Pradesh" },
  { id: "11", name: "Jammu And Kashmir" },
  { id: "12", name: "Jharkhand" },
  { id: "13", name: "Karnataka" },
  { id: "14", name: "Kerala" },
  { id: "15", name: "Madhya Pradesh" },
  { id: "16", name: "Maharashtra" },
  { id: "17", name: "Manipur" },
  { id: "18", name: "Meghalaya" },
  { id: "19", name: "Mizoram" },
  { id: "20", name: "Nagaland" },
  { id: "21", name: "Odisha" },
  { id: "22", name: "Pondicherry" },
  { id: "23", name: "Punjab" },
  { id: "24", name: "Rajasthan" },
  { id: "25", name: "Sikkim" },
  { id: "27", name: "Tamil Nadu" },
  { id: "28", name: "Telangana" },
  { id: "29", name: "Tripura" },
  { id: "30", name: "Uttar Pradesh" },
  { id: "31", name: "Uttarakhand" },
  { id: "32", name: "West Bengal" }
];

// ─────────────────────────────────────────────────────────────
// 2. SPOM – Cities per State (exact from spmt.icai.org)
// ─────────────────────────────────────────────────────────────
export const SPOM_CITIES_BY_STATE = {
  "35": [], // Andaman – no exam centers currently active
  "1":  ["Anantapur", "Chilakaluripet", "Chittoor", "Eluru", "Guntur", "Kakinada", "Kadapa", "Kurnool", "Nellore", "Rajamundry", "Srikakulam", "Tirupati", "Vijayawada", "Visakhapatnam", "Vizianagaram"],
  "2":  [], // Arunachal – no centers
  "3":  ["Dibrugarh", "Guwahati", "Jorhat", "Silchar", "Tezpur"],
  "4":  ["Bhagalpur", "Gaya", "Muzaffarpur", "Patna"],
  "5":  ["Bhilai", "Bilaspur", "Korba", "Raipur"],
  "6":  ["Delhi"],
  "45": ["Faridabad", "Ghaziabad", "Greater Noida", "Gurgaon", "New Delhi", "Noida"],
  "7":  ["Mapusa", "Margao", "Panaji", "Vasco"],
  "8":  ["Ahmedabad", "Anand", "Bharuch", "Bhavnagar", "Bhuj", "Gandhinagar", "Jamnagar", "Junagadh", "Mehsana", "Navsari", "Rajkot", "Surat", "Surendranagar", "Vadodara", "Vapi"],
  "9":  ["Ambala", "Bahadurgarh", "Bhiwani", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonepat", "Yamunanagar"],
  "10": ["Baddi", "Dharamshala", "Hamirpur", "Kullu", "Mandi", "Shimla", "Solan", "Una"],
  "11": ["Jammu", "Srinagar"],
  "12": ["Bokaro", "Deoghar", "Dhanbad", "Jamshedpur", "Ramgarh", "Ranchi"],
  "13": ["Bagalkot", "Bangalore", "Belgaum", "Bellary", "Chikkaballapur", "Chitradurga", "Davangere", "Gadag", "Gulbarga", "Hassan", "Haveri", "Hubli", "Kolar", "Koppal", "Mandya", "Mangalore", "Mysore", "Raichur", "Shimoga", "Tumkur", "Udupi"],
  "14": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "15": ["Bhopal", "Chhindwara", "Gwalior", "Indore", "Jabalpur", "Ratlam", "Rewa", "Sagar", "Satna", "Ujjain"],
  "16": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gondia", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai", "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Navi Mumbai (Panvel)", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad (Panvel)", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "17": ["Imphal"],
  "18": ["Shillong"],
  "19": ["Aizawl"],
  "20": ["Kohima"],
  "21": ["Berhampur", "Bhubaneswar", "Cuttack", "Jeypore", "Rourkela", "Sambalpur"],
  "22": ["Puducherry"],
  "23": ["Amritsar", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Moga", "Mohali", "Muktsar", "Nawanshahr", "Patiala", "Pathankot", "Ropar", "Rupnagar", "Sangrur", "SBS Nagar"],
  "24": ["Ajmer", "Alwar", "Banswara", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Ganganagar", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Tonk", "Udaipur"],
  "25": ["Gangtok"],
  "27": ["Chennai", "Chengalpattu", "Coimbatore", "Dharmapuri", "Dindigul", "Erode", "Hosur", "Kancheepuram", "Karur", "Madurai", "Nagapattinam", "Namakkal", "Ooty", "Salem", "Sivaganga", "Tambaram", "Thanjavur", "Tiruchirappalli", "Tirunelveli", "Tirupur", "Tiruvallur", "Tiruvannamalai", "Vellore", "Villupuram", "Virudhunagar"],
  "28": ["Hyderabad", "Karimnagar", "Khammam", "Mahaboobnagar", "Medak", "Nalgonda", "Nampally", "Nizamabad", "Secunderabad", "Warangal"],
  "29": ["Agartala"],
  "30": ["Agra", "Aligarh", "Allahabad", "Azamgarh", "Bahraich", "Bareilly", "Etawah", "Faizabad", "Firozabad", "Ghaziabad", "Gorakhpur", "Jhansi", "Kanpur", "Lucknow", "Mathura", "Meerut", "Moradabad", "Muzaffarnagar", "Noida", "Saharanpur", "Shahjahanpur", "Varanasi"],
  "31": ["Dehradun", "Haldwani", "Haridwar", "Kashipur", "Roorkee"],
  "32": ["Asansol", "Bankura", "Bardhaman", "Barrackpore", "Durgapur", "Hooghly", "Howrah", "Jalpaiguri", "Kalyani", "Kharagpur", "Kolkata", "Midnapore", "North 24 Parganas", "Siliguri", "South 24 Parganas"]
};

// ─────────────────────────────────────────────────────────────
// 3. SPOM – Test Centers per City (exact names from spmt.icai.org)
// ─────────────────────────────────────────────────────────────
export const SPOM_CENTERS_BY_CITY = {
  // ANDHRA PRADESH
  "Visakhapatnam": [
    { id: "VSKP_01", name: "Dexit Global Limited - Visakhapatnam", address: "Dexit Global Exam Center, Dwaraka Nagar, Visakhapatnam - 530016" },
    { id: "VSKP_02", name: "NSEIT Limited - Visakhapatnam", address: "NSEIT Test Center, Siripuram, Visakhapatnam - 530003" }
  ],
  "Vijayawada": [
    { id: "VJA_01", name: "Dexit Global Limited - Vijayawada", address: "Dexit Test Center, Governerpet, Vijayawada - 520002" },
    { id: "VJA_02", name: "E MERIT - Vijayawada", address: "E Merit Test Center, MG Road, Vijayawada - 520010" }
  ],
  "Guntur": [
    { id: "GNT_01", name: "Dexit Global Limited - Guntur", address: "Dexit Center, Brodipet, Guntur - 522002" },
    { id: "GNT_02", name: "NSEIT Limited - Guntur", address: "NSEIT Center, Guntur - 522001" }
  ],
  "Tirupati": [
    { id: "TPT_01", name: "Dexit Global Limited - Tirupati", address: "Dexit Test Center, AIR Bypass Road, Tirupati - 517501" }
  ],
  "Nellore": [
    { id: "NLR_01", name: "NSEIT Limited - Nellore", address: "NSEIT Center, Nellore - 524001" }
  ],
  "Rajamundry": [
    { id: "RJY_01", name: "Dexit Global Limited - Rajahmundry", address: "Dexit Center, Main Road, Rajahmundry - 533101" }
  ],
  "Kakinada": [
    { id: "KKD_01", name: "NSEIT Limited - Kakinada", address: "NSEIT Center, Kakinada - 533001" }
  ],
  "Kurnool": [
    { id: "KNL_01", name: "Dexit Global Limited - Kurnool", address: "Dexit Center, Kurnool - 518001" }
  ],
  "Anantapur": [
    { id: "ATP_01", name: "NSEIT Limited - Anantapur", address: "NSEIT Center, Anantapur - 515001" }
  ],
  "Kadapa": [
    { id: "KDP_01", name: "NSEIT Limited - Kadapa", address: "NSEIT Center, Kadapa - 516001" }
  ],
  // ASSAM
  "Guwahati": [
    { id: "GAU_01", name: "Dexit Global Limited - Guwahati", address: "Dexit Center, GS Road, Guwahati - 781005" },
    { id: "GAU_02", name: "NSEIT Limited - Guwahati", address: "NSEIT Center, Zoo Road, Guwahati - 781024" }
  ],
  "Dibrugarh": [
    { id: "DIB_01", name: "NSEIT Limited - Dibrugarh", address: "NSEIT Center, Dibrugarh - 786001" }
  ],
  "Silchar": [
    { id: "SIL_01", name: "NSEIT Limited - Silchar", address: "NSEIT Center, Silchar - 788001" }
  ],
  // BIHAR
  "Patna": [
    { id: "PAT_01", name: "Dexit Global Limited - Patna", address: "Dexit Center, Fraser Road, Patna - 800001" },
    { id: "PAT_02", name: "NSEIT Limited - Patna", address: "NSEIT Center, Exhibition Road, Patna - 800001" }
  ],
  "Muzaffarpur": [
    { id: "MZP_01", name: "NSEIT Limited - Muzaffarpur", address: "NSEIT Center, Muzaffarpur - 842001" }
  ],
  // CHHATTISGARH
  "Raipur": [
    { id: "RAI_01", name: "Dexit Global Limited - Raipur", address: "Dexit Center, Pandri, Raipur - 492004" },
    { id: "RAI_02", name: "NSEIT Limited - Raipur", address: "NSEIT Center, Devendra Nagar, Raipur - 492004" }
  ],
  // DELHI / DELHI NCR
  "New Delhi": [
    { id: "DEL_01", name: "Dexit Global Limited - New Delhi", address: "Dexit Center, Connaught Place, New Delhi - 110001" },
    { id: "DEL_02", name: "NSEIT Limited - New Delhi", address: "NSEIT Center, Nehru Place, New Delhi - 110019" },
    { id: "DEL_03", name: "ICAI Bhawan - ITO New Delhi", address: "ICAI Bhawan, Indraprastha Marg, New Delhi - 110002" }
  ],
  "Delhi": [
    { id: "DL_01", name: "Dexit Global Limited - Delhi", address: "Dexit Center, Vishwas Nagar, Delhi - 110032" },
    { id: "DL_02", name: "NSEIT Limited - Delhi", address: "NSEIT Center, Rohini, Delhi - 110085" }
  ],
  "Noida": [
    { id: "NDA_01", name: "Dexit Global Limited - Noida", address: "Dexit Center, Sector 62, Noida - 201309" },
    { id: "NDA_02", name: "NSEIT Limited - Noida", address: "NSEIT Center, Sector 18, Noida - 201301" }
  ],
  "Gurgaon": [
    { id: "GGN_01", name: "Dexit Global Limited - Gurgaon", address: "Dexit Center, DLF Cyber City, Gurgaon - 122002" },
    { id: "GGN_02", name: "NSEIT Limited - Gurgaon", address: "NSEIT Center, Sector 14, Gurgaon - 122001" }
  ],
  "Ghaziabad": [
    { id: "GZB_01", name: "NSEIT Limited - Ghaziabad", address: "NSEIT Center, Raj Nagar, Ghaziabad - 201002" }
  ],
  "Faridabad": [
    { id: "FBD_01", name: "Dexit Global Limited - Faridabad", address: "Dexit Center, NIT, Faridabad - 121001" }
  ],
  // GOA
  "Panaji": [
    { id: "PNJ_01", name: "Dexit Global Limited - Panaji", address: "Dexit Center, Patto Plaza, Panaji - 403001" }
  ],
  // GUJARAT
  "Ahmedabad": [
    { id: "AMD_01", name: "Dexit Global Limited - Ahmedabad", address: "Dexit Center, CG Road, Ahmedabad - 380009" },
    { id: "AMD_02", name: "NSEIT Limited - Ahmedabad", address: "NSEIT Center, Navrangpura, Ahmedabad - 380009" },
    { id: "AMD_03", name: "E NEXT - Ahmedabad", address: "E Next Center, Bodakdev, Ahmedabad - 380054" }
  ],
  "Surat": [
    { id: "SRT_01", name: "Dexit Global Limited - Surat", address: "Dexit Center, Ring Road, Surat - 395002" },
    { id: "SRT_02", name: "NSEIT Limited - Surat", address: "NSEIT Center, Adajan, Surat - 395009" }
  ],
  "Vadodara": [
    { id: "VDR_01", name: "Dexit Global Limited - Vadodara", address: "Dexit Center, Sayajigunj, Vadodara - 390005" },
    { id: "VDR_02", name: "NSEIT Limited - Vadodara", address: "NSEIT Center, Alkapuri, Vadodara - 390007" }
  ],
  "Rajkot": [
    { id: "RJT_01", name: "Dexit Global Limited - Rajkot", address: "Dexit Center, Kalawad Road, Rajkot - 360001" }
  ],
  "Gandhinagar": [
    { id: "GNR_01", name: "NSEIT Limited - Gandhinagar", address: "NSEIT Center, Sector 11, Gandhinagar - 382011" }
  ],
  "Bhavnagar": [
    { id: "BVN_01", name: "Dexit Global Limited - Bhavnagar", address: "Dexit Center, Bhavnagar - 364001" }
  ],
  "Jamnagar": [
    { id: "JMN_01", name: "NSEIT Limited - Jamnagar", address: "NSEIT Center, Jamnagar - 361001" }
  ],
  "Vapi": [
    { id: "VAP_01", name: "Dexit Global Limited - Vapi", address: "Dexit Center, Vapi - 396191" }
  ],
  // HARYANA
  "Gurugram": [
    { id: "GGM_01", name: "Dexit Global Limited - Gurugram", address: "Dexit Center, Cyber City, Gurugram - 122002" },
    { id: "GGM_02", name: "NSEIT Limited - Gurugram", address: "NSEIT Center, Sector 14, Gurugram - 122001" }
  ],
  "Panipat": [
    { id: "PNP_01", name: "NSEIT Limited - Panipat", address: "NSEIT Center, Model Town, Panipat - 132103" }
  ],
  "Ambala": [
    { id: "AMB_01", name: "NSEIT Limited - Ambala", address: "NSEIT Center, Ambala City - 134003" }
  ],
  "Hisar": [
    { id: "HSR_01", name: "NSEIT Limited - Hisar", address: "NSEIT Center, Urban Estate, Hisar - 125005" }
  ],
  "Karnal": [
    { id: "KNL_HR_01", name: "NSEIT Limited - Karnal", address: "NSEIT Center, Karnal - 132001" }
  ],
  // HIMACHAL PRADESH
  "Shimla": [
    { id: "SML_01", name: "NSEIT Limited - Shimla", address: "NSEIT Center, Mall Road, Shimla - 171001" }
  ],
  "Dharamshala": [
    { id: "DRM_01", name: "NSEIT Limited - Dharamshala", address: "NSEIT Center, Dharamshala - 176215" }
  ],
  // JAMMU & KASHMIR
  "Jammu": [
    { id: "JAM_01", name: "Dexit Global Limited - Jammu", address: "Dexit Center, Gandhi Nagar, Jammu - 180004" },
    { id: "JAM_02", name: "NSEIT Limited - Jammu", address: "NSEIT Center, Canal Road, Jammu - 180001" }
  ],
  "Srinagar": [
    { id: "SNG_01", name: "NSEIT Limited - Srinagar", address: "NSEIT Center, Lal Chowk, Srinagar - 190001" }
  ],
  // JHARKHAND
  "Ranchi": [
    { id: "RNC_01", name: "Dexit Global Limited - Ranchi", address: "Dexit Center, Main Road, Ranchi - 834001" },
    { id: "RNC_02", name: "NSEIT Limited - Ranchi", address: "NSEIT Center, Lalpur, Ranchi - 834001" }
  ],
  "Jamshedpur": [
    { id: "JSR_01", name: "NSEIT Limited - Jamshedpur", address: "NSEIT Center, Bistupur, Jamshedpur - 831001" }
  ],
  "Dhanbad": [
    { id: "DHN_01", name: "Dexit Global Limited - Dhanbad", address: "Dexit Center, Bank More, Dhanbad - 826001" }
  ],
  // KARNATAKA
  "Bangalore": [
    { id: "BLR_01", name: "Dexit Global Limited - Bangalore", address: "Dexit Center, Koramangala, Bangalore - 560034" },
    { id: "BLR_02", name: "E MERIT - RT NAGAR", address: "E Merit Center, RT Nagar, Bangalore - 560032" },
    { id: "BLR_03", name: "E NEXT", address: "E Next Test Center, Hebbal, Bangalore - 560024" },
    { id: "BLR_04", name: "MILESTONE TECHNOLOGIES - BANGALORE", address: "Milestone Tech, Bannerghatta Road, Bangalore - 560029" },
    { id: "BLR_05", name: "REVEREND TECHNOLOGIES PVT LTD", address: "Reverend Tech, Whitefield, Bangalore - 560066" },
    { id: "BLR_06", name: "TECHXCELLENCE DIGITAL SOLUTIONS", address: "TechXcellence, JP Nagar, Bangalore - 560078" },
    { id: "BLR_07", name: "TVAKSA TECHNOLOGIES PRIVATE LIMITED", address: "Tvaksa Tech, Electronic City, Bangalore - 560100" }
  ],
  "Hubli": [
    { id: "HUB_01", name: "Dexit Global Limited - Hubli", address: "Dexit Center, Keshwapur, Hubli - 580023" },
    { id: "HUB_02", name: "NSEIT Limited - Hubli", address: "NSEIT Center, Deshpande Nagar, Hubli - 580029" }
  ],
  "Mangalore": [
    { id: "MNG_01", name: "Dexit Global Limited - Mangalore", address: "Dexit Center, Lalbagh, Mangalore - 575003" },
    { id: "MNG_02", name: "NSEIT Limited - Mangalore", address: "NSEIT Center, Attavar, Mangalore - 575001" }
  ],
  "Mysore": [
    { id: "MYS_01", name: "Dexit Global Limited - Mysore", address: "Dexit Center, Saraswathipuram, Mysore - 570009" },
    { id: "MYS_02", name: "NSEIT Limited - Mysore", address: "NSEIT Center, Kuvempunagar, Mysore - 570023" }
  ],
  "Belgaum": [
    { id: "BLG_01", name: "NSEIT Limited - Belgaum", address: "NSEIT Center, Tilakwadi, Belgaum - 590006" }
  ],
  "Davangere": [
    { id: "DVG_01", name: "NSEIT Limited - Davangere", address: "NSEIT Center, PJ Extension, Davangere - 577002" }
  ],
  "Gulbarga": [
    { id: "GBG_01", name: "NSEIT Limited - Gulbarga", address: "NSEIT Center, Super Market Area, Gulbarga - 585101" }
  ],
  "Shimoga": [
    { id: "SHM_01", name: "NSEIT Limited - Shimoga", address: "NSEIT Center, Vinoba Nagar, Shimoga - 577201" }
  ],
  "Tumkur": [
    { id: "TMK_01", name: "NSEIT Limited - Tumkur", address: "NSEIT Center, SS Puram, Tumkur - 572102" }
  ],
  "Udupi": [
    { id: "UDP_01", name: "NSEIT Limited - Udupi", address: "NSEIT Center, Manipal, Udupi - 576104" }
  ],
  // KERALA
  "Ernakulam": [
    { id: "EKM_01", name: "Dexit Global Limited - Ernakulam", address: "Dexit Center, MG Road, Ernakulam - 682016" },
    { id: "EKM_02", name: "NSEIT Limited - Ernakulam", address: "NSEIT Center, Ravipuram, Ernakulam - 682015" }
  ],
  "Thiruvananthapuram": [
    { id: "TRV_01", name: "Dexit Global Limited - Thiruvananthapuram", address: "Dexit Center, Vazhuthacaud, Thiruvananthapuram - 695014" },
    { id: "TRV_02", name: "NSEIT Limited - Thiruvananthapuram", address: "NSEIT Center, Statue Junction, Thiruvananthapuram - 695001" }
  ],
  "Kozhikode": [
    { id: "CLT_01", name: "Dexit Global Limited - Kozhikode", address: "Dexit Center, Eranhipalam, Kozhikode - 673006" },
    { id: "CLT_02", name: "NSEIT Limited - Kozhikode", address: "NSEIT Center, Arayidathupalam, Kozhikode - 673016" }
  ],
  "Thrissur": [
    { id: "TCR_01", name: "Dexit Global Limited - Thrissur", address: "Dexit Center, Round South, Thrissur - 680001" },
    { id: "TCR_02", name: "NSEIT Limited - Thrissur", address: "NSEIT Center, Thrissur - 680001" }
  ],
  "Kannur": [
    { id: "CNN_01", name: "NSEIT Limited - Kannur", address: "NSEIT Center, Burnassery, Kannur - 670012" }
  ],
  "Kottayam": [
    { id: "KTM_01", name: "NSEIT Limited - Kottayam", address: "NSEIT Center, Nagampadom, Kottayam - 686001" }
  ],
  "Palakkad": [
    { id: "PKD_01", name: "NSEIT Limited - Palakkad", address: "NSEIT Center, Palakkad - 678001" }
  ],
  "Malappuram": [
    { id: "MLP_01", name: "NSEIT Limited - Malappuram", address: "NSEIT Center, Malappuram - 676505" }
  ],
  "Alappuzha": [
    { id: "ALP_01", name: "NSEIT Limited - Alappuzha", address: "NSEIT Center, Alappuzha - 688001" }
  ],
  // MADHYA PRADESH
  "Indore": [
    { id: "IND_01", name: "Dexit Global Limited - Indore", address: "Dexit Center, Vijay Nagar, Indore - 452010" },
    { id: "IND_02", name: "NSEIT Limited - Indore", address: "NSEIT Center, Palasia Square, Indore - 452001" }
  ],
  "Bhopal": [
    { id: "BPL_01", name: "Dexit Global Limited - Bhopal", address: "Dexit Center, MP Nagar, Bhopal - 462011" },
    { id: "BPL_02", name: "NSEIT Limited - Bhopal", address: "NSEIT Center, Shivaji Nagar, Bhopal - 462016" }
  ],
  "Gwalior": [
    { id: "GWL_01", name: "NSEIT Limited - Gwalior", address: "NSEIT Center, City Center, Gwalior - 474001" }
  ],
  "Jabalpur": [
    { id: "JBP_01", name: "NSEIT Limited - Jabalpur", address: "NSEIT Center, Wright Town, Jabalpur - 482001" }
  ],
  "Ujjain": [
    { id: "UJN_01", name: "NSEIT Limited - Ujjain", address: "NSEIT Center, Freeganj, Ujjain - 456010" }
  ],
  // MAHARASHTRA
  "Mumbai": [
    { id: "MUM_01", name: "Dexit Global Limited - Mumbai", address: "Dexit Center, Andheri East, Mumbai - 400069" },
    { id: "MUM_02", name: "NSEIT Limited - Mumbai BKC", address: "NSEIT Center, BKC, Bandra East, Mumbai - 400051" },
    { id: "MUM_03", name: "E MERIT - Mumbai", address: "E Merit Center, Borivali West, Mumbai - 400091" }
  ],
  "Pune": [
    { id: "PUN_01", name: "Dexit Global Limited - Pune", address: "Dexit Center, Kothrud, Pune - 411038" },
    { id: "PUN_02", name: "NSEIT Limited - Pune", address: "NSEIT Center, Shivajinagar, Pune - 411005" }
  ],
  "Nagpur": [
    { id: "NGP_01", name: "Dexit Global Limited - Nagpur", address: "Dexit Center, Dharampeth, Nagpur - 440010" },
    { id: "NGP_02", name: "NSEIT Limited - Nagpur", address: "NSEIT Center, Sitabuldi, Nagpur - 440012" }
  ],
  "Nashik": [
    { id: "NAS_01", name: "Dexit Global Limited - Nashik", address: "Dexit Center, Mahatma Nagar, Nashik - 422007" },
    { id: "NAS_02", name: "NSEIT Limited - Nashik", address: "NSEIT Center, College Road, Nashik - 422005" }
  ],
  "Thane": [
    { id: "THA_01", name: "Dexit Global Limited - Thane", address: "Dexit Center, Naupada, Thane - 400602" }
  ],
  "Navi Mumbai": [
    { id: "NMB_01", name: "Dexit Global Limited - Navi Mumbai", address: "Dexit Center, Vashi, Navi Mumbai - 400703" },
    { id: "NMB_02", name: "NSEIT Limited - Navi Mumbai", address: "NSEIT Center, CBD Belapur, Navi Mumbai - 400614" }
  ],
  "Aurangabad": [
    { id: "AUR_01", name: "Dexit Global Limited - Aurangabad", address: "Dexit Center, CIDCO, Aurangabad - 431003" }
  ],
  "Kolhapur": [
    { id: "KLP_01", name: "NSEIT Limited - Kolhapur", address: "NSEIT Center, Rajarampuri, Kolhapur - 416008" }
  ],
  "Solapur": [
    { id: "SLR_01", name: "NSEIT Limited - Solapur", address: "NSEIT Center, Budhwar Peth, Solapur - 413002" }
  ],
  "Amravati": [
    { id: "AMR_01", name: "NSEIT Limited - Amravati", address: "NSEIT Center, Camp Area, Amravati - 444602" }
  ],
  "Akola": [
    { id: "AKL_01", name: "NSEIT Limited - Akola", address: "NSEIT Center, Civil Lines, Akola - 444001" }
  ],
  // ODISHA
  "Bhubaneswar": [
    { id: "BHU_01", name: "Dexit Global Limited - Bhubaneswar", address: "Dexit Center, Sahid Nagar, Bhubaneswar - 751007" },
    { id: "BHU_02", name: "NSEIT Limited - Bhubaneswar", address: "NSEIT Center, Nayapalli, Bhubaneswar - 751012" }
  ],
  "Cuttack": [
    { id: "CTK_01", name: "NSEIT Limited - Cuttack", address: "NSEIT Center, Buxi Bazar, Cuttack - 753001" }
  ],
  "Rourkela": [
    { id: "RKL_01", name: "NSEIT Limited - Rourkela", address: "NSEIT Center, Rourkela - 769001" }
  ],
  "Sambalpur": [
    { id: "SBP_01", name: "NSEIT Limited - Sambalpur", address: "NSEIT Center, Sambalpur - 768001" }
  ],
  // PUNJAB
  "Ludhiana": [
    { id: "LDH_01", name: "Dexit Global Limited - Ludhiana", address: "Dexit Center, Ferozepur Road, Ludhiana - 141001" },
    { id: "LDH_02", name: "NSEIT Limited - Ludhiana", address: "NSEIT Center, Model Town, Ludhiana - 141002" }
  ],
  "Amritsar": [
    { id: "ASR_01", name: "Dexit Global Limited - Amritsar", address: "Dexit Center, Lawrence Road, Amritsar - 143001" },
    { id: "ASR_02", name: "NSEIT Limited - Amritsar", address: "NSEIT Center, Ranjit Avenue, Amritsar - 143001" }
  ],
  "Jalandhar": [
    { id: "JUC_01", name: "Dexit Global Limited - Jalandhar", address: "Dexit Center, Model Town, Jalandhar - 144001" }
  ],
  "Patiala": [
    { id: "PTL_01", name: "NSEIT Limited - Patiala", address: "NSEIT Center, Leela Bhawan, Patiala - 147001" }
  ],
  "Mohali": [
    { id: "MOH_01", name: "Dexit Global Limited - Mohali", address: "Dexit Center, Phase 10, Mohali - 160062" },
    { id: "MOH_02", name: "NSEIT Limited - Mohali", address: "NSEIT Center, Phase 7, Mohali - 160059" }
  ],
  "Bathinda": [
    { id: "BTI_01", name: "NSEIT Limited - Bathinda", address: "NSEIT Center, Bathinda - 151001" }
  ],
  // RAJASTHAN
  "Jaipur": [
    { id: "JAI_01", name: "Dexit Global Limited - Jaipur", address: "Dexit Center, Malviya Nagar, Jaipur - 302017" },
    { id: "JAI_02", name: "NSEIT Limited - Jaipur", address: "NSEIT Center, MI Road, Jaipur - 302001" },
    { id: "JAI_03", name: "E MERIT - Jaipur", address: "E Merit Center, Jagatpura, Jaipur - 302017" }
  ],
  "Jodhpur": [
    { id: "JDH_01", name: "Dexit Global Limited - Jodhpur", address: "Dexit Center, Chopasni Road, Jodhpur - 342001" }
  ],
  "Udaipur": [
    { id: "UDR_01", name: "NSEIT Limited - Udaipur", address: "NSEIT Center, Chetak Circle, Udaipur - 313001" }
  ],
  "Kota": [
    { id: "KOT_01", name: "NSEIT Limited - Kota", address: "NSEIT Center, DC Square, Kota - 324007" }
  ],
  "Ajmer": [
    { id: "AJM_01", name: "NSEIT Limited - Ajmer", address: "NSEIT Center, Nasirabad Road, Ajmer - 305001" }
  ],
  "Bikaner": [
    { id: "BKN_01", name: "NSEIT Limited - Bikaner", address: "NSEIT Center, Bikaner - 334001" }
  ],
  // TAMIL NADU
  "Chennai": [
    { id: "MAA_01", name: "Dexit Global Limited - Chennai", address: "Dexit Center, Anna Nagar, Chennai - 600040" },
    { id: "MAA_02", name: "NSEIT Limited - Chennai", address: "NSEIT Center, Mount Road, Chennai - 600002" },
    { id: "MAA_03", name: "E MERIT - Chennai", address: "E Merit Center, Tambaram, Chennai - 600045" }
  ],
  "Coimbatore": [
    { id: "CBE_01", name: "Dexit Global Limited - Coimbatore", address: "Dexit Center, RS Puram, Coimbatore - 641002" },
    { id: "CBE_02", name: "NSEIT Limited - Coimbatore", address: "NSEIT Center, Gandhipuram, Coimbatore - 641012" }
  ],
  "Madurai": [
    { id: "MDU_01", name: "Dexit Global Limited - Madurai", address: "Dexit Center, KK Nagar, Madurai - 625020" },
    { id: "MDU_02", name: "NSEIT Limited - Madurai", address: "NSEIT Center, Bibi Kulam, Madurai - 625002" }
  ],
  "Salem": [
    { id: "SLM_01", name: "NSEIT Limited - Salem", address: "NSEIT Center, Alagapuram, Salem - 636016" }
  ],
  "Tiruchirappalli": [
    { id: "TRZ_01", name: "Dexit Global Limited - Trichy", address: "Dexit Center, Thillai Nagar, Trichy - 620018" }
  ],
  "Tirupur": [
    { id: "TUP_01", name: "NSEIT Limited - Tirupur", address: "NSEIT Center, Tirupur - 641601" }
  ],
  "Erode": [
    { id: "ERD_01", name: "NSEIT Limited - Erode", address: "NSEIT Center, Erode - 638001" }
  ],
  "Vellore": [
    { id: "VLR_01", name: "NSEIT Limited - Vellore", address: "NSEIT Center, Gandhi Nagar, Vellore - 632006" }
  ],
  // TELANGANA
  "Hyderabad": [
    { id: "HYD_01", name: "Dexit Global Limited - Hyderabad", address: "Dexit Center, Begumpet, Hyderabad - 500016" },
    { id: "HYD_02", name: "NSEIT Limited - Hyderabad", address: "NSEIT Center, Ameerpet, Hyderabad - 500016" },
    { id: "HYD_03", name: "E MERIT - Hyderabad", address: "E Merit Center, Kukatpally, Hyderabad - 500072" }
  ],
  "Secunderabad": [
    { id: "SCB_01", name: "Dexit Global Limited - Secunderabad", address: "Dexit Center, SD Road, Secunderabad - 500003" }
  ],
  "Warangal": [
    { id: "WGL_01", name: "NSEIT Limited - Warangal", address: "NSEIT Center, Hanamkonda, Warangal - 506001" }
  ],
  "Karimnagar": [
    { id: "KMR_01", name: "NSEIT Limited - Karimnagar", address: "NSEIT Center, Karimnagar - 505001" }
  ],
  "Nizamabad": [
    { id: "NZB_01", name: "NSEIT Limited - Nizamabad", address: "NSEIT Center, Nizamabad - 503001" }
  ],
  // UTTAR PRADESH
  "Lucknow": [
    { id: "LKO_01", name: "Dexit Global Limited - Lucknow", address: "Dexit Center, Hazratganj, Lucknow - 226001" },
    { id: "LKO_02", name: "NSEIT Limited - Lucknow", address: "NSEIT Center, Vibhuti Khand, Lucknow - 226010" }
  ],
  "Kanpur": [
    { id: "CNB_01", name: "Dexit Global Limited - Kanpur", address: "Dexit Center, Civil Lines, Kanpur - 208001" },
    { id: "CNB_02", name: "NSEIT Limited - Kanpur", address: "NSEIT Center, Kidwai Nagar, Kanpur - 208011" }
  ],
  "Allahabad": [
    { id: "ALD_01", name: "NSEIT Limited - Prayagraj", address: "NSEIT Center, Allahpur, Prayagraj - 211006" }
  ],
  "Varanasi": [
    { id: "VNS_01", name: "Dexit Global Limited - Varanasi", address: "Dexit Center, Sigra, Varanasi - 221010" }
  ],
  "Agra": [
    { id: "AGR_01", name: "NSEIT Limited - Agra", address: "NSEIT Center, Sanjay Place, Agra - 282002" }
  ],
  "Meerut": [
    { id: "MRT_01", name: "NSEIT Limited - Meerut", address: "NSEIT Center, Begum Bridge, Meerut - 250001" }
  ],
  "Ghaziabad": [
    { id: "GZB_UP_01", name: "Dexit Global Limited - Ghaziabad", address: "Dexit Center, Raj Nagar, Ghaziabad - 201002" }
  ],
  "Bareilly": [
    { id: "BEL_01", name: "NSEIT Limited - Bareilly", address: "NSEIT Center, Civil Lines, Bareilly - 243001" }
  ],
  // UTTARAKHAND
  "Dehradun": [
    { id: "DDN_01", name: "Dexit Global Limited - Dehradun", address: "Dexit Center, Rajpur Road, Dehradun - 248001" },
    { id: "DDN_02", name: "NSEIT Limited - Dehradun", address: "NSEIT Center, Paltan Bazar, Dehradun - 248001" }
  ],
  "Haridwar": [
    { id: "HRW_01", name: "NSEIT Limited - Haridwar", address: "NSEIT Center, Jwalapur Road, Haridwar - 249401" }
  ],
  "Haldwani": [
    { id: "HLW_01", name: "NSEIT Limited - Haldwani", address: "NSEIT Center, Nainital Road, Haldwani - 263139" }
  ],
  // WEST BENGAL
  "Kolkata": [
    { id: "CCU_01", name: "Dexit Global Limited - Kolkata", address: "Dexit Center, Park Street, Kolkata - 700016" },
    { id: "CCU_02", name: "NSEIT Limited - Kolkata", address: "NSEIT Center, Salt Lake, Kolkata - 700091" },
    { id: "CCU_03", name: "E MERIT - Kolkata", address: "E Merit Center, Ultadanga, Kolkata - 700067" }
  ],
  "Siliguri": [
    { id: "SIL_WB_01", name: "NSEIT Limited - Siliguri", address: "NSEIT Center, Sevoke Road, Siliguri - 734001" }
  ],
  "Asansol": [
    { id: "ASN_01", name: "NSEIT Limited - Asansol", address: "NSEIT Center, GT Road, Asansol - 713301" }
  ],
  "Durgapur": [
    { id: "DGP_01", name: "NSEIT Limited - Durgapur", address: "NSEIT Center, City Centre, Durgapur - 713216" }
  ],
  // CHANDIGARH
  "Chandigarh": [
    { id: "CHD_01", name: "Dexit Global Limited - Chandigarh", address: "Dexit Center, Sector 35, Chandigarh - 160035" },
    { id: "CHD_02", name: "NSEIT Limited - Chandigarh", address: "NSEIT Center, Sector 22, Chandigarh - 160022" }
  ],
  // PONDICHERRY
  "Puducherry": [
    { id: "PUD_01", name: "NSEIT Limited - Puducherry", address: "NSEIT Center, MG Road, Puducherry - 605001" }
  ]
};

// ─────────────────────────────────────────────────────────────
// 4. BOS Adv MCS / Adv ITT – Courses (from icaionlineregistration.org)
// ─────────────────────────────────────────────────────────────
export const ADV_COURSES = [
  { id: "48", name: "AICITSS - Advanced Information Technology (Adv ITT)" },
  { id: "45", name: "Advanced (ICITSS) MCS Course (Adv MCS)" },
  { id: "49", name: "Advanced (ICITSS) MCS Course - Weekend" },
  { id: "47", name: "ICITSS - Information Technology (ITT)" },
  { id: "46", name: "ICITSS - Orientation Course (MCS)" }
];

// ─────────────────────────────────────────────────────────────
// 5. BOS Adv MCS / Adv ITT – Regions (from icaionlineregistration.org)
// ─────────────────────────────────────────────────────────────
export const ADV_ZONES = [
  { id: "4", name: "Southern" },
  { id: "2", name: "Western" },
  { id: "3", name: "Northern" },
  { id: "1", name: "Eastern" },
  { id: "5", name: "Central" }
];

// ─────────────────────────────────────────────────────────────
// 6. BOS – POUs per Region (exact from icaionlineregistration.org Pou dropdown)
// ─────────────────────────────────────────────────────────────
export const ADV_POUS_BY_ZONE = {
  "4": [ // Southern
    { id: "Alappuzha",     city: "Alappuzha",     name: "Alappuzha Branch - SIRC",         address: "ICAI Bhawan, Alappuzha, Kerala - 688001" },
    { id: "Anantapur",     city: "Anantapur",     name: "Anantapur Branch - SIRC",          address: "ICAI Bhawan, Anantapur, AP - 515001" },
    { id: "Ballari",       city: "Ballari",       name: "Ballari Branch - SIRC",            address: "ICAI Bhawan, Ballari, Karnataka - 583101" },
    { id: "Belagavi",      city: "Belagavi",      name: "Belagavi Branch - SIRC",           address: "ICAI Bhawan, Belgaum, Karnataka - 590006" },
    { id: "BENGALURU",     city: "Bengaluru",     name: "Bengaluru Branch - SIRC",          address: "ICAI Bhawan, 16/0 Millers Tank Bed Area, Vasanthnagar, Bengaluru - 560052" },
    { id: "Chengalpattu",  city: "Chengalpattu",  name: "Chengalpattu Branch - SIRC",       address: "ICAI Bhawan, Chengalpattu, Tamil Nadu - 603001" },
    { id: "CHENNAI",       city: "Chennai",       name: "SIRC Chennai",                     address: "ICAI Bhawan, 122 MG Road, Nungambakkam, Chennai - 600034" },
    { id: "COIMBATORE",    city: "Coimbatore",    name: "Coimbatore Branch - SIRC",         address: "ICAI Bhawan, Mettupalayam Road, Coimbatore - 641034" },
    { id: "ERNAKULAM",     city: "Ernakulam",     name: "Ernakulam Branch - SIRC",          address: "ICAI Bhawan, Dewan's Road, Ernakulam, Kochi - 682016" },
    { id: "ERODE",         city: "Erode",         name: "Erode Branch - SIRC",              address: "ICAI Bhawan, Erode, Tamil Nadu - 638001" },
    { id: "GUNTUR",        city: "Guntur",        name: "Guntur Branch - SIRC",             address: "ICAI Bhawan, Guntur, AP - 522002" },
    { id: "HUBBALLI",      city: "Hubballi",      name: "Hubballi Branch - SIRC",           address: "ICAI Bhawan, Hubli, Karnataka - 580029" },
    { id: "HYDERABAD",     city: "Hyderabad",     name: "Hyderabad Branch - SIRC",          address: "ICAI Bhawan, 11-5-398/C, Red Hills, Lakdikapul, Hyderabad - 500004" },
    { id: "KADAPA",        city: "Kadapa",        name: "Kadapa Branch - SIRC",             address: "ICAI Bhawan, Kadapa, AP - 516001" },
    { id: "KAKINADA",      city: "Kakinada",      name: "Kakinada Branch - SIRC",           address: "ICAI Bhawan, Kakinada, AP - 533001" },
    { id: "Kalaburgi",     city: "Kalaburgi",     name: "Kalaburgi Branch - SIRC",          address: "ICAI Bhawan, Kalaburgi, Karnataka - 585101" },
    { id: "KANNUR",        city: "Kannur",        name: "Kannur Branch - SIRC",             address: "ICAI Bhawan, Kannur, Kerala - 670001" },
    { id: "KARIMNAGAR",    city: "Karimnagar",    name: "Karimnagar Branch - SIRC",         address: "ICAI Bhawan, Karimnagar, Telangana - 505001" },
    { id: "Kollam",        city: "Kollam",        name: "Kollam Branch - SIRC",             address: "ICAI Bhawan, Kollam, Kerala - 691001" },
    { id: "KOTTAYAM",      city: "Kottayam",      name: "Kottayam Branch - SIRC",           address: "ICAI Bhawan, Nagampadom, Kottayam - 686001" },
    { id: "KOZHIKODE",     city: "Kozhikode",     name: "Kozhikode Branch - SIRC",          address: "ICAI Bhawan, Eranhipalam, Kozhikode - 673006" },
    { id: "MADURAI",       city: "Madurai",       name: "Madurai Branch - SIRC",            address: "ICAI Bhawan, 182-B Sundaram Mill Compound, Madurai - 625002" },
    { id: "MANGALURU",     city: "Mangaluru",     name: "Mangaluru Branch - SIRC",          address: "ICAI Bhawan, Attavar, Mangaluru - 575001" },
    { id: "MYSURU",        city: "Mysuru",        name: "Mysuru Branch - SIRC",             address: "ICAI Bhawan, Bank Canal Road, Mysore - 570020" },
    { id: "NELLORE",       city: "Nellore",       name: "Nellore Branch - SIRC",            address: "ICAI Bhawan, Nellore, AP - 524001" },
    { id: "PALAKKAD",      city: "Palakkad",      name: "Palakkad Branch - SIRC",           address: "ICAI Bhawan, Palakkad, Kerala - 678001" },
    { id: "Pondicherry",   city: "Pondicherry",   name: "Pondicherry Branch - SIRC",        address: "ICAI Bhawan, MG Road, Puducherry - 605001" },
    { id: "RAJAMUNDRY",    city: "Rajamundry",    name: "Rajamundry Branch - SIRC",         address: "ICAI Bhawan, Rajahmundry, AP - 533101" },
    { id: "SALEM",         city: "Salem",         name: "Salem Branch - SIRC",              address: "ICAI Bhawan, Alagapuram, Salem - 636016" },
    { id: "THRISSUR",      city: "Thrissur",      name: "Thrissur Branch - SIRC",           address: "ICAI Bhawan, Round South, Thrissur - 680001" },
    { id: "TIRUNELVELI",   city: "Tirunelveli",   name: "Tirunelveli Branch - SIRC",        address: "ICAI Bhawan, Tirunelveli, Tamil Nadu - 627001" },
    { id: "TIRUCHIRAPALLI", city: "Tiruchirapalli", name: "Tiruchirapalli Branch - SIRC",   address: "ICAI Bhawan, Thillai Nagar, Trichy - 620018" },
    { id: "TIRUPUR",       city: "Tirupur",       name: "Tirupur Branch - SIRC",            address: "ICAI Bhawan, Tirupur, Tamil Nadu - 641601" },
    { id: "THIRUVANANTHAPURAM", city: "Thiruvananthapuram", name: "Thiruvananthapuram Branch - SIRC", address: "ICAI Bhawan, Cotton Hill, Vazhuthacaud, Thiruvananthapuram - 695014" },
    { id: "VIJAYAWADA",    city: "Vijayawada",    name: "Vijayawada Branch - SIRC",         address: "ICAI Bhawan, Governerpet, Vijayawada - 520002" },
    { id: "VISAKHAPATNAM", city: "Visakhapatnam", name: "Visakhapatnam Branch - SIRC",      address: "ICAI Bhawan, Waltair Uplands, Visakhapatnam - 530003" },
    { id: "VELLORE",       city: "Vellore",       name: "Vellore Branch - SIRC",            address: "ICAI Bhawan, Gandhi Nagar, Vellore - 632006" },
    { id: "WARANGAL",      city: "Warangal",      name: "Warangal Branch - SIRC",           address: "ICAI Bhawan, Hanamkonda, Warangal - 506001" }
  ],
  "2": [ // Western
    { id: "AHMEDABAD",     city: "Ahmedabad",     name: "Ahmedabad Branch - WIRC",          address: "ICAI Bhawan, 123 Sardar Patel Colony, Naranpura, Ahmedabad - 380014" },
    { id: "Anand",         city: "Anand",         name: "Anand Branch - WIRC",              address: "ICAI Bhawan, Anand, Gujarat - 388001" },
    { id: "AURANGABAD",    city: "Aurangabad",    name: "Aurangabad Branch - WIRC",         address: "ICAI Bhawan, CIDCO, Chhatrapati Sambhajinagar - 431003" },
    { id: "BHAVNAGAR",     city: "Bhavnagar",     name: "Bhavnagar Branch - WIRC",          address: "ICAI Bhawan, Bhavnagar, Gujarat - 364001" },
    { id: "GOA",           city: "Goa",           name: "Goa Branch - WIRC",                address: "ICAI Bhawan, Patto Plaza, Panaji, Goa - 403001" },
    { id: "JAMNAGAR",      city: "Jamnagar",      name: "Jamnagar Branch - WIRC",           address: "ICAI Bhawan, Jamnagar, Gujarat - 361001" },
    { id: "KOLHAPUR",      city: "Kolhapur",      name: "Kolhapur Branch - WIRC",           address: "ICAI Bhawan, Rajarampuri, Kolhapur - 416008" },
    { id: "MUMBAI",        city: "Mumbai",        name: "WIRC Mumbai (BKC)",                address: "ICAI Tower, Plot No. C-40, G Block, BKC, Bandra East, Mumbai - 400051" },
    { id: "NAGPUR",        city: "Nagpur",        name: "Nagpur Branch - WIRC",             address: "ICAI Bhawan, 20/9 Dhantoli, Nagpur - 440012" },
    { id: "NASHIK",        city: "Nashik",        name: "Nashik Branch - WIRC",             address: "ICAI Bhawan, Near Kulkarni Garden, Nashik - 422005" },
    { id: "PUNE",          city: "Pune",          name: "Pune Branch - WIRC",               address: "ICAI Bhawan, Plot No. 8, Parshwanath Nagar, Bibwewadi, Pune - 411037" },
    { id: "RAJKOT",        city: "Rajkot",        name: "Rajkot Branch - WIRC",             address: "ICAI Bhawan, Sardar Nagar, Rajkot - 360001" },
    { id: "SOLAPUR",       city: "Solapur",       name: "Solapur Branch - WIRC",            address: "ICAI Bhawan, Budhwar Peth, Solapur - 413002" },
    { id: "SURAT",         city: "Surat",         name: "Surat Branch - WIRC",              address: "ICAI Bhawan, Near Majura Gate, Ring Road, Surat - 395002" },
    { id: "THANE",         city: "Thane",         name: "Thane Branch - WIRC",              address: "ICAI Bhawan, Balkum Road, Thane (W) - 400608" },
    { id: "VADODARA",      city: "Vadodara",      name: "Vadodara Branch - WIRC",           address: "ICAI Bhawan, Kalali-Talsat Road, Vadodara - 390012" }
  ],
  "3": [ // Northern
    { id: "AGRA",          city: "Agra",          name: "Agra Branch - NIRC",               address: "ICAI Bhawan, Sanjay Place, Agra - 282002" },
    { id: "AJMER",         city: "Ajmer",         name: "Ajmer Branch - NIRC",              address: "ICAI Bhawan, Nasirabad Road, Ajmer - 305001" },
    { id: "AMRITSAR",      city: "Amritsar",      name: "Amritsar Branch - NIRC",           address: "ICAI Bhawan, Lawrence Road, Amritsar - 143001" },
    { id: "BAREILLY",      city: "Bareilly",      name: "Bareilly Branch - NIRC",           address: "ICAI Bhawan, Civil Lines, Bareilly - 243001" },
    { id: "BATHINDA",      city: "Bathinda",      name: "Bathinda Branch - NIRC",           address: "ICAI Bhawan, Bathinda, Punjab - 151001" },
    { id: "BIKANER",       city: "Bikaner",       name: "Bikaner Branch - NIRC",            address: "ICAI Bhawan, Bikaner, Rajasthan - 334001" },
    { id: "CHANDIGARH",    city: "Chandigarh",    name: "Chandigarh Branch - NIRC",         address: "ICAI Bhawan, Sector 35-B, Chandigarh - 160022" },
    { id: "DEHRADUN",      city: "Dehradun",      name: "Dehradun Branch - NIRC",           address: "ICAI Bhawan, Rajpur Road, Dehradun - 248001" },
    { id: "JAIPUR",        city: "Jaipur",        name: "Jaipur Branch - NIRC",             address: "ICAI Bhawan, D-1, Jhalana Institutional Area, Jaipur - 302004" },
    { id: "JALANDHAR",     city: "Jalandhar",     name: "Jalandhar Branch - NIRC",          address: "ICAI Bhawan, Ladowali Road, Jalandhar - 144001" },
    { id: "JAMMU",         city: "Jammu",         name: "Jammu Branch - NIRC",              address: "ICAI Bhawan, Canal Road, Jammu - 180001" },
    { id: "JODHPUR",       city: "Jodhpur",       name: "Jodhpur Branch - NIRC",            address: "ICAI Bhawan, Chopasni Road, Jodhpur - 342001" },
    { id: "KANPUR",        city: "Kanpur",        name: "Kanpur Branch - NIRC",             address: "ICAI Bhawan, 16/77 Civil Lines, Kanpur - 208001" },
    { id: "KOTA",          city: "Kota",          name: "Kota Branch - NIRC",               address: "ICAI Bhawan, DC Square, Kota - 324007" },
    { id: "LUDHIANA",      city: "Ludhiana",      name: "Ludhiana Branch - NIRC",           address: "ICAI Bhawan, Pakhowal Road, Ludhiana - 141001" },
    { id: "LUCKNOW",       city: "Lucknow",       name: "Lucknow Branch - NIRC",            address: "ICAI Bhawan, 27/6 Ram Mohan Rai Marg, Lucknow - 226001" },
    { id: "MEERUT",        city: "Meerut",        name: "Meerut Branch - NIRC",             address: "ICAI Bhawan, Begum Bridge, Meerut - 250001" },
    { id: "MOHALI",        city: "Mohali",        name: "Mohali Branch - NIRC",             address: "ICAI Bhawan, Phase 7, Mohali - 160059" },
    { id: "NEWDELHI",      city: "New Delhi",     name: "NIRC New Delhi",                   address: "ICAI Bhawan, 52-54 Institutional Area, Vishwas Nagar, Shahdara, Delhi - 110032" },
    { id: "PATIALA",       city: "Patiala",       name: "Patiala Branch - NIRC",            address: "ICAI Bhawan, Leela Bhawan, Patiala - 147001" },
    { id: "UDAIPUR",       city: "Udaipur",       name: "Udaipur Branch - NIRC",            address: "ICAI Bhawan, Chetak Circle, Udaipur - 313001" },
    { id: "VARANASI",      city: "Varanasi",      name: "Varanasi Branch - NIRC",           address: "ICAI Bhawan, Maldahiya, Varanasi - 221002" }
  ],
  "1": [ // Eastern
    { id: "ASANSOL",       city: "Asansol",       name: "Asansol Branch - EIRC",            address: "ICAI Bhawan, GT Road, Asansol - 713301" },
    { id: "BHUBANESWAR",   city: "Bhubaneswar",   name: "Bhubaneswar Branch - EIRC",        address: "ICAI Bhawan, A/98 Nayapalli, Bhubaneswar - 751012" },
    { id: "CUTTACK",       city: "Cuttack",       name: "Cuttack Branch - EIRC",            address: "ICAI Bhawan, Buxi Bazar, Cuttack - 753001" },
    { id: "DHANBAD",       city: "Dhanbad",       name: "Dhanbad Branch - EIRC",            address: "ICAI Bhawan, Bank More, Dhanbad - 826001" },
    { id: "DURGAPUR",      city: "Durgapur",      name: "Durgapur Branch - EIRC",           address: "ICAI Bhawan, City Centre, Durgapur - 713216" },
    { id: "GUWAHATI",      city: "Guwahati",      name: "Guwahati Branch - EIRC",           address: "ICAI Bhawan, Zoo Road, Guwahati - 781024" },
    { id: "JAMSHEDPUR",    city: "Jamshedpur",    name: "Jamshedpur Branch - EIRC",         address: "ICAI Bhawan, Bistupur, Jamshedpur - 831001" },
    { id: "KOLKATA",       city: "Kolkata",       name: "EIRC Kolkata",                     address: "ICAI Bhawan, 7 Anandilal Poddar Sarani, Russell Street, Kolkata - 700071" },
    { id: "PATNA",         city: "Patna",         name: "Patna Branch - EIRC",              address: "ICAI Bhawan, Exhibition Road, Patna - 800001" },
    { id: "RANCHI",        city: "Ranchi",        name: "Ranchi Branch - EIRC",             address: "ICAI Bhawan, Main Road, Ranchi - 834001" },
    { id: "SILIGURI",      city: "Siliguri",      name: "Siliguri Branch - EIRC",           address: "ICAI Bhawan, Sevoke Road, Siliguri - 734001" }
  ],
  "5": [ // Central
    { id: "AGRA_C",        city: "Agra",          name: "Agra Branch - CIRC",               address: "ICAI Bhawan, Sanjay Place, Agra - 282002" },
    { id: "ALLAHABAD",     city: "Prayagraj",     name: "Prayagraj Branch - CIRC",          address: "ICAI Bhawan, Tashkent Marg, Prayagraj - 211001" },
    { id: "BHOPAL",        city: "Bhopal",        name: "Bhopal Branch - CIRC",             address: "ICAI Bhawan, Zone-1, Maharana Pratap Nagar, Bhopal - 462011" },
    { id: "GWALIOR",       city: "Gwalior",       name: "Gwalior Branch - CIRC",            address: "ICAI Bhawan, City Centre, Gwalior - 474001" },
    { id: "INDORE",        city: "Indore",        name: "Indore Branch - CIRC",             address: "ICAI Bhawan, Plot No. 19B, Scheme 78, Vijay Nagar, Indore - 452010" },
    { id: "JABALPUR",      city: "Jabalpur",      name: "Jabalpur Branch - CIRC",           address: "ICAI Bhawan, Wright Town, Jabalpur - 482001" },
    { id: "KANPUR_C",      city: "Kanpur",        name: "Kanpur Branch - CIRC",             address: "ICAI Bhawan, 16/77 Civil Lines, Kanpur - 208001" },
    { id: "LUCKNOW_C",     city: "Lucknow",       name: "Lucknow Branch - CIRC",            address: "ICAI Bhawan, 27/6 Ram Mohan Rai Marg, Lucknow - 226001" },
    { id: "RAIPUR",        city: "Raipur",        name: "Raipur Branch - CIRC",             address: "ICAI Bhawan, Devendra Nagar, Raipur - 492004" },
    { id: "UJJAIN",        city: "Ujjain",        name: "Ujjain Branch - CIRC",             address: "ICAI Bhawan, Freeganj, Ujjain - 456010" },
    { id: "VARANASI_C",    city: "Varanasi",      name: "Varanasi Branch - CIRC",           address: "ICAI Bhawan, Maldahiya, Varanasi - 221002" }
  ]
};

// ─────────────────────────────────────────────────────────────
// 7. SPOM – Calendar Available Dates (Aug–Sep 2026)
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// 8. Slot Generator – SPOM
// ─────────────────────────────────────────────────────────────
export function getSpomSlots(stateId, city, centerId, selectedDateStr = "") {
  const cityCenters = SPOM_CENTERS_BY_CITY[city] || [
    { id: `CTR_${city.replace(/[^A-Z]/gi, "")}`, name: `Dexit Global Limited - ${city}`, address: `Official ICAI Examination Premises, ${city}` }
  ];
  const selectedCenter = cityCenters.find(c => c.id === centerId) || cityCenters[0];

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
      timing: "Morning Slot (09:30 AM – 12:30 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: Math.max(1, 18 - i * 2),
      totalSeats: 30,
      status: i >= 3 ? "FEW_LEFT" : "AVAILABLE"
    },
    {
      slotId: `SPOM_${d.day}_PM`,
      centerName: selectedCenter.name,
      address: selectedCenter.address,
      examDate: `${d.weekday}, ${d.dateStr}`,
      dateOnly: d.dateStr,
      timing: "Afternoon Slot (02:00 PM – 05:00 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: Math.max(1, 7 + i),
      totalSeats: 30,
      status: i % 2 === 0 ? "FEW_LEFT" : "AVAILABLE"
    }
  ]);
}

// ─────────────────────────────────────────────────────────────
// 9. Batch Generator – BOS Adv MCS / Adv ITT
// ─────────────────────────────────────────────────────────────
export function getAdvIttBatches(courseId, zoneId, pouId) {
  const zonePous = ADV_POUS_BY_ZONE[zoneId] || ADV_POUS_BY_ZONE["4"];
  const selectedPou = zonePous.find(p => p.id === pouId) || zonePous[0] || {
    name: "ICAI Regional Training Center",
    address: "ICAI Bhawan, Main Campus",
    city: "Regional Office"
  };
  const courseObj = ADV_COURSES.find(c => c.id === courseId) || ADV_COURSES[0];
  const now = new Date();

  return [
    {
      batchCode: `${courseObj.id}_${selectedPou.city.toUpperCase().replace(/[^A-Z]/g, "")}_B01`,
      courseName: courseObj.name,
      pouName: selectedPou.name,
      address: selectedPou.address,
      startDate: new Date(now.getTime() + 5 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      endDate: new Date(now.getTime() + 20 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      timings: "10:00 AM – 04:00 PM (Daily)",
      fee: courseId === "48" || courseId === "45" ? "₹7,500" : "₹7,000",
      availableSeats: 19,
      totalCapacity: 40,
      status: "OPEN"
    },
    {
      batchCode: `${courseObj.id}_${selectedPou.city.toUpperCase().replace(/[^A-Z]/g, "")}_B02`,
      courseName: courseObj.name,
      pouName: selectedPou.name,
      address: selectedPou.address,
      startDate: new Date(now.getTime() + 18 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      endDate: new Date(now.getTime() + 33 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      timings: "09:30 AM – 05:30 PM (Daily)",
      fee: courseId === "48" || courseId === "45" ? "₹7,500" : "₹7,000",
      availableSeats: 26,
      totalCapacity: 40,
      status: "OPEN"
    },
    {
      batchCode: `${courseObj.id}_${selectedPou.city.toUpperCase().replace(/[^A-Z]/g, "")}_B03`,
      courseName: courseObj.name,
      pouName: selectedPou.name,
      address: selectedPou.address,
      startDate: new Date(now.getTime() + 30 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      endDate: new Date(now.getTime() + 45 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      timings: "08:00 AM – 04:00 PM (Daily)",
      fee: courseId === "48" || courseId === "45" ? "₹7,500" : "₹7,000",
      availableSeats: 4,
      totalCapacity: 40,
      status: "FEW_LEFT"
    }
  ];
}
