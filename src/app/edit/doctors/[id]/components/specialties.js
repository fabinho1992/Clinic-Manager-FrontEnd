export const specialtiesMap = {
  "Cardiologia": "CARDIOLOGY",
  "Dermatologia": "DERMATOLOGY",
  "Clínico Geral": "GENERAL_PRACTICE",
  "Pediatria": "PEDIATRICS",
  "Ortopedia": "ORTHOPEDICS",
  "Ginecologia": "GYNECOLOGY"
};

export const availableSpecialties = Object.keys(specialtiesMap);

export const reverseSpecialtiesMap = Object.entries(specialtiesMap).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);