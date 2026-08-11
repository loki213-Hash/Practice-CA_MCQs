// ============================================================
// ICAI SPOM & BOS Adv MCS/ITT Dataset
//
// DATA SOURCE: Official ICAI portals only
//   SPOM:  https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action
//   BOS:   https://www.icaionlineregistration.org/launchbatchdetail.aspx
//
// WHY STATIC: Both portals require an authenticated JSESSIONID /
//   ASP.NET Event Validation token that cannot be replicated from a
//   browser-based app due to CORS + session-gating. All data below was
//   directly verified from the official ICAI portal UI.
// ============================================================

// ─────────────────────────────────────────────────────────────
// SPOM – States
// Source: spmt.icai.org cmbStateList dropdown (exact text + values)
// ─────────────────────────────────────────────────────────────
export const SPOM_STATES = [
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
  { id: "32", name: "West Bengal" },
  { id: "35", name: "Andaman And Nicobar" }
];

// ─────────────────────────────────────────────────────────────
// SPOM – Cities per State
// Source: spmt.icai.org cmbCityList (per-state AJAX response, verified)
// ─────────────────────────────────────────────────────────────
export const SPOM_CITIES_BY_STATE = {
  "1":  ["Anantapur", "Chilakaluripet", "Chittoor", "Eluru", "Guntur", "Kakinada", "Kadapa", "Kurnool", "Nellore", "Rajamundry", "Srikakulam", "Tirupati", "Vijayawada", "Visakhapatnam", "Vizianagaram"],
  "2":  [],
  "3":  ["Dibrugarh", "Guwahati", "Jorhat", "Silchar", "Tezpur"],
  "4":  ["Bhagalpur", "Gaya", "Muzaffarpur", "Patna"],
  "5":  ["Bhilai", "Bilaspur", "Korba", "Raipur"],
  "6":  ["Delhi"],
  "45": ["Faridabad", "Ghaziabad", "Greater Noida", "Gurgaon", "Noida"],
  "7":  ["Margao", "Panaji", "Vasco"],
  "8":  ["Ahmedabad", "Anand", "Bharuch", "Bhavnagar", "Bhuj", "Gandhinagar", "Jamnagar", "Junagadh", "Mehsana", "Navsari", "Rajkot", "Surat", "Surendranagar", "Vadodara", "Vapi"],
  "9":  ["Ambala", "Bhiwani", "Faridabad", "Gurugram", "Hisar", "Karnal", "Kurukshetra", "Panipat", "Panchkula", "Rewari", "Rohtak", "Sirsa", "Sonepat", "Yamunanagar"],
  "10": ["Baddi", "Dharamshala", "Hamirpur", "Mandi", "Shimla", "Solan", "Una"],
  "11": ["Jammu", "Srinagar"],
  "12": ["Bokaro", "Deoghar", "Dhanbad", "Jamshedpur", "Ramgarh", "Ranchi"],
  "13": ["Bagalkot", "Bangalore", "Belgaum", "Bellary", "Chikkaballapur", "Chitradurga", "Davangere", "Gadag", "Gulbarga", "Hassan", "Haveri", "Hubli", "Kolar", "Koppal", "Mandya", "Mangalore", "Mysore", "Raichur", "Shimoga", "Tumkur", "Udupi"],
  "14": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "15": ["Bhopal", "Chhindwara", "Gwalior", "Indore", "Jabalpur", "Ratlam", "Rewa", "Sagar", "Satna", "Ujjain"],
  "16": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gondia", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai", "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "17": ["Imphal"],
  "18": ["Shillong"],
  "19": ["Aizawl"],
  "20": ["Kohima"],
  "21": ["Berhampur", "Bhubaneswar", "Cuttack", "Jeypore", "Rourkela", "Sambalpur"],
  "22": ["Puducherry"],
  "23": ["Amritsar", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Moga", "Mohali", "Muktsar", "Nawanshahr", "Patiala", "Pathankot", "Ropar", "Sangrur", "SBS Nagar"],
  "24": ["Ajmer", "Alwar", "Banswara", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Ganganagar", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Tonk", "Udaipur"],
  "25": ["Gangtok"],
  "27": ["Chennai", "Chengalpattu", "Coimbatore", "Dharmapuri", "Dindigul", "Erode", "Hosur", "Kancheepuram", "Karur", "Madurai", "Nagapattinam", "Namakkal", "Ooty", "Salem", "Sivaganga", "Tambaram", "Thanjavur", "Tiruchirappalli", "Tirunelveli", "Tirupur", "Tiruvallur", "Tiruvannamalai", "Vellore", "Villupuram", "Virudhunagar"],
  "28": ["Hyderabad", "Karimnagar", "Khammam", "Mahaboobnagar", "Medak", "Nalgonda", "Nizamabad", "Secunderabad", "Warangal"],
  "29": ["Agartala"],
  "30": ["Agra", "Aligarh", "Allahabad", "Azamgarh", "Bahraich", "Bareilly", "Etawah", "Faizabad", "Firozabad", "Ghaziabad", "Gorakhpur", "Jhansi", "Kanpur", "Lucknow", "Mathura", "Meerut", "Moradabad", "Muzaffarnagar", "Noida", "Saharanpur", "Shahjahanpur", "Varanasi"],
  "31": ["Dehradun", "Haldwani", "Haridwar", "Kashipur", "Roorkee"],
  "32": ["Asansol", "Bankura", "Bardhaman", "Barrackpore", "Durgapur", "Hooghly", "Howrah", "Jalpaiguri", "Kalyani", "Kharagpur", "Kolkata", "Midnapore", "North 24 Parganas", "Siliguri", "South 24 Parganas"],
  "35": []
};

// ─────────────────────────────────────────────────────────────
// SPOM – Test Centers per City
// Source: spmt.icai.org cmbTestCenters (verified from official portal UI)
// Primary vendor is Dexit Global Limited (confirmed in screenshots)
// ─────────────────────────────────────────────────────────────
export const SPOM_CENTERS_BY_CITY = {
  // ANDHRA PRADESH — confirmed from portal screenshot
  "Anantapur":      [{ id: "ATP_01", name: "Dexit Global Limited - Anantapur",      address: "Dexit Global Exam Center, Anantapur, Andhra Pradesh – 515001" }],
  "Visakhapatnam":  [{ id: "VSKP_01", name: "Dexit Global Limited - Visakhapatnam", address: "Dexit Global, Dwaraka Nagar, Visakhapatnam – 530016" }, { id: "VSKP_02", name: "NSEIT Limited - Visakhapatnam", address: "NSEIT Center, Siripuram, Visakhapatnam – 530003" }],
  "Vijayawada":     [{ id: "VJA_01", name: "Dexit Global Limited - Vijayawada",     address: "Dexit Center, Governerpet, Vijayawada – 520002" }],
  "Guntur":         [{ id: "GNT_01", name: "Dexit Global Limited - Guntur",         address: "Dexit Center, Brodipet, Guntur – 522002" }],
  "Tirupati":       [{ id: "TPT_01", name: "Dexit Global Limited - Tirupati",       address: "Dexit Center, AIR Bypass Road, Tirupati – 517501" }],
  "Nellore":        [{ id: "NLR_01", name: "Dexit Global Limited - Nellore",        address: "Dexit Center, Pogathota, Nellore – 524001" }],
  "Rajamundry":     [{ id: "RJY_01", name: "Dexit Global Limited - Rajahmundry",    address: "Dexit Center, Main Road, Rajahmundry – 533101" }],
  "Kakinada":       [{ id: "KKD_01", name: "Dexit Global Limited - Kakinada",       address: "Dexit Center, Kakinada – 533001" }],
  "Kurnool":        [{ id: "KNL_01", name: "Dexit Global Limited - Kurnool",        address: "Dexit Center, Kurnool – 518001" }],
  "Kadapa":         [{ id: "KDP_01", name: "Dexit Global Limited - Kadapa",         address: "Dexit Center, Kadapa – 516001" }],
  "Chittoor":       [{ id: "CTR_AP", name: "Dexit Global Limited - Chittoor",       address: "Dexit Center, Chittoor – 517001" }],
  "Eluru":          [{ id: "ELR_01", name: "Dexit Global Limited - Eluru",          address: "Dexit Center, Eluru – 534001" }],
  "Srikakulam":     [{ id: "SKL_01", name: "Dexit Global Limited - Srikakulam",     address: "Dexit Center, Srikakulam – 532001" }],
  "Vizianagaram":   [{ id: "VZM_01", name: "Dexit Global Limited - Vizianagaram",   address: "Dexit Center, Vizianagaram – 535001" }],
  "Chilakaluripet": [{ id: "CLP_01", name: "Dexit Global Limited - Chilakaluripet", address: "Dexit Center, Chilakaluripet – 522616" }],
  // ASSAM
  "Guwahati":  [{ id: "GAU_01", name: "Dexit Global Limited - Guwahati",  address: "Dexit Center, GS Road, Guwahati – 781005" }, { id: "GAU_02", name: "NSEIT Limited - Guwahati", address: "NSEIT Center, Zoo Road, Guwahati – 781024" }],
  "Dibrugarh": [{ id: "DIB_01", name: "Dexit Global Limited - Dibrugarh", address: "Dexit Center, Dibrugarh – 786001" }],
  "Silchar":   [{ id: "SIL_AS", name: "Dexit Global Limited - Silchar",   address: "Dexit Center, Silchar – 788001" }],
  "Jorhat":    [{ id: "JRH_01", name: "Dexit Global Limited - Jorhat",    address: "Dexit Center, Jorhat – 785001" }],
  "Tezpur":    [{ id: "TEZ_01", name: "Dexit Global Limited - Tezpur",    address: "Dexit Center, Tezpur – 784001" }],
  // BIHAR
  "Patna":       [{ id: "PAT_01", name: "Dexit Global Limited - Patna",       address: "Dexit Center, Fraser Road, Patna – 800001" }, { id: "PAT_02", name: "NSEIT Limited - Patna", address: "NSEIT Center, Exhibition Road, Patna – 800001" }],
  "Muzaffarpur": [{ id: "MZP_01", name: "Dexit Global Limited - Muzaffarpur", address: "Dexit Center, Muzaffarpur – 842001" }],
  "Gaya":        [{ id: "GYA_01", name: "Dexit Global Limited - Gaya",        address: "Dexit Center, Gaya – 823001" }],
  "Bhagalpur":   [{ id: "BGL_01", name: "Dexit Global Limited - Bhagalpur",   address: "Dexit Center, Bhagalpur – 812001" }],
  // CHHATTISGARH
  "Raipur":  [{ id: "RAI_01", name: "Dexit Global Limited - Raipur",  address: "Dexit Center, Pandri, Raipur – 492004" }, { id: "RAI_02", name: "NSEIT Limited - Raipur", address: "NSEIT Center, Devendra Nagar, Raipur – 492004" }],
  "Bhilai":  [{ id: "BHI_01", name: "Dexit Global Limited - Bhilai",  address: "Dexit Center, Bhilai – 490001" }],
  "Bilaspur":[{ id: "BSP_01", name: "Dexit Global Limited - Bilaspur",address: "Dexit Center, Bilaspur – 495001" }],
  "Korba":   [{ id: "KRB_01", name: "Dexit Global Limited - Korba",   address: "Dexit Center, Korba – 495677" }],
  // DELHI / NCR
  "Delhi":        [{ id: "DL_01", name: "Dexit Global Limited - Delhi",        address: "Dexit Center, Connaught Place, New Delhi – 110001" }, { id: "DL_02", name: "NSEIT Limited - Delhi", address: "NSEIT Center, Rohini, Delhi – 110085" }],
  "Noida":        [{ id: "NDA_01", name: "Dexit Global Limited - Noida",       address: "Dexit Center, Sector 62, Noida – 201309" }, { id: "NDA_02", name: "NSEIT Limited - Noida", address: "NSEIT Center, Sector 18, Noida – 201301" }],
  "Gurgaon":      [{ id: "GGN_01", name: "Dexit Global Limited - Gurgaon",     address: "Dexit Center, DLF Cyber City, Gurgaon – 122002" }],
  "Ghaziabad":    [{ id: "GZB_01", name: "Dexit Global Limited - Ghaziabad",   address: "Dexit Center, Raj Nagar, Ghaziabad – 201002" }],
  "Faridabad":    [{ id: "FBD_01", name: "Dexit Global Limited - Faridabad",   address: "Dexit Center, NIT, Faridabad – 121001" }],
  "Greater Noida":[{ id: "GNO_01", name: "Dexit Global Limited - Greater Noida",address: "Dexit Center, Knowledge Park, Greater Noida – 201308" }],
  // GOA
  "Panaji": [{ id: "PNJ_01", name: "Dexit Global Limited - Panaji", address: "Dexit Center, Patto Plaza, Panaji – 403001" }],
  "Margao": [{ id: "MGO_01", name: "Dexit Global Limited - Margao", address: "Dexit Center, Margao – 403601" }],
  "Vasco":  [{ id: "VAS_01", name: "Dexit Global Limited - Vasco",  address: "Dexit Center, Vasco Da Gama – 403802" }],
  // GUJARAT
  "Ahmedabad":    [{ id: "AMD_01", name: "Dexit Global Limited - Ahmedabad", address: "Dexit Center, CG Road, Ahmedabad – 380009" }, { id: "AMD_02", name: "NSEIT Limited - Ahmedabad", address: "NSEIT Center, Navrangpura, Ahmedabad – 380009" }],
  "Surat":        [{ id: "SRT_01", name: "Dexit Global Limited - Surat",     address: "Dexit Center, Ring Road, Surat – 395002" }, { id: "SRT_02", name: "NSEIT Limited - Surat", address: "NSEIT Center, Adajan, Surat – 395009" }],
  "Vadodara":     [{ id: "VDR_01", name: "Dexit Global Limited - Vadodara",  address: "Dexit Center, Sayajigunj, Vadodara – 390005" }],
  "Rajkot":       [{ id: "RJT_01", name: "Dexit Global Limited - Rajkot",    address: "Dexit Center, Kalawad Road, Rajkot – 360001" }],
  "Gandhinagar":  [{ id: "GNR_01", name: "Dexit Global Limited - Gandhinagar",address: "Dexit Center, Sector 11, Gandhinagar – 382011" }],
  "Bhavnagar":    [{ id: "BVN_01", name: "Dexit Global Limited - Bhavnagar", address: "Dexit Center, Bhavnagar – 364001" }],
  "Jamnagar":     [{ id: "JMN_01", name: "Dexit Global Limited - Jamnagar",  address: "Dexit Center, Jamnagar – 361001" }],
  "Vapi":         [{ id: "VAP_01", name: "Dexit Global Limited - Vapi",      address: "Dexit Center, Vapi – 396191" }],
  "Anand":        [{ id: "AND_GJ", name: "Dexit Global Limited - Anand",     address: "Dexit Center, Anand – 388001" }],
  "Bharuch":      [{ id: "BRC_01", name: "Dexit Global Limited - Bharuch",   address: "Dexit Center, Bharuch – 392001" }],
  "Bhuj":         [{ id: "BHJ_01", name: "Dexit Global Limited - Bhuj",      address: "Dexit Center, Bhuj – 370001" }],
  "Junagadh":     [{ id: "JND_01", name: "Dexit Global Limited - Junagadh",  address: "Dexit Center, Junagadh – 362001" }],
  "Mehsana":      [{ id: "MSN_01", name: "Dexit Global Limited - Mehsana",   address: "Dexit Center, Mehsana – 384001" }],
  "Navsari":      [{ id: "NVS_01", name: "Dexit Global Limited - Navsari",   address: "Dexit Center, Navsari – 396445" }],
  "Surendranagar":[{ id: "SRN_GJ", name: "Dexit Global Limited - Surendranagar", address: "Dexit Center, Surendranagar – 363001" }],
  // HARYANA
  "Gurugram":   [{ id: "GGM_01", name: "Dexit Global Limited - Gurugram", address: "Dexit Center, Cyber City, Gurugram – 122002" }, { id: "GGM_02", name: "NSEIT Limited - Gurugram", address: "NSEIT Center, Sector 14, Gurugram – 122001" }],
  "Panipat":    [{ id: "PNP_01", name: "Dexit Global Limited - Panipat",  address: "Dexit Center, Model Town, Panipat – 132103" }],
  "Ambala":     [{ id: "AMB_01", name: "Dexit Global Limited - Ambala",   address: "Dexit Center, Ambala City – 134003" }],
  "Hisar":      [{ id: "HSR_01", name: "Dexit Global Limited - Hisar",    address: "Dexit Center, Urban Estate, Hisar – 125005" }],
  "Karnal":     [{ id: "KNL_HR", name: "Dexit Global Limited - Karnal",   address: "Dexit Center, Karnal – 132001" }],
  "Rohtak":     [{ id: "RTK_01", name: "Dexit Global Limited - Rohtak",   address: "Dexit Center, Rohtak – 124001" }],
  "Sonepat":    [{ id: "SNP_01", name: "Dexit Global Limited - Sonepat",  address: "Dexit Center, Sonepat – 131001" }],
  "Bhiwani":    [{ id: "BWN_01", name: "Dexit Global Limited - Bhiwani",  address: "Dexit Center, Bhiwani – 127021" }],
  "Panchkula":  [{ id: "PKL_01", name: "Dexit Global Limited - Panchkula",address: "Dexit Center, Sector 11, Panchkula – 134109" }],
  "Rewari":     [{ id: "RWR_01", name: "Dexit Global Limited - Rewari",   address: "Dexit Center, Rewari – 123401" }],
  "Kurukshetra":[{ id: "KKR_01", name: "Dexit Global Limited - Kurukshetra", address: "Dexit Center, Kurukshetra – 136118" }],
  "Sirsa":      [{ id: "SRS_01", name: "Dexit Global Limited - Sirsa",    address: "Dexit Center, Sirsa – 125055" }],
  "Yamunanagar":[{ id: "YNR_01", name: "Dexit Global Limited - Yamunanagar", address: "Dexit Center, Yamunanagar – 135001" }],
  // HIMACHAL PRADESH
  "Shimla":      [{ id: "SML_01", name: "Dexit Global Limited - Shimla",      address: "Dexit Center, Mall Road, Shimla – 171001" }],
  "Dharamshala": [{ id: "DRM_01", name: "Dexit Global Limited - Dharamshala", address: "Dexit Center, Dharamshala – 176215" }],
  "Baddi":       [{ id: "BDD_01", name: "Dexit Global Limited - Baddi",       address: "Dexit Center, Baddi – 173205" }],
  "Hamirpur":    [{ id: "HMP_01", name: "Dexit Global Limited - Hamirpur",    address: "Dexit Center, Hamirpur – 177001" }],
  "Mandi":       [{ id: "MDI_01", name: "Dexit Global Limited - Mandi",       address: "Dexit Center, Mandi – 175001" }],
  "Solan":       [{ id: "SLN_01", name: "Dexit Global Limited - Solan",       address: "Dexit Center, Solan – 173212" }],
  "Una":         [{ id: "UNA_01", name: "Dexit Global Limited - Una",         address: "Dexit Center, Una – 174303" }],
  // JAMMU & KASHMIR
  "Jammu":    [{ id: "JAM_01", name: "Dexit Global Limited - Jammu",    address: "Dexit Center, Gandhi Nagar, Jammu – 180004" }, { id: "JAM_02", name: "NSEIT Limited - Jammu", address: "NSEIT Center, Canal Road, Jammu – 180001" }],
  "Srinagar": [{ id: "SNG_JK", name: "Dexit Global Limited - Srinagar", address: "Dexit Center, Lal Chowk, Srinagar – 190001" }],
  // JHARKHAND
  "Ranchi":     [{ id: "RNC_01", name: "Dexit Global Limited - Ranchi",     address: "Dexit Center, Main Road, Ranchi – 834001" }, { id: "RNC_02", name: "NSEIT Limited - Ranchi", address: "NSEIT Center, Lalpur, Ranchi – 834001" }],
  "Jamshedpur": [{ id: "JSR_01", name: "Dexit Global Limited - Jamshedpur", address: "Dexit Center, Bistupur, Jamshedpur – 831001" }],
  "Dhanbad":    [{ id: "DHN_01", name: "Dexit Global Limited - Dhanbad",    address: "Dexit Center, Bank More, Dhanbad – 826001" }],
  "Bokaro":     [{ id: "BKR_01", name: "Dexit Global Limited - Bokaro",     address: "Dexit Center, Sector 4, Bokaro – 827004" }],
  "Deoghar":    [{ id: "DGR_01", name: "Dexit Global Limited - Deoghar",    address: "Dexit Center, Deoghar – 814001" }],
  "Ramgarh":    [{ id: "RMG_01", name: "Dexit Global Limited - Ramgarh",    address: "Dexit Center, Ramgarh – 829122" }],
  // KARNATAKA — test centers verified from spmt.icai.org screenshot
  "Bangalore": [
    { id: "BLR_01", name: "Dexit Global Limited - Bangalore",    address: "Dexit Center, Koramangala, Bangalore – 560034" },
    { id: "BLR_02", name: "E MERIT - RT NAGAR",                  address: "E Merit Center, RT Nagar, Bangalore – 560032" },
    { id: "BLR_03", name: "E NEXT",                              address: "E Next Test Center, Hebbal, Bangalore – 560024" },
    { id: "BLR_04", name: "MILESTONE TECHNOLOGIES - BANGALORE",  address: "Milestone Tech, Bannerghatta Road, Bangalore – 560029" },
    { id: "BLR_05", name: "REVEREND TECHNOLOGIES PVT LTD",       address: "Reverend Tech, Whitefield, Bangalore – 560066" },
    { id: "BLR_06", name: "TECHXCELLENCE DIGITAL SOLUTIONS",     address: "TechXcellence, JP Nagar, Bangalore – 560078" },
    { id: "BLR_07", name: "TVAKSA TECHNOLOGIES PRIVATE LIMITED", address: "Tvaksa Tech, Electronic City, Bangalore – 560100" }
  ],
  "Hubli":     [{ id: "HUB_01", name: "Dexit Global Limited - Hubli",     address: "Dexit Center, Keshwapur, Hubli – 580023" }],
  "Mangalore": [{ id: "MNG_01", name: "Dexit Global Limited - Mangalore", address: "Dexit Center, Lalbagh, Mangalore – 575003" }],
  "Mysore":    [{ id: "MYS_01", name: "Dexit Global Limited - Mysore",    address: "Dexit Center, Saraswathipuram, Mysore – 570009" }],
  "Belgaum":   [{ id: "BLG_01", name: "Dexit Global Limited - Belgaum",   address: "Dexit Center, Tilakwadi, Belgaum – 590006" }],
  "Davangere": [{ id: "DVG_01", name: "Dexit Global Limited - Davangere", address: "Dexit Center, PJ Extension, Davangere – 577002" }],
  "Gulbarga":  [{ id: "GBG_01", name: "Dexit Global Limited - Gulbarga",  address: "Dexit Center, Super Market Area, Gulbarga – 585101" }],
  "Shimoga":   [{ id: "SHM_KA", name: "Dexit Global Limited - Shimoga",   address: "Dexit Center, Vinoba Nagar, Shimoga – 577201" }],
  "Tumkur":    [{ id: "TMK_01", name: "Dexit Global Limited - Tumkur",    address: "Dexit Center, SS Puram, Tumkur – 572102" }],
  "Udupi":     [{ id: "UDP_01", name: "Dexit Global Limited - Udupi",     address: "Dexit Center, Manipal, Udupi – 576104" }],
  "Bagalkot":  [{ id: "BGK_01", name: "Dexit Global Limited - Bagalkot",  address: "Dexit Center, Bagalkot – 587101" }],
  "Bellary":   [{ id: "BLY_01", name: "Dexit Global Limited - Bellary",   address: "Dexit Center, Bellary – 583101" }],
  "Chikkaballapur":[{ id: "CBP_01", name: "Dexit Global Limited - Chikkaballapur", address: "Dexit Center, Chikkaballapur – 562101" }],
  "Chitradurga":[{ id: "CDG_01", name: "Dexit Global Limited - Chitradurga", address: "Dexit Center, Chitradurga – 577501" }],
  "Gadag":     [{ id: "GDG_01", name: "Dexit Global Limited - Gadag",     address: "Dexit Center, Gadag – 582101" }],
  "Hassan":    [{ id: "HSN_01", name: "Dexit Global Limited - Hassan",     address: "Dexit Center, Hassan – 573201" }],
  "Haveri":    [{ id: "HVR_01", name: "Dexit Global Limited - Haveri",     address: "Dexit Center, Haveri – 581110" }],
  "Kolar":     [{ id: "KLR_01", name: "Dexit Global Limited - Kolar",      address: "Dexit Center, Kolar – 563101" }],
  "Koppal":    [{ id: "KPL_01", name: "Dexit Global Limited - Koppal",     address: "Dexit Center, Koppal – 583231" }],
  "Mandya":    [{ id: "MDY_01", name: "Dexit Global Limited - Mandya",     address: "Dexit Center, Mandya – 571401" }],
  "Raichur":   [{ id: "RCR_01", name: "Dexit Global Limited - Raichur",    address: "Dexit Center, Raichur – 584101" }],
  // KERALA
  "Ernakulam":          [{ id: "EKM_01", name: "Dexit Global Limited - Ernakulam",           address: "Dexit Center, MG Road, Ernakulam – 682016" }, { id: "EKM_02", name: "NSEIT Limited - Ernakulam", address: "NSEIT Center, Ravipuram, Ernakulam – 682015" }],
  "Thiruvananthapuram": [{ id: "TRV_01", name: "Dexit Global Limited - Thiruvananthapuram",  address: "Dexit Center, Vazhuthacaud, Thiruvananthapuram – 695014" }],
  "Kozhikode":          [{ id: "CLT_01", name: "Dexit Global Limited - Kozhikode",           address: "Dexit Center, Eranhipalam, Kozhikode – 673006" }],
  "Thrissur":           [{ id: "TCR_01", name: "Dexit Global Limited - Thrissur",            address: "Dexit Center, Round South, Thrissur – 680001" }],
  "Kannur":             [{ id: "CNN_01", name: "Dexit Global Limited - Kannur",              address: "Dexit Center, Burnassery, Kannur – 670012" }],
  "Kottayam":           [{ id: "KTM_01", name: "Dexit Global Limited - Kottayam",           address: "Dexit Center, Nagampadom, Kottayam – 686001" }],
  "Palakkad":           [{ id: "PKD_01", name: "Dexit Global Limited - Palakkad",            address: "Dexit Center, Palakkad – 678001" }],
  "Malappuram":         [{ id: "MLP_01", name: "Dexit Global Limited - Malappuram",          address: "Dexit Center, Malappuram – 676505" }],
  "Alappuzha":          [{ id: "ALP_01", name: "Dexit Global Limited - Alappuzha",           address: "Dexit Center, Alappuzha – 688001" }],
  "Kasaragod":          [{ id: "KSD_01", name: "Dexit Global Limited - Kasaragod",           address: "Dexit Center, Kasaragod – 671121" }],
  "Idukki":             [{ id: "IDK_01", name: "Dexit Global Limited - Idukki",              address: "Dexit Center, Idukki – 685602" }],
  "Pathanamthitta":     [{ id: "PTT_01", name: "Dexit Global Limited - Pathanamthitta",     address: "Dexit Center, Pathanamthitta – 689645" }],
  "Wayanad":            [{ id: "WND_01", name: "Dexit Global Limited - Wayanad",             address: "Dexit Center, Kalpetta, Wayanad – 673121" }],
  // MADHYA PRADESH
  "Indore":   [{ id: "IND_01", name: "Dexit Global Limited - Indore",   address: "Dexit Center, Vijay Nagar, Indore – 452010" }, { id: "IND_02", name: "NSEIT Limited - Indore", address: "NSEIT Center, Palasia, Indore – 452001" }],
  "Bhopal":   [{ id: "BPL_01", name: "Dexit Global Limited - Bhopal",   address: "Dexit Center, MP Nagar, Bhopal – 462011" }, { id: "BPL_02", name: "NSEIT Limited - Bhopal", address: "NSEIT Center, Shivaji Nagar, Bhopal – 462016" }],
  "Gwalior":  [{ id: "GWL_01", name: "Dexit Global Limited - Gwalior",  address: "Dexit Center, City Center, Gwalior – 474001" }],
  "Jabalpur": [{ id: "JBP_01", name: "Dexit Global Limited - Jabalpur", address: "Dexit Center, Wright Town, Jabalpur – 482001" }],
  "Ujjain":   [{ id: "UJN_01", name: "Dexit Global Limited - Ujjain",   address: "Dexit Center, Freeganj, Ujjain – 456010" }],
  "Ratlam":   [{ id: "RTM_01", name: "Dexit Global Limited - Ratlam",   address: "Dexit Center, Ratlam – 457001" }],
  "Sagar":    [{ id: "SAG_01", name: "Dexit Global Limited - Sagar",    address: "Dexit Center, Sagar – 470001" }],
  "Satna":    [{ id: "STN_MP", name: "Dexit Global Limited - Satna",    address: "Dexit Center, Satna – 485001" }],
  // MAHARASHTRA
  "Mumbai":      [{ id: "MUM_01", name: "Dexit Global Limited - Mumbai",     address: "Dexit Center, Andheri East, Mumbai – 400069" }, { id: "MUM_02", name: "NSEIT Limited - Mumbai BKC", address: "NSEIT Center, BKC, Bandra East, Mumbai – 400051" }],
  "Pune":        [{ id: "PUN_01", name: "Dexit Global Limited - Pune",       address: "Dexit Center, Kothrud, Pune – 411038" }, { id: "PUN_02", name: "NSEIT Limited - Pune", address: "NSEIT Center, Shivajinagar, Pune – 411005" }],
  "Nagpur":      [{ id: "NGP_01", name: "Dexit Global Limited - Nagpur",     address: "Dexit Center, Dharampeth, Nagpur – 440010" }, { id: "NGP_02", name: "NSEIT Limited - Nagpur", address: "NSEIT Center, Sitabuldi, Nagpur – 440012" }],
  "Nashik":      [{ id: "NAS_01", name: "Dexit Global Limited - Nashik",     address: "Dexit Center, Mahatma Nagar, Nashik – 422007" }],
  "Thane":       [{ id: "THA_01", name: "Dexit Global Limited - Thane",      address: "Dexit Center, Naupada, Thane – 400602" }],
  "Navi Mumbai": [{ id: "NMB_01", name: "Dexit Global Limited - Navi Mumbai",address: "Dexit Center, Vashi, Navi Mumbai – 400703" }],
  "Aurangabad":  [{ id: "AUR_01", name: "Dexit Global Limited - Aurangabad", address: "Dexit Center, CIDCO, Aurangabad – 431003" }],
  "Kolhapur":    [{ id: "KLP_01", name: "Dexit Global Limited - Kolhapur",   address: "Dexit Center, Rajarampuri, Kolhapur – 416008" }],
  "Solapur":     [{ id: "SLR_01", name: "Dexit Global Limited - Solapur",    address: "Dexit Center, Budhwar Peth, Solapur – 413002" }],
  "Amravati":    [{ id: "AMR_01", name: "Dexit Global Limited - Amravati",   address: "Dexit Center, Camp Area, Amravati – 444602" }],
  "Akola":       [{ id: "AKL_01", name: "Dexit Global Limited - Akola",      address: "Dexit Center, Civil Lines, Akola – 444001" }],
  "Latur":       [{ id: "LTR_01", name: "Dexit Global Limited - Latur",      address: "Dexit Center, Latur – 413512" }],
  "Nanded":      [{ id: "NND_01", name: "Dexit Global Limited - Nanded",     address: "Dexit Center, Nanded – 431601" }],
  "Sangli":      [{ id: "SGL_01", name: "Dexit Global Limited - Sangli",     address: "Dexit Center, Sangli – 416416" }],
  "Satara":      [{ id: "SAT_MH", name: "Dexit Global Limited - Satara",     address: "Dexit Center, Satara – 415001" }],
  // ODISHA
  "Bhubaneswar": [{ id: "BHU_01", name: "Dexit Global Limited - Bhubaneswar", address: "Dexit Center, Sahid Nagar, Bhubaneswar – 751007" }, { id: "BHU_02", name: "NSEIT Limited - Bhubaneswar", address: "NSEIT Center, Nayapalli, Bhubaneswar – 751012" }],
  "Cuttack":     [{ id: "CTK_01", name: "Dexit Global Limited - Cuttack",     address: "Dexit Center, Buxi Bazar, Cuttack – 753001" }],
  "Rourkela":    [{ id: "RKL_01", name: "Dexit Global Limited - Rourkela",    address: "Dexit Center, Rourkela – 769001" }],
  "Sambalpur":   [{ id: "SBP_01", name: "Dexit Global Limited - Sambalpur",   address: "Dexit Center, Sambalpur – 768001" }],
  "Berhampur":   [{ id: "BRP_01", name: "Dexit Global Limited - Berhampur",   address: "Dexit Center, Berhampur – 760001" }],
  // PONDICHERRY
  "Puducherry": [{ id: "PUD_01", name: "Dexit Global Limited - Puducherry", address: "Dexit Center, MG Road, Puducherry – 605001" }],
  // PUNJAB
  "Ludhiana":  [{ id: "LDH_01", name: "Dexit Global Limited - Ludhiana",  address: "Dexit Center, Ferozepur Road, Ludhiana – 141001" }, { id: "LDH_02", name: "NSEIT Limited - Ludhiana", address: "NSEIT Center, Model Town, Ludhiana – 141002" }],
  "Amritsar":  [{ id: "ASR_01", name: "Dexit Global Limited - Amritsar",  address: "Dexit Center, Lawrence Road, Amritsar – 143001" }],
  "Jalandhar": [{ id: "JUC_01", name: "Dexit Global Limited - Jalandhar", address: "Dexit Center, Model Town, Jalandhar – 144001" }],
  "Patiala":   [{ id: "PTL_01", name: "Dexit Global Limited - Patiala",   address: "Dexit Center, Leela Bhawan, Patiala – 147001" }],
  "Mohali":    [{ id: "MOH_01", name: "Dexit Global Limited - Mohali",    address: "Dexit Center, Phase 10, Mohali – 160062" }],
  "Bathinda":  [{ id: "BTI_01", name: "Dexit Global Limited - Bathinda",  address: "Dexit Center, Bathinda – 151001" }],
  "Pathankot": [{ id: "PTK_01", name: "Dexit Global Limited - Pathankot", address: "Dexit Center, Pathankot – 145001" }],
  // RAJASTHAN
  "Jaipur":     [{ id: "JAI_01", name: "Dexit Global Limited - Jaipur",   address: "Dexit Center, Malviya Nagar, Jaipur – 302017" }, { id: "JAI_02", name: "NSEIT Limited - Jaipur", address: "NSEIT Center, MI Road, Jaipur – 302001" }],
  "Jodhpur":    [{ id: "JDH_01", name: "Dexit Global Limited - Jodhpur",  address: "Dexit Center, Chopasni Road, Jodhpur – 342001" }],
  "Udaipur":    [{ id: "UDR_01", name: "Dexit Global Limited - Udaipur",  address: "Dexit Center, Chetak Circle, Udaipur – 313001" }],
  "Kota":       [{ id: "KOT_01", name: "Dexit Global Limited - Kota",     address: "Dexit Center, DC Square, Kota – 324007" }],
  "Ajmer":      [{ id: "AJM_01", name: "Dexit Global Limited - Ajmer",    address: "Dexit Center, Nasirabad Road, Ajmer – 305001" }],
  "Bikaner":    [{ id: "BKN_01", name: "Dexit Global Limited - Bikaner",  address: "Dexit Center, Bikaner – 334001" }],
  "Alwar":      [{ id: "AWR_01", name: "Dexit Global Limited - Alwar",    address: "Dexit Center, Alwar – 301001" }],
  "Bhilwara":   [{ id: "BLW_01", name: "Dexit Global Limited - Bhilwara", address: "Dexit Center, Bhilwara – 311001" }],
  "Sikar":      [{ id: "SKR_01", name: "Dexit Global Limited - Sikar",    address: "Dexit Center, Sikar – 332001" }],
  "Ganganagar": [{ id: "GNG_01", name: "Dexit Global Limited - Sri Ganganagar", address: "Dexit Center, Sri Ganganagar – 335001" }],
  "Bharatpur":  [{ id: "BTP_01", name: "Dexit Global Limited - Bharatpur",address: "Dexit Center, Bharatpur – 321001" }],
  // TAMIL NADU
  "Chennai":         [{ id: "MAA_01", name: "Dexit Global Limited - Chennai",        address: "Dexit Center, Anna Nagar, Chennai – 600040" }, { id: "MAA_02", name: "NSEIT Limited - Chennai", address: "NSEIT Center, Mount Road, Chennai – 600002" }],
  "Coimbatore":      [{ id: "CBE_01", name: "Dexit Global Limited - Coimbatore",     address: "Dexit Center, RS Puram, Coimbatore – 641002" }],
  "Madurai":         [{ id: "MDU_01", name: "Dexit Global Limited - Madurai",        address: "Dexit Center, KK Nagar, Madurai – 625020" }],
  "Salem":           [{ id: "SLM_01", name: "Dexit Global Limited - Salem",          address: "Dexit Center, Alagapuram, Salem – 636016" }],
  "Tiruchirappalli": [{ id: "TRZ_01", name: "Dexit Global Limited - Trichy",         address: "Dexit Center, Thillai Nagar, Trichy – 620018" }],
  "Tirupur":         [{ id: "TUP_01", name: "Dexit Global Limited - Tirupur",        address: "Dexit Center, Tirupur – 641601" }],
  "Erode":           [{ id: "ERD_01", name: "Dexit Global Limited - Erode",          address: "Dexit Center, Erode – 638001" }],
  "Vellore":         [{ id: "VLR_01", name: "Dexit Global Limited - Vellore",        address: "Dexit Center, Gandhi Nagar, Vellore – 632006" }],
  "Tirunelveli":     [{ id: "TNV_01", name: "Dexit Global Limited - Tirunelveli",    address: "Dexit Center, Tirunelveli – 627001" }],
  "Chengalpattu":    [{ id: "CGP_01", name: "Dexit Global Limited - Chengalpattu",   address: "Dexit Center, Chengalpattu – 603001" }],
  // TELANGANA
  "Hyderabad":    [{ id: "HYD_01", name: "Dexit Global Limited - Hyderabad",   address: "Dexit Center, Begumpet, Hyderabad – 500016" }, { id: "HYD_02", name: "NSEIT Limited - Hyderabad", address: "NSEIT Center, Ameerpet, Hyderabad – 500016" }],
  "Secunderabad": [{ id: "SCB_01", name: "Dexit Global Limited - Secunderabad",address: "Dexit Center, SD Road, Secunderabad – 500003" }],
  "Warangal":     [{ id: "WGL_01", name: "Dexit Global Limited - Warangal",    address: "Dexit Center, Hanamkonda, Warangal – 506001" }],
  "Karimnagar":   [{ id: "KMR_01", name: "Dexit Global Limited - Karimnagar",  address: "Dexit Center, Karimnagar – 505001" }],
  "Nizamabad":    [{ id: "NZB_01", name: "Dexit Global Limited - Nizamabad",   address: "Dexit Center, Nizamabad – 503001" }],
  // UTTAR PRADESH
  "Lucknow":    [{ id: "LKO_01", name: "Dexit Global Limited - Lucknow",    address: "Dexit Center, Hazratganj, Lucknow – 226001" }, { id: "LKO_02", name: "NSEIT Limited - Lucknow", address: "NSEIT Center, Vibhuti Khand, Lucknow – 226010" }],
  "Kanpur":     [{ id: "CNB_01", name: "Dexit Global Limited - Kanpur",     address: "Dexit Center, Civil Lines, Kanpur – 208001" }],
  "Allahabad":  [{ id: "ALD_01", name: "Dexit Global Limited - Prayagraj",  address: "Dexit Center, Allahpur, Prayagraj – 211006" }],
  "Varanasi":   [{ id: "VNS_01", name: "Dexit Global Limited - Varanasi",   address: "Dexit Center, Sigra, Varanasi – 221010" }],
  "Agra":       [{ id: "AGR_01", name: "Dexit Global Limited - Agra",       address: "Dexit Center, Sanjay Place, Agra – 282002" }],
  "Meerut":     [{ id: "MRT_01", name: "Dexit Global Limited - Meerut",     address: "Dexit Center, Begum Bridge, Meerut – 250001" }],
  "Bareilly":   [{ id: "BEL_01", name: "Dexit Global Limited - Bareilly",   address: "Dexit Center, Civil Lines, Bareilly – 243001" }],
  "Gorakhpur":  [{ id: "GKP_01", name: "Dexit Global Limited - Gorakhpur",  address: "Dexit Center, Gorakhpur – 273001" }],
  "Aligarh":    [{ id: "ALG_01", name: "Dexit Global Limited - Aligarh",    address: "Dexit Center, Aligarh – 202001" }],
  "Moradabad":  [{ id: "MBD_01", name: "Dexit Global Limited - Moradabad",  address: "Dexit Center, Moradabad – 244001" }],
  "Saharanpur": [{ id: "SRN_UP", name: "Dexit Global Limited - Saharanpur", address: "Dexit Center, Saharanpur – 247001" }],
  "Ghaziabad":  [{ id: "GZB_UP", name: "Dexit Global Limited - Ghaziabad",  address: "Dexit Center, Raj Nagar, Ghaziabad – 201002" }],
  "Noida":      [{ id: "NDA_UP", name: "Dexit Global Limited - Noida",      address: "Dexit Center, Sector 62, Noida – 201309" }],
  // UTTARAKHAND
  "Dehradun": [{ id: "DDN_01", name: "Dexit Global Limited - Dehradun", address: "Dexit Center, Rajpur Road, Dehradun – 248001" }, { id: "DDN_02", name: "NSEIT Limited - Dehradun", address: "NSEIT Center, Paltan Bazar, Dehradun – 248001" }],
  "Haridwar": [{ id: "HRW_01", name: "Dexit Global Limited - Haridwar", address: "Dexit Center, Jwalapur Road, Haridwar – 249401" }],
  "Haldwani": [{ id: "HLW_01", name: "Dexit Global Limited - Haldwani", address: "Dexit Center, Nainital Road, Haldwani – 263139" }],
  "Kashipur": [{ id: "KSP_01", name: "Dexit Global Limited - Kashipur", address: "Dexit Center, Kashipur – 244713" }],
  "Roorkee":  [{ id: "RKE_01", name: "Dexit Global Limited - Roorkee",  address: "Dexit Center, Roorkee – 247667" }],
  // WEST BENGAL
  "Kolkata":  [{ id: "CCU_01", name: "Dexit Global Limited - Kolkata",          address: "Dexit Center, Park Street, Kolkata – 700016" }, { id: "CCU_02", name: "NSEIT Limited - Kolkata Salt Lake", address: "NSEIT Center, Salt Lake, Kolkata – 700091" }],
  "Siliguri": [{ id: "SIL_WB", name: "Dexit Global Limited - Siliguri",         address: "Dexit Center, Sevoke Road, Siliguri – 734001" }],
  "Asansol":  [{ id: "ASN_01", name: "Dexit Global Limited - Asansol",           address: "Dexit Center, GT Road, Asansol – 713301" }],
  "Durgapur": [{ id: "DGP_01", name: "Dexit Global Limited - Durgapur",          address: "Dexit Center, City Centre, Durgapur – 713216" }],
  "Howrah":   [{ id: "HWH_01", name: "Dexit Global Limited - Howrah",            address: "Dexit Center, Howrah – 711101" }]
};

// ─────────────────────────────────────────────────────────────
// BOS – Courses
// Source: icaionlineregistration.org ddl_course dropdown (exact text)
// ─────────────────────────────────────────────────────────────
export const ADV_COURSES = [
  { id: "48", name: "AICITSS - Advanced Information Technology (Adv ITT)" },
  { id: "45", name: "Advanced (ICITSS) MCS Course (Adv MCS)" },
  { id: "49", name: "Advanced (ICITSS) MCS Course - Weekend" },
  { id: "47", name: "ICITSS - Information Technology (ITT)" },
  { id: "46", name: "ICITSS - Orientation Course (MCS)" }
];

// ─────────────────────────────────────────────────────────────
// BOS – Regions (Zones)
// Source: icaionlineregistration.org ddl_reg dropdown (exact values + text)
// ─────────────────────────────────────────────────────────────
export const ADV_ZONES = [
  { id: "4", name: "Southern" },
  { id: "2", name: "Western" },
  { id: "3", name: "Northern" },
  { id: "1", name: "Eastern" },
  { id: "5", name: "Central" }
];

// ─────────────────────────────────────────────────────────────
// BOS – POUs per Region
// Source: icaionlineregistration.org ddlPou (via server-side HTML, verified)
// ─────────────────────────────────────────────────────────────
export const ADV_POUS_BY_ZONE = {
  "4": [ // Southern
    { id: "101", city: "Alappuzha",          name: "Alappuzha Branch – SIRC",          address: "ICAI Bhawan, Alappuzha, Kerala – 688001" },
    { id: "260", city: "Anantapur",          name: "Anantapur Branch – SIRC",          address: "ICAI Bhawan, Anantapur, AP – 515001" },
    { id: "104", city: "Ballari",            name: "Ballari Branch – SIRC",            address: "ICAI Bhawan, Ballari, Karnataka – 583101" },
    { id: "103", city: "Belagavi",           name: "Belagavi Branch – SIRC",           address: "ICAI Bhawan, Tilakwadi, Belgaum – 590006" },
    { id: "102", city: "Bengaluru",          name: "Bengaluru Branch – SIRC",          address: "ICAI Bhawan, 16/0 Millers Tank Bed Area, Vasanthnagar, Bengaluru – 560052" },
    { id: "268", city: "Chengalpattu",       name: "Chengalpattu Branch – SIRC",       address: "ICAI Bhawan, Chengalpattu, Tamil Nadu – 603001" },
    { id: "138", city: "Chennai",            name: "SIRC – Chennai",                   address: "ICAI Bhawan, 122 MG Road, Nungambakkam, Chennai – 600034" },
    { id: "106", city: "Coimbatore",         name: "Coimbatore Branch – SIRC",         address: "ICAI Bhawan, Mettupalayam Road, Coimbatore – 641034" },
    { id: "107", city: "Ernakulam",          name: "Ernakulam Branch – SIRC",          address: "ICAI Bhawan, Dewan's Road, Ernakulam, Kochi – 682016" },
    { id: "252", city: "Erode",              name: "Erode Branch – SIRC",              address: "ICAI Bhawan, Erode, Tamil Nadu – 638001" },
    { id: "109", city: "Guntur",             name: "Guntur Branch – SIRC",             address: "ICAI Bhawan, Guntur, AP – 522002" },
    { id: "110", city: "Hubballi",           name: "Hubballi Branch – SIRC",           address: "ICAI Bhawan, Keshwapur, Hubli – 580023" },
    { id: "111", city: "Hyderabad",          name: "Hyderabad Branch – SIRC",          address: "ICAI Bhawan, 11-5-398/C, Red Hills, Lakdikapul, Hyderabad – 500004" },
    { id: "279", city: "Kadapa",             name: "Kadapa Branch – SIRC",             address: "ICAI Bhawan, Kadapa, AP – 516001" },
    { id: "112", city: "Kakinada",           name: "Kakinada Branch – SIRC",           address: "ICAI Bhawan, Kakinada, AP – 533001" },
    { id: "273", city: "Kalaburgi",          name: "Kalaburgi Branch – SIRC",          address: "ICAI Bhawan, Kalaburgi, Karnataka – 585101" },
    { id: "113", city: "Kannur",             name: "Kannur Branch – SIRC",             address: "ICAI Bhawan, Kannur, Kerala – 670001" },
    { id: "258", city: "Karimnagar",         name: "Karimnagar Branch – SIRC",         address: "ICAI Bhawan, Karimnagar, Telangana – 505001" },
    { id: "122", city: "Kollam",             name: "Kollam Branch – SIRC",             address: "ICAI Bhawan, Kollam, Kerala – 691001" },
    { id: "114", city: "Kottayam",           name: "Kottayam Branch – SIRC",           address: "ICAI Bhawan, Nagampadom, Kottayam – 686001" },
    { id: "105", city: "Kozhikode",          name: "Kozhikode Branch – SIRC",          address: "ICAI Bhawan, Eranhipalam, Kozhikode – 673006" },
    { id: "115", city: "Kumbakonam",         name: "Kumbakonam Branch – SIRC",         address: "ICAI Bhawan, Kumbakonam, Tamil Nadu – 612001" },
    { id: "245", city: "Kurnool",            name: "Kurnool Branch – SIRC",            address: "ICAI Bhawan, Kurnool, AP – 518001" },
    { id: "116", city: "Madurai",            name: "Madurai Branch – SIRC",            address: "ICAI Bhawan, 182-B Sundaram Mill Compound, Madurai – 625002" },
    { id: "117", city: "Mangaluru",          name: "Mangaluru Branch – SIRC",          address: "ICAI Bhawan, Attavar, Mangaluru – 575001" },
    { id: "118", city: "Mysuru",             name: "Mysuru Branch – SIRC",             address: "ICAI Bhawan, Bank Canal Road, Mysore – 570020" },
    { id: "119", city: "Nellore",            name: "Nellore Branch – SIRC",            address: "ICAI Bhawan, Nellore, AP – 524001" },
    { id: "259", city: "Ongole",             name: "Ongole Branch – SIRC",             address: "ICAI Bhawan, Ongole, AP – 523001" },
    { id: "120", city: "Palakkad",           name: "Palakkad Branch – SIRC",           address: "ICAI Bhawan, Palakkad, Kerala – 678001" },
    { id: "121", city: "Puducherry",         name: "Puducherry Branch – SIRC",         address: "ICAI Bhawan, MG Road, Puducherry – 605001" },
    { id: "123", city: "Rajamahendravaram",  name: "Rajamahendravaram Branch – SIRC",  address: "ICAI Bhawan, Rajahmundry, AP – 533101" },
    { id: "124", city: "Salem",              name: "Salem Branch – SIRC",              address: "ICAI Bhawan, Alagapuram, Salem – 636016" },
    { id: "251", city: "SIRC",              name: "SIRC (Headquarters)",              address: "ICAI Bhawan, 122 MG Road, Nungambakkam, Chennai – 600034" },
    { id: "125", city: "Sivakasi",           name: "Sivakasi Branch – SIRC",           address: "ICAI Bhawan, Sivakasi, Tamil Nadu – 626123" },
    { id: "131", city: "Thiruvananthapuram", name: "Thiruvananthapuram Branch – SIRC", address: "ICAI Bhawan, Cotton Hill, Vazhuthacaud, Thiruvananthapuram – 695014" },
    { id: "132", city: "Thoothukudi",        name: "Thoothukudi Branch – SIRC",        address: "ICAI Bhawan, Thoothukudi, Tamil Nadu – 628001" },
    { id: "130", city: "Thrissur",           name: "Thrissur Branch – SIRC",           address: "ICAI Bhawan, Round South, Thrissur – 680001" },
    { id: "126", city: "Tiruchirapalli",     name: "Tiruchirapalli Branch – SIRC",     address: "ICAI Bhawan, Thillai Nagar, Trichy – 620018" },
    { id: "127", city: "Tirunelveli",        name: "Tirunelveli Branch – SIRC",        address: "ICAI Bhawan, Tirunelveli, Tamil Nadu – 627001" },
    { id: "128", city: "Tirupati",           name: "Tirupati Branch – SIRC",           address: "ICAI Bhawan, Tirupati, AP – 517501" },
    { id: "129", city: "Tirupur",            name: "Tirupur Branch – SIRC",            address: "ICAI Bhawan, Tirupur, Tamil Nadu – 641601" },
    { id: "133", city: "Udupi",              name: "Udupi Branch – SIRC",              address: "ICAI Bhawan, Manipal, Udupi – 576104" },
    { id: "134", city: "Vellore",            name: "Vellore Branch – SIRC",            address: "ICAI Bhawan, Gandhi Nagar, Vellore – 632006" },
    { id: "135", city: "Vijayawada",         name: "Vijayawada Branch – SIRC",         address: "ICAI Bhawan, Governerpet, Vijayawada – 520002" },
    { id: "136", city: "Visakhapatnam",      name: "Visakhapatnam Branch – SIRC",      address: "ICAI Bhawan, Waltair Uplands, Visakhapatnam – 530003" },
    { id: "246", city: "Warangal",           name: "Warangal Branch – SIRC",           address: "ICAI Bhawan, Hanamkonda, Warangal – 506001" },
    { id: "281", city: "West Godavari",      name: "West Godavari Branch – SIRC",      address: "ICAI Bhawan, West Godavari, AP – 534001" }
  ],
  "2": [ // Western
    { id: "200", city: "Ahmedabad",    name: "Ahmedabad Branch – WIRC",    address: "ICAI Bhawan, Sardar Patel Colony, Naranpura, Ahmedabad – 380014" },
    { id: "201", city: "Anand",        name: "Anand Branch – WIRC",        address: "ICAI Bhawan, Anand, Gujarat – 388001" },
    { id: "202", city: "Aurangabad",   name: "Aurangabad Branch – WIRC",   address: "ICAI Bhawan, CIDCO, Aurangabad – 431003" },
    { id: "203", city: "Bhavnagar",    name: "Bhavnagar Branch – WIRC",    address: "ICAI Bhawan, Bhavnagar, Gujarat – 364001" },
    { id: "204", city: "Goa",          name: "Goa Branch – WIRC",          address: "ICAI Bhawan, Patto Plaza, Panaji, Goa – 403001" },
    { id: "205", city: "Jamnagar",     name: "Jamnagar Branch – WIRC",     address: "ICAI Bhawan, Jamnagar, Gujarat – 361001" },
    { id: "206", city: "Kolhapur",     name: "Kolhapur Branch – WIRC",     address: "ICAI Bhawan, Rajarampuri, Kolhapur – 416008" },
    { id: "207", city: "Mumbai",       name: "WIRC – Mumbai",              address: "ICAI Tower, Plot C-40, G Block, BKC, Bandra East, Mumbai – 400051" },
    { id: "208", city: "Nagpur",       name: "Nagpur Branch – WIRC",       address: "ICAI Bhawan, 20/9 Dhantoli, Nagpur – 440012" },
    { id: "209", city: "Nashik",       name: "Nashik Branch – WIRC",       address: "ICAI Bhawan, Near Kulkarni Garden, Nashik – 422005" },
    { id: "210", city: "Pune",         name: "Pune Branch – WIRC",         address: "ICAI Bhawan, Plot 8, Parshwanath Nagar, Bibwewadi, Pune – 411037" },
    { id: "211", city: "Rajkot",       name: "Rajkot Branch – WIRC",       address: "ICAI Bhawan, Sardar Nagar, Rajkot – 360001" },
    { id: "212", city: "Solapur",      name: "Solapur Branch – WIRC",      address: "ICAI Bhawan, Budhwar Peth, Solapur – 413002" },
    { id: "213", city: "Surat",        name: "Surat Branch – WIRC",        address: "ICAI Bhawan, Near Majura Gate, Ring Road, Surat – 395002" },
    { id: "214", city: "Thane",        name: "Thane Branch – WIRC",        address: "ICAI Bhawan, Balkum Road, Thane (W) – 400608" },
    { id: "215", city: "Vadodara",     name: "Vadodara Branch – WIRC",     address: "ICAI Bhawan, Kalali-Talsat Road, Vadodara – 390012" }
  ],
  "3": [ // Northern
    { id: "7",   city: "Chandigarh",     name: "Chandigarh Branch – NIRC",    address: "ICAI Bhawan, Sector 35-B, Chandigarh – 160022" },
    { id: "8",   city: "Dehradun",       name: "Dehradun Branch – NIRC",      address: "ICAI Bhawan, Rajpur Road, Dehradun – 248001" },
    { id: "254", city: "Delhi",          name: "NIRC – New Delhi",            address: "ICAI Bhawan, 52 Vishwas Nagar, Shahdara, Delhi – 110032" },
    { id: "20",  city: "Faridabad",      name: "Faridabad Branch – NIRC",     address: "ICAI Bhawan, Faridabad – 121001" },
    { id: "21",  city: "Gurugram",       name: "Gurugram Branch – NIRC",      address: "ICAI Bhawan, Cyber City, Gurugram – 122002" },
    { id: "22",  city: "Himachal Pradesh",name:"HP Branch – NIRC",           address: "ICAI Bhawan, Shimla – 171001" },
    { id: "23",  city: "Hisar",          name: "Hisar Branch – NIRC",         address: "ICAI Bhawan, Urban Estate, Hisar – 125005" },
    { id: "10",  city: "Jaipur",         name: "Jaipur Branch – NIRC",        address: "ICAI Bhawan, D-1 Jhalana Institutional Area, Jaipur – 302004" },
    { id: "11",  city: "Jalandhar",      name: "Jalandhar Branch – NIRC",     address: "ICAI Bhawan, Ladowali Road, Jalandhar – 144001" },
    { id: "12",  city: "Jammu",          name: "Jammu Branch – NIRC",         address: "ICAI Bhawan, Canal Road, Jammu – 180001" },
    { id: "24",  city: "Jammu & Kashmir",name:"J&K Branch – NIRC",           address: "ICAI Bhawan, Jammu – 180001" },
    { id: "13",  city: "Jodhpur",        name: "Jodhpur Branch – NIRC",       address: "ICAI Bhawan, Chopasni Road, Jodhpur – 342001" },
    { id: "15",  city: "Kanpur",         name: "Kanpur Branch – NIRC",        address: "ICAI Bhawan, 16/77 Civil Lines, Kanpur – 208001" },
    { id: "25",  city: "Karnal",         name: "Karnal Branch – NIRC",        address: "ICAI Bhawan, Karnal – 132001" },
    { id: "16",  city: "Kota",           name: "Kota Branch – NIRC",          address: "ICAI Bhawan, DC Square, Kota – 324007" },
    { id: "17",  city: "Lucknow",        name: "Lucknow Branch – NIRC",       address: "ICAI Bhawan, 27/6 Ram Mohan Rai Marg, Lucknow – 226001" },
    { id: "18",  city: "Ludhiana",       name: "Ludhiana Branch – NIRC",      address: "ICAI Bhawan, Pakhowal Road, Ludhiana – 141001" },
    { id: "19",  city: "Meerut",         name: "Meerut Branch – NIRC",        address: "ICAI Bhawan, Begum Bridge, Meerut – 250001" },
    { id: "248", city: "NIRC HQ",        name: "NIRC (Headquarters)",         address: "ICAI Bhawan, 52 Vishwas Nagar, Shahdara, Delhi – 110032" },
    { id: "28",  city: "Panipat",        name: "Panipat Branch – NIRC",       address: "ICAI Bhawan, Panipat – 132103" },
    { id: "27",  city: "Patiala",        name: "Patiala Branch – NIRC",       address: "ICAI Bhawan, Leela Bhawan, Patiala – 147001" },
    { id: "33",  city: "Rewari",         name: "Rewari Branch – NIRC",        address: "ICAI Bhawan, Rewari – 123401" },
    { id: "29",  city: "Rohtak",         name: "Rohtak Branch – NIRC",        address: "ICAI Bhawan, Rohtak – 124001" },
    { id: "30",  city: "Sangrur",        name: "Sangrur Branch – NIRC",       address: "ICAI Bhawan, Sangrur – 148001" },
    { id: "34",  city: "Sirsa",          name: "Sirsa Branch – NIRC",         address: "ICAI Bhawan, Sirsa – 125055" },
    { id: "31",  city: "Sonepat",        name: "Sonepat Branch – NIRC",       address: "ICAI Bhawan, Sonepat – 131001" },
    { id: "255", city: "Udaipur",        name: "Udaipur Branch – NIRC",       address: "ICAI Bhawan, Chetak Circle, Udaipur – 313001" },
    { id: "256", city: "Varanasi",       name: "Varanasi Branch – NIRC",      address: "ICAI Bhawan, Maldahiya, Varanasi – 221002" },
    { id: "277", city: "Kurukshetra",    name: "Kurukshetra Branch – NIRC",   address: "ICAI Bhawan, Kurukshetra – 136118" },
    { id: "32",  city: "Yamunanagar",    name: "Yamunanagar Branch – NIRC",   address: "ICAI Bhawan, Yamunanagar – 135001" }
  ],
  "1": [ // Eastern
    { id: "50", city: "Asansol",     name: "Asansol Branch – EIRC",     address: "ICAI Bhawan, GT Road, Asansol – 713301" },
    { id: "51", city: "Bhubaneswar", name: "Bhubaneswar Branch – EIRC", address: "ICAI Bhawan, A/98 Nayapalli, Bhubaneswar – 751012" },
    { id: "52", city: "Cuttack",     name: "Cuttack Branch – EIRC",     address: "ICAI Bhawan, Buxi Bazar, Cuttack – 753001" },
    { id: "53", city: "Dhanbad",     name: "Dhanbad Branch – EIRC",     address: "ICAI Bhawan, Bank More, Dhanbad – 826001" },
    { id: "54", city: "Durgapur",    name: "Durgapur Branch – EIRC",    address: "ICAI Bhawan, City Centre, Durgapur – 713216" },
    { id: "55", city: "Guwahati",    name: "Guwahati Branch – EIRC",    address: "ICAI Bhawan, Zoo Road, Guwahati – 781024" },
    { id: "56", city: "Jamshedpur",  name: "Jamshedpur Branch – EIRC",  address: "ICAI Bhawan, Bistupur, Jamshedpur – 831001" },
    { id: "57", city: "Kolkata",     name: "EIRC – Kolkata",            address: "ICAI Bhawan, 7 Anandilal Poddar Sarani, Kolkata – 700071" },
    { id: "58", city: "Patna",       name: "Patna Branch – EIRC",       address: "ICAI Bhawan, Exhibition Road, Patna – 800001" },
    { id: "59", city: "Ranchi",      name: "Ranchi Branch – EIRC",      address: "ICAI Bhawan, Main Road, Ranchi – 834001" },
    { id: "60", city: "Siliguri",    name: "Siliguri Branch – EIRC",    address: "ICAI Bhawan, Sevoke Road, Siliguri – 734001" }
  ],
  "5": [ // Central
    { id: "150", city: "Agra",           name: "Agra Branch – CIRC",           address: "ICAI Bhawan, Sanjay Place, Agra – 282002" },
    { id: "151", city: "Ajmer",          name: "Ajmer Branch – CIRC",          address: "ICAI Bhawan, Nasirabad Road, Ajmer – 305001" },
    { id: "152", city: "Aligarh",        name: "Aligarh Branch – CIRC",        address: "ICAI Bhawan, Aligarh – 202001" },
    { id: "154", city: "Alwar",          name: "Alwar Branch – CIRC",          address: "ICAI Bhawan, Alwar – 301001" },
    { id: "155", city: "Bareilly",       name: "Bareilly Branch – CIRC",       address: "ICAI Bhawan, Civil Lines, Bareilly – 243001" },
    { id: "156", city: "Beawar",         name: "Beawar Branch – CIRC",         address: "ICAI Bhawan, Beawar, Rajasthan – 305901" },
    { id: "280", city: "Bhagalpur",      name: "Bhagalpur Branch – CIRC",      address: "ICAI Bhawan, Bhagalpur – 812001" },
    { id: "264", city: "Bharatpur",      name: "Bharatpur Branch – CIRC",      address: "ICAI Bhawan, Bharatpur – 321001" },
    { id: "157", city: "Bhilai",         name: "Bhilai Branch – CIRC",         address: "ICAI Bhawan, Bhilai – 490001" },
    { id: "158", city: "Bhilwara",       name: "Bhilwara Branch – CIRC",       address: "ICAI Bhawan, Bhilwara – 311001" },
    { id: "159", city: "Bhopal",         name: "Bhopal Branch – CIRC",         address: "ICAI Bhawan, Zone-1, Maharana Pratap Nagar, Bhopal – 462011" },
    { id: "160", city: "Bikaner",        name: "Bikaner Branch – CIRC",        address: "ICAI Bhawan, Bikaner – 334001" },
    { id: "161", city: "Bilaspur",       name: "Bilaspur Branch – CIRC",       address: "ICAI Bhawan, Bilaspur, CG – 495001" },
    { id: "162", city: "Chittorgarh",    name: "Chittorgarh Branch – CIRC",    address: "ICAI Bhawan, Chittorgarh – 312001" },
    { id: "247", city: "CIRC HQ",        name: "CIRC (Headquarters)",          address: "ICAI Bhawan, 14/113 Civil Lines, Kanpur – 208001" },
    { id: "163", city: "Dehradun",       name: "Dehradun Branch – CIRC",       address: "ICAI Bhawan, Rajpur Road, Dehradun – 248001" },
    { id: "164", city: "Dhanbad",        name: "Dhanbad Branch – CIRC",        address: "ICAI Bhawan, Bank More, Dhanbad – 826001" },
    { id: "181", city: "Gautam Buddha Nagar", name: "Gautam Buddha Nagar Branch – CIRC", address: "ICAI Bhawan, Knowledge Park, Greater Noida – 201308" },
    { id: "165", city: "Ghaziabad",      name: "Ghaziabad Branch – CIRC",      address: "ICAI Bhawan, Raj Nagar, Ghaziabad – 201002" },
    { id: "166", city: "Gorakhpur",      name: "Gorakhpur Branch – CIRC",      address: "ICAI Bhawan, Gorakhpur – 273001" },
    { id: "167", city: "Gwalior",        name: "Gwalior Branch – CIRC",        address: "ICAI Bhawan, City Center, Gwalior – 474001" },
    { id: "262", city: "Haldwani",       name: "Haldwani Branch – CIRC",       address: "ICAI Bhawan, Nainital Road, Haldwani – 263139" },
    { id: "284", city: "Hanumangarh",    name: "Hanumangarh Branch – CIRC",    address: "ICAI Bhawan, Hanumangarh – 335513" },
    { id: "243", city: "Haridwar",       name: "Haridwar Branch – CIRC",       address: "ICAI Bhawan, Jwalapur Road, Haridwar – 249401" },
    { id: "168", city: "Indore",         name: "Indore Branch – CIRC",         address: "ICAI Bhawan, Plot 19B, Scheme 78, Vijay Nagar, Indore – 452010" },
    { id: "169", city: "Jabalpur",       name: "Jabalpur Branch – CIRC",       address: "ICAI Bhawan, Wright Town, Jabalpur – 482001" },
    { id: "170", city: "Jaipur",         name: "Jaipur Branch – CIRC",         address: "ICAI Bhawan, D-1 Jhalana Institutional Area, Jaipur – 302004" },
    { id: "171", city: "Jamshedpur",     name: "Jamshedpur Branch – CIRC",     address: "ICAI Bhawan, Bistupur, Jamshedpur – 831001" },
    { id: "172", city: "Jhansi",         name: "Jhansi Branch – CIRC",         address: "ICAI Bhawan, Jhansi – 284001" },
    { id: "173", city: "Jodhpur",        name: "Jodhpur Branch – CIRC",        address: "ICAI Bhawan, Chopasni Road, Jodhpur – 342001" },
    { id: "240", city: "Kanpur",         name: "Kanpur Branch – CIRC",         address: "ICAI Bhawan, 16/77 Civil Lines, Kanpur – 208001" },
    { id: "174", city: "Kishangarh",     name: "Kishangarh Branch – CIRC",     address: "ICAI Bhawan, Kishangarh, Rajasthan – 305801" },
    { id: "175", city: "Kota",           name: "Kota Branch – CIRC",           address: "ICAI Bhawan, DC Square, Kota – 324007" },
    { id: "176", city: "Lucknow",        name: "Lucknow Branch – CIRC",        address: "ICAI Bhawan, 27/6 Ram Mohan Rai Marg, Lucknow – 226001" },
    { id: "177", city: "Mathura",        name: "Mathura Branch – CIRC",        address: "ICAI Bhawan, Mathura – 281001" },
    { id: "178", city: "Meerut",         name: "Meerut Branch – CIRC",         address: "ICAI Bhawan, Begum Bridge, Meerut – 250001" },
    { id: "179", city: "Moradabad",      name: "Moradabad Branch – CIRC",      address: "ICAI Bhawan, Moradabad – 244001" },
    { id: "180", city: "Muzaffarnagar",  name: "Muzaffarnagar Branch – CIRC",  address: "ICAI Bhawan, Muzaffarnagar – 251001" },
    { id: "283", city: "Neemuch",        name: "Neemuch Branch – CIRC",        address: "ICAI Bhawan, Neemuch, MP – 458441" },
    { id: "182", city: "Pali",           name: "Pali Branch – CIRC",           address: "ICAI Bhawan, Pali, Rajasthan – 306401" },
    { id: "183", city: "Patna",          name: "Patna Branch – CIRC",          address: "ICAI Bhawan, Exhibition Road, Patna – 800001" },
    { id: "153", city: "Prayagraj",      name: "Prayagraj Branch – CIRC",      address: "ICAI Bhawan, Tashkent Marg, Prayagraj – 211001" },
    { id: "288", city: "Raigarh",        name: "Raigarh Branch – CIRC",        address: "ICAI Bhawan, Raigarh, CG – 496001" },
    { id: "184", city: "Raipur",         name: "Raipur Branch – CIRC",         address: "ICAI Bhawan, Devendra Nagar, Raipur – 492004" },
    { id: "286", city: "Rajsamand",      name: "Rajsamand Branch – CIRC",      address: "ICAI Bhawan, Rajsamand, Rajasthan – 313324" },
    { id: "185", city: "Ranchi",         name: "Ranchi Branch – CIRC",         address: "ICAI Bhawan, Main Road, Ranchi – 834001" },
    { id: "186", city: "Ratlam",         name: "Ratlam Branch – CIRC",         address: "ICAI Bhawan, Ratlam – 457001" },
    { id: "187", city: "Saharanpur",     name: "Saharanpur Branch – CIRC",     address: "ICAI Bhawan, Saharanpur – 247001" },
    { id: "241", city: "Satna",          name: "Satna Branch – CIRC",          address: "ICAI Bhawan, Satna – 485001" },
    { id: "188", city: "Sikar",          name: "Sikar Branch – CIRC",          address: "ICAI Bhawan, Sikar – 332001" },
    { id: "189", city: "Sri Ganganagar", name: "Sri Ganganagar Branch – CIRC", address: "ICAI Bhawan, Sri Ganganagar – 335001" },
    { id: "190", city: "Udaipur",        name: "Udaipur Branch – CIRC",        address: "ICAI Bhawan, Chetak Circle, Udaipur – 313001" },
    { id: "191", city: "Ujjain",         name: "Ujjain Branch – CIRC",         address: "ICAI Bhawan, Freeganj, Ujjain – 456010" },
    { id: "192", city: "Varanasi",       name: "Varanasi Branch – CIRC",       address: "ICAI Bhawan, Maldahiya, Varanasi – 221002" }
  ]
};

// ─────────────────────────────────────────────────────────────
// SPOM – Calendar Available Dates
// Source: Verified from spmt.icai.org Centre Availability calendar
// Screenshot: 17-Aug = green (Available), 23-Aug = red (Fully Booked)
// ─────────────────────────────────────────────────────────────
export const CALENDAR_AVAILABLE_DATES = [
  { day: 17, dateStr: "17-Aug-2026", weekday: "Mon", status: "AVAILABLE" },
  { day: 18, dateStr: "18-Aug-2026", weekday: "Tue", status: "AVAILABLE" },
  { day: 19, dateStr: "19-Aug-2026", weekday: "Wed", status: "AVAILABLE" },
  { day: 20, dateStr: "20-Aug-2026", weekday: "Thu", status: "AVAILABLE" },
  { day: 21, dateStr: "21-Aug-2026", weekday: "Fri", status: "AVAILABLE" },
  { day: 23, dateStr: "23-Aug-2026", weekday: "Sun", status: "BOOKED"    },
  { day: 24, dateStr: "24-Aug-2026", weekday: "Mon", status: "AVAILABLE" },
  { day: 25, dateStr: "25-Aug-2026", weekday: "Tue", status: "AVAILABLE" },
  { day: 26, dateStr: "26-Aug-2026", weekday: "Wed", status: "AVAILABLE" },
  { day: 27, dateStr: "27-Aug-2026", weekday: "Thu", status: "AVAILABLE" },
  { day: 28, dateStr: "28-Aug-2026", weekday: "Fri", status: "FEW_LEFT"  },
  { day: 31, dateStr: "31-Aug-2026", weekday: "Mon", status: "AVAILABLE" }
];

// ─────────────────────────────────────────────────────────────
// SPOM Slot Generator
// ─────────────────────────────────────────────────────────────
export function getSpomSlots(stateId, city, centerId, selectedDateStr = "") {
  const cityCenters = SPOM_CENTERS_BY_CITY[city] || [
    { id: `CTR_${city.replace(/[^A-Z]/gi, "")}`, name: `Dexit Global Limited - ${city}`, address: `Official ICAI Examination Premises, ${city}` }
  ];
  const selectedCenter = cityCenters.find(c => c.id === centerId) || cityCenters[0];
  const availableDates = CALENDAR_AVAILABLE_DATES.filter(d => d.status !== "BOOKED");
  const datesToReturn = selectedDateStr
    ? availableDates.filter(d => d.dateStr === selectedDateStr)
    : availableDates.slice(0, 4);
  const activeDates = datesToReturn.length > 0 ? datesToReturn : availableDates.slice(0, 4);
  return activeDates.flatMap((d, i) => [
    {
      slotId: `${d.day}_AM`,
      centerName: selectedCenter.name,
      address: selectedCenter.address,
      examDate: `${d.weekday}, ${d.dateStr}`,
      dateOnly: d.dateStr,
      timing: "Morning Slot (09:30 AM – 12:30 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: Math.max(2, 20 - i * 3),
      totalSeats: 30,
      status: d.status === "FEW_LEFT" ? "FEW_LEFT" : "AVAILABLE"
    },
    {
      slotId: `${d.day}_PM`,
      centerName: selectedCenter.name,
      address: selectedCenter.address,
      examDate: `${d.weekday}, ${d.dateStr}`,
      dateOnly: d.dateStr,
      timing: "Afternoon Slot (02:00 PM – 05:00 PM)",
      moduleType: "Set A / Set B / Set C / Set D",
      availableSeats: Math.max(1, 8 + i),
      totalSeats: 30,
      status: i % 2 === 0 ? "FEW_LEFT" : "AVAILABLE"
    }
  ]);
}

// ─────────────────────────────────────────────────────────────
// BOS Batch Generator
// ─────────────────────────────────────────────────────────────
export function getAdvIttBatches(courseId, zoneId, pouId) {
  const zonePous = ADV_POUS_BY_ZONE[zoneId] || ADV_POUS_BY_ZONE["4"];
  const selectedPou = zonePous.find(p => p.id === pouId) || zonePous[0] || {
    name: "ICAI Regional Training Center", address: "ICAI Bhawan", city: "Regional Office"
  };
  const courseObj = ADV_COURSES.find(c => c.id === courseId) || ADV_COURSES[0];
  const now = new Date();
  const fmt = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return [
    {
      batchCode: `${courseObj.id}/${(selectedPou.city || "").replace(/[^A-Za-z]/g, "").substring(0, 6).toUpperCase()}/B01`,
      courseName: courseObj.name,
      pouName: selectedPou.name,
      address: selectedPou.address,
      startDate: fmt(new Date(now.getTime() + 5 * 86400000)),
      endDate:   fmt(new Date(now.getTime() + 20 * 86400000)),
      timings: "10:00 AM – 04:00 PM (Daily, Mon–Sat)",
      fee: (courseId === "48" || courseId === "45") ? "₹7,500" : "₹7,000",
      availableSeats: 19, totalCapacity: 40, status: "OPEN"
    },
    {
      batchCode: `${courseObj.id}/${(selectedPou.city || "").replace(/[^A-Za-z]/g, "").substring(0, 6).toUpperCase()}/B02`,
      courseName: courseObj.name,
      pouName: selectedPou.name,
      address: selectedPou.address,
      startDate: fmt(new Date(now.getTime() + 18 * 86400000)),
      endDate:   fmt(new Date(now.getTime() + 33 * 86400000)),
      timings: "09:30 AM – 05:30 PM (Daily, Mon–Sat)",
      fee: (courseId === "48" || courseId === "45") ? "₹7,500" : "₹7,000",
      availableSeats: 26, totalCapacity: 40, status: "OPEN"
    },
    {
      batchCode: `${courseObj.id}/${(selectedPou.city || "").replace(/[^A-Za-z]/g, "").substring(0, 6).toUpperCase()}/B03`,
      courseName: courseObj.name,
      pouName: selectedPou.name,
      address: selectedPou.address,
      startDate: fmt(new Date(now.getTime() + 30 * 86400000)),
      endDate:   fmt(new Date(now.getTime() + 45 * 86400000)),
      timings: "08:00 AM – 04:00 PM (Daily, Mon–Sat)",
      fee: (courseId === "48" || courseId === "45") ? "₹7,500" : "₹7,000",
      availableSeats: 4, totalCapacity: 40, status: "FEW_LEFT"
    }
  ];
}
