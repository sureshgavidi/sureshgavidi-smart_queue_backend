const Hospital = require("../models/Hospital");

exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({});
    res.status(200).json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.seedHospitalsIfEmpty = async () => {
  try {
    const count = await Hospital.countDocuments();
    if (count === 0) {
      console.log("Seeding initial hospitals...");
      await Hospital.insertMany([
        { 
          name: 'City General Hospital', 
          location: 'Elluru', 
          address: '123 Elluru Main Road, Elluru', 
          departments: ['Cardiology', 'Orthopedics', 'General Medicine', 'Pediatrics', 'Dermatology', 'ENT'] 
        },
        { 
          name: 'Metro Healthcare Center', 
          location: 'Elluru', 
          address: '45 Elluru Avenue, Elluru', 
          departments: ['Neurology', 'General Medicine', 'Gynecology', 'Ophthalmology', 'Dental'] 
        },
        { 
          name: 'Sunrise Medical Institute', 
          location: 'Elluru', 
          address: '78 Elluru Drive, Elluru', 
          departments: ['Oncology', 'Cardiology', 'Urology', 'Psychiatry', 'General Medicine'] 
        },
      ]);
      console.log("Hospitals seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding hospitals:", error);
  }
};
