// Class categories configuration
export const CLASS_CATEGORIES = {
  Pathology: ['cavity', 'lesion', 'calculus'],
  'Non-Pathology': ['rootcanal', 'filling', 'crown', 'sinus', 'collimation', 'implant'],
  'Tooth Parts': ['tooth mask', 'enamel', 'dentin', 'pulp', 'tooth number', 'bone'],
  Others: ['impacted tooth', 'attrition', 'root canal']
};

// X-ray type detection keywords
export const XRAY_TYPES = {
  OPG: ['opg', 'dr. trupal', 'dr.nimesh', 'dr. mamta', 'dr mamta', 'dr trupal', 'dr nimesh'],
  Bitewing: ['bitewing'],
  IOPA: ['iopa', 'full dataset', 'full-dataset', 'preprocessing', 'pearl comparison', 'pathology']
};

// Default retrain threshold
export const DEFAULT_RETRAIN_THRESHOLD = 20;
