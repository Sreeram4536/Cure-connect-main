export const isValidName = (name: string): boolean => {
  const nameRegex = /^[A-Za-z\s]{4,25}$/;
  return nameRegex.test(name);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/;
  return passwordRegex.test(password);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

// export const isValidDateOfBirth = (dob: string): boolean => {
//   const selectedDate = new Date(dob);
//   const today = new Date();
//   return (
//     selectedDate instanceof Date &&
//     !isNaN(selectedDate.getTime()) &&
//     selectedDate <= today

//   );
// };

export const isValidDateOfBirth = (dob: string): { valid: boolean; reason?: string } => {
  const selectedDate = new Date(dob);
  const today = new Date();

  if (!(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
    return { valid: false, reason: "invalid" };
  }

  if (selectedDate > today) {
    return { valid: false, reason: "future" };
  }

  const age = today.getFullYear() - selectedDate.getFullYear();
  const monthDiff = today.getMonth() - selectedDate.getMonth();
  const dayDiff = today.getDate() - selectedDate.getDate();

  const isUnder18 =
    age < 18 ||
    (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)));

  if (isUnder18) return { valid: false, reason: "underage" };

  return { valid: true };
};


// export const isValidDateOfBirth = (dob: string): boolean => {
//   const selectedDate = new Date(dob);
//   const today = new Date();

//   if (!(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) return false;

//   const age = today.getFullYear() - selectedDate.getFullYear();
//   const monthDiff = today.getMonth() - selectedDate.getMonth();
//   const dayDiff = today.getDate() - selectedDate.getDate();

//   const isUnder18 =
//     age < 18 ||
//     (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)));

//   // Must be a valid past date and at least 18 years old
//   return selectedDate <= today && !isUnder18;
// };

