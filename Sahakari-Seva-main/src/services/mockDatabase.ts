// ==============================================================================
// SAHAKARI SEVA — OFFLINE MOCK DATABASE
// A rich, realistic cooperative dataset used as the offline fallback so every
// screen stays fully functional without the backend: 16 workers across 10
// trades, 8 customers, 12 bookings, ratings, welfare schemes, invoices and
// role-specific notification feeds.
// ==============================================================================

import {
  Worker,
  ServiceCategory,
  Booking,
  Rating,
  Welfare,
  Invoice,
  Notification,
  NearbyWorkerResult,
  Profile,
} from '../types';

// -----------------------------------------------------------------------------
// SERVICE CATEGORIES (10 trades)
// -----------------------------------------------------------------------------

export const MOCK_CATEGORIES: ServiceCategory[] = [
  { id: 's0000000-0000-0000-0000-000000000001', name: 'Electrical', name_hi: 'विद्युत सेवाएं (इलेक्ट्रीशियन)', description: 'Wiring repair, short-circuits, MCB fixes, switches, fans, lighting.', description_hi: 'वायरिंग मरम्मत, शॉर्ट-सर्किट, एमसीबी ट्रिपिंग, स्विच और लाइट फिटिंग।', icon: 'Zap', base_price: 249, emergency_available: true, active: true },
  { id: 's0000000-0000-0000-0000-000000000002', name: 'Plumbing', name_hi: 'नलसाजी सेवाएं (प्लम्बर)', description: 'Pipe leakage, tap repair, drain blockage, cistern, water motor fixes.', description_hi: 'पाइप लीकेज, नल मरम्मत, ड्रेनेज ब्लॉकेज, वाटर मोटर फिटिंग।', icon: 'Wrench', base_price: 249, emergency_available: true, active: true },
  { id: 's0000000-0000-0000-0000-000000000003', name: 'Carpentry', name_hi: 'बढ़ईगीरी सेवाएं (बढ़ई)', description: 'Furniture repair, door latch, hinges, modular fitting, lock replacement.', description_hi: 'फर्नीचर मरम्मत, दरवाजे के ताले, अलमारी और मॉड्यूलर फिटिंग।', icon: 'Hammer', base_price: 299, emergency_available: false, active: true },
  { id: 's0000000-0000-0000-0000-000000000004', name: 'Painting', name_hi: 'पुताई और पेंटिंग', description: 'Interior & exterior wall painting, waterproof primer, distemper, texture.', description_hi: 'आंतरिक व बाहरी पुताई, वाटरप्रूफिंग, डिस्टेंपर और टेक्सचर पेंट।', icon: 'Paintbrush', base_price: 349, emergency_available: false, active: true },
  { id: 's0000000-0000-0000-0000-000000000005', name: 'Cleaning & Sanitization', name_hi: 'सफाई और स्वच्छता', description: 'Deep home cleaning, sofa & carpet shampoo, kitchen degreasing, bathroom descaling.', description_hi: 'डीप होम क्लीनिंग, सोफा और कारपेट शैम्पू, किचन डीग्रीजिंग, बाथरूम सफाई।', icon: 'Sparkles', base_price: 399, emergency_available: true, active: true },
  { id: 's0000000-0000-0000-0000-000000000006', name: 'Gardening & Landscaping', name_hi: 'बागवानी सेवाएं', description: 'Lawn mowing, plant pruning, organic fertilization, terrace garden maintenance.', description_hi: 'लॉन कटाई, पौधों की छंटाई, जैविक खाद, टेरेस गार्डन मेंटेनेंस।', icon: 'Flower2', base_price: 299, emergency_available: false, active: true },
  { id: 's0000000-0000-0000-0000-000000000007', name: 'Appliance Repair', name_hi: 'घरेलू उपकरण मरम्मत', description: 'Washing machine, microwave, refrigerator, geyser, mixer grinder repair.', description_hi: 'वॉशिंग मशीन, माइक्रोवेव, फ्रिज, गीज़र, मिक्सर ग्राइंडर की मरम्मत।', icon: 'Tv', base_price: 299, emergency_available: false, active: true },
  { id: 's0000000-0000-0000-0000-000000000008', name: 'AC Repair & Servicing', name_hi: 'एसी रिपेयर और सर्विसिंग', description: 'AC foam cleaning, gas top-up, capacitor change, compressor troubleshooting.', description_hi: 'एसी फोम जेट सर्विस, गैस चार्जिंग, कैपेसिटर बदलाव, कूलिंग समस्या निवारण।', icon: 'AirVent', base_price: 499, emergency_available: true, active: true },
  { id: 's0000000-0000-0000-0000-000000000009', name: 'Driver Services', name_hi: 'ड्राइवर सेवाएं', description: 'Verified part-time & full-time drivers for household or institutional needs.', description_hi: 'घरेलू या संस्थागत जरूरतों के लिए सत्यापित पार्ट-टाइम व फुल-टाइम ड्राइवर।', icon: 'Car', base_price: 499, emergency_available: false, active: true },
  { id: 's0000000-0000-0000-0000-000000000010', name: 'Caregiving & Nursing', name_hi: 'देखभाल और नर्सिंग सेवाएं', description: 'Elderly care, patient assistance, home nursing, physiotherapy support.', description_hi: 'बुजुर्ग देखभाल, मरीज सहायता, होम नर्सिंग, फिजियोथेरेपी सहायता।', icon: 'HeartPulse', base_price: 449, emergency_available: true, active: true },
];

// -----------------------------------------------------------------------------
// WORKERS (18 across trades & Jaipur zones)
// -----------------------------------------------------------------------------

const coop = {
  id: 'c0000000-0000-0000-0000-000000000001',
  name: 'Jaipur Shramik Sahakari Sangh (Reg. 8842)',
};

export const MOCK_WORKERS: Worker[] = [
  {
    id: 'w0000000-0000-0000-0000-000000000001', profile_id: 'p0000000-0000-0000-0000-000000000010', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0101', skill_category: 'Electrical', skills: ['House Wiring', 'MCB Tripping Fix', 'Fan Installation', 'Inverter Cabling'],
    experience_years: 8, bio: 'Govt ITI certified electrician with 8+ years experience in domestic troubleshooting. Proud member of Jaipur Shramik Sahakari Sangh.',
    service_area: 'C-Scheme & MI Road (Jaipur)', pincode: '302001',
    latitude: 26.9017, longitude: 75.7925, service_radius_km: 15,
    hourly_or_base_rate: 249, average_rating: 4.9, total_jobs: 142, total_earnings: 74200,
    welfare_status: 'Active Member', insurance_status: 'Ayushman Bharat + PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'Govt ITI National Trade Certificate (Electrician)',
    profile: { id: 'p0000000-0000-0000-0000-000000000010', full_name: 'Rajesh Sharma', email: 'rajesh.sharma@worker.in', phone: '+91 98110 55443', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302001', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000002', profile_id: 'p0000000-0000-0000-0000-000000000011', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0102', skill_category: 'Plumbing', skills: ['Pipe Fitting', 'Tap Leakage', 'Water Motor', 'Drain Blockage', 'Sanitary Fitting'],
    experience_years: 6, bio: 'Certified plumber specializing in drainage, sanitary fittings and water motor installation.',
    service_area: 'Malviya Nagar (Jaipur)', pincode: '302017',
    latitude: 26.8560, longitude: 75.8180, service_radius_km: 12,
    hourly_or_base_rate: 249, average_rating: 4.8, total_jobs: 118, total_earnings: 58700,
    welfare_status: 'Active Member', insurance_status: 'Ayushman Bharat + PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'ITI Plumber Trade Certificate',
    profile: { id: 'p0000000-0000-0000-0000-000000000011', full_name: 'Sunil Verma', email: 'sunil.verma@worker.in', phone: '+91 98122 11876', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302017', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000003', profile_id: 'p0000000-0000-0000-0000-000000000012', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0103', skill_category: 'Carpentry', skills: ['Modular Kitchen Fitting', 'Door Lock Installation', 'Furniture Polish', 'Hinges Repair'],
    experience_years: 10, bio: 'Master carpenter with modular kitchen and wardrobe fitting expertise.',
    service_area: 'Vaishali Nagar (Jaipur)', pincode: '302021',
    latitude: 26.9115, longitude: 75.7390, service_radius_km: 12,
    hourly_or_base_rate: 299, average_rating: 4.7, total_jobs: 94, total_earnings: 46100,
    welfare_status: 'Active Member', insurance_status: 'PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'NSDC Skill India Certified Level 4 (Carpentry)',
    profile: { id: 'p0000000-0000-0000-0000-000000000012', full_name: 'Mohammad Imran', email: 'imran.carpenter@worker.in', phone: '+91 98333 20981', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302021', language: 'ur' as any },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000004', profile_id: 'p0000000-0000-0000-0000-000000000013', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0104', skill_category: 'Painting', skills: ['Interior Painting', 'Texture Finish', 'Waterproofing', 'Distemper & Polish'],
    experience_years: 5, bio: 'Painter with premium interior texture and waterproof coating expertise.',
    service_area: 'Mansarovar (Jaipur)', pincode: '302020',
    latitude: 26.8560, longitude: 75.7645, service_radius_km: 10,
    hourly_or_base_rate: 349, average_rating: 4.6, total_jobs: 67, total_earnings: 39200,
    welfare_status: 'Active Member', insurance_status: 'PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'ITI Painter Trade Certificate',
    profile: { id: 'p0000000-0000-0000-0000-000000000013', full_name: 'Vikram Singh', email: 'vikram.paint@worker.in', phone: '+91 98444 51230', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302020', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000005', profile_id: 'p0000000-0000-0000-0000-000000000014', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0105', skill_category: 'Cleaning & Sanitization', skills: ['Deep Home Cleaning', 'Sofa & Carpet Shampoo', 'Kitchen Degreasing', 'Bathroom Descaling'],
    experience_years: 4, bio: 'Professional deep-cleaning specialist with hospital-grade sanitization training.',
    service_area: 'Civil Lines (Jaipur)', pincode: '302006',
    latitude: 26.9190, longitude: 75.8120, service_radius_km: 10,
    hourly_or_base_rate: 399, average_rating: 4.8, total_jobs: 81, total_earnings: 41500,
    welfare_status: 'Active Member', insurance_status: 'Ayushman Bharat',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'NSDC Housekeeping Level 3',
    profile: { id: 'p0000000-0000-0000-0000-000000000014', full_name: 'Anita Devi', email: 'anita.clean@worker.in', phone: '+91 98555 67432', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302006', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000006', profile_id: 'p0000000-0000-0000-0000-000000000015', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0106', skill_category: 'Electrical', skills: ['Substation Wiring', 'Solar Panel Installation', 'Industrial MCB'],
    experience_years: 4, bio: 'ITI certified electrician seeking cooperative onboarding. Experienced in domestic rooftop solar and electrical setups.',
    service_area: 'Jagatpura & Sanganer (Jaipur)', pincode: '302027',
    latitude: 26.8199, longitude: 75.8411, service_radius_km: 15,
    hourly_or_base_rate: 320, average_rating: 5.0, total_jobs: 0, total_earnings: 0,
    welfare_status: 'Application Under Review', insurance_status: 'Pending Verification',
    availability_status: 'available', verification_status: 'pending',
    verification_notes: 'ITI Certificate uploaded. Pending admin review of national trade certificate.',
    certification_name: 'National Trade Certificate (Electrician) - ITI Pusa',
    profile: { id: 'p0000000-0000-0000-0000-000000000015', full_name: 'Arjun Meena', email: 'arjun.meena@worker.in', phone: '+91 98114 77889', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302027', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000007', profile_id: 'p0000000-0000-0000-0000-000000000016', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0107', skill_category: 'AC Repair & Servicing', skills: ['AC Foam Cleaning', 'Gas Top-Up', 'Capacitor Change', 'Compressor Troubleshooting'],
    experience_years: 7, bio: 'AC technician with split & window AC servicing expertise across Jaipur.',
    service_area: 'Bani Park (Jaipur)', pincode: '302006',
    latitude: 26.9290, longitude: 75.7890, service_radius_km: 12,
    hourly_or_base_rate: 499, average_rating: 4.7, total_jobs: 129, total_earnings: 68300,
    welfare_status: 'Active Member', insurance_status: 'Ayushman Bharat + PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'ITI Refrigeration & AC Technician',
    profile: { id: 'p0000000-0000-0000-0000-000000000016', full_name: 'Karan Gupta', email: 'karan.ac@worker.in', phone: '+91 98666 34578', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302006', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000008', profile_id: 'p0000000-0000-0000-0000-000000000017', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0108', skill_category: 'Appliance Repair', skills: ['Washing Machine Repair', 'Refrigerator Servicing', 'Geyser Fix', 'Microwave Repair'],
    experience_years: 6, bio: 'White-goods technician covering washing machines, fridges, geysers and microwaves.',
    service_area: 'Tonk Road (Jaipur)', pincode: '302015',
    latitude: 26.8710, longitude: 75.8130, service_radius_km: 10,
    hourly_or_base_rate: 299, average_rating: 4.6, total_jobs: 73, total_earnings: 35800,
    welfare_status: 'Active Member', insurance_status: 'PMSBY',
    availability_status: 'busy', verification_status: 'verified',
    certification_name: 'ITI Mechanic Consumer Electronics',
    profile: { id: 'p0000000-0000-0000-0000-000000000017', full_name: 'Ramesh Yadav', email: 'ramesh.appliance@worker.in', phone: '+91 98777 89321', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302015', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000009', profile_id: 'p0000000-0000-0000-0000-000000000018', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0109', skill_category: 'Gardening & Landscaping', skills: ['Lawn Mowing', 'Plant Pruning', 'Organic Fertilization', 'Terrace Garden Setup'],
    experience_years: 3, bio: 'Horticulture diploma holder with rooftop and community garden expertise.',
    service_area: 'Jhotwara (Jaipur)', pincode: '302012',
    latitude: 26.9550, longitude: 75.7350, service_radius_km: 10,
    hourly_or_base_rate: 299, average_rating: 4.5, total_jobs: 41, total_earnings: 21400,
    welfare_status: 'Active Member', insurance_status: 'PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'Horticulture Certificate - Indian Agricultural Institute',
    profile: { id: 'p0000000-0000-0000-0000-000000000018', full_name: 'Deepak Kumar', email: 'deepak.garden@worker.in', phone: '+91 98888 12390', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302012', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000010', profile_id: 'p0000000-0000-0000-0000-000000000019', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0110', skill_category: 'Driver Services', skills: ['Chauffeur Driving', 'Hill Driving', 'GPS Navigation', 'Vehicle Maintenance'],
    experience_years: 12, bio: 'Safe, courteous chauffeur with 12 years of accident-free driving record.',
    service_area: 'Vidhyadhar Nagar (Jaipur)', pincode: '302039',
    latitude: 26.9830, longitude: 75.7810, service_radius_km: 20,
    hourly_or_base_rate: 499, average_rating: 4.9, total_jobs: 156, total_earnings: 89400,
    welfare_status: 'Active Member', insurance_status: 'Ayushman Bharat + PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'Heavy & Light Vehicle License (Govt of Rajasthan)',
    profile: { id: 'p0000000-0000-0000-0000-000000000019', full_name: 'Suresh Chauhan', email: 'suresh.driver@worker.in', phone: '+91 98999 45671', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302039', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000011', profile_id: 'p0000000-0000-0000-0000-000000000020', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0111', skill_category: 'Caregiving & Nursing', skills: ['Elderly Care', 'Bedside Assistance', 'Medication Reminders', 'Physiotherapy Support'],
    experience_years: 5, bio: 'Certified home nurse with geriatric care and post-surgical assistance experience.',
    service_area: 'Shastri Nagar (Jaipur)', pincode: '302016',
    latitude: 26.9290, longitude: 75.7970, service_radius_km: 12,
    hourly_or_base_rate: 449, average_rating: 4.9, total_jobs: 88, total_earnings: 52600,
    welfare_status: 'Active Member', insurance_status: 'Ayushman Bharat + PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'ANM Nursing Certificate - Red Cross',
    profile: { id: 'p0000000-0000-0000-0000-000000000020', full_name: 'Meena Kumari', email: 'meena.care@worker.in', phone: '+91 98100 76543', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302016', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000012', profile_id: 'p0000000-0000-0000-0000-000000000021', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0112', skill_category: 'Plumbing', skills: ['Bathroom Fitting', 'Geyser Installation', 'CPVC Piping', 'Drain Machine'],
    experience_years: 9, bio: 'Senior plumber with full bathroom renovation and geyser installation expertise.',
    service_area: 'Ambabari (Jaipur)', pincode: '302023',
    latitude: 26.9370, longitude: 75.8130, service_radius_km: 12,
    hourly_or_base_rate: 269, average_rating: 4.7, total_jobs: 104, total_earnings: 51800,
    welfare_status: 'Active Member', insurance_status: 'PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'ITI Plumber Trade Certificate',
    profile: { id: 'p0000000-0000-0000-0000-000000000021', full_name: 'Harish Chawla', email: 'harish.plumb@worker.in', phone: '+91 98222 90876', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302023', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000013', profile_id: 'p0000000-0000-0000-0000-000000000022', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0113', skill_category: 'Electrical', skills: ['Smart Home Wiring', 'CCTV Installation', 'UPS & Inverter Setup'],
    experience_years: 5, bio: 'Modern electrical technician specializing in smart-home and security wiring.',
    service_area: 'Sitapura & Sanganer (Jaipur)', pincode: '302022',
    latitude: 26.8360, longitude: 75.8640, service_radius_km: 15,
    hourly_or_base_rate: 279, average_rating: 4.6, total_jobs: 58, total_earnings: 31300,
    welfare_status: 'Active Member', insurance_status: 'PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'ITI Electrician + NSDC Smart Home Level 3',
    profile: { id: 'p0000000-0000-0000-0000-000000000022', full_name: 'Nitin Rawat', email: 'nitin.elec@worker.in', phone: '+91 98333 21456', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302022', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000014', profile_id: 'p0000000-0000-0000-0000-000000000023', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0114', skill_category: 'Cleaning & Sanitization', skills: ['Office Deep Cleaning', 'Carpet Shampooing', 'Sanitization Fogging'],
    experience_years: 2, bio: 'Fogging and deep-cleaning specialist serving institutional clients.',
    service_area: 'Sanganer (Jaipur)', pincode: '302029',
    latitude: 26.8236, longitude: 75.7845, service_radius_km: 10,
    hourly_or_base_rate: 379, average_rating: 4.4, total_jobs: 29, total_earnings: 18700,
    welfare_status: 'Active Member', insurance_status: 'Pending Verification',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'NSDC Housekeeping Level 2',
    profile: { id: 'p0000000-0000-0000-0000-000000000023', full_name: 'Ravi Shankar', email: 'ravi.clean@worker.in', phone: '+91 98444 90812', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302029', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000015', profile_id: 'p0000000-0000-0000-0000-000000000024', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0115', skill_category: 'Painting', skills: ['Wall Texture Art', 'Wooden Polish', 'Waterproof Coating'],
    experience_years: 8, bio: 'Texture-art painter known for premium residential finishes across Jaipur.',
    service_area: 'Malviya Nagar & Gandhi Path (Jaipur)', pincode: '302017',
    latitude: 26.8620, longitude: 75.8060, service_radius_km: 10,
    hourly_or_base_rate: 369, average_rating: 4.8, total_jobs: 96, total_earnings: 57400,
    welfare_status: 'Active Member', insurance_status: 'Ayushman Bharat',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'ITI Painter + NSDC Texture Level 4',
    profile: { id: 'p0000000-0000-0000-0000-000000000024', full_name: 'Manoj Tiwari', email: 'manoj.paint@worker.in', phone: '+91 98555 67890', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302017', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000016', profile_id: 'p0000000-0000-0000-0000-000000000025', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0116', skill_category: 'Caregiving & Nursing', skills: ['Newborn Care', 'Mother Care', 'Nutrition Guidance'],
    experience_years: 6, bio: 'Experienced maternity nurse with newborn and post-natal care certification.',
    service_area: 'Vaishali Nagar & Chitrakoot (Jaipur)', pincode: '302021',
    latitude: 26.9080, longitude: 75.7460, service_radius_km: 12,
    hourly_or_base_rate: 469, average_rating: 4.9, total_jobs: 112, total_earnings: 64900,
    welfare_status: 'Active Member', insurance_status: 'Ayushman Bharat + PMSBY',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'ANM + Mother & Child Care Certificate',
    profile: { id: 'p0000000-0000-0000-0000-000000000025', full_name: 'Sunita Sharma', email: 'sunita.care@worker.in', phone: '+91 98666 54321', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302021', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000017', profile_id: 'p0000000-0000-0000-0000-000000000026', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0117', skill_category: 'Appliance Repair', skills: ['Refrigerator Gas Charging', 'Washing Machine Motor', 'Mixer Grinder Repair'],
    experience_years: 3, bio: 'Appliance repair technician with refrigeration gas-charging certification.',
    service_area: 'Jawahar Nagar (Jaipur)', pincode: '302004',
    latitude: 26.9430, longitude: 75.8000, service_radius_km: 10,
    hourly_or_base_rate: 289, average_rating: 4.4, total_jobs: 36, total_earnings: 19200,
    welfare_status: 'Active Member', insurance_status: 'Pending Verification',
    availability_status: 'available', verification_status: 'pending',
    verification_notes: 'Certification document uploaded. Awaiting federation verification call.',
    certification_name: 'ITI Mechanic Refrigeration & AC',
    profile: { id: 'p0000000-0000-0000-0000-000000000026', full_name: 'Amit Pal', email: 'amit.appliance@worker.in', phone: '+91 98777 10293', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302004', language: 'hi' },
    cooperative: coop,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000018', profile_id: 'p0000000-0000-0000-0000-000000000027', cooperative_id: coop.id,
    worker_code: 'WRK-JPR-0118', skill_category: 'Carpentry', skills: ['Furniture Restoration', 'Veneer Work', 'Window Frame Repair'],
    experience_years: 11, bio: 'Restoration carpenter with antique furniture and veneer craftsmanship.',
    service_area: 'Old City & Brahmapuri (Jaipur)', pincode: '302002',
    latitude: 26.8900, longitude: 75.7830, service_radius_km: 8,
    hourly_or_base_rate: 319, average_rating: 4.8, total_jobs: 137, total_earnings: 71200,
    welfare_status: 'Active Member', insurance_status: 'Ayushman Bharat',
    availability_status: 'available', verification_status: 'verified',
    certification_name: 'NSDC Furniture & Fitting Level 5',
    profile: { id: 'p0000000-0000-0000-0000-000000000027', full_name: 'Ghanshyam Sahu', email: 'ghanshyam.carp@worker.in', phone: '+91 98111 99887', role: 'worker', city: 'Jaipur', state: 'Rajasthan', pincode: '302002', language: 'hi' },
    cooperative: coop,
  },
];

// -----------------------------------------------------------------------------
// CUSTOMERS (8)
// -----------------------------------------------------------------------------

export const MOCK_CUSTOMERS: Profile[] = [
  { id: 'p0000000-0000-0000-0000-000000000001', full_name: 'Amit Kumar', email: 'amit.kumar@customer.in', phone: '+91 98765 43210', role: 'customer', address: 'B-12, Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302017', language: 'en' },
  { id: 'p0000000-0000-0000-0000-000000000002', full_name: 'Priya Singh', email: 'priya.singh@customer.in', phone: '+91 98711 54321', role: 'customer', address: 'Flat 402, C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001', language: 'en' },
  { id: 'p0000000-0000-0000-0000-000000000003', full_name: 'Rohit Malhotra', email: 'rohit.m@customer.in', phone: '+91 98660 11223', role: 'customer', address: 'A-21, Mansarovar', city: 'Jaipur', state: 'Rajasthan', pincode: '302020', language: 'en' },
  { id: 'p0000000-0000-0000-0000-000000000004', full_name: 'Kavita Reddy', email: 'kavita.r@customer.in', phone: '+91 98550 44556', role: 'customer', address: 'Plot 21, Jagatpura', city: 'Jaipur', state: 'Rajasthan', pincode: '302027', language: 'en' },
  { id: 'p0000000-0000-0000-0000-000000000005', full_name: 'Sandeep Batra', email: 'sandeep.b@customer.in', phone: '+91 98440 77889', role: 'customer', address: 'C-9, Vaishali Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302021', language: 'en' },
  { id: 'p0000000-0000-0000-0000-000000000006', full_name: 'Neha Agarwal', email: 'neha.a@customer.in', phone: '+91 98330 99001', role: 'customer', address: 'D-4, Vidhyadhar Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302039', language: 'en' },
  { id: 'p0000000-0000-0000-0000-000000000007', full_name: 'Vikram Rathore', email: 'vikram.r@customer.in', phone: '+91 98220 33445', role: 'customer', address: 'C-15, Jhotwara', city: 'Jaipur', state: 'Rajasthan', pincode: '302012', language: 'en' },
  { id: 'p0000000-0000-0000-0000-000000000008', full_name: 'Farhan Ali', email: 'farhan.a@customer.in', phone: '+91 98110 66778', role: 'customer', address: 'E-2, Sanganer', city: 'Jaipur', state: 'Rajasthan', pincode: '302029', language: 'en' },
];

// -----------------------------------------------------------------------------
// BOOKINGS (12 — mixed statuses for the demo customer & worker)
// -----------------------------------------------------------------------------

const cat = (id: string) => MOCK_CATEGORIES.find(c => c.id === id)!;
const worker = (id: string) => MOCK_WORKERS.find(w => w.id === id)!;
const customer = (id: string) => MOCK_CUSTOMERS.find(c => c.id === id)!;

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk-demo-1', booking_code: 'BK-2026-JPR-001',
    customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-05', booking_time: '14:00',
    address: 'Flat 402, C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
    service_description: 'Ceiling fan sparking and switchboard loose in the living room.',
    estimated_amount: 349, final_amount: 349, is_emergency: false,
    status: 'completed', payment_status: 'paid',
    created_at: '2026-09-04T10:00:00Z', updated_at: '2026-09-05T08:12:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000002'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
    supplemental_bill: {
      id: 'sb-demo-1',
      booking_id: 'bk-demo-1',
      status: 'pending_approval',
      diagnosis_notes: 'Upon physical inspection of the ceiling fan, discovered a burnt 2.5µF motor capacitor and melted internal wiring terminal requiring immediate replacement before the fan can safely operate.',
      items: [
        {
          id: 'item-1',
          title: 'Heavy-Duty 2.5µF Motor Capacitor',
          description: 'Original ISI-marked flame-retardant replacement capacitor',
          cost: 180,
          type: 'part',
        },
        {
          id: 'item-2',
          title: 'Terminal Block Rewiring & Insulation',
          description: 'High-temperature terminal block with silicone heat-shrink sleeve',
          cost: 120,
          type: 'repair',
        },
      ],
      subtotal: 300,
      total_amount: 300,
      created_at: '2026-09-05T14:15:00Z',
    },
  },
  {
    id: 'bk-demo-2', booking_code: 'BK-2026-JPR-002',
    customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000002',
    service_category_id: 's0000000-0000-0000-0000-000000000002', cooperative_id: coop.id,
    booking_date: '2026-09-06', booking_time: '11:30',
    address: 'Flat 402, C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
    service_description: 'Kitchen sink drain blockage and leaking tap repair.',
    estimated_amount: 249, final_amount: 249, is_emergency: false,
    status: 'pending', payment_status: 'pending',
    created_at: '2026-09-05T09:30:00Z', updated_at: '2026-09-05T09:30:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000002'), customer: customer('p0000000-0000-0000-0000-000000000002'), service_category: cat('s0000000-0000-0000-0000-000000000002'),
  },
  {
    id: 'bk-demo-3', booking_code: 'BK-2026-JPR-003',
    customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000003',
    service_category_id: 's0000000-0000-0000-0000-000000000003', cooperative_id: coop.id,
    booking_date: '2026-09-04', booking_time: '16:00',
    address: 'Flat 402, C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
    service_description: 'Wardrobe door hinges loose and lock replacement.',
    estimated_amount: 299, final_amount: 299, is_emergency: false,
    status: 'in_progress', payment_status: 'pending',
    created_at: '2026-09-03T18:00:00Z', updated_at: '2026-09-04T15:40:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000003'), customer: customer('p0000000-0000-0000-0000-000000000002'), service_category: cat('s0000000-0000-0000-0000-000000000003'),
  },
  {
    id: 'bk-demo-4', booking_code: 'BK-2026-JPR-004',
    customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-08-25', booking_time: '10:00',
    address: 'Flat 402, C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
    service_description: 'Living room ceiling fan short-circuit repair and MCB inspection.',
    estimated_amount: 450, final_amount: 450, is_emergency: true,
    status: 'completed', payment_status: 'paid',
    created_at: '2026-08-25T09:30:00Z', updated_at: '2026-08-25T11:45:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000002'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-demo-5', booking_code: 'BK-2026-JPR-005',
    customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000005',
    service_category_id: 's0000000-0000-0000-0000-000000000005', cooperative_id: coop.id,
    booking_date: '2026-08-18', booking_time: '09:00',
    address: 'Flat 402, C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
    service_description: 'Deep home cleaning — 2BHK apartment, sofa shampoo included.',
    estimated_amount: 799, final_amount: 799, is_emergency: false,
    status: 'completed', payment_status: 'paid',
    created_at: '2026-08-17T12:00:00Z', updated_at: '2026-08-18T14:30:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000005'), customer: customer('p0000000-0000-0000-0000-000000000002'), service_category: cat('s0000000-0000-0000-0000-000000000005'),
  },
  {
    id: 'bk-demo-6', booking_code: 'BK-2026-JPR-006',
    customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000007',
    service_category_id: 's0000000-0000-0000-0000-000000000008', cooperative_id: coop.id,
    booking_date: '2026-08-10', booking_time: '13:00',
    address: 'Flat 402, C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
    service_description: 'Split AC foam cleaning and gas pressure check (2 units).',
    estimated_amount: 998, final_amount: 998, is_emergency: false,
    status: 'completed', payment_status: 'paid',
    created_at: '2026-08-09T10:00:00Z', updated_at: '2026-08-10T15:20:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000007'), customer: customer('p0000000-0000-0000-0000-000000000002'), service_category: cat('s0000000-0000-0000-0000-000000000008'),
  },
  {
    id: 'bk-demo-7', booking_code: 'BK-2026-JPR-007',
    customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000010',
    service_category_id: 's0000000-0000-0000-0000-000000000009', cooperative_id: coop.id,
    booking_date: '2026-08-02', booking_time: '08:00',
    address: 'Flat 402, C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
    service_description: 'Full-day chauffeur for airport pickup and wedding errands.',
    estimated_amount: 1999, final_amount: 1999, is_emergency: false,
    status: 'cancelled', payment_status: 'refunded',
    created_at: '2026-07-30T09:00:00Z', updated_at: '2026-08-01T19:00:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000010'), customer: customer('p0000000-0000-0000-0000-000000000002'), service_category: cat('s0000000-0000-0000-0000-000000000009'),
  },
  {
    id: 'bk-worker-1', booking_code: 'BK-2026-JPR-101',
    customer_id: 'p0000000-0000-0000-0000-000000000001', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-06', booking_time: '15:30',
    address: 'B-12, Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302017',
    latitude: 26.8560, longitude: 75.8180,
    service_description: 'Two fans not rotating and one switchboard sparking in bedroom.',
    estimated_amount: 249, final_amount: 249, is_emergency: false,
    status: 'pending', payment_status: 'pending',
    created_at: '2026-09-05T16:20:00Z', updated_at: '2026-09-05T16:20:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000001'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-2', booking_code: 'BK-2026-JPR-102',
    customer_id: 'p0000000-0000-0000-0000-000000000003', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-06', booking_time: '18:00',
    address: 'A-21, Mansarovar', city: 'Jaipur', state: 'Rajasthan', pincode: '302020',
    latitude: 26.8560, longitude: 75.7645,
    service_description: 'Emergency: inverter not charging and lights flickering. ⚡',
    estimated_amount: 311, final_amount: 311, is_emergency: true,
    status: 'pending', payment_status: 'pending',
    created_at: '2026-09-05T17:05:00Z', updated_at: '2026-09-05T17:05:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000003'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-3', booking_code: 'BK-2026-JPR-103',
    customer_id: 'p0000000-0000-0000-0000-000000000004', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-07', booking_time: '10:00',
    address: 'Plot 21, Jagatpura', city: 'Jaipur', state: 'Rajasthan', pincode: '302027',
    latitude: 26.8280, longitude: 75.8360,
    service_description: 'Full house wiring inspection and earthing check for new flat.',
    estimated_amount: 699, final_amount: 699, is_emergency: false,
    status: 'pending', payment_status: 'pending',
    created_at: '2026-09-04T11:00:00Z', updated_at: '2026-09-05T09:00:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000004'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-4', booking_code: 'BK-2026-JPR-104',
    customer_id: 'p0000000-0000-0000-0000-000000000005', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-08', booking_time: '12:00',
    address: 'C-9, Vaishali Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302021',
    latitude: 26.9115, longitude: 75.7390,
    service_description: 'MCB frequently tripping — need full distribution board check.',
    estimated_amount: 249, final_amount: 249, is_emergency: false,
    status: 'completed', payment_status: 'paid',
    created_at: '2026-09-03T14:00:00Z', updated_at: '2026-09-08T11:30:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000005'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-5', booking_code: 'BK-2026-JPR-105',
    customer_id: 'p0000000-0000-0000-0000-000000000006', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-08-30', booking_time: '16:00',
    address: 'D-4, Vidhyadhar Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302039',
    latitude: 26.9830, longitude: 75.7810,
    service_description: 'New exhaust fan installation and geyser earthing.',
    estimated_amount: 349, final_amount: 349, is_emergency: false,
    status: 'completed', payment_status: 'paid',
    created_at: '2026-08-29T10:00:00Z', updated_at: '2026-08-30T17:40:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000006'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-6', booking_code: 'BK-2026-JPR-106',
    customer_id: 'p0000000-0000-0000-0000-000000000001', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-10', booking_time: '15:00',
    address: 'B-12, Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302017',
    latitude: 26.8585, longitude: 75.8205,
    service_description: 'Living room chandelier mounting and dimmer regulator fitting.',
    estimated_amount: 349, final_amount: 349, is_emergency: false,
    status: 'pending', payment_status: 'pending',
    created_at: '2026-09-08T10:00:00Z', updated_at: '2026-09-08T11:00:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000001'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-7', booking_code: 'BK-2026-JPR-107',
    customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-11', booking_time: '11:00',
    address: 'Flat 402, C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
    latitude: 26.9017, longitude: 75.7925,
    service_description: 'Solar inverter wiring and battery connection check.',
    estimated_amount: 499, final_amount: 499, is_emergency: false,
    status: 'in_progress', payment_status: 'pending',
    created_at: '2026-09-09T09:00:00Z', updated_at: '2026-09-11T12:30:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000002'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-8', booking_code: 'BK-2026-JPR-108',
    customer_id: 'p0000000-0000-0000-0000-000000000004', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-15', booking_time: '11:00',
    address: 'Plot 21, Jagatpura', city: 'Jaipur', state: 'Rajasthan', pincode: '302027',
    latitude: 26.8295, longitude: 75.8380,
    service_description: 'Modular switchboard installation and earthing testing in 2 bedrooms.',
    estimated_amount: 550, final_amount: 550, is_emergency: false,
    status: 'accepted', payment_status: 'pending',
    created_at: '2026-09-09T14:00:00Z', updated_at: '2026-09-09T15:00:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000004'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-9', booking_code: 'BK-2026-JPR-109',
    customer_id: 'p0000000-0000-0000-0000-000000000001', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-16', booking_time: '16:00',
    address: 'Flat 101, Mansarovar', city: 'Jaipur', state: 'Rajasthan', pincode: '302020',
    latitude: 26.8540, longitude: 75.7620,
    service_description: 'Ceiling fan rewinding and capacitor replacement.',
    estimated_amount: 320, final_amount: 320, is_emergency: false,
    status: 'pending', payment_status: 'pending',
    created_at: '2026-09-10T10:00:00Z', updated_at: '2026-09-10T10:30:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000001'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-10', booking_code: 'BK-2026-JPR-110',
    customer_id: 'p0000000-0000-0000-0000-000000000005', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-15', booking_time: '14:30',
    address: 'C-9, Vaishali Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302021',
    latitude: 26.9130, longitude: 75.7410,
    service_description: 'Sub-panel breaker tripping and voltage stabilization check.',
    estimated_amount: 420, final_amount: 420, is_emergency: false,
    status: 'pending', payment_status: 'pending',
    created_at: '2026-09-10T11:00:00Z', updated_at: '2026-09-10T11:00:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000005'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
  {
    id: 'bk-worker-11', booking_code: 'BK-2026-JPR-111',
    customer_id: 'p0000000-0000-0000-0000-000000000006', worker_id: 'w0000000-0000-0000-0000-000000000001',
    service_category_id: 's0000000-0000-0000-0000-000000000001', cooperative_id: coop.id,
    booking_date: '2026-09-15', booking_time: '17:30',
    address: 'D-4, Vidhyadhar Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302039',
    latitude: 26.9815, longitude: 75.7830,
    service_description: 'Balcony LED spotlight installation and power socket rewiring.',
    estimated_amount: 380, final_amount: 380, is_emergency: false,
    status: 'pending', payment_status: 'pending',
    created_at: '2026-09-10T12:00:00Z', updated_at: '2026-09-10T12:00:00Z',
    worker: worker('w0000000-0000-0000-0000-000000000001'), customer: customer('p0000000-0000-0000-0000-000000000006'), service_category: cat('s0000000-0000-0000-0000-000000000001'),
  },
];

// -----------------------------------------------------------------------------
// RATINGS
// -----------------------------------------------------------------------------

export const MOCK_RATINGS: Rating[] = [
  { id: 'r-01', booking_id: 'bk-demo-4', customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000001', rating: 5, feedback: 'Rahul arrived in 15 minutes, fixed the short circuit cleanly and charged exact cooperative rate.', tags: ['Punctual', 'Skilled', 'Fair Price'], customer_name: 'Priya Singh', created_at: '2026-08-25T12:00:00Z' },
  { id: 'r-02', booking_id: 'bk-worker-1', customer_id: 'p0000000-0000-0000-0000-000000000001', worker_id: 'w0000000-0000-0000-0000-000000000001', rating: 5, feedback: 'Very professional. Explained the issue and fixed it the same day.', tags: ['Polite', 'Skilled'], customer_name: 'Amit Kumar', created_at: '2026-09-01T10:00:00Z' },
  { id: 'r-03', booking_id: 'bk-demo-5', customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000005', rating: 5, feedback: 'Deep cleaning was thorough. The sofa looks brand new!', tags: ['Clean Work', 'Punctual'], customer_name: 'Priya Singh', created_at: '2026-08-19T09:00:00Z' },
  { id: 'r-04', booking_id: 'bk-demo-6', customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000007', rating: 4, feedback: 'AC cooling improved noticeably after service. Slightly late arrival.', tags: ['Skilled', 'Fair Price'], customer_name: 'Priya Singh', created_at: '2026-08-11T10:00:00Z' },
  { id: 'r-05', booking_id: 'bk-worker-3', customer_id: 'p0000000-0000-0000-0000-000000000004', worker_id: 'w0000000-0000-0000-0000-000000000001', rating: 5, feedback: 'Wiring inspection report was detailed. Great value for money.', tags: ['Skilled', 'Fair Price', 'Clean Work'], customer_name: 'Kavita Reddy', created_at: '2026-09-05T12:00:00Z' },
  { id: 'r-06', booking_id: 'bk-worker-5', customer_id: 'p0000000-0000-0000-0000-000000000006', worker_id: 'w0000000-0000-0000-0000-000000000001', rating: 4, feedback: 'Fan installation done neatly. Geyser earthing sorted.', tags: ['Punctual', 'Clean Work'], customer_name: 'Neha Agarwal', created_at: '2026-08-31T10:00:00Z' },
];

// -----------------------------------------------------------------------------
// WELFARE SCHEMES
// -----------------------------------------------------------------------------

export const MOCK_WELFARE: Welfare[] = [
  { id: 'wel-001', worker_id: 'w0000000-0000-0000-0000-000000000001', welfare_scheme: 'Ayushman Bharat PM-JAY Health Protection', enrollment_status: 'Active', contribution_balance: 7420, insurance_status: '₹5,00,000 Family Health Cover Active', insurance_provider: 'National Health Authority (NHA)', policy_reference: 'AB-PMJAY-RJ-2026-8831', valid_until: '2027-03-31', updated_at: '2026-09-01T00:00:00Z' },
  { id: 'wel-002', worker_id: 'w0000000-0000-0000-0000-000000000001', welfare_scheme: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)', enrollment_status: 'Active', contribution_balance: 2400, insurance_status: '₹2,00,000 Accidental Disability Cover', insurance_provider: 'National Insurance Company', policy_reference: 'PMSBY-2026-77319', valid_until: '2027-05-31', updated_at: '2026-09-01T00:00:00Z' },
  { id: 'wel-003', worker_id: 'w0000000-0000-0000-0000-000000000001', welfare_scheme: 'Cooperative Shramik Pension & Emergency Fund', enrollment_status: 'Active', contribution_balance: 5100, insurance_status: 'Cooperative Provident Corpus', insurance_provider: 'Jaipur Shramik Sahakari Sangh Trust', policy_reference: 'COOP-PF-0101', valid_until: '2036-12-31', updated_at: '2026-09-01T00:00:00Z' },
  { id: 'wel-004', worker_id: 'w0000000-0000-0000-0000-000000000002', welfare_scheme: 'Ayushman Bharat PM-JAY Health Protection', enrollment_status: 'Active', contribution_balance: 5870, insurance_status: '₹5,00,000 Family Health Cover Active', insurance_provider: 'National Health Authority (NHA)', policy_reference: 'AB-PMJAY-RJ-2026-7742', valid_until: '2027-03-31', updated_at: '2026-09-01T00:00:00Z' },
  { id: 'wel-005', worker_id: 'w0000000-0000-0000-0000-000000000006', welfare_scheme: 'Cooperative Shramik Pension & Emergency Fund', enrollment_status: 'Pending', contribution_balance: 0, insurance_status: 'Enrollment Pending Admin Review', insurance_provider: 'Jaipur Shramik Sahakari Sangh Trust', policy_reference: 'COOP-PF-0106', valid_until: '2036-12-31', updated_at: '2026-09-01T00:00:00Z' },
];

// -----------------------------------------------------------------------------
// INVOICES
// -----------------------------------------------------------------------------

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv-001', booking_id: 'bk-demo-4', invoice_number: 'INV-2026-0825-01', customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000001', subtotal: 450, platform_fee: 22.5, cooperative_share: 45, worker_amount: 382.5, tax: 0, total_amount: 450, generated_at: '2026-08-25T11:45:00Z' },
  { id: 'inv-002', booking_id: 'bk-demo-5', invoice_number: 'INV-2026-0818-01', customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000005', subtotal: 799, platform_fee: 39.95, cooperative_share: 79.9, worker_amount: 679.15, tax: 0, total_amount: 799, generated_at: '2026-08-18T14:30:00Z' },
  { id: 'inv-003', booking_id: 'bk-demo-6', invoice_number: 'INV-2026-0810-01', customer_id: 'p0000000-0000-0000-0000-000000000002', worker_id: 'w0000000-0000-0000-0000-000000000007', subtotal: 998, platform_fee: 49.9, cooperative_share: 99.8, worker_amount: 848.3, tax: 0, total_amount: 998, generated_at: '2026-08-10T15:20:00Z' },
  { id: 'inv-004', booking_id: 'bk-worker-5', invoice_number: 'INV-2026-0830-01', customer_id: 'p0000000-0000-0000-0000-000000000006', worker_id: 'w0000000-0000-0000-0000-000000000001', subtotal: 349, platform_fee: 17.45, cooperative_share: 34.9, worker_amount: 296.65, tax: 0, total_amount: 349, generated_at: '2026-08-30T17:40:00Z' },
];

// -----------------------------------------------------------------------------
// ROLE-SPECIFIC NOTIFICATION FEEDS
// -----------------------------------------------------------------------------

export const MOCK_NOTIFICATIONS: Record<'customer' | 'worker' | 'admin', Notification[]> = {
  customer: [
    { id: 'notif-c-sb1', user_id: 'p0000000-0000-0000-0000-000000000002', type: 'extra_bill', title: '⚠️ Supplemental Bill Received (₹300)', message: 'Rajesh Sharma reported additional defects for booking BK-2026-JPR-001. Please review and approve.', read: false, action_url: '/bookings', created_at: '2026-09-05T14:15:00Z' },
    { id: 'notif-c-01', user_id: 'p0000000-0000-0000-0000-000000000002', type: 'booking', title: 'Booking Accepted 🎉', message: 'Rajesh Sharma accepted your booking BK-2026-JPR-001. He will arrive at 2:00 PM on 5 Sep.', read: false, action_url: '/bookings', created_at: '2026-09-05T08:12:00Z' },
    { id: 'notif-c-02', user_id: 'p0000000-0000-0000-0000-000000000002', type: 'payment', title: 'Payment Received', message: 'Payment of ₹450 for BK-2026-JPR-004 settled. 85% went directly to the worker.', read: false, action_url: '/bookings', created_at: '2026-08-25T12:00:00Z' },
    { id: 'notif-c-03', user_id: 'p0000000-0000-0000-0000-000000000002', type: 'welfare', title: 'Welfare Contribution Added', message: '10% social security welfare credit was deposited into the cooperative pool.', read: true, action_url: '/welfare', created_at: '2026-08-25T12:01:00Z' },
    { id: 'notif-c-04', user_id: 'p0000000-0000-0000-0000-000000000002', type: 'admin', title: 'Service Completed', message: 'Deep home cleaning (BK-2026-JPR-005) marked complete. Please rate your professional.', read: true, action_url: '/bookings', created_at: '2026-08-18T14:35:00Z' },
  ],
  worker: [
    { id: 'notif-w-01', user_id: 'w0000000-0000-0000-0000-000000000001', type: 'booking', title: 'New Job Request 📋', message: 'New electrical job BK-2026-JPR-101 in Malviya Nagar. 85% wage share applies.', read: false, action_url: '/jobs', created_at: '2026-09-05T16:20:00Z' },
    { id: 'notif-w-02', user_id: 'w0000000-0000-0000-0000-000000000001', type: 'emergency', title: 'Emergency Request ⚡', message: 'URGENT: Inverter failure in Mansarovar. 25% emergency premium included.', read: false, action_url: '/jobs', created_at: '2026-09-05T17:05:00Z' },
    { id: 'notif-w-03', user_id: 'w0000000-0000-0000-0000-000000000001', type: 'welfare', title: 'Insurance Renewal Due', message: 'Your PMSBY accidental cover renews on 31 May 2027. Premium ₹330 auto-debited from welfare corpus.', read: false, action_url: '/welfare', created_at: '2026-09-04T09:00:00Z' },
    { id: 'notif-w-04', user_id: 'w0000000-0000-0000-0000-000000000001', type: 'payment', title: 'Wage Credited ₹296.65', message: '85% wage share for BK-2026-JPR-105 credited to your account.', read: true, action_url: '/welfare', created_at: '2026-08-30T18:00:00Z' },
  ],
  admin: [
    { id: 'notif-a-01', user_id: 'admin-demo', type: 'admin', title: 'Verification Queue: 2 Pending', message: 'Arjun Meena (WRK-JPR-0106) and Amit Pal (WRK-JPR-0117) are awaiting certificate review.', read: false, action_url: '/verification', created_at: '2026-09-05T10:00:00Z' },
    { id: 'notif-a-02', user_id: 'admin-demo', type: 'forecast', title: 'Demand Surge Predicted 📈', message: 'Saturday demand forecast +55% surge in C-Scheme zone. 3 electricians recommended for mobilization.', read: false, action_url: '/forecast', created_at: '2026-09-05T08:30:00Z' },
    { id: 'notif-a-03', user_id: 'admin-demo', type: 'welfare', title: 'Welfare Corpus Milestone', message: 'Cooperative welfare pool crossed ₹2,45,000. Ayushman enrollments at 92%.', read: true, action_url: '/dashboard', created_at: '2026-09-03T12:00:00Z' },
    { id: 'notif-a-04', user_id: 'admin-demo', type: 'payment', title: 'Weekly Settlement Report', message: '₹1,24,350 disbursed this week: 85% wages, 10% welfare, 5% platform.', read: true, action_url: '/dashboard', created_at: '2026-09-01T09:00:00Z' },
  ],
};

// -----------------------------------------------------------------------------
// DERIVED HELPERS
// -----------------------------------------------------------------------------

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function buildNearbyWorkers(
  lat: number,
  lng: number,
  radius = 15,
  service?: string,
  emergency = false
): NearbyWorkerResult[] {
  return MOCK_WORKERS
    .filter(w => w.verification_status === 'verified')
    .filter(w => w.availability_status !== 'offline')
    .filter(w => {
      if (emergency) {
        // Must belong to category supporting emergency service
        const cat = MOCK_CATEGORIES.find(c => c.name.toLowerCase() === w.skill_category.toLowerCase());
        return cat?.emergency_available ?? true;
      }
      // When not an emergency search, keep emergency_only workers reserved
      return w.availability_status !== 'emergency_only';
    })
    .filter(w => (service && service !== 'all' ? w.skill_category.toLowerCase() === service.toLowerCase() : true))
    .map(w => {
      const dist = haversineKm(lat, lng, w.latitude ?? 28.6315, w.longitude ?? 77.2167);
      const distanceScore = Math.max(5, Math.round(40 - dist * 3));
      const availabilityScore = emergency
        ? (w.availability_status === 'emergency_only' ? 30 : w.availability_status === 'available' ? 25 : 12)
        : (w.availability_status === 'available' ? 20 : 18);
      const ratingScore = Math.round(w.average_rating * 4);
      const reliabilityScore = Math.min(10, Math.max(4, Math.round(w.total_jobs / 20)));
      const emergencyBonusScore = emergency && (w.availability_status === 'emergency_only' || w.availability_status === 'available') ? 10 : 0;
      const serviceMatchScore = 10;
      const totalScore = Math.min(100, distanceScore + availabilityScore + ratingScore + reliabilityScore + serviceMatchScore + emergencyBonusScore);
      return {
        workerId: w.id,
        name: w.profile?.full_name || w.worker_code,
        service: w.skill_category,
        skills: w.skills,
        latitude: w.latitude ?? 28.6315,
        longitude: w.longitude ?? 77.2167,
        distance_km: parseFloat(dist.toFixed(1)),
        within_radius: dist <= radius,
        rating: w.average_rating,
        total_jobs: w.total_jobs,
        hourly_rate: w.hourly_or_base_rate,
        availability: w.availability_status,
        verification: w.verification_status,
        cooperative_name: w.cooperative?.name,
        matchScore: totalScore,
        breakdown: {
          totalScore,
          distanceScore,
          availabilityScore,
          ratingScore,
          reliabilityScore,
          serviceMatchScore,
        },
        approximate_location: {
          area: w.service_area,
          city: w.profile?.city || 'Jaipur',
          pincode: w.pincode,
          latitude: w.latitude ?? 28.6315,
          longitude: w.longitude ?? 77.2167,
        },
      };
    })
    .filter(w => w.within_radius)
    .sort((a, b) => {
      if (emergency) {
        const aReady = a.availability === 'emergency_only' || a.availability === 'available';
        const bReady = b.availability === 'emergency_only' || b.availability === 'available';
        if (aReady && !bReady) return -1;
        if (!aReady && bReady) return 1;
      }
      return a.distance_km - b.distance_km;
    });
}

export const MOCK_ADMIN_STATS = {
  totalWorkers: MOCK_WORKERS.length,
  verifiedWorkers: MOCK_WORKERS.filter(w => w.verification_status === 'verified').length,
  pendingWorkers: MOCK_WORKERS.filter(w => w.verification_status === 'pending').length,
  totalBookings: MOCK_BOOKINGS.length,
  completedJobs: MOCK_WORKERS.reduce((s, w) => s + w.total_jobs, 0),
  welfareCorpus: '₹2,45,000',
  totalEarnings: MOCK_WORKERS.reduce((s, w) => s + w.total_earnings, 0),
};
