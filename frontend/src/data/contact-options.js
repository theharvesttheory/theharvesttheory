import contract from "./intake-contract.json";

const successCopy = {
  "product-orders": {
    "successTitle": "Ordering will be available shortly.",
    "successNote": "Your details haven't been sent yet — our order desk opens soon."
  },
  "general": {
    "successTitle": "Thank you — noted.",
    "successNote": "We have your message and will be in touch shortly."
  },
  "retail": {
    "successTitle": "Thank you — noted.",
    "successNote": "Our partnerships team will be in touch shortly."
  },
  "gifting": {
    "successTitle": "Thank you — noted.",
    "successNote": "Our gifting team will be in touch shortly."
  },
  "export": {
    "successTitle": "Thank you — noted.",
    "successNote": "Our export desk will be in touch shortly."
  },
  "collaborations": {
    "successTitle": "Thank you — noted.",
    "successNote": "We have your message and will be in touch shortly."
  },
  "press": {
    "successTitle": "Thank you — noted.",
    "successNote": "We have your message and will be in touch shortly."
  },
  "wholesale": {
    "successTitle": "Thank you — noted.",
    "successNote": "Our wholesale team will be in touch shortly."
  },
  "sourcing": {
    "successTitle": "Thank you — noted.",
    "successNote": "Our sourcing team will be in touch shortly."
  }
};

export const CONTACT_TYPES = contract.types.map(type => ({ ...type, ...successCopy[type.id] }));
