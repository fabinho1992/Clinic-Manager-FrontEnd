// src/utils/specialtiesMap.js
export const specialtiesMap = {
  "Cardiologia": "CARDIOLOGY",
  "Dermatologia": "DERMATOLOGY",
  "Clinico Geral": "GENERAL_PRACTICE",
  "Pediatria": "PEDIATRICS",
  "Ortopedia": "ORTHOPEDICS",
  "Ginecologia": "GYNECOLOGY",
  "Neurologia": "NEUROLOGY",
  "Oftalmologia": "OPHTHALMOLOGY"
};

export const reverseSpecialtiesMap = Object.fromEntries(
  Object.entries(specialtiesMap).map(([pt, en]) => [en, pt])
);

export const availableSpecialties = Object.keys(specialtiesMap);