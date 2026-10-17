import contract from "./intake-contract.json";

export const CONTACT_TYPES = contract.types.map(type => ({
  ...type,
  successTitle: type.id === "product-orders" ? "Your product enquiry has been received." : "Your enquiry has been received.",
  successNote: "Thank you. Your details have been saved for our team to review.",
}));
