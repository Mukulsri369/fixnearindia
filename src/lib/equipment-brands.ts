/**
 * Brand catalog mapped to equipment categories.
 *
 * Key = equipment category name exactly as it appears in SEGMENTS (technician-catalog.ts).
 * Used by the onboarding wizard so a technician only sees brands that actually
 * manufacture the equipment they selected.
 */

export const CATEGORY_BRANDS: Record<string, string[]> = {
  /* ---------------- Home / Residential ---------------- */
  "AC / Cooling": [
    "Daikin", "Voltas", "Blue Star", "Hitachi", "Carrier", "O General", "LG", "Samsung", "Panasonic",
    "Mitsubishi Electric", "Mitsubishi Heavy Industries", "Toshiba", "Lloyd", "Godrej", "Whirlpool",
    "Haier", "Sharp", "Onida", "Videocon", "IFB", "Croma", "Sansui", "TCL", "Midea", "Gree", "Trane",
    "York", "Rheem", "Symphony", "Bajaj", "Crompton", "Havells", "Usha", "Orient Electric", "Kenstar",
    "Cruise", "Amstrad", "Bosch", "Sanyo", "Electrolux",
  ],
  Refrigeration: [
    "LG", "Samsung", "Whirlpool", "Godrej", "Haier", "Bosch", "Siemens", "Panasonic", "Hitachi",
    "Liebherr", "Electrolux", "Voltas Beko", "IFB", "Sharp", "Videocon", "Kelvinator", "Croma",
    "Toshiba", "Mitsubishi Electric", "Blue Star", "Western", "Rockwell", "Elanpro", "Midea", "TCL",
  ],
  "Washing / Laundry": [
    "LG", "Samsung", "IFB", "Bosch", "Siemens", "Whirlpool", "Godrej", "Haier", "Panasonic", "Onida",
    "Videocon", "Electrolux", "Voltas Beko", "Midea", "TCL", "Croma", "Lloyd", "Toshiba", "Candy",
    "Intex", "Sansui", "Hitachi",
  ],
  Kitchen: [
    "Prestige", "Butterfly", "Pigeon", "Hawkins", "Bajaj", "Philips", "Havells", "Usha", "Morphy Richards",
    "Preethi", "Sujata", "Kenstar", "Wonderchef", "Borosil", "Glen", "Faber", "Elica", "Kaff", "Sunflame",
    "Hindware", "Kutchina", "IFB", "LG", "Samsung", "Panasonic", "Whirlpool", "Bosch", "Siemens",
    "Godrej", "Haier", "Inalsa", "Crompton", "Orient Electric", "Kent", "Agaro", "Instant Pot",
    "Black+Decker", "Electrolux", "V-Guard",
  ],
  "Water Purification": [
    "Kent", "Aquaguard", "Eureka Forbes", "Pureit", "Livpure", "AO Smith", "Blue Star", "Havells",
    "LG", "Faber", "Tata Swach", "Hindware", "V-Guard", "Nasaka", "Zero B", "Dr. Aquaguard", "Konvio",
    "Bluestar Aristo", "Ion Exchange", "Whirlpool",
  ],
  "Geyser / Water Heating": [
    "AO Smith", "Racold", "Bajaj", "Havells", "V-Guard", "Crompton", "Usha", "Venus", "Hindware",
    "Orient Electric", "Kenstar", "Morphy Richards", "Bosch", "Haier", "Jaquar", "Marc", "Faber",
    "Polycab", "Khaitan",
  ],
  "Power Backup": [
    "Luminous", "Exide", "Microtek", "Amaron", "V-Guard", "Su-Kam", "APC", "Numeric", "Livguard",
    "Okaya", "Genus", "Base", "Eaton", "Vertiv", "Delta", "Havells", "Sukam", "Amara Raja", "Servo",
    "Schneider Electric", "Bajaj", "Crompton", "Emerson", "Hitachi Hi-Rel",
  ],
  "TV / Entertainment": [
    "Sony", "Samsung", "LG", "Panasonic", "Philips", "TCL", "Xiaomi", "OnePlus", "Realme", "Vu",
    "Hisense", "Toshiba", "Sharp", "Haier", "Thomson", "Kodak", "Micromax", "Sansui", "Onida",
    "Videocon", "BPL", "Croma", "Blaupunkt", "Acer", "Motorola", "Nokia", "JBL", "Bose", "Yamaha",
    "Denon", "Zebronics", "boAt", "Marshall", "Harman Kardon", "Polk Audio",
  ],
  "Computer / IT": [
    "HP", "Dell", "Lenovo", "Acer", "Asus", "Apple", "MSI", "Microsoft", "Samsung", "LG", "Sony",
    "Toshiba", "Fujitsu", "Gigabyte", "Intel", "AMD", "NVIDIA", "Seagate", "Western Digital", "Kingston",
    "Corsair", "Logitech", "Canon", "Epson", "Brother", "Xerox", "Ricoh", "Zebronics", "iBall",
    "TP-Link", "D-Link", "Netgear", "Cisco", "Wipro", "HCL",
  ],
  "Mobile / Smart Devices": [
    "Apple", "Samsung", "Xiaomi", "Redmi", "Realme", "OnePlus", "Oppo", "Vivo", "iQOO", "Poco",
    "Motorola", "Nokia", "Google", "Nothing", "Infinix", "Tecno", "Lava", "Micromax", "Honor", "Asus",
    "Sony", "Huawei", "Amazfit", "Noise", "boAt", "Fire-Boltt", "Fitbit", "Garmin",
  ],
  "Cctv / Security": [
    "Hikvision", "CP Plus", "Dahua", "Godrej", "Honeywell", "Bosch", "Panasonic", "Samsung Wisenet",
    "Axis", "Zicom", "Sparsh", "Secureye", "Zebronics", "D-Link", "TP-Link", "Ezviz", "Uniview",
    "Matrix", "eSSL", "Realtime", "Mantra", "Qubo", "Mi", "Tata Play",
  ],
  "Home Automation": [
    "Schneider Electric", "Legrand", "Havells", "Anchor Panasonic", "Wipro", "Syska", "Philips Hue",
    "Google Nest", "Amazon Alexa", "Xiaomi", "Qubo", "Oakter", "Silvan", "Crestron", "Lutron", "GM Modular",
    "Norisys", "Cubical", "Homemate", "Zunpulse",
  ],
  "Electrical / Lighting": [
    "Havells", "Philips", "Syska", "Wipro", "Crompton", "Bajaj", "Orient Electric", "Anchor Panasonic",
    "Legrand", "Schneider Electric", "Siemens", "ABB", "L&T", "Polycab", "V-Guard", "GM Modular",
    "Finolex", "RR Kabel", "Usha", "Surya", "Eveready", "Halonix", "Osram", "Luker", "Hager",
    "C&S Electric", "Indoasian",
  ],
  "Personal Electronics": [
    "Philips", "Braun", "Panasonic", "Havells", "Syska", "Nova", "Kemei", "Vega", "Wahl", "Dyson",
    "Bajaj", "Agaro", "Beurer", "Oral-B", "Xiaomi", "boAt", "Sony", "JBL", "Realme", "Noise",
  ],
  Fitness: [
    "Cockatoo", "Powermax", "Durafit", "Fitkit", "Reach", "Kobo", "Welcare", "Cult Sport", "Lifelong",
    "Healthgenie", "Afton", "Propel", "Precor", "Life Fitness", "Technogym", "Johnson Fitness",
    "Nautilus", "Sparnod",
  ],

  /* ---------------- Business / Commercial ---------------- */
  "Commercial Refrigeration": [
    "Blue Star", "Voltas", "Western", "Elanpro", "Rockwell", "Frigoglass", "Haier", "Carrier",
    "Danfoss", "Emerson (Copeland)", "Bitzer", "Tecumseh", "Hussmann", "Kirloskar", "Celfrost",
    "Ice Make", "Vestfrost", "Liebherr", "Hoshizaki", "Godrej", "Fujiyama",
  ],
  "Commercial Kitchen": [
    "Rational", "Hobart", "Winterhalter", "Electrolux Professional", "Hoshizaki", "Manitowoc",
    "Middleby", "Convotherm", "Unox", "Robot Coupe", "Sirman", "Blue Star", "Elanpro", "Celfrost",
    "IFB Hotel Solutions", "Rico", "Kanteen India", "Fabristeel", "Prime Kitchen", "Ambassador",
    "Sunflame Professional", "Vulcan", "Garland",
  ],
  "Restaurant / Food Service": [
    "Rational", "Hobart", "Winterhalter", "Middleby", "Elanpro", "Blue Star", "Celfrost", "Hoshizaki",
    "Manitowoc", "Robot Coupe", "Bunn", "La Marzocco", "Franke", "Nuova Simonelli", "Rancilio",
    "Dr. Coffee", "Lavazza", "Cafe Desire", "Unox", "Kanteen India",
  ],
  "Commercial Laundry": [
    "IFB", "Electrolux Professional", "Miele Professional", "Alliance (Speed Queen)", "Girbau",
    "Primus", "LG Commercial", "Ramsons", "Stefab", "Danube", "Renzacci", "Union", "Whirlpool Commercial",
  ],
  "Office IT": [
    "HP", "Dell", "Lenovo", "Cisco", "Fortinet", "Juniper", "Aruba", "Netgear", "TP-Link", "D-Link",
    "Ubiquiti", "APC", "Eaton", "Vertiv", "Canon", "Xerox", "Ricoh", "Epson", "Brother", "Konica Minolta",
    "Kyocera", "Sharp", "Toshiba", "Synology", "QNAP", "Seagate", "Western Digital", "Microsoft",
    "Polycom", "Logitech", "Zebra", "Honeywell",
  ],
  "Commercial Power": [
    "Schneider Electric", "ABB", "Siemens", "L&T", "Eaton", "Legrand", "Havells", "Vertiv", "APC",
    "Delta", "Socomec", "Luminous", "Microtek", "Numeric", "Emerson", "Kirloskar", "Cummins",
    "Mahindra Powerol", "Ashok Leyland", "Sudhir Power", "Jakson", "Servokon", "CG Power",
  ],
  "Commercial HVAC": [
    "Daikin", "Carrier", "Blue Star", "Voltas", "Hitachi", "Trane", "York", "Mitsubishi Electric",
    "Mitsubishi Heavy Industries", "LG", "Samsung", "Toshiba", "Panasonic", "Johnson Controls",
    "Systemair", "Kirloskar", "Thermax", "Danfoss", "Zamil", "Waves", "Edgetech", "Honeywell",
  ],
  "Commercial Security": [
    "Hikvision", "Dahua", "CP Plus", "Bosch", "Honeywell", "Axis", "Samsung Wisenet", "Panasonic",
    "Godrej", "Matrix", "eSSL", "ZKTeco", "Suprema", "Realtime", "Uniview", "Vantage", "Secureye",
    "Notifier", "Ravel", "Agni", "Tyco", "Schneider Electric",
  ],
  "Building Equipment": [
    "Otis", "Kone", "Schindler", "ThyssenKrupp", "Mitsubishi Electric", "Johnson Lifts", "Fujitec",
    "Hitachi", "Omega Elevators", "Escon", "Grundfos", "Kirloskar", "CRI", "Honeywell", "Siemens",
    "Schneider Electric", "Legrand", "Gandhi Automations", "Hormann",
  ],
  "Commercial Water Systems": [
    "Ion Exchange", "Thermax", "Eureka Forbes", "AO Smith", "Kent", "Aquaguard", "Blue Star",
    "Grundfos", "Kirloskar", "CRI", "Pentair", "Doshi Ion", "Va Tech Wabag", "Netsol Water",
    "Hydro Pure", "Watertec",
  ],
  Retail: [
    "Zebra", "Honeywell", "Epson", "TVS Electronics", "Posiflex", "Star Micronics", "Datalogic",
    "Ingenico", "PAX", "Verifone", "Pine Labs", "Essae", "Rongta", "Godrej", "Toshiba", "NCR",
  ],
  Salon: [
    "Wahl", "Andis", "Philips", "Panasonic", "Babyliss", "Dyson", "Kemei", "Vega Professional",
    "Takara Belmont", "Ikonic", "Berkowits", "Havells", "Remington", "Braun",
  ],
  "Commercial Gym": [
    "Life Fitness", "Technogym", "Precor", "Matrix Fitness", "Cybex", "Nautilus", "Star Trac",
    "Johnson Fitness", "Cosco", "Powermax", "Afton", "Viva Fitness", "Energie Fitness", "Sparnod",
  ],
  Hotel: [
    "Assa Abloy", "Onity", "Salto", "Godrej", "Dormakaba", "LG", "Samsung", "Philips", "Elanpro",
    "Celfrost", "IFB Hotel Solutions", "Electrolux Professional", "Blue Star", "Daikin", "Otis",
    "Kone", "Bosch", "Honeywell",
  ],

  /* ---------------- Industrial ---------------- */
  "Industrial Electrical": [
    "Siemens", "ABB", "Schneider Electric", "L&T", "Eaton", "Legrand", "C&S Electric", "Havells",
    "CG Power", "BCH", "Rockwell Automation", "Mitsubishi Electric", "Hager", "Chint", "GE",
    "Kirloskar Electric", "Bharat Bijlee", "Polycab", "Phoenix Contact", "Wago", "Rittal",
  ],
  "Motors & Drives": [
    "ABB", "Siemens", "Schneider Electric", "Danfoss", "Yaskawa", "Mitsubishi Electric", "Delta",
    "WEG", "SEW-Eurodrive", "Lenze", "Fuji Electric", "Hitachi Industrial", "INVT", "LS Electric",
    "Bharat Bijlee", "Kirloskar Electric", "CG Power", "Havells", "Marathon", "Nord", "Bonfiglioli",
    "Rockwell Automation", "Toshiba", "Baldor",
  ],
  "PLC / Automation": [
    "Siemens", "Allen-Bradley / Rockwell Automation", "Mitsubishi Electric", "Omron", "Schneider Electric",
    "Delta", "ABB", "Beckhoff", "Bosch Rexroth", "Fuji Electric", "Keyence", "Panasonic", "LS Electric",
    "Wago", "Phoenix Contact", "B&R", "GE Fanuc", "Honeywell", "Yokogawa", "Emerson",
  ],
  Instrumentation: [
    "Endress+Hauser", "Emerson (Rosemount)", "Yokogawa", "Honeywell", "ABB", "Siemens", "Fluke",
    "Keyence", "Sick", "IFM", "Pepperl+Fuchs", "Vega", "Krohne", "WIKA", "Baumer", "Ashcroft",
    "Forbes Marshall", "Toshniwal", "Masibus", "Selec", "Autonics",
  ],
  "CNC / Machine Tools": [
    "FANUC", "Siemens", "Mitsubishi CNC", "Heidenhain", "Haas", "Mazak", "DMG Mori", "Okuma", "Makino",
    "Doosan", "Hurco", "Syntec", "Delta CNC", "Fagor", "Ace Micromatic", "Jyoti CNC", "Bharat Fritz Werner",
    "HMT", "LMW", "Amada", "Trumpf", "Bystronic", "Hyundai WIA",
  ],
  Robotics: [
    "FANUC", "KUKA", "ABB Robotics", "Yaskawa Motoman", "Kawasaki", "Universal Robots", "Epson Robotics",
    "Denso", "Stäubli", "Mitsubishi Electric", "Omron Adept", "Doosan Robotics", "Techman", "Nachi",
    "Comau", "Hyundai Robotics", "Delta", "Igus",
  ],
  "Production Machinery": [
    "Siemens", "ABB", "Bosch Rexroth", "Schneider Electric", "SMC", "Festo", "Parker", "Emerson",
    "Rockwell Automation", "Mitsubishi Electric", "Omron", "Kirloskar", "L&T", "Thermax", "Voltas",
    "Elgi", "Atlas Copco",
  ],
  Packaging: [
    "Bosch Packaging (Syntegon)", "Krones", "Sidel", "Tetra Pak", "Multivac", "Ishida", "Nichrome",
    "Uflex", "Rovema", "Sacmi", "Marchesini", "IMA", "PAKONA", "Pacmac", "Videojet", "Domino",
    "Markem-Imaje", "Zebra",
  ],
  "Plastic Machinery": [
    "Engel", "Arburg", "Husky", "Haitian", "Milacron", "Ferromatik", "Toshiba Machine (Shibaura)",
    "JSW", "Sumitomo Demag", "Windsor", "Electronica Plastic Machines", "L&T Plastics", "Negri Bossi",
    "Battenfeld", "Nissei", "Krauss Maffei",
  ],
  Textile: [
    "Rieter", "Trützschler", "Lakshmi Machine Works (LMW)", "Picanol", "Toyota Industries", "Tsudakoma",
    "Karl Mayer", "Murata", "Savio", "Schlafhorst", "Saurer", "Itema", "Somet", "Sulzer", "Juki",
    "Brother", "Jack", "Zoje", "Shima Seiki", "Stoll",
  ],
  "Food Processing": [
    "GEA", "Alfa Laval", "Bühler", "Tetra Pak", "SPX Flow", "Krones", "JBT", "Bosch (Syntegon)",
    "Marel", "Baader", "Hosokawa", "Sidel", "APV", "IKA", "Nichrome", "Rieco", "Kanchan Metals",
    "Sujata Industries", "Milky Day", "Thermax", "Forbes Marshall", "Ishida",
  ],
  Pharmaceutical: [
    "IMA", "Bosch (Syntegon)", "Glatt", "GEA", "ACG", "Cadmach", "Sejong", "Korsch", "Fette Compacting",
    "Uhlmann", "Marchesini", "Thermo Fisher", "Steris", "Getinge", "Shimadzu", "Waters", "Agilent",
  ],
  Pumps: [
    "Grundfos", "KSB", "Kirloskar Brothers", "CRI Pumps", "Crompton", "Wilo", "Flowserve", "Sulzer",
    "Xylem", "Ebara", "Lubi", "Texmo", "Shakti", "Havells", "V-Guard", "Roto",
  ],
  "Compressors / Pneumatics": [
    "Atlas Copco", "Ingersoll Rand", "Elgi", "Kaeser", "Kirloskar Pneumatic", "Chicago Pneumatic",
    "Gardner Denver", "SMC", "Festo", "Parker", "Janatics", "Airmax", "Sullair", "Boge", "Bitzer",
    "Copeland",
  ],
  "Industrial HVAC / Refrigeration": [
    "Daikin", "Carrier", "Trane", "York", "Blue Star", "Voltas", "Thermax", "Kirloskar Chillers",
    "Danfoss", "Bitzer", "Emerson (Copeland)", "GEA", "Mycom", "Johnson Controls", "Systemair",
    "Frick", "Baltimore Aircoil", "Advantage",
  ],
  "Welding / Cutting": [
    "Lincoln Electric", "ESAB", "Fronius", "Miller", "Kemppi", "Panasonic", "Ador Welding", "Warpp",
    "Cruxweld", "Messer", "Trumpf", "Amada", "Bystronic", "Hypertherm", "Migatronic", "OTC Daihen",
  ],
  "Material Handling": [
    "Toyota Material Handling", "Godrej Material Handling", "KION (Linde)", "Crown", "Hyster-Yale",
    "Jungheinrich", "Komatsu", "Voltas", "Ace", "Escorts", "Demag", "Konecranes", "Street Crane",
    "Electromech", "SSI Schaefer", "Daifuku", "Interroll", "Habasit",
  ],
  "Construction / Mining": [
    "Caterpillar", "JCB", "Komatsu", "Tata Hitachi", "Volvo Construction Equipment", "SANY",
    "Schwing Stetter", "Ace", "Escorts", "Mahindra Construction Equipment", "Liebherr", "Hyundai",
    "Doosan", "Case", "Terex", "Putzmeister", "Wirtgen", "Atlas Copco (Epiroc)", "Metso", "Sandvik",
  ],
  "Water / Wastewater": [
    "Va Tech Wabag", "Ion Exchange", "Thermax", "Grundfos", "Xylem", "Veolia", "Suez", "Pentair",
    "Alfa Laval", "GEA", "Andritz", "KSB", "Kirloskar Brothers", "Hach", "Endress+Hauser", "Netsol Water",
    "Aquatech", "Doshi Ion", "Triveni", "Hydroflux",
  ],
  "Printing / Paper": [
    "Heidelberg", "Komori", "manroland", "KBA", "Bobst", "HP Indigo", "Xerox", "Canon", "Ricoh",
    "Konica Minolta", "Kodak", "Screen", "Durst", "Videojet", "Domino", "Markem-Imaje", "Voith",
    "Valmet", "Andritz",
  ],
  "Power Generation / Renewable": [
    "Cummins", "Kirloskar Oil Engines", "Mahindra Powerol", "Ashok Leyland", "Caterpillar", "Perkins",
    "Jakson", "Sudhir Power", "BHEL", "GE", "Siemens Energy", "Vestas", "Suzlon", "Senvion", "Nordex",
    "SMA", "Sungrow", "Huawei", "Fronius", "Delta", "ABB", "Tata Power Solar", "Waaree", "Adani Solar",
    "Vikram Solar", "Luminous", "Growatt", "Polycab",
  ],
  "Fire / Industrial Safety": [
    "Honeywell", "Notifier", "Siemens", "Bosch", "Tyco", "Johnson Controls", "Ravel", "Agni",
    "Apollo Fire Detectors", "System Sensor", "Minimax", "HD Fire Protect", "Newage", "Kanex",
    "Safex", "Ceasefire", "Draeger", "MSA",
  ],
  "Laboratory / Testing": [
    "Thermo Fisher", "Agilent", "Shimadzu", "Waters", "PerkinElmer", "Mettler Toledo", "Bruker",
    "Eppendorf", "Sartorius", "Hach", "Anton Paar", "Bio-Rad", "Labindia", "Remi", "Borosil Scientific",
    "Systronics", "Fluke", "Keysight", "Tektronix", "Megger", "Yokogawa", "Rigol", "Hioki", "Chroma",
    "Instron", "Zwick Roell", "Presto", "Electrolab",
  ],
  "Agriculture / Agro-Processing": [
    "Mahindra", "John Deere", "New Holland", "Sonalika", "Escorts Kubota", "TAFE", "Massey Ferguson",
    "Eicher", "Kirloskar", "CRI Pumps", "Shakti", "Texmo", "Bühler", "Alvan Blanch", "Milltec",
    "Satake", "Fowler Westrup", "Perfura", "Rieco", "Osaw",
  ],
};

/** All brands across every category, de-duplicated and sorted. */
export const ALL_CATEGORY_BRANDS: string[] = Array.from(
  new Set(Object.values(CATEGORY_BRANDS).flat()),
).sort((a, b) => a.localeCompare(b));

/** Brands relevant to the equipment categories a technician selected. */
export function brandsForCategories(categoryNames: string[]): { category: string; brands: string[] }[] {
  const seen = new Set<string>();
  const groups: { category: string; brands: string[] }[] = [];
  for (const name of categoryNames) {
    if (seen.has(name)) continue;
    seen.add(name);
    const brands = CATEGORY_BRANDS[name];
    if (brands?.length) groups.push({ category: name, brands });
  }
  return groups;
}
