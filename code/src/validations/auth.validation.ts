export const validateRegisterInput = (data: {
  username: string;
  email: string;
  password: string;
}) => {
  const { username, email, password } = data;

  if (!username || !/^[a-zA-Z0-9_]{2,50}$/.test(username)) {
    return "Username must be 2-50 characters long and contain only letters, numbers, and underscores.";
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return "Invalid email format.";
  }

  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[A-Za-z]/.test(password)) {
    return "Password must contain at least one letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }

  return null;
};

export const validateLoginInput = (data: {
  email: string;
  password: string;
}) => {
  const { email, password } = data;

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return "Invalid email format.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  return null;
};
